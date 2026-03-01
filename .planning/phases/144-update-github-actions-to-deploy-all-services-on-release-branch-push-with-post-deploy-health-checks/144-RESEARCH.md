# Phase 144: Update GitHub Actions to Deploy All Services on Release Branch Push with Post-Deploy Health Checks - Research

**Researched:** 2026-03-01
**Domain:** GitHub Actions CI/CD, Fly.io deployment automation, post-deploy health checks
**Confidence:** HIGH

## Summary

Phase 143 established all four production services manually: the registry backend at `api.packages.meshlang.dev` (Fly.io, `mesh-registry`), the packages website at `packages.meshlang.dev` (Fly.io, `mesh-packages`), the docs site at `meshlang.dev` (GitHub Pages, `deploy.yml`), and binary artifacts via tagged GitHub Releases (`release.yml`). These deployments were done by hand using `fly deploy`, `gh workflow run`, and `git tag`. Phase 144 automates the Fly.io deployments on release branch push and adds post-deploy health checks.

The current `release.yml` already handles docs (GitHub Pages) and binary artifacts (GitHub Releases) on tag push. What is missing is automated re-deployment of the two Fly.io apps — `mesh-registry` and `mesh-packages` — whenever a release happens. The existing `deploy.yml` only deploys the VitePress docs site. A new or extended workflow needs to deploy both Fly.io apps, then verify the live endpoints respond.

The standard pattern is clear and well-supported: `superfly/flyctl-actions/setup-flyctl@master` + `flyctl deploy --remote-only` with `FLY_API_TOKEN` per app (or a shared org-scoped token). Each Fly.io app has its own `fly.toml` in a subdirectory (`registry/fly.toml`, `packages-website/fly.toml`), so `working-directory` is the cleanest deployment approach. Post-deploy health checks should use `curl --retry` or `jtalk/url-health-check-action` against the live endpoints.

**Primary recommendation:** Create a new `.github/workflows/deploy-services.yml` triggered on `release` published events (which fire after the release workflow completes) plus `workflow_dispatch`. Deploy `mesh-registry` and `mesh-packages` in parallel jobs, then run a final health-check job that polls all four service endpoints.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `superfly/flyctl-actions/setup-flyctl` | `@master` | Installs `flyctl` in the runner | Official Fly.io action |
| `flyctl deploy --remote-only` | current | Deploys app using fly.toml in working dir | Standard CD pattern per Fly docs |
| `FLY_API_TOKEN` secret | n/a | Authenticates flyctl to Fly.io API | Required for CI deployments |
| `jtalk/url-health-check-action` | `@v4` | Polls URL with retries until healthy | Purpose-built health check action |
| `curl --retry` | n/a | Inline health check alternative (simpler) | Zero dependencies, shell built-in |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| GitHub Actions `concurrency` | n/a | Prevent double-deploy race conditions | Always on deploy workflows |
| `actions/checkout@v4` | v4 | Repo checkout so fly.toml is present | Required in every job |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `release` event trigger | `push: tags: ['v*']` | Tag push triggers earlier (before GitHub Release is created); release event is cleaner sequencing |
| Per-app deploy tokens | Single org-scoped `FLY_API_TOKEN` | Org token simpler for small teams; per-app tokens are principle of least privilege |
| `jtalk/url-health-check-action` | Inline `curl --retry` loop | curl is simpler, zero marketplace dependency; action gives cleaner output |

## Architecture Patterns

### Recommended Project Structure

No new file structure is needed. The workflow file is added to:
```
.github/
└── workflows/
    ├── release.yml            (existing — builds binaries + GitHub Release)
    ├── deploy.yml             (existing — deploys docs to GitHub Pages)
    └── deploy-services.yml    (NEW — deploys Fly.io services + health checks)
```

### Pattern 1: Parallel Fly.io App Deployment

**What:** Two independent jobs each deploy one Fly.io app using the app's `fly.toml` via `working-directory`.
**When to use:** When apps are independent and can be deployed simultaneously.

