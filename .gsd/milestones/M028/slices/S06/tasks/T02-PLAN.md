---
estimated_steps: 4
estimated_files: 4
skills_used:
  - review
  - test
---

# T02: Publish the canonical production backend proof narrative

**Slice:** S06 — Honest Production Proof and Documentation
**Milestone:** M028

## Description

Once T01 restores truth, Mesh needs one canonical public story for backend evaluators. This task turns the repaired `reference-backend/` path into the public proof surface: the package README becomes the complete operator/developer runbook, the website gets a dedicated proof page, and the repo landing page points there early instead of leaving readers in toy-first material.

## Steps

1. Expand `reference-backend/README.md` with the missing supervision/recovery section, keeping it as the deepest runbook for startup, tooling, deploy, crash recovery, and health inspection on the canonical backend path.
2. Create `website/docs/docs/production-backend-proof/index.md` as the one public narrative for external evaluators: explain what `reference-backend/` proves, summarize tooling/runtime/deploy/recovery proof classes, and link directly to the exact harness/tests/scripts instead of copying every long command block.
3. Update `website/docs/.vitepress/config.mts` so the new proof page is visible in the manual sidebar, and update `README.md` near the top with a “Production backend proof” section that points to the website page, `reference-backend/README.md`, and `compiler/meshc/tests/e2e_reference_backend.rs`.
4. Remove or re-anchor stale landing-page wording while touching `README.md` (for example the placeholder-link language and any unsupported hard-coded version/status phrasing) so the repo front page stops making trust claims without immediate evidence.

## Must-Haves

- [ ] `reference-backend/README.md` documents the real supervision/recovery inspection fields and proof commands only after T01 has those commands passing.
- [ ] `website/docs/docs/production-backend-proof/index.md` exists and clearly routes readers to the canonical backend proof surfaces instead of duplicating unverifiable claims.
- [ ] `website/docs/.vitepress/config.mts` exposes the new proof page in the sidebar so it is discoverable without direct URL knowledge.
- [ ] `README.md` points readers to the production backend proof early and no longer contains placeholder-link framing for the docs site.

## Verification

- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture`
- `rg -n "Production backend proof|reference-backend|production-backend-proof|Supervision and recovery|worker_crash_recovers_job|worker_restart_is_visible_in_health|process restart" README.md reference-backend/README.md website/docs/docs/production-backend-proof/index.md website/docs/.vitepress/config.mts`
- `! rg -n "placeholder link" README.md`

## Inputs

- `compiler/meshc/tests/e2e_reference_backend.rs` — passing backend proof harness from T01 that this task must cite directly
- `reference-backend/README.md` — existing package-local runbook to extend instead of replacing
- `README.md` — top-level repo landing page that currently hides the real backend proof path
- `website/docs/.vitepress/config.mts` — manual sidebar wiring for all docs pages

## Expected Output

- `reference-backend/README.md` — completed package-local runbook with supervision/recovery proof documentation
- `website/docs/docs/production-backend-proof/index.md` — canonical public production-backend proof page
- `website/docs/.vitepress/config.mts` — sidebar wiring for the new proof page
- `README.md` — repo landing page with an early production backend proof entrypoint

## Observability Impact

- Signals exposed: the public proof surfaces must point directly at the runtime truth sources — `GET /health`, `GET /jobs/:id`, `jobs`, `_mesh_migrations`, and the named deploy/recovery harnesses in `compiler/meshc/tests/e2e_reference_backend.rs`.
- Future inspection path: a future agent can verify this task by reading `README.md`, the website proof page, and `reference-backend/README.md`, then rerunning the linked proof commands/scripts to confirm the docs still land on the same real backend surfaces.
- Failure visibility added: documentation drift becomes visible through the named grep/runtime checks in this task instead of vague prose review because the docs now route readers to exact commands, tests, and scripts.
