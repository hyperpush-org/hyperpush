---
id: T02
parent: S01
milestone: M049
provides: []
requires: []
affects: []
key_files: ["compiler/mesh-pkg/src/scaffold.rs", "compiler/meshc/tests/tooling_e2e.rs", "compiler/meshc/tests/e2e_m049_s01.rs", ".gsd/milestones/M049/slices/S01/tasks/T02-SUMMARY.md"]
key_decisions: ["Keep the Postgres starter migration-first via `meshc migrate . up` instead of startup DDL.", "Keep `DATABASE_URL` out of the generated runtime registry and `/health` surface while still exposing usable bootstrap and config diagnostics."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the task verification rail (`cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`, `cargo test -p mesh-pkg m047_s05_scaffold_todo_api_project_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture`) and then replayed the current slice-level checks (`cargo test -p meshc --test e2e_m049_s01 -- --nocapture`, `node --test scripts/tests/verify-m048-s05-contract.test.mjs`). All passed on the final run."
completed_at: 2026-04-02T21:13:26.741Z
blocker_discovered: false
---

# T02: Shipped a real Postgres todo-api scaffold with migrations, pool-backed startup, helper-based CRUD, and static contract checks.

> Shipped a real Postgres todo-api scaffold with migrations, pool-backed startup, helper-based CRUD, and static contract checks.

## What Happened
---
id: T02
parent: S01
milestone: M049
key_files:
  - compiler/mesh-pkg/src/scaffold.rs
  - compiler/meshc/tests/tooling_e2e.rs
  - compiler/meshc/tests/e2e_m049_s01.rs
  - .gsd/milestones/M049/slices/S01/tasks/T02-SUMMARY.md
key_decisions:
  - Keep the Postgres starter migration-first via `meshc migrate . up` instead of startup DDL.
  - Keep `DATABASE_URL` out of the generated runtime registry and `/health` surface while still exposing usable bootstrap and config diagnostics.
duration: ""
verification_result: passed
completed_at: 2026-04-02T21:13:26.742Z
blocker_discovered: false
---

# T02: Shipped a real Postgres todo-api scaffold with migrations, pool-backed startup, helper-based CRUD, and static contract checks.

**Shipped a real Postgres todo-api scaffold with migrations, pool-backed startup, helper-based CRUD, and static contract checks.**

## What Happened

Replaced the fail-closed Postgres todo-api stub in `compiler/mesh-pkg/src/scaffold.rs` with a real migration-first starter generator. The new `--db postgres` path now emits `config.mpl`, `.env.example`, `tests/config.test.mpl`, a starter migration, a pool-backed `main.mpl`, a pool-carrying runtime registry, a secret-safe `/health` handler, Postgres storage helpers on `Repo` / `Query` / `Pg` / `Migration`, and an honest README/Docker contract. Kept the default SQLite scaffold intact, then converted the library, CLI, and slice-owned static rails from fail-closed expectations into positive contract assertions for the generated Postgres tree.

## Verification

Ran the task verification rail (`cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`, `cargo test -p mesh-pkg m047_s05_scaffold_todo_api_project_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture`) and then replayed the current slice-level checks (`cargo test -p meshc --test e2e_m049_s01 -- --nocapture`, `node --test scripts/tests/verify-m048-s05-contract.test.mjs`). All passed on the final run.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture` | 0 | ✅ pass | 10500ms |
| 2 | `cargo test -p mesh-pkg m047_s05_scaffold_todo_api_project_ -- --nocapture` | 0 | ✅ pass | 6400ms |
| 3 | `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture` | 0 | ✅ pass | 14700ms |
| 4 | `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture` | 0 | ✅ pass | 9300ms |
| 5 | `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` | 0 | ✅ pass | 13400ms |
| 6 | `node --test scripts/tests/verify-m048-s05-contract.test.mjs` | 0 | ✅ pass | 4200ms |


## Deviations

Updated `compiler/meshc/tests/e2e_m049_s01.rs` during T02 even though the task plan only named `tooling_e2e` directly, so the slice-owned rail stopped asserting the obsolete fail-closed stub and stayed truthful.

## Known Issues

Live migration/build/boot/CRUD proof for the generated Postgres starter still belongs to T03. The current `e2e_m049_s01` rail is a static scaffold contract check, not the final end-to-end runtime proof.

## Files Created/Modified

- `compiler/mesh-pkg/src/scaffold.rs`
- `compiler/meshc/tests/tooling_e2e.rs`
- `compiler/meshc/tests/e2e_m049_s01.rs`
- `.gsd/milestones/M049/slices/S01/tasks/T02-SUMMARY.md`


## Deviations
Updated `compiler/meshc/tests/e2e_m049_s01.rs` during T02 even though the task plan only named `tooling_e2e` directly, so the slice-owned rail stopped asserting the obsolete fail-closed stub and stayed truthful.

## Known Issues
Live migration/build/boot/CRUD proof for the generated Postgres starter still belongs to T03. The current `e2e_m049_s01` rail is a static scaffold contract check, not the final end-to-end runtime proof.