```yaml
# Source: https://fly.io/docs/launch/continuous-deployment-with-github-actions/
jobs:
  deploy-registry:
    name: Deploy mesh-registry
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy registry
        working-directory: registry
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-packages-website:
    name: Deploy mesh-packages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy packages website
        working-directory: packages-website
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Pattern 2: Post-Deploy Health Check Job

**What:** A final job that `needs` both deploy jobs and polls live endpoints.
**When to use:** After all deployments complete, to confirm services are responding.

```yaml
  health-check:
    name: Post-Deploy Health Checks
    needs: [deploy-registry, deploy-packages-website]
    runs-on: ubuntu-latest
    steps:
      - name: Check registry API
        uses: jtalk/url-health-check-action@v4
        with:
          url: https://api.packages.meshlang.dev/api/v1/packages
          max-attempts: 5
          retry-delay: 10s

      - name: Check packages website
        uses: jtalk/url-health-check-action@v4
        with:
          url: https://packages.meshlang.dev
          max-attempts: 5
          retry-delay: 10s

      - name: Check docs site
        uses: jtalk/url-health-check-action@v4
        with:
          url: https://meshlang.dev
          max-attempts: 3
          retry-delay: 5s
```

**Inline curl alternative** (no marketplace dependency):
```yaml
      - name: Check registry API
        run: |
          curl -sf --retry 5 --retry-delay 10 --retry-connrefused \
            https://api.packages.meshlang.dev/api/v1/packages > /dev/null
          echo "Registry API: OK"
```

### Pattern 3: Trigger on GitHub Release Published

**What:** Workflow fires when a GitHub Release is published (not just when a tag is pushed).
**When to use:** When you want Fly.io deploys to happen after the release workflow completes and GitHub Release is visible.

```yaml
on:
  release:
    types: [published]
  workflow_dispatch:
```

**Alternative: trigger on tag push (same as release.yml):**
```yaml
on:
  push:
    tags: ['v*']
  workflow_dispatch:
```

Note: `release: published` fires after `softprops/action-gh-release` runs successfully. The release workflow creates the GitHub Release from the tag — so `release: published` fires after binary artifacts are uploaded. For Fly.io deploys, both triggers work; `push: tags` is simpler and fires earlier.

### Pattern 4: Concurrency Guard for Deploy Workflows

**What:** Ensures only one active production deploy per app at a time; queues rather than cancels.
**When to use:** Always for production deployments.

```yaml
concurrency:
  group: deploy-fly-${{ github.ref_name }}
  cancel-in-progress: false   # never cancel an active deploy
