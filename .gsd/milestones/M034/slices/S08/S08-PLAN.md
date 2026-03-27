# S08: Hosted rollout completion and first-green evidence

**Goal:** Finish the hosted rollout evidence path by preserving a fresh pre-push baseline, creating the missing candidate tags on the rolled-out commit, and capturing one authoritative `first-green` remote-evidence bundle for milestone closeout.
**Demo:** After this: Remote `main`, `v0.1.0`, and `ext-v0.3.0` now have the hosted workflow evidence S05 expects, with a preserved first-green bundle for milestone closeout.

## Tasks
- [x] **T01: Captured a fresh s08-prepush red hosted-evidence bundle, kept first-green unused, and marked the stale v0.1.0 directory as incomplete noise.** — The repo already has a misleading occupied `v0.1.0` evidence directory that is missing the files the archive helper requires. This task makes the final capture deterministic before any outward action: confirm the stale directory is incomplete, keep `first-green` unused, and archive one fresh red baseline under a dedicated non-final label so later tasks can distinguish real rollout progress from label-collision noise.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/verify-m034-s06-remote-evidence.sh` | Fail closed and inspect the wrapper contract instead of inventing manual archive state. | Treat a hung stop-after replay as a verifier regression and keep the last generated logs. | Treat missing `manifest.json`, `status.txt`, or `remote-runs.json` as archive drift. |
| Existing evidence directories under `.tmp/m034-s06/evidence/` | Preserve them as historical context unless they clearly block the planned label strategy. | N/A | Treat partial bundles like `v0.1.0/` as evidence hygiene problems, not as proof. |
| Hosted run query inside the stop-after replay | Keep the resulting red bundle and use it as the pre-push baseline instead of retrying blindly. | Capture the timeout in the archived logs and stop. | Treat missing workflow entries or wrong refs as baseline truth, not as a local script success. |

## Load Profile

- **Shared resources**: local `.tmp/m034-s06/evidence/` archive tree and one stop-after `verify-m034-s05.sh` replay.
- **Per-operation cost**: one archive-helper execution plus a bounded scan of the occupied evidence labels.
- **10x breakpoint**: repeated archive-helper reruns would mostly create label churn, so the task should claim exactly one disposable pre-push label and keep `first-green` untouched.

## Negative Tests

- **Malformed inputs**: occupied label missing `manifest.json`, missing `status.txt`, or a pre-existing `first-green` directory.
- **Error paths**: archive helper returns non-zero but fails to leave a red bundle, or the stop-after replay drifts into `public-http` / `s01-live-proof`.
- **Boundary conditions**: the new pre-push label must be unique, the stale `v0.1.0` directory must stay clearly non-authoritative, and the final `first-green` label must still be available when the task ends.

## Steps

1. Inspect `.tmp/m034-s06/evidence/v0.1.0/` and record which required archive files are missing so the stale directory is treated as noise, not truth.
2. Confirm `.tmp/m034-s06/evidence/first-green/` does not exist and reserve that label for the final green capture.
3. Run `bash scripts/verify-m034-s06-remote-evidence.sh s08-prepush` through the repo-root `.env` context, expect a red result, and keep the archived bundle as the authoritative pre-tag baseline.
4. If the wrapper or contract tests drift, repair them in this task before any outward tag creation is attempted.

## Must-Haves

- [ ] The task leaves one fresh non-final pre-push bundle at `.tmp/m034-s06/evidence/s08-prepush/`.
- [ ] `first-green` remains unused when the task finishes.
- [ ] The stale `v0.1.0` directory is explicitly recognized as incomplete and non-authoritative.
- [ ] Any wrapper/test drift discovered here is fixed before later tasks rely on the archive contract.
  - Estimate: 45m
  - Files: scripts/verify-m034-s06-remote-evidence.sh, scripts/verify-m034-s05.sh, scripts/tests/verify-m034-s06-contract.test.mjs, .tmp/m034-s06/evidence/v0.1.0, .tmp/m034-s06/evidence/s08-prepush/manifest.json, .tmp/m034-s06/evidence/first-green
  - Verify: node --test scripts/tests/verify-m034-s06-contract.test.mjs
bash -c 'set -euo pipefail; test -f .env; set -a; source .env; set +a; rm -rf .tmp/m034-s06/evidence/s08-prepush; if bash scripts/verify-m034-s06-remote-evidence.sh s08-prepush; then echo "expected pre-push bundle to stay red before tags exist" >&2; exit 1; fi'
python3 - <<'PY'
import json
from pathlib import Path
stale = Path('.tmp/m034-s06/evidence/v0.1.0')
assert not (stale / 'manifest.json').exists()
assert not (stale / 'status.txt').exists()
prepush = Path('.tmp/m034-s06/evidence/s08-prepush')
assert (prepush / 'manifest.json').exists()
assert (prepush / 'remote-runs.json').exists()
assert (prepush / 'status.txt').read_text().strip() == 'failed'
manifest = json.loads((prepush / 'manifest.json').read_text())
assert manifest['stopAfterPhase'] == 'remote-evidence'
assert manifest['s05ExitCode'] != 0
assert not Path('.tmp/m034-s06/evidence/first-green').exists()
PY
- [x] **T02: Created the candidate tags on the rolled-out SHA and captured the hosted blockers preventing a truthful first-green archive.** — This is the only outward-facing step in the slice. It must not happen speculatively. The task first proves the intended commit and tag names locally, asks the user for explicit approval to create and push `v0.1.0` and `ext-v0.3.0`, then watches the resulting hosted `push` runs until the candidate-tag workflows either go green or produce concrete failure evidence for the next iteration.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `git` tag/push to `origin` | Stop immediately, keep the exact stderr, and do not claim any hosted evidence progress. | Treat a stalled push as an external transport blocker and preserve the last attempted ref state. | Treat an unexpected remote SHA or missing remote tag as failure, even if a local tag exists. |
| GitHub Actions hosted runs | Poll until the expected run exists on the expected tag or a bounded wait expires, then keep the run metadata for inspection. | Preserve the last observed run status and URL rather than looping forever. | Treat wrong `headBranch`, wrong `headSha`, or missing required jobs as failure, not as eventual-consistency success. |
| User confirmation gate | Do not create or push tags until the user explicitly approves the exact outward action. | N/A | Treat ambiguous confirmation as "no" and stop cleanly. |

## Load Profile

- **Shared resources**: remote git refs, GitHub Actions queues, and the `.tmp/m034-s08/tag-rollout/` monitoring files.
- **Per-operation cost**: two tag pushes plus repeated `gh run list/view` polling for `release.yml`, `deploy-services.yml`, and `publish-extension.yml`.
- **10x breakpoint**: hosted polling dominates first, so the task should use bounded waits and durable JSON snapshots instead of ad hoc terminal-only checks.

## Negative Tests

- **Malformed inputs**: wrong target SHA, missing local version/tag derivation, or absent user approval.
- **Error paths**: push rejected, tag already exists remotely with the wrong SHA, hosted run fails, or hosted run is green on the wrong ref.
- **Boundary conditions**: the task must prove both remote tags exist and each candidate workflow run points at the same intended rollout commit before T03 can archive `first-green`.

## Steps

1. Confirm local `HEAD`, remote `main`, and the derived tags from `compiler/meshc/Cargo.toml` plus `tools/editors/vscode-mesh/package.json` all line up with the intended rollout commit.
2. Present the exact outward action (`git tag` / `git push origin v0.1.0 ext-v0.3.0`) and wait for explicit user confirmation before mutating any remote state.
3. Create and push the tags, then poll `gh run list/view` for `release.yml`, `deploy-services.yml`, and `publish-extension.yml`, persisting the latest successful or failing run payloads under `.tmp/m034-s08/tag-rollout/`.
4. Stop only when the remote tags exist and the monitored run payloads show completed green runs on the expected branch/tag and `headSha`, or when a concrete hosted blocker is captured for follow-up.

## Must-Haves

- [ ] No remote tag creation or push happens before explicit user confirmation.
- [ ] `origin` ends the task with both `v0.1.0` and `ext-v0.3.0` present on the intended rollout commit.
- [ ] Durable run snapshots exist for `release.yml`, `deploy-services.yml`, and `publish-extension.yml`.
- [ ] The task distinguishes wrong-ref/stale-run failures from genuinely green candidate-tag runs.
  - Estimate: 1h
  - Files: compiler/meshc/Cargo.toml, compiler/meshpkg/Cargo.toml, tools/editors/vscode-mesh/package.json, .tmp/m034-s08/tag-rollout/tag-refs.txt, .tmp/m034-s08/tag-rollout/workflow-status.json, .tmp/m034-s08/tag-rollout/release-v0.1.0-view.json, .tmp/m034-s08/tag-rollout/deploy-services-v0.1.0-view.json, .tmp/m034-s08/tag-rollout/publish-extension-ext-v0.3.0-view.json
  - Verify: bash -c 'set -euo pipefail; test -s .tmp/m034-s08/tag-rollout/tag-refs.txt; grep -F "refs/tags/v0.1.0" .tmp/m034-s08/tag-rollout/tag-refs.txt; grep -F "refs/tags/ext-v0.3.0" .tmp/m034-s08/tag-rollout/tag-refs.txt'
python3 - <<'PY'
import json
from pathlib import Path
summary = json.loads(Path('.tmp/m034-s08/tag-rollout/workflow-status.json').read_text())
expected = {
    'release.yml': 'v0.1.0',
    'deploy-services.yml': 'v0.1.0',
    'publish-extension.yml': 'ext-v0.3.0',
}
for workflow, ref_name in expected.items():
    entry = summary[workflow]
    assert entry['headBranch'] == ref_name, (workflow, entry)
    assert entry['status'] == 'completed', (workflow, entry)
    assert entry['conclusion'] == 'success', (workflow, entry)
    assert entry['headSha'], (workflow, entry)
PY
  - Blocker: `deploy-services.yml` is red on `v0.1.0` because the `packages-website` runtime Docker layer reruns `npm install --omit=dev --ignore-scripts` and fails with a Vite / Svelte peer-dependency `ERESOLVE` conflict. `release.yml` is red on `v0.1.0` because multiple `Verify release assets (...)` jobs fail: Unix installer smoke builds cannot find `libmesh_rt.a`, macOS checksum generation assumes `sha256sum`, and the Windows checksum step has broken PowerShell `Select-Object -First 1,` syntax. T03 cannot truthfully claim `.tmp/m034-s06/evidence/first-green/` until those hosted regressions are fixed.
- [x] **T03: Reworked the packages-website Docker image to prune builder dependencies instead of reinstalling runtime packages, eliminating the hosted ERESOLVE failure path.** — Reproduce the hosted `deploy-services.yml` failure from the saved tag-run logs and the current `packages-website` container build, then remove the runtime-stage dependency installation path that triggers the Vite/Svelte peer-resolution `ERESOLVE`. Prefer a container layout that carries a production-safe dependency set forward from build time instead of re-resolving peers during the runtime image build. Keep the Fly deploy workflow contract truthful and leave a repo-local reproduction log.

Steps:
1. Use `.tmp/m034-s08/tag-rollout/deploy-services-v0.1.0-log-failed.txt` plus the current `packages-website/Dockerfile` to reproduce the failing runtime install path locally.
2. Update the packages website image build so the runtime stage no longer reruns the failing `npm install --omit=dev --ignore-scripts` resolution step.
3. Touch `.github/workflows/deploy-services.yml` or its verifier only if the deploy contract itself must change to stay truthful.

Must-haves:
- The old peer-resolution failure is reproduced or otherwise explained by a deterministic local check.
- A local Docker build for `packages-website` completes without the runtime-stage `ERESOLVE` failure.
- Any workflow/verifier edits preserve the current deploy-services ownership and health-check contract.
  - Estimate: 45m
  - Files: packages-website/Dockerfile, packages-website/package.json, packages-website/package-lock.json, .github/workflows/deploy-services.yml, scripts/verify-m034-s05-workflows.sh, .tmp/m034-s08/tag-rollout/deploy-services-v0.1.0-log-failed.txt, .tmp/m034-s08/deploy-services-local-build.log
  - Verify: bash -c 'set -euo pipefail; mkdir -p .tmp/m034-s08; docker build -f packages-website/Dockerfile packages-website | tee .tmp/m034-s08/deploy-services-local-build.log'
bash scripts/verify-m034-s05-workflows.sh
- [x] **T04: Repaired release asset smoke verification to build `mesh-rt` locally and hash staged archives portably across Unix and Windows.** — Use the saved `release.yml` tag-run failure logs to repair the repo-owned release verification path instead of hand-waving around hosted drift. The fixes must cover the real blockers recorded by T02: the staged smoke path must truthfully satisfy the `libmesh_rt.a` requirement where the verifier expects it, checksum generation must no longer assume `sha256sum` on macOS, and the Windows checksum archive selection must use valid PowerShell syntax. Update the workflow-contract verifiers in the same task so local proof encodes the repaired hosted contract.

Steps:
1. Reproduce the failing `Verify release assets (...)` expectations from `.tmp/m034-s08/tag-rollout/release-v0.1.0-log-failed.txt` and the current `.github/workflows/release.yml` plus staged installer proof scripts.
2. Repair the release workflow and any repo-owned helper scripts so the Unix/macOS/Windows verification jobs are truthful for the staged assets they consume.
3. Update `scripts/verify-m034-s02-workflows.sh` and `scripts/verify-m034-s05-workflows.sh` if their current assertions encode the broken hosted behavior.
4. Keep the documented installer mirrors in `website/docs/public/` aligned if the underlying helper logic changes.

Must-haves:
- No `Verify release assets (...)` step depends on a host-only checksum tool assumption.
- The Windows checksum selection path is valid PowerShell instead of the broken `Select-Object -First 1,` form.
- The repo-owned workflow verifiers pass only when the repaired release contract is present.
  - Estimate: 1h 15m
  - Files: .github/workflows/release.yml, scripts/verify-m034-s03.sh, scripts/verify-m034-s02-workflows.sh, scripts/verify-m034-s05-workflows.sh, tools/install/install.sh, tools/install/install.ps1, website/docs/public/install.sh, website/docs/public/install.ps1, .tmp/m034-s08/tag-rollout/release-v0.1.0-log-failed.txt, .tmp/m034-s08/release-workflow-proof.log
  - Verify: bash -c 'set -euo pipefail; mkdir -p .tmp/m034-s08; bash scripts/verify-m034-s02-workflows.sh | tee .tmp/m034-s08/release-workflow-proof.log'
bash scripts/verify-m034-s05-workflows.sh
bash scripts/verify-m034-s03.sh
- [x] **T05: Captured the remote-SHA blocker preventing a truthful candidate-tag reroll.** — After T03 and T04 land, the old candidate-tag runs are still tied to the broken rollout commit, so they are not acceptable evidence. This task first confirms the repaired rollout SHA on local `HEAD` and `origin/main`, then asks for explicit approval before any outward mutation. After approval, retarget or recreate `v0.1.0` and `ext-v0.3.0` on the repaired rollout commit, monitor the hosted runs, and persist durable snapshots that distinguish the new runs from the stale red ones by ref name and `headSha`.

Steps:
1. Confirm the intended rollout SHA from local `HEAD`, `origin/main`, and the version files that derive `v0.1.0` / `ext-v0.3.0`.
2. Present the exact outward action needed to retarget or recreate the two existing remote tags, and wait for explicit user approval before mutating any remote ref.
3. Update the remote tags on the repaired rollout commit, then use the rollout monitor to capture `release.yml`, `deploy-services.yml`, and `publish-extension.yml` run payloads plus any failed job logs under `.tmp/m034-s08/tag-rollout/`.
4. Stop only when the monitored runs are completed green on the expected refs and `headSha`, or when a new concrete hosted blocker is captured.

Must-haves:
- No remote tag mutation happens before explicit user approval.
- The saved status distinguishes stale earlier runs from the repaired reroll by `headSha` and ref.
- `release.yml`, `deploy-services.yml`, and `publish-extension.yml` all settle green on the expected candidate tags before T06 starts.
  - Estimate: 1h
  - Files: compiler/meshc/Cargo.toml, compiler/meshpkg/Cargo.toml, tools/editors/vscode-mesh/package.json, .tmp/m034-s08/tag-rollout/tag-refs.txt, .tmp/m034-s08/tag-rollout/workflow-status.json, .tmp/m034-s08/tag-rollout/release-v0.1.0-view.json, .tmp/m034-s08/tag-rollout/deploy-services-v0.1.0-view.json, .tmp/m034-s08/tag-rollout/publish-extension-ext-v0.3.0-view.json, .tmp/m034-s08/tag-rollout/rollout_monitor.py
  - Verify: bash -c 'set -euo pipefail; test -s .tmp/m034-s08/tag-rollout/tag-refs.txt; grep -F "refs/tags/v0.1.0" .tmp/m034-s08/tag-rollout/tag-refs.txt; grep -F "refs/tags/ext-v0.3.0" .tmp/m034-s08/tag-rollout/tag-refs.txt'
python3 - <<'PY'
import json
from pathlib import Path
summary = json.loads(Path('.tmp/m034-s08/tag-rollout/workflow-status.json').read_text())
expected = {
    'release.yml': 'v0.1.0',
    'deploy-services.yml': 'v0.1.0',
    'publish-extension.yml': 'ext-v0.3.0',
}
for workflow, ref_name in expected.items():
    entry = summary[workflow]
    assert entry['headBranch'] == ref_name, (workflow, entry)
    assert entry['status'] == 'completed', (workflow, entry)
    assert entry['conclusion'] == 'success', (workflow, entry)
    assert entry['headSha'], (workflow, entry)
PY
  - Blocker: origin/main and both remote candidate tags still point at 6979a4a17221af8e39200b574aa2209ad54bc983, while local HEAD is 5e457f3cce9b58d34be6516164b093f253047510 and GitHub returns HTTP 422 for that SHA. release.yml and deploy-services.yml therefore remain red on the stale hosted reroll.
- [ ] **T06: Capture the authoritative `first-green` hosted-evidence bundle and validate its manifest.** — Once T05 proves the repaired candidate tags are green, preserve that truth through the repo-owned wrapper exactly once. Reconfirm that `.tmp/m034-s06/evidence/first-green/` is still unused, rerun the S05/S06 contract tests if any wrapper or workflow-contract code changed earlier in the slice, then run `scripts/verify-m034-s06-remote-evidence.sh first-green` exactly once from the authenticated repo root. Validate the archived manifest and copied verifier artifacts so milestone closeout can consume the bundle directly without another hosted query.

Steps:
1. Confirm `first-green` is absent and that T05's `workflow-status.json` shows all required workflows green on the expected refs and `headSha`.
2. Rerun the S05/S06 contract tests if earlier tasks touched the wrapper or workflow-contract logic.
3. Run the canonical wrapper once with the reserved label and validate `status.txt`, `current-phase.txt`, `phase-report.txt`, `manifest.json`, and `remote-runs.json`.
4. Leave the archive in place as the single authoritative first-green bundle for milestone closeout.

Must-haves:
- `first-green` is claimed exactly once.
- The wrapper stays the sole owner of the final hosted-evidence proof path.
- The archived manifest and remote-run summary both show all required workflows green.
  - Estimate: 45m
  - Files: scripts/verify-m034-s06-remote-evidence.sh, scripts/tests/verify-m034-s05-contract.test.mjs, scripts/tests/verify-m034-s06-contract.test.mjs, .tmp/m034-s08/tag-rollout/workflow-status.json, .tmp/m034-s06/evidence/first-green/manifest.json, .tmp/m034-s06/evidence/first-green/remote-runs.json, .tmp/m034-s06/evidence/first-green/phase-report.txt
  - Verify: node --test scripts/tests/verify-m034-s05-contract.test.mjs scripts/tests/verify-m034-s06-contract.test.mjs
bash -c 'set -euo pipefail; test -f .env; set -a; source .env; set +a; bash scripts/verify-m034-s06-remote-evidence.sh first-green'
python3 - <<'PY'
import json
from pathlib import Path
root = Path('.tmp/m034-s06/evidence/first-green')
assert (root / 'status.txt').read_text().strip() == 'ok'
assert (root / 'current-phase.txt').read_text().strip() == 'stopped-after-remote-evidence'
phase_report = (root / 'phase-report.txt').read_text()
for needle in ['candidate-tags\tpassed', 'remote-evidence\tpassed']:
    assert needle in phase_report, needle
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['s05ExitCode'] == 0
assert manifest['stopAfterPhase'] == 'remote-evidence'
for entry in manifest['remoteRunsSummary']:
    assert entry['status'] == 'ok', entry
PY
