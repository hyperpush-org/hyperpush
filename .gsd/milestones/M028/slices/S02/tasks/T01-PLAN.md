---
estimated_steps: 4
estimated_files: 5
skills_used:
  - test
  - debug-like-expert
  - review
---

# T01: Deepen the Rust harness with migration, health, and DB truth assertions

**Slice:** S02 — Runtime Correctness on the Golden Path
**Milestone:** M028

## Description

Turn `compiler/meshc/tests/e2e_reference_backend.rs` into a real correctness harness before changing runtime behavior. This task should reproduce the trust gap in executable form: the harness must prove migration status/apply truth and one full job lifecycle through HTTP, worker health, and direct Postgres reads using the same native PG path the migration runner already trusts.

## Steps

1. Refactor the existing Rust test helpers so backend startup, ports, process cleanup, and HTTP probes are configurable instead of hardcoded to one `:18080` path.
2. Add direct Postgres helper functions to `compiler/meshc/tests/e2e_reference_backend.rs` using `mesh_rt::db::pg::{native_pg_connect, native_pg_query, native_pg_close}` and mirror the authoritative migration command shape `meshc migrate reference-backend <command>`.
3. Add ignored `e2e_reference_backend_migration_status_and_apply` coverage that asserts pending-before-apply, applied-after-apply, and the expected version in `_mesh_migrations`.
4. Add ignored `e2e_reference_backend_job_flow_updates_health_and_db` coverage that posts a job, waits for processing, then asserts `/jobs/:id`, `/health`, and direct `jobs` table reads agree on `status`, `attempts`, `processed_at`, `processed_jobs`, `failed_jobs`, and `last_job_id`.

## Must-Haves

- [ ] `compiler/meshc/tests/e2e_reference_backend.rs` keeps the existing build/runtime proofs and gains named ignored tests for migration truth and job-flow truth.
- [ ] The new tests parse structured JSON responses instead of relying on brittle string-contains checks for the main correctness assertions.
- [ ] Direct DB assertions use the repo’s native PG helper path, not `psql` shell-outs.
- [ ] The harness is ready for later multi-instance work by removing hardcoded single-port assumptions from helper code.

## Verification

- `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_job_flow_updates_health_and_db -- --ignored --nocapture`

## Observability Impact

- Signals added/changed: the compiler-facing harness now asserts worker counters, `last_job_id`, migration versions, and persisted job state instead of only startup reachability.
- How a future agent inspects this: run the two new ignored tests in `compiler/meshc/tests/e2e_reference_backend.rs` and inspect their direct DB / HTTP assertion failures.
- Failure state exposed: migration discovery/apply drift, stale health counters, mismatched HTTP vs DB row state, and hardcoded-port issues become explicit test failures.

## Inputs

- `compiler/meshc/tests/e2e_reference_backend.rs` — existing reference-backend proof harness to deepen
- `compiler/meshc/src/migrate.rs` — authoritative native Postgres access pattern for migration truth checks
- `reference-backend/api/health.mpl` — worker health contract the new tests must assert against
- `reference-backend/api/jobs.mpl` — job create/read HTTP contract the new tests must assert against
- `reference-backend/migrations/20260323010000_create_jobs.mpl` — expected migration version and durable schema under test

## Expected Output

- `compiler/meshc/tests/e2e_reference_backend.rs` — richer migration/job-flow integration harness with direct DB assertions and configurable process helpers
