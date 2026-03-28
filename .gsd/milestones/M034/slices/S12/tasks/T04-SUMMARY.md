---
id: T04
parent: S12
milestone: M034
provides: []
requires: []
affects: []
key_files: ["scripts/verify-m034-s06-remote-evidence.sh", "scripts/tests/verify-m034-s06-contract.test.mjs", ".tmp/m034-s12/t04/final-closeout-summary.json", ".tmp/m034-s12/t04/verification-results.json", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M034/slices/S12/tasks/T04-SUMMARY.md"]
key_decisions: ["D111: allow red stop-after remote-evidence bundles under diagnostic labels, but require the reserved `first-green` label to archive only after a green stop-after bundle (`exit 0`, `status.txt=ok`, `current-phase.txt=stopped-after-remote-evidence`)."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the archive-helper and S05 contract tests after the helper change; they all passed, including the new reserved-label failure-path coverage. Reran `bash scripts/verify-m034-s06-remote-evidence.sh first-green` and confirmed it now refuses to create `.tmp/m034-s06/evidence/first-green/` while `release.yml` is still red. Reran the full `.env`-backed `bash scripts/verify-m034-s05.sh` replay from a fresh verify root and confirmed the first failing phase is still `remote-evidence`. Verified that the requested success markers (`status.txt=ok`, `current-phase.txt=complete`, and passed `remote-evidence` / `public-http` / `s01-live-proof` lines) still fail, while the reserved `first-green` path remains absent as intended."
completed_at: 2026-03-28T00:36:53.518Z
blocker_discovered: true
---

# T04: Hardened the reserved `first-green` archive contract and documented the remaining hosted `release.yml` blocker instead of falsely claiming milestone closeout.

> Hardened the reserved `first-green` archive contract and documented the remaining hosted `release.yml` blocker instead of falsely claiming milestone closeout.

## What Happened
---
id: T04
parent: S12
milestone: M034
key_files:
  - scripts/verify-m034-s06-remote-evidence.sh
  - scripts/tests/verify-m034-s06-contract.test.mjs
  - .tmp/m034-s12/t04/final-closeout-summary.json
  - .tmp/m034-s12/t04/verification-results.json
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M034/slices/S12/tasks/T04-SUMMARY.md
key_decisions:
  - D111: allow red stop-after remote-evidence bundles under diagnostic labels, but require the reserved `first-green` label to archive only after a green stop-after bundle (`exit 0`, `status.txt=ok`, `current-phase.txt=stopped-after-remote-evidence`).
duration: ""
verification_result: mixed
completed_at: 2026-03-28T00:36:53.519Z
blocker_discovered: true
---

# T04: Hardened the reserved `first-green` archive contract and documented the remaining hosted `release.yml` blocker instead of falsely claiming milestone closeout.

**Hardened the reserved `first-green` archive contract and documented the remaining hosted `release.yml` blocker instead of falsely claiming milestone closeout.**

## What Happened

I refreshed the live `remote-evidence` gate and confirmed the hosted `release.yml` lane is still red on the approved `v0.1.0` SHA, which made the planned green closeout path unavailable. While exercising the reserved-label path, I found a local contract bug: `scripts/verify-m034-s06-remote-evidence.sh first-green` would still archive a red stop-after bundle. I fixed the helper so diagnostic labels may still archive red bundles, but the reserved `first-green` label now refuses to archive unless the stop-after verifier exits 0 and leaves `status.txt=ok` plus `current-phase.txt=stopped-after-remote-evidence`. I expanded the Node contract tests for both the red refusal and green acceptance paths, removed the bogus red `first-green` directory the old behavior had created, reran the real helper to confirm the reserved label stays absent, reran the full `.env`-backed `bash scripts/verify-m034-s05.sh` replay, and wrote `.tmp/m034-s12/t04/final-closeout-summary.json` to tie the fresh hosted failure to the fresh replay state. Because the hosted lane is still red and any further GitHub mutation would require explicit user approval, this is a plan-invalidating blocker rather than a completed closeout.

## Verification

Ran the archive-helper and S05 contract tests after the helper change; they all passed, including the new reserved-label failure-path coverage. Reran `bash scripts/verify-m034-s06-remote-evidence.sh first-green` and confirmed it now refuses to create `.tmp/m034-s06/evidence/first-green/` while `release.yml` is still red. Reran the full `.env`-backed `bash scripts/verify-m034-s05.sh` replay from a fresh verify root and confirmed the first failing phase is still `remote-evidence`. Verified that the requested success markers (`status.txt=ok`, `current-phase.txt=complete`, and passed `remote-evidence` / `public-http` / `s01-live-proof` lines) still fail, while the reserved `first-green` path remains absent as intended.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/tests/verify-m034-s06-contract.test.mjs scripts/tests/verify-m034-s05-contract.test.mjs` | 0 | ✅ pass | 2421ms |
| 2 | `bash scripts/verify-m034-s06-remote-evidence.sh first-green` | 1 | ✅ pass (expected blocker; reserved label refused) | 138525ms |
| 3 | `bash -lc 'set -euo pipefail; test -f .env; set -a; source .env; set +a; bash scripts/verify-m034-s05.sh'` | 1 | ❌ fail | 128447ms |
| 4 | `bash -lc "grep -Fxq 'ok' .tmp/m034-s05/verify/status.txt"` | 1 | ❌ fail | 30ms |
| 5 | `bash -lc "grep -Fxq 'complete' .tmp/m034-s05/verify/current-phase.txt"` | 1 | ❌ fail | 25ms |
| 6 | `bash -lc "grep -Fxq $'remote-evidence\tpassed' .tmp/m034-s05/verify/phase-report.txt"` | 1 | ❌ fail | 21ms |
| 7 | `bash -lc "grep -Fxq $'public-http\tpassed' .tmp/m034-s05/verify/phase-report.txt"` | 1 | ❌ fail | 26ms |
| 8 | `bash -lc "grep -Fxq $'s01-live-proof\tpassed' .tmp/m034-s05/verify/phase-report.txt"` | 1 | ❌ fail | 99ms |
| 9 | `bash -lc 'test ! -e .tmp/m034-s06/evidence/first-green'` | 0 | ✅ pass | 66ms |


## Deviations

The task plan assumed the hosted `release.yml` lane was already green and ready for one-shot archival. In local reality it is still red, so I did not claim closeout. Instead I repaired the reserved-label contract, removed the bogus red archive the old helper behavior created, and wrote a blocker summary tying the fresh hosted failure to the fresh replay failure.

## Known Issues

Hosted `release.yml` run `23669185030` is still `completed/failure` on `refs/tags/v0.1.0` / SHA `1e83ea930fdfd346b9e56659dc50d2f759ec5da2`, so the full `.env`-backed `bash scripts/verify-m034-s05.sh` replay still fails at `remote-evidence`. The milestone cannot truthfully capture `first-green` or complete final closeout until that hosted lane is rerun green with explicit user approval for the required GitHub mutation.

## Files Created/Modified

- `scripts/verify-m034-s06-remote-evidence.sh`
- `scripts/tests/verify-m034-s06-contract.test.mjs`
- `.tmp/m034-s12/t04/final-closeout-summary.json`
- `.tmp/m034-s12/t04/verification-results.json`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M034/slices/S12/tasks/T04-SUMMARY.md`


## Deviations
The task plan assumed the hosted `release.yml` lane was already green and ready for one-shot archival. In local reality it is still red, so I did not claim closeout. Instead I repaired the reserved-label contract, removed the bogus red archive the old helper behavior created, and wrote a blocker summary tying the fresh hosted failure to the fresh replay failure.

## Known Issues
Hosted `release.yml` run `23669185030` is still `completed/failure` on `refs/tags/v0.1.0` / SHA `1e83ea930fdfd346b9e56659dc50d2f759ec5da2`, so the full `.env`-backed `bash scripts/verify-m034-s05.sh` replay still fails at `remote-evidence`. The milestone cannot truthfully capture `first-green` or complete final closeout until that hosted lane is rerun green with explicit user approval for the required GitHub mutation.
