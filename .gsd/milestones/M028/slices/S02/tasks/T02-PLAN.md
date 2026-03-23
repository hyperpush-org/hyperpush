---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - code-optimizer
  - test
  - review
---

# T02: Make job claiming atomic and contention-safe on the reference backend

**Slice:** S02 — Runtime Correctness on the Golden Path
**Milestone:** M028

## Description

Fix the most credibility-damaging runtime flaw on the golden path: ordinary shared-database contention currently looks like worker failure because `claim_next_pending_job()` does a read-then-update claim and the worker increments `failed_jobs` on the resulting zero-row race. The fix belongs at the storage/worker boundary, with runtime internals touched only if the app-level escape hatch is truly insufficient.

## Steps

1. Add a focused ignored contention regression to `compiler/meshc/tests/e2e_reference_backend.rs` that starts two backend instances against one database and proves the current claim race shows up as a false worker failure.
2. Rewrite `reference-backend/storage/jobs.mpl` so claiming a pending job happens atomically in one SQL round-trip that both selects and marks the row, preferably through `Repo.query_raw(...)` returning the claimed row.
3. Update `reference-backend/jobs/worker.mpl` so benign claim misses map to idle/no-work behavior instead of incrementing `failed_jobs`, while real processing errors still flow into `last_error` and `failed_jobs`.
4. Touch `compiler/mesh-rt/src/db/repo.rs` only if the app-level raw-query path cannot express the needed claim shape cleanly; keep any runtime change minimal and directly justified by the failing proof.

## Must-Haves

- [ ] `compiler/meshc/tests/e2e_reference_backend.rs` contains a focused contention regression that fails on the old read-then-update claim path and passes on the fixed path.
- [ ] The pending-job claim path no longer depends on `oldest_pending_job()` followed by a separate `Repo.update_where(...)` race window.
- [ ] The worker does not increment `failed_jobs` for ordinary shared-DB claim contention.
- [ ] Real job-processing failures still surface through the existing `/health` worker diagnostics.

## Verification

- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_claim_contention_is_not_failure -- --ignored --nocapture`

## Observability Impact

- Signals added/changed: claim contention stops appearing as `failed_jobs`/`last_error` noise, while real processing failures remain visible through the same worker state surface.
- How a future agent inspects this: rerun `e2e_reference_backend_claim_contention_is_not_failure` and compare its per-instance `/health` assertions before and after the atomic-claim change.
- Failure state exposed: true processing failures remain visible, but false-positive worker failures from claim races are removed.

## Inputs

- `compiler/meshc/tests/e2e_reference_backend.rs` — focused failing proof surface that should drive the fix
- `reference-backend/storage/jobs.mpl` — current read-then-update claim implementation
- `reference-backend/jobs/worker.mpl` — current failure classification for claim/process errors
- `reference-backend/api/health.mpl` — worker diagnostics that must stay compatible and meaningful
- `compiler/mesh-rt/src/db/repo.rs` — minimal fallback seam only if raw-query support needs a runtime adjustment

## Expected Output

- `compiler/meshc/tests/e2e_reference_backend.rs` — focused contention regression proving claim misses are no longer counted as worker failures
- `reference-backend/storage/jobs.mpl` — atomic claim-and-return implementation for pending jobs
- `reference-backend/jobs/worker.mpl` — corrected contention/error classification for worker state
- `compiler/mesh-rt/src/db/repo.rs` — minimal runtime support change only if required by the atomic claim path
