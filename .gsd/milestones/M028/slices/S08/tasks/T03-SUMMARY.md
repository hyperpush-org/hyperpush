---
id: T03
parent: S08
milestone: M028
provides:
  - Final green milestone validation and requirement truth for the reconciled recovery-aware reference-backend proof surface.
key_files:
  - .gsd/milestones/M028/M028-VALIDATION.md
  - .gsd/REQUIREMENTS.md
  - .gsd/milestones/M028/slices/S08/S08-PLAN.md
  - .gsd/milestones/M028/slices/S08/tasks/T03-PLAN.md
key_decisions:
  - Keep R004 and R009 validated by S07 runtime proof, and validate R008 only through S08’s reconciled proof-surface rerun instead of reassigning the runtime closure to a docs-only slice.
patterns_established:
  - Seal milestone closure only after a single post-edit rerun proves both runtime commands and validation/requirement artifacts agree on the same command list.
observability_surfaces:
  - .gsd/milestones/M028/M028-VALIDATION.md
  - .gsd/REQUIREMENTS.md
  - reference-backend/scripts/verify-production-proof-surface.sh
  - .gsd/tmp/t03-verification-final/summary.json
  - .gsd/tmp/t03-verification-final/*.log
duration: 1h 20m
verification_result: passed
completed_at: 2026-03-24T00:36:37-04:00
blocker_discovered: false
---

# T03: Seal milestone validation and requirement truth

**Sealed M028 with a pass verdict and moved R008 to validated after a full green recovery-aware proof-surface rerun.**

## What Happened

I started by fixing the missing `## Observability Impact` section in `.gsd/milestones/M028/slices/S08/tasks/T03-PLAN.md`, because the pre-flight contract required the task plan itself to explain how future agents would detect closure-surface drift.

My first verification harness exposed a local execution mismatch instead of a product failure: the tool session defaulted to a different worktree than the one named in the auto-mode contract. I stopped, re-read the authoritative files from `/Users/sn0w/Documents/dev/mesh-lang/.gsd/worktrees/M028`, and switched to absolute-path execution rooted at that worktree for the rest of the task.

From the correct worktree, I reran the entire S08 verification list. The first full rerun showed that every runtime and docs-build command was already green, and that the only remaining failures were the expected stale validation/requirements checks. That gave me the evidence needed to rewrite `.gsd/milestones/M028/M028-VALIDATION.md` from a red interim closure narrative to the final green milestone verdict.

I then updated `.gsd/REQUIREMENTS.md` so R008 moved from **Active** to **Validated**, using S08 as the validation surface for the reconciled public/docs/UAT/validation truth path while keeping R004 and R009 explicitly validated by S07’s runtime recovery proof. I also updated the traceability table, the coverage-summary counts, and R009’s note so it no longer claimed S08 was still pending.

Finally, I reran the full verification list again after the doc edits. That final post-edit rerun is the authoritative evidence set for this task: all 13 checks passed, including the stale-claim sweep and the targeted Python assertion over R008 plus `verdict: pass`.

## Verification

I verified the task in two stages:
1. a pre-edit full rerun to confirm the runtime/public proof surface was genuinely green and that the remaining work was closure-surface reconciliation rather than a hidden regression;
2. a post-edit full rerun to prove the final `M028-VALIDATION.md` and `.gsd/REQUIREMENTS.md` text agrees with the same passing command set.

The authoritative final gate was the post-edit rerun recorded under `.gsd/tmp/t03-verification-final/summary.json`, and every command in the slice verification list passed there.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash reference-backend/scripts/verify-production-proof-surface.sh` | 0 | ✅ pass | 2.02s |
| 2 | `npm --prefix website ci` | 0 | ✅ pass | 26.49s |
| 3 | `npm --prefix website run build` | 0 | ✅ pass | 38.29s |
| 4 | `cargo run -p meshc -- build reference-backend` | 0 | ✅ pass | 62.96s |
| 5 | `cargo run -p meshc -- fmt --check reference-backend` | 0 | ✅ pass | 6.25s |
| 6 | `cargo run -p meshc -- test reference-backend` | 0 | ✅ pass | 7.29s |
| 7 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture` | 0 | ✅ pass | 16.87s |
| 8 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture` | 0 | ✅ pass | 16.36s |
| 9 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_process_restart_recovers_inflight_job -- --ignored --nocapture` | 0 | ✅ pass | 15.45s |
| 10 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture` | 0 | ✅ pass | 10.02s |
| 11 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture` | 0 | ✅ pass | 56.80s |
| 12 | `! rg -n "placeholder|partial / not done|current blocker|needs-remediation|R004.*still open|R009.*still open|replace this placeholder" .gsd/milestones/M028/M028-VALIDATION.md .gsd/milestones/M028/slices/S05/S05-SUMMARY.md .gsd/milestones/M028/slices/S05/S05-UAT.md .gsd/milestones/M028/slices/S06/S06-SUMMARY.md .gsd/milestones/M028/slices/S06/S06-UAT.md` | 0 | ✅ pass | 0.08s |
| 13 | `python3 - <<'PY' ... assert 'Status: validated' in R008 ... assert 'verdict: pass' in M028-VALIDATION ... PY` | 0 | ✅ pass | 0.13s |

## Diagnostics

Future agents can inspect this closure in four places:
- `.gsd/milestones/M028/M028-VALIDATION.md` now carries the authoritative milestone verdict and the completed slice/requirement rationale.
- `.gsd/REQUIREMENTS.md` now records R008 as validated while keeping R004 and R009 anchored to S07.
- `reference-backend/scripts/verify-production-proof-surface.sh` remains the fastest drift detector for the public proof surface.
- `.gsd/tmp/t03-verification-final/summary.json` and the sibling `*.log` files capture the exact post-edit rerun used to seal the slice.

If future drift appears, compare the command exits from the full S08 verification list with the current text in `M028-VALIDATION.md` and `.gsd/REQUIREMENTS.md`:
- commands fail + docs still claim green => real proof regression
- commands pass + docs disagree => closure-surface drift

## Deviations

I made one execution deviation from the written task plan: after the first harness run I discovered the tool session had defaulted to a different worktree than the auto-mode contract specified, so I restarted verification using only absolute paths rooted at `/Users/sn0w/Documents/dev/mesh-lang/.gsd/worktrees/M028`.

## Known Issues

None.

## Files Created/Modified

- `.gsd/milestones/M028/slices/S08/tasks/T03-PLAN.md` — added the missing `## Observability Impact` section required by the task pre-flight.
- `.gsd/milestones/M028/M028-VALIDATION.md` — replaced the stale interim milestone verdict with the final green closure narrative and pass verdict.
- `.gsd/REQUIREMENTS.md` — moved R008 to validated, updated traceability/coverage counts, and removed the last pending-S08 note from R009.
- `.gsd/milestones/M028/slices/S08/tasks/T03-SUMMARY.md` — recorded the execution narrative and final verification evidence.
