---
id: T04
parent: S08
milestone: M034
provides: []
requires: []
affects: []
key_files: [".github/workflows/release.yml", "scripts/verify-m034-s02-workflows.sh", ".tmp/m034-s08/release-workflow-proof.log", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Build `mesh-rt` on the `verify-release-assets` job instead of widening the published release bundle, because installed `meshc` only needs the local `libmesh_rt.a` search path satisfied for the smoke build.", "Generate Unix `SHA256SUMS` with Python `hashlib` and keep Windows archive selection in separate bindings so the hosted verifier stays portable across macOS, Linux, and PowerShell."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the task-plan workflow contract gate exactly as written and wrote the proof log to `.tmp/m034-s08/release-workflow-proof.log`. Re-ran the adjacent S05 workflow verifier to confirm the release-lane repair did not regress the public-surface workflow contracts. Re-ran the canonical installer verifier locally (`bash scripts/verify-m034-s03.sh`) and replayed the hosted-style prebuilt-archive path with `M034_S03_PREBUILT_RELEASE_DIR=.tmp/m034-s08/prebuilt-release-assets bash scripts/verify-m034-s03.sh` to prove the repaired release workflow contract now satisfies the `libmesh_rt.a` requirement without relying on a locally built archive bundle."
completed_at: 2026-03-27T16:53:40.130Z
blocker_discovered: false
---

# T04: Repaired release asset smoke verification to build `mesh-rt` locally and hash staged archives portably across Unix and Windows.

> Repaired release asset smoke verification to build `mesh-rt` locally and hash staged archives portably across Unix and Windows.

## What Happened
---
id: T04
parent: S08
milestone: M034
key_files:
  - .github/workflows/release.yml
  - scripts/verify-m034-s02-workflows.sh
  - .tmp/m034-s08/release-workflow-proof.log
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Build `mesh-rt` on the `verify-release-assets` job instead of widening the published release bundle, because installed `meshc` only needs the local `libmesh_rt.a` search path satisfied for the smoke build.
  - Generate Unix `SHA256SUMS` with Python `hashlib` and keep Windows archive selection in separate bindings so the hosted verifier stays portable across macOS, Linux, and PowerShell.
duration: ""
verification_result: passed
completed_at: 2026-03-27T16:53:40.131Z
blocker_discovered: false
---

# T04: Repaired release asset smoke verification to build `mesh-rt` locally and hash staged archives portably across Unix and Windows.

**Repaired release asset smoke verification to build `mesh-rt` locally and hash staged archives portably across Unix and Windows.**

## What Happened

Used the saved hosted `release.yml` failure log from T02 to target the real breakpoints instead of guessing. In `.github/workflows/release.yml`, I replaced the Unix `sha256sum` assumption with an inline Python `hashlib` checksum generator that works on macOS and Linux, rewrote the Windows checksum selection to use separate `$meshcArchive` / `$meshpkgArchive` bindings instead of the broken `Select-Object -First 1,` form, and added an explicit Rust install plus `cargo build -q -p mesh-rt` step before the staged installer smoke runs. Then I updated `scripts/verify-m034-s02-workflows.sh` so the local release-workflow contract only passes when that repaired behavior is present, recorded the non-obvious release-smoke rule in `.gsd/KNOWLEDGE.md`, and saved the CI decision in `.gsd/DECISIONS.md`.

## Verification

Ran the task-plan workflow contract gate exactly as written and wrote the proof log to `.tmp/m034-s08/release-workflow-proof.log`. Re-ran the adjacent S05 workflow verifier to confirm the release-lane repair did not regress the public-surface workflow contracts. Re-ran the canonical installer verifier locally (`bash scripts/verify-m034-s03.sh`) and replayed the hosted-style prebuilt-archive path with `M034_S03_PREBUILT_RELEASE_DIR=.tmp/m034-s08/prebuilt-release-assets bash scripts/verify-m034-s03.sh` to prove the repaired release workflow contract now satisfies the `libmesh_rt.a` requirement without relying on a locally built archive bundle.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -c 'set -euo pipefail; mkdir -p .tmp/m034-s08; bash scripts/verify-m034-s02-workflows.sh | tee .tmp/m034-s08/release-workflow-proof.log'` | 0 | ✅ pass | 1122ms |
| 2 | `bash scripts/verify-m034-s05-workflows.sh` | 0 | ✅ pass | 1024ms |
| 3 | `bash scripts/verify-m034-s03.sh` | 0 | ✅ pass | 27822ms |
| 4 | `M034_S03_PREBUILT_RELEASE_DIR=.tmp/m034-s08/prebuilt-release-assets bash scripts/verify-m034-s03.sh` | 0 | ✅ pass | 7961ms |


## Deviations

None.

## Known Issues

The repo-owned release workflow contract is repaired locally, but this task did not re-run the hosted `v0.1.0` tag workflow or capture the final `first-green` evidence bundle. That outward verification remains downstream work.

## Files Created/Modified

- `.github/workflows/release.yml`
- `scripts/verify-m034-s02-workflows.sh`
- `.tmp/m034-s08/release-workflow-proof.log`
- `.gsd/KNOWLEDGE.md`


## Deviations
None.

## Known Issues
The repo-owned release workflow contract is repaired locally, but this task did not re-run the hosted `v0.1.0` tag workflow or capture the final `first-green` evidence bundle. That outward verification remains downstream work.
