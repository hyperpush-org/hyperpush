---
estimated_steps: 3
estimated_files: 5
skills_used:
  - test
  - debug-like-expert
  - review
---

# T03: Prove multi-instance exact-once processing on the shared database

**Slice:** S02 — Runtime Correctness on the Golden Path
**Milestone:** M028

## Description

Close the slice by proving that two real `reference-backend` processes can share one Postgres-backed `jobs` table without duplicate processing or false failure counters. This task should use the same Rust harness and observability surfaces already established in S01/T01, not a new shell script or a separate test runner.

## Steps

1. Extend `compiler/meshc/tests/e2e_reference_backend.rs` with a two-process helper that starts `reference-backend` on unique ports against the same `DATABASE_URL`, then cleans both processes up reliably.
2. Add ignored `e2e_reference_backend_multi_instance_claims_once` coverage that enqueues multiple jobs, waits for terminal state, and asserts every row reaches `processed` exactly once with `attempts = 1` and no `failed` rows.
3. Assert both backend instances’ `/health` payloads keep `failed_jobs = 0` through ordinary claim contention and that DB truth matches the health/job HTTP views.

## Must-Haves

- [ ] The slice ends with a named ignored Rust test for the exact multi-instance contention scenario called out in S02 research.
- [ ] The test uses unique ports and safe cleanup so failures are about runtime correctness, not stale listeners.
- [ ] Exact-once success is proven through both HTTP and direct DB assertions.
- [ ] False worker failures from claim contention stay retired under two real backend instances.

## Verification

- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_multi_instance_claims_once -- --ignored --nocapture`

## Observability Impact

- Signals added/changed: the harness now proves cross-process worker counters and persisted row state under real contention, not just single-instance behavior.
- How a future agent inspects this: rerun `e2e_reference_backend_multi_instance_claims_once` and inspect the per-instance `/health` assertions plus direct `jobs` table checks.
- Failure state exposed: duplicate processing, rows stuck in `processing`, unexpected `failed` rows, or `failed_jobs` drift become explicit multi-instance regression failures.

## Inputs

- `compiler/meshc/tests/e2e_reference_backend.rs` — single-instance harness that should gain multi-process coverage
- `reference-backend/storage/jobs.mpl` — atomic claim semantics that the shared-DB proof depends on
- `reference-backend/jobs/worker.mpl` — worker health/error classification under contention
- `reference-backend/api/health.mpl` — per-instance diagnostics the test must assert against
- `reference-backend/api/jobs.mpl` — HTTP job contract used to cross-check direct DB truth

## Expected Output

- `compiler/meshc/tests/e2e_reference_backend.rs` — multi-instance exact-once regression coverage for the canonical backend path