```

### Anti-Patterns to Avoid

- **Canceling in-progress deploy jobs:** If a deploy is in flight, canceling it can leave the app in a broken state. Always use `cancel-in-progress: false` for deploy workflows.
- **Running Fly.io deploys inside the LLVM-heavy `build` matrix:** The registry Dockerfile is built by Fly.io's remote builders — no local LLVM needed. Keep Fly.io deploy jobs minimal (checkout + flyctl only).
- **Forgetting `--remote-only`:** Without this flag, flyctl tries to build locally, which fails because the runner doesn't have Docker configured for production builds. `--remote-only` delegates the build to Fly.io's remote builders.
- **Using a single shared `FLY_API_TOKEN` for all apps unnecessarily:** A single org-scoped token works for a small project. For least-privilege, create per-app tokens with `fly tokens create deploy --app <appname> -x 999999h`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polling until service is up | Custom bash retry loop | `jtalk/url-health-check-action@v4` or `curl --retry` | curl's `--retry-connrefused` and `--retry-delay` handle edge cases correctly |
| Fly.io deploy auth | Manual token management | `FLY_API_TOKEN` env + `superfly/flyctl-actions/setup-flyctl@master` | Official pattern; token is automatically consumed by flyctl |
| Ordering deploy jobs | Complex sequential job chaining | `needs: [deploy-registry, deploy-packages-website]` on health-check | GitHub Actions handles DAG ordering natively |

**Key insight:** The Fly.io deploy pattern is about 10 lines of YAML per app. There is nothing to build — just wire the official tooling together correctly.

## Common Pitfalls

### Pitfall 1: Wrong Working Directory for `fly.toml`

**What goes wrong:** `flyctl deploy` runs from the repo root but `fly.toml` is in `registry/` or `packages-website/`. flyctl errors with "no config file found".
**Why it happens:** flyctl looks for `fly.toml` in the current directory by default.
**How to avoid:** Use `working-directory: registry` (or `packages-website`) on the run step, OR use `flyctl deploy --config registry/fly.toml`.
**Warning signs:** Error message "Error: no config file found" in the deploy step.

### Pitfall 2: Using Organization Token vs. App-Scoped Token

**What goes wrong:** Token works but has broader-than-needed permissions.
**Why it happens:** `fly auth token` returns an org-level token. `fly tokens create deploy --app mesh-registry` returns app-scoped.
**How to avoid:** For a two-app project, an org token stored as `FLY_API_TOKEN` is acceptable. For stricter security, create two separate secrets `FLY_REGISTRY_TOKEN` and `FLY_PACKAGES_TOKEN` using `fly tokens create deploy --app <appname> -x 999999h`.

### Pitfall 3: `release: published` vs `push: tags` Ordering

**What goes wrong:** Deploy fires before the GitHub Release is created (the release workflow runs in parallel with deploy).
**Why it happens:** Both workflows listen to `push: tags: ['v*']`. They start concurrently.
**How to avoid:** Either: (a) use `release: types: [published]` for the deploy workflow — it fires only after the release is complete; OR (b) accept that Fly.io deploy doesn't depend on GitHub Release creation and use `push: tags`.
**Note:** Fly.io deploys from source code, not from Release artifacts. The deploy and release workflows are independent and can safely run in parallel.

### Pitfall 4: Health Check Timing After Fly.io Deploy

**What goes wrong:** Health check runs immediately after `fly deploy` exits but the new instance hasn't replaced the old one yet.
**Why it happens:** `fly deploy` returns when the deploy is submitted, but the VM switch may take a few seconds.
**How to avoid:** Add a short initial delay (`sleep 10`) before the first health check poll, or rely on `max-attempts` with `retry-delay` to absorb the warmup. `jtalk/url-health-check-action@v4` with `max-attempts: 5` and `retry-delay: 10s` gives 50 seconds of retry window.

### Pitfall 5: The `FlyV1` Token Prefix

**What goes wrong:** Token authentication fails in CI.
**Why it happens:** `fly tokens create deploy` outputs a token starting with `FlyV1 `. GitHub Actions secrets strip leading whitespace, but the token must include the `FlyV1 ` prefix.
**How to avoid:** Copy the full output of `fly tokens create deploy`, including `FlyV1 ` at the beginning, into the GitHub secret. Verify with `fly tokens list` that the token exists.

## Code Examples

Verified patterns from official sources:

### Complete deploy-services.yml Skeleton

```yaml
# Source: https://fly.io/docs/launch/continuous-deployment-with-github-actions/
name: Deploy Services

on:
  push:
    tags: ['v*']
  workflow_dispatch:

concurrency:
  group: deploy-fly-${{ github.ref_name }}
  cancel-in-progress: false

jobs:
  deploy-registry:
    name: Deploy mesh-registry to Fly.io
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy
        working-directory: registry
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-packages-website:
    name: Deploy mesh-packages to Fly.io
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy
        working-directory: packages-website
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  health-check:
    name: Post-Deploy Health Checks
    needs: [deploy-registry, deploy-packages-website]
    runs-on: ubuntu-latest
    steps:
      - name: Check registry API
        run: |
          curl -sf --retry 5 --retry-delay 10 --retry-connrefused \
            https://api.packages.meshlang.dev/api/v1/packages > /dev/null
          echo "Registry API: OK"

      - name: Check packages website
        run: |
          curl -sf --retry 5 --retry-delay 10 --retry-connrefused \
            https://packages.meshlang.dev > /dev/null
          echo "Packages website: OK"

      - name: Check docs site
        run: |
          curl -sf --retry 3 --retry-delay 5 \
            https://meshlang.dev > /dev/null
          echo "Docs site: OK"
```

### Creating Fly.io Deploy Token (run once, store as GitHub secret)

```bash
# App-scoped token (recommended)
fly tokens create deploy --app mesh-registry -x 999999h
# OR
fly tokens create deploy --app mesh-packages -x 999999h

