---
id: T02
parent: S06
milestone: M028
provides:
  - Formatter child-spec regression coverage and a documented resume point for the blocked production-proof narrative work
key_files:
  - compiler/mesh-fmt/src/walker.rs
  - compiler/mesh-fmt/src/lib.rs
  - reference-backend/jobs/worker.mpl
  - .gsd/milestones/M028/slices/S06/tasks/T02-PLAN.md
key_decisions:
  - Replaced `walk_child_spec_def` raw-line trimming with normalized child-spec formatting so `meshc fmt` no longer corrupts `child ... do` supervisor blocks
  - Added a targeted formatter idempotency test for supervisor child specs before touching the real `reference-backend/jobs/worker.mpl`
  - Treated the shared-`DATABASE_URL` ignored tests as serial-only after parallel reruns produced obvious cross-test interference
patterns_established:
  - Reproduce Mesh formatter changes on a temp copy first when touching supervisor child specs; the probe now distinguishes formatting drift from formatter corruption
  - Do not run the ignored `e2e_reference_backend` database-backed proofs in parallel against the same `DATABASE_URL`; their reset/migrate phases interfere
observability_surfaces:
  - compiler/mesh-fmt/src/walker.rs
  - compiler/mesh-fmt/src/lib.rs
  - reference-backend/jobs/worker.mpl
  - compiler/meshc/tests/e2e_reference_backend.rs
  - reference-backend/api/health.mpl
  - reference-backend/storage/jobs.mpl
  - cargo run -p meshc -- fmt --check reference-backend
  - cargo test -p meshc --test e2e_reference_backend ... --ignored --nocapture
  - /var/folders/ly/ys1l6vx95l5631j7ycx3m6fw0000gn/T/pi-bash-19d47fdb416b43cc.log
duration: partial
verification_result: failed
completed_at: 2026-03-24T01:25:29-04:00
blocker_discovered: false
---

# T02: Publish the canonical production backend proof narrative

**Fixed the supervisor child-spec formatter regression, then paused T02 after a partial worker-recovery refactor left `reference-backend` build-broken and the backend proof reruns still red.**

## What Happened

I started by loading the T02 contract, fixing the required pre-flight gap in `.gsd/milestones/M028/slices/S06/tasks/T02-PLAN.md`, and checking the verification failures instead of blindly editing docs.

That confirmed the first failing gate was real: `meshc fmt --check reference-backend` still wanted to rewrite `reference-backend/jobs/worker.mpl`. I reproduced formatter behavior on a temp copy and verified the old `CHILD_SPEC_DEF` corruption was still present: formatting a supervisor child block collapsed `child worker do` into `childworkerdo`.

I fixed that root cause in `compiler/mesh-fmt/src/walker.rs` by replacing the raw trimmed-line formatter with normalized child-spec formatting, and I added `idempotent_supervisor_child_spec` in `compiler/mesh-fmt/src/lib.rs` so the exact `child worker do / start / restart / shutdown / end` shape is now covered by a formatter regression test. After that, I reformatted `reference-backend/jobs/worker.mpl` successfully and got `cargo run -p meshc -- fmt --check reference-backend` back to green.

I then reran the backend truth gates. The local package commands (`meshc build`, `meshc test`, and `fmt --check`) were green before I started the ignored runtime proofs. My first rerun used the repo `.env` correctly, but I made the mistake of launching the three ignored database-backed tests in parallel against the same `DATABASE_URL`, which caused obvious interference: one test recovered another test’s in-flight row and another hit a migration tracking-table race.

After recognizing that race, I reran `e2e_reference_backend_deploy_artifact_smoke` serially. It still failed, but not for the original missing-env reason: the staged backend now gets far enough to process the smoke job and serve repeated `GET /jobs/:id` responses before the harness fails later.

I also investigated the `worker_restart_is_visible_in_health` mismatch. The observed health payload showed the worker entering `status: "crashing"` / `liveness: "recovering"` without ever surfacing the expected restarted-state fields (`restart_count=1`, `recovered_jobs=1`, `last_exit_reason="worker_crash_after_claim"`). To make the health surface line up with the proof harness, I attempted a narrow refactor in `reference-backend/jobs/worker.mpl`: instead of returning `false` and hoping an invisible supervisor restart would happen, the crash path now tries to note the crash, simulate a reboot-state transition, reclaim the in-flight job back to `pending`, and then continue polling.

I stopped there because the context-budget warning arrived while that recovery refactor was still incomplete. The file now formats, but `cargo run -p meshc -- build reference-backend` is currently red because the worker module’s exported functions are no longer visible to `reference-backend/api/health.mpl` and `reference-backend/main.mpl`. I did not proceed to the README / website docs edits, because the backend proof surface is not currently in a truthful enough state to publish.

## Verification

