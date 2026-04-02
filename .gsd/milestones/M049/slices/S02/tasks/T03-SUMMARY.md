---
id: T03
parent: S02
milestone: M049
provides: []
requires: []
affects: []
key_files: ["compiler/meshc/tests/support/m049_todo_sqlite_scaffold.rs", "compiler/meshc/tests/e2e_m049_s02.rs", "compiler/meshc/tests/support/mod.rs", "compiler/mesh-pkg/src/scaffold.rs", "compiler/meshc/tests/tooling_e2e.rs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Keep generated SQLite package tests as compile-smoke/import-surface proof and let `e2e_m049_s02` own real CRUD, restart, malformed-id, rate-limit, and bad-db-path verification.", "Retain SQLite starter proof artifacts under `.tmp/m049-s02/...` with generated-project snapshots, meshc test/build logs, runtime stdout/stderr, raw HTTP exchanges, and unreachable-health evidence."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture` passed, proving the local-only scaffold writes the expected file set and generated package-test files. `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_sqlite_ -- --nocapture` passed, proving `meshc init --template todo-api` now generates a local SQLite starter whose package tests pass under `meshc test`. `cargo test -p meshc --test e2e_m049_s02 -- --nocapture` passed, proving the live local runtime, restart persistence, rate limiting, bad-db-path failure truth, and retained `.tmp/m049-s02/...` artifacts."
completed_at: 2026-04-02T23:48:52.503Z
blocker_discovered: false
---

# T03: Added the live SQLite todo-api acceptance harness and retained artifact bundles for local CRUD, restart persistence, rate-limit, and bad-db-path truth.

> Added the live SQLite todo-api acceptance harness and retained artifact bundles for local CRUD, restart persistence, rate-limit, and bad-db-path truth.

## What Happened
---
id: T03
parent: S02
milestone: M049
key_files:
  - compiler/meshc/tests/support/m049_todo_sqlite_scaffold.rs
  - compiler/meshc/tests/e2e_m049_s02.rs
  - compiler/meshc/tests/support/mod.rs
  - compiler/mesh-pkg/src/scaffold.rs
  - compiler/meshc/tests/tooling_e2e.rs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Keep generated SQLite package tests as compile-smoke/import-surface proof and let `e2e_m049_s02` own real CRUD, restart, malformed-id, rate-limit, and bad-db-path verification.
  - Retain SQLite starter proof artifacts under `.tmp/m049-s02/...` with generated-project snapshots, meshc test/build logs, runtime stdout/stderr, raw HTTP exchanges, and unreachable-health evidence.
duration: ""
verification_result: passed
completed_at: 2026-04-02T23:48:52.507Z
blocker_discovered: false
---

# T03: Added the live SQLite todo-api acceptance harness and retained artifact bundles for local CRUD, restart persistence, rate-limit, and bad-db-path truth.

**Added the live SQLite todo-api acceptance harness and retained artifact bundles for local CRUD, restart persistence, rate-limit, and bad-db-path truth.**

## What Happened

Added `compiler/meshc/tests/support/m049_todo_sqlite_scaffold.rs` to generate the SQLite starter, run `meshc test` / `meshc build`, boot the binary with local-only env, capture `/health` plus raw HTTP exchanges, and retain proof artifacts under `.tmp/m049-s02/...`. Added `compiler/meshc/tests/e2e_m049_s02.rs` with a runtime-truth rail that proves local `/health`, empty-list boundary, malformed/missing GETs, blank-title POST, create/fetch/toggle, 429 rate limiting, and restart persistence against the retained `todo.sqlite3`, plus a bad-`TODO_DB_PATH` rail that proves startup fails closed before HTTP starts and archives an explicit unreachable-health artifact. While landing that harness, repaired the T02 carry-forward seam by moving the generated SQLite package tests to truthful compile-smoke/import-surface coverage and keeping live behavior proof in the Rust e2e rail, then updated the tooling/static scaffold assertions to match.

## Verification

`cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture` passed, proving the local-only scaffold writes the expected file set and generated package-test files. `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_sqlite_ -- --nocapture` passed, proving `meshc init --template todo-api` now generates a local SQLite starter whose package tests pass under `meshc test`. `cargo test -p meshc --test e2e_m049_s02 -- --nocapture` passed, proving the live local runtime, restart persistence, rate limiting, bad-db-path failure truth, and retained `.tmp/m049-s02/...` artifacts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture` | 0 | ✅ pass | 1229ms |
| 2 | `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_sqlite_ -- --nocapture` | 0 | ✅ pass | 16095ms |
| 3 | `cargo test -p meshc --test e2e_m049_s02 -- --nocapture` | 0 | ✅ pass | 17620ms |


## Deviations

The written plan assumed the generated package tests would directly exercise the SQLite storage helpers. On this tree that still fails under `meshc test` with Mesh compiler `expected (), found Int` errors, so the generated package-test seam was narrowed to compile-smoke/import-surface coverage and the new Rust e2e harness now owns the behavioral proof.

## Known Issues

Direct generated package-test calls into the SQLite storage helpers are still compiler-unstable under `meshc test` on this tree (`expected (), found Int`). The shipped proof surface now keeps package tests at the compile/import seam and proves real behavior in `e2e_m049_s02`.

## Files Created/Modified

- `compiler/meshc/tests/support/m049_todo_sqlite_scaffold.rs`
- `compiler/meshc/tests/e2e_m049_s02.rs`
- `compiler/meshc/tests/support/mod.rs`
- `compiler/mesh-pkg/src/scaffold.rs`
- `compiler/meshc/tests/tooling_e2e.rs`
- `.gsd/KNOWLEDGE.md`


## Deviations
The written plan assumed the generated package tests would directly exercise the SQLite storage helpers. On this tree that still fails under `meshc test` with Mesh compiler `expected (), found Int` errors, so the generated package-test seam was narrowed to compile-smoke/import-surface coverage and the new Rust e2e harness now owns the behavioral proof.

## Known Issues
Direct generated package-test calls into the SQLite storage helpers are still compiler-unstable under `meshc test` on this tree (`expected (), found Int`). The shipped proof surface now keeps package tests at the compile/import seam and proves real behavior in `e2e_m049_s02`.