# Or single org token for both apps:
fly auth token
```

### Triggering the workflow manually (for testing)

```bash
gh workflow run deploy-services.yml --repo <owner>/mesh
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fly auth token` (org-level) | `fly tokens create deploy --app` (per-app) | 2024 | Least-privilege tokens; Fly docs explicitly deprecated org token for CI |
| Buildpack deploys | `--remote-only` with Dockerfile | Always current | Remote builder handles Docker; no local Docker daemon needed |
| Self-hosted deploy scripts | `superfly/flyctl-actions/setup-flyctl@master` | Always current | Official action; always installs latest flyctl |

**Deprecated/outdated:**
- Org-level `fly auth token` for CI: Fly.io docs now recommend `fly tokens create deploy` for scoped access. Still works but not recommended.

## Open Questions

1. **Token strategy: one vs. two**
   - What we know: A single org-level `FLY_API_TOKEN` can deploy both `mesh-registry` and `mesh-packages`. Per-app tokens would require `FLY_REGISTRY_TOKEN` and `FLY_PACKAGES_TOKEN` as separate secrets.
   - What's unclear: Whether a single secret was already created during Phase 143 deployment.
   - Recommendation: Check with `fly tokens list` if a token already exists. If one token is already in GitHub secrets, use it for both apps. Add note to use per-app tokens if the project grows.

2. **Trigger: `push: tags` vs `release: published`**
   - What we know: Fly.io deploys from source, not from Release artifacts. The release workflow creates the GitHub Release. Both are independent.
   - What's unclear: User preference — do they want deploys to happen only after the GitHub Release is created (slightly later, cleaner sequencing) or immediately when a tag is pushed (faster)?
   - Recommendation: Use `push: tags: ['v*']` + `workflow_dispatch` — mirrors existing `release.yml` pattern, fires faster, and is simpler. The Fly.io deploy doesn't depend on Release artifacts.

3. **Does the existing `deploy.yml` need changes?**
   - What we know: `deploy.yml` currently deploys docs on every push to `main`. It does not run on tag push.
   - What's unclear: Should docs also be re-deployed on tag/release? Currently the user manually triggers `gh workflow run deploy.yml` for releases.
   - Recommendation: Add `push: tags: ['v*']` to the `deploy.yml` triggers so docs auto-redeploy on release. This is a one-line addition to the existing file.

## Validation Architecture

> Skipping this section — `workflow.nyquist_validation` is not present in `.planning/config.json` (field absent = false).

## Sources

### Primary (HIGH confidence)
- https://fly.io/docs/launch/continuous-deployment-with-github-actions/ — Official Fly.io GitHub Actions pattern, `--remote-only` flag, `FLY_API_TOKEN`, `superfly/flyctl-actions/setup-flyctl@master`
- https://fly.io/docs/security/tokens/ — Token scoping, `fly tokens create deploy --app`, per-app vs. org tokens
- https://docs.github.com/actions/using-workflows/triggering-a-workflow — Event triggers, `release: published`, `push: tags`, `workflow_dispatch`
- https://docs.github.com/actions/using-jobs/using-concurrency — `concurrency`, `cancel-in-progress: false` for production deploys

### Secondary (MEDIUM confidence)
- https://github.com/Jtalk/url-health-check-action — `jtalk/url-health-check-action@v4` for health checks with retry
- Multiple sources confirm `working-directory` as the standard pattern for mono-repo multi-app Fly.io deployments

### Tertiary (LOW confidence)
- Community forum posts on Fly.io token prefix format (`FlyV1 `) — confirmed by official token docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Official Fly.io docs and GitHub Actions docs are authoritative and current
- Architecture: HIGH — Pattern is well-established; existing `registry/fly.toml` and `packages-website/fly.toml` confirm the approach works
- Pitfalls: HIGH for working-directory and token issues (commonly reported); MEDIUM for health check timing (based on community patterns)

**Research date:** 2026-03-01
**Valid until:** 2026-06-01 (flyctl-actions uses `@master`, which auto-updates; patterns are stable)