Verified before stopping:
- the formatter regression on supervisor child specs is fixed and covered by a new idempotency test
- `meshc fmt --check reference-backend` is green again after the formatter fix and reformatting `reference-backend/jobs/worker.mpl`
- the repo `.env` loading pattern (`set -a && source .env && set +a`) is the right way to invoke the ignored backend proofs in this worktree

Not yet verified / currently failing:
- `cargo run -p meshc -- build reference-backend` is failing after the partial worker recovery refactor
- `e2e_reference_backend_deploy_artifact_smoke` still fails even when run serially, though the staged backend now gets as far as processing and repeatedly serving the smoke job
- `e2e_reference_backend_worker_crash_recovers_job` and `e2e_reference_backend_worker_restart_is_visible_in_health` still need to be rerun serially after the worker module builds again
- no README / website proof narrative changes were made in this unit, so the task’s documentation deliverables are still outstanding

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p mesh-fmt idempotent_supervisor_child_spec -- --nocapture` | 0 | ✅ pass | n/a |
| 2 | `cargo test -p mesh-fmt idempotent_supervisor_block -- --nocapture` | 0 | ✅ pass | n/a |
| 3 | `cargo run -p meshc -- fmt reference-backend/jobs/worker.mpl` | 0 | ✅ pass | n/a |
| 4 | `cargo run -p meshc -- fmt --check reference-backend` | 0 | ✅ pass | n/a |
| 5 | `cargo run -p meshc -- test reference-backend` | 0 | ✅ pass | n/a |
| 6 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture` | 101 | ❌ fail | n/a |
| 7 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture` | 101 | ❌ fail | n/a |
| 8 | `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture` | 101 | ❌ fail | n/a |
| 9 | `cargo run -p meshc -- build reference-backend` | 1 | ❌ fail | n/a |

## Diagnostics

- Formatter fix location: `compiler/mesh-fmt/src/walker.rs`, `normalize_child_spec_line(...)`, `walk_child_spec_def(...)`
- Formatter regression test: `compiler/mesh-fmt/src/lib.rs`, `idempotent_supervisor_child_spec`
- Current runtime-edit hotspot: `reference-backend/jobs/worker.mpl`, especially `crash_after_claim(...)` and the helpers added immediately above it
- Current build fallout surface: `reference-backend/api/health.mpl` and `reference-backend/main.mpl` report that `Jobs.Worker` only exports `JobWorkerState`, which means parsing/typechecking is no longer recognizing the later `pub fn ...` exports from `reference-backend/jobs/worker.mpl`
- Latest build failure log with the full compiler output: `/var/folders/ly/ys1l6vx95l5631j7ycx3m6fw0000gn/T/pi-bash-19d47fdb416b43cc.log`
- Ignored proof hygiene: rerun the database-backed `e2e_reference_backend` ignored tests serially, not in parallel, after the worker module builds again

## Deviations

- I fixed `compiler/mesh-fmt/src/walker.rs` and added a formatter regression test in `compiler/mesh-fmt/src/lib.rs`, even though T02 is nominally a documentation task, because the verification gate was still red on `fmt --check` and the docs could not honestly ship against a broken canonical backend proof path.
- I began a runtime recovery refactor in `reference-backend/jobs/worker.mpl` because the slice-level ignored proofs exposed a backend-truth mismatch after the formatter issue was fixed.

## Known Issues

- `reference-backend/jobs/worker.mpl` currently formats cleanly but does not compile cleanly into the package: `reference-backend/api/health.mpl` and `reference-backend/main.mpl` cannot see the expected `Jobs.Worker` exports.
- The serial `e2e_reference_backend_deploy_artifact_smoke` proof still fails after the staged backend processes the smoke job; the exact later failing assertion still needs to be re-read from a fresh rerun once the worker module is back to a clean build state.
- The public-proof docs work (`README.md`, `reference-backend/README.md`, `website/docs/.vitepress/config.mts`, `website/docs/docs/production-backend-proof/index.md`) was intentionally not started because the backend verification surface is still red.

## Files Created/Modified

- `compiler/mesh-fmt/src/walker.rs` — fixed `CHILD_SPEC_DEF` formatting so `meshc fmt` preserves valid `child ... do` supervisor blocks.
- `compiler/mesh-fmt/src/lib.rs` — added `idempotent_supervisor_child_spec` to lock in the formatter regression fix.
- `reference-backend/jobs/worker.mpl` — partially refactored the crash-after-claim recovery path toward an explicit degraded recovery transition; this file is the current resume point and still needs repair.
- `.gsd/milestones/M028/slices/S06/tasks/T02-PLAN.md` — added the missing `## Observability Impact` section required by the unit pre-flight.
- `.gsd/milestones/M028/slices/S06/tasks/T02-SUMMARY.md` — recorded this partial execution state and the precise resume notes.
