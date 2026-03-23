# S02: Runtime Correctness on the Golden Path

**Goal:** Raise the `reference-backend/` golden path from "it builds and a smoke script passes" to "the real runtime path is mechanically trusted" by proving migrations, HTTP, DB state, and worker behavior with stronger automated checks and by fixing the most credibility-damaging runtime blocker on that path.
**Demo:** Against one real Postgres database, the existing `compiler/meshc/tests/e2e_reference_backend.rs` harness proves migration status/apply truth, job creation and processing truth across HTTP + DB + `/health`, and exact-once multi-instance claiming without ordinary contention inflating worker failure signals.

## Must-Haves

- S02 directly advances **R003** by extending `compiler/meshc/tests/e2e_reference_backend.rs` into the authoritative runtime-correctness harness instead of creating a second backend proof surface.
- The golden-path harness proves migration truth, not just command success: `meshc migrate reference-backend status` must show pending before apply and applied after apply, and `_mesh_migrations` must reflect the same version directly in Postgres.
- The golden-path harness proves job lifecycle truth, not just a shell smoke: `POST /jobs`, `GET /jobs/:id`, `GET /health`, and direct DB reads must agree on `status`, `attempts`, `processed_at`, worker counters, and failure state.
- Ordinary multi-instance claim contention on the shared `jobs` table must no longer surface as `failed_jobs` growth or duplicate processing; the storage/worker path must treat benign claim misses as non-failure runtime behavior.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_runtime_starts -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_job_flow_updates_health_and_db -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_multi_instance_claims_once -- --ignored --nocapture`

## Observability / Diagnostics

- Runtime signals: `reference-backend` worker status/counters from `GET /health`, per-job row state in `jobs`, and migration versions in `_mesh_migrations`
- Inspection surfaces: `compiler/meshc/tests/e2e_reference_backend.rs`, `meshc migrate reference-backend <command>`, `GET /health`, `GET /jobs/:id`, and direct Postgres reads through `mesh_rt::db::pg::{native_pg_connect,native_pg_query,native_pg_close}`
- Failure visibility: migration pending/applied mismatch, job rows stuck in `pending`/`processing`, duplicate or failed rows, `failed_jobs` counter drift, `last_error`, and exact test-name failures for the broken runtime phase
- Redaction constraints: never echo `DATABASE_URL`; assertions and logs should report safe IDs, statuses, counters, timestamps, and migration versions only

## Integration Closure

- Upstream surfaces consumed: `compiler/meshc/tests/e2e_reference_backend.rs`, `compiler/meshc/src/migrate.rs`, `reference-backend/storage/jobs.mpl`, `reference-backend/jobs/worker.mpl`, `reference-backend/api/health.mpl`, `reference-backend/api/jobs.mpl`, `reference-backend/migrations/20260323010000_create_jobs.mpl`
- New wiring introduced in this slice: richer Rust integration helpers for direct DB truth + multi-instance process control, plus an atomic claim path from `reference-backend/storage/jobs.mpl` into worker failure classification
- What remains before the milestone is truly usable end-to-end: S03 tooling trust, S04 native deployment proof, S05 crash/restart supervision proof, and S06 final documentation/proof promotion

## Tasks

- [ ] **T01: Deepen the Rust harness with migration, health, and DB truth assertions** `est:2h`
  - Why: S02 cannot fix the right runtime problem until the existing `e2e_reference_backend` harness proves more than startup reachability and a coarse smoke script.
  - Files: `compiler/meshc/tests/e2e_reference_backend.rs`, `compiler/meshc/src/migrate.rs`, `reference-backend/api/health.mpl`, `reference-backend/api/jobs.mpl`, `reference-backend/migrations/20260323010000_create_jobs.mpl`
  - Do: Refactor the Rust helpers so backend ports/processes are configurable, add direct Postgres query helpers using the same native PG path `meshc migrate` uses, then add ignored `e2e_reference_backend_migration_status_and_apply` and `e2e_reference_backend_job_flow_updates_health_and_db` coverage with structured JSON assertions against `/health` and `/jobs/:id` plus direct `_mesh_migrations` and `jobs` row checks.
  - Verify: `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_job_flow_updates_health_and_db -- --ignored --nocapture`
  - Done when: the Rust harness can mechanically prove pending→applied migration state and HTTP/health/DB agreement for one processed job without delegating those assertions to `reference-backend/scripts/smoke.sh`.
- [ ] **T02: Make job claiming atomic and contention-safe on the reference backend** `est:2h`
  - Why: the current read-then-update claim path turns normal shared-DB contention into `update_where: no rows matched`, which the worker currently records as a runtime failure.
  - Files: `reference-backend/storage/jobs.mpl`, `reference-backend/jobs/worker.mpl`, `reference-backend/api/health.mpl`, `compiler/meshc/tests/e2e_reference_backend.rs`, `compiler/mesh-rt/src/db/repo.rs`
  - Do: Add a focused two-instance contention regression to the Rust harness, replace the non-atomic pending-job claim with a single claim-and-return path at the storage layer, prefer `Repo.query_raw(...)` on the app side before touching runtime internals, and update worker error classification so benign claim misses become idle/no-work behavior while real processing failures still surface through `failed_jobs` and `last_error`.
  - Verify: `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_claim_contention_is_not_failure -- --ignored --nocapture`
  - Done when: one job shared by two backend instances no longer triggers `update_where: no rows matched`-style worker failure accounting, and the storage claim path no longer has a read/update race window.
- [ ] **T03: Prove multi-instance exact-once processing on the shared database** `est:90m`
  - Why: R003 is not retired until two real backend instances can share the same `jobs` table without duplicate work or false failure counters.
  - Files: `compiler/meshc/tests/e2e_reference_backend.rs`, `reference-backend/storage/jobs.mpl`, `reference-backend/jobs/worker.mpl`, `reference-backend/api/health.mpl`, `reference-backend/api/jobs.mpl`
  - Do: Extend the Rust harness with a two-process shared-DB scenario using unique ports, enqueue multiple jobs, wait for terminal state, and assert through HTTP plus direct DB reads that every job is processed once, no row lands in `failed`, and neither instance reports `failed_jobs` growth from claim contention.
  - Verify: `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_multi_instance_claims_once -- --ignored --nocapture`
  - Done when: the shared-DB two-instance proof passes reliably and the exact failure mode called out in S02 research is covered by an executable regression test.

## Files Likely Touched

- `compiler/meshc/tests/e2e_reference_backend.rs`
- `compiler/meshc/src/migrate.rs`
- `reference-backend/storage/jobs.mpl`
- `reference-backend/jobs/worker.mpl`
- `reference-backend/api/health.mpl`
- `reference-backend/api/jobs.mpl`
- `reference-backend/migrations/20260323010000_create_jobs.mpl`
- `compiler/mesh-rt/src/db/repo.rs`
