---
id: T02
parent: S03
milestone: M049
provides: []
requires: []
affects: []
key_files: ["examples/todo-sqlite/mesh.toml", "examples/todo-sqlite/README.md", "examples/todo-sqlite/tests/storage.test.mpl", "examples/todo-postgres/mesh.toml", "examples/todo-postgres/README.md", "examples/todo-postgres/work.mpl", "examples/todo-postgres/.env.example", "examples/todo-postgres/migrations/20260402120000_create_todos.mpl"]
key_decisions: ["Keep the tracked example apps generator-owned and refresh them only through `scripts/tests/verify-m049-s03-materialize-examples.mjs`, not through hand edits under `examples/`.", "Preserve the intentional SQLite/Postgres file-set split in the checked-in trees instead of normalizing them toward a shared showcase layout."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` now passes and reports both examples as exact matches against fresh public-CLI output. `node --test scripts/tests/verify-m049-s03-materialize-examples.test.mjs` still passes, so the materializer's red-path coverage for unsafe roots, malformed partial targets, invalid `meshc` overrides, generation failures, and named drift reporting remains intact. A boundary assertion confirmed the intentional SQLite/Postgres file-set split and the absence of build artifacts, `.env`, and `examples/README.md`. Slice-level status remains partial: `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` still fails because T03 has not added that target yet."
completed_at: 2026-04-03T01:23:00.462Z
blocker_discovered: false
---

# T02: Checked in generator-owned `todo-sqlite` and `todo-postgres` example trees under `examples/` using the public materializer seam.

> Checked in generator-owned `todo-sqlite` and `todo-postgres` example trees under `examples/` using the public materializer seam.

## What Happened
---
id: T02
parent: S03
milestone: M049
key_files:
  - examples/todo-sqlite/mesh.toml
  - examples/todo-sqlite/README.md
  - examples/todo-sqlite/tests/storage.test.mpl
  - examples/todo-postgres/mesh.toml
  - examples/todo-postgres/README.md
  - examples/todo-postgres/work.mpl
  - examples/todo-postgres/.env.example
  - examples/todo-postgres/migrations/20260402120000_create_todos.mpl
key_decisions:
  - Keep the tracked example apps generator-owned and refresh them only through `scripts/tests/verify-m049-s03-materialize-examples.mjs`, not through hand edits under `examples/`.
  - Preserve the intentional SQLite/Postgres file-set split in the checked-in trees instead of normalizing them toward a shared showcase layout.
duration: ""
verification_result: mixed
completed_at: 2026-04-03T01:23:00.464Z
blocker_discovered: false
---

# T02: Checked in generator-owned `todo-sqlite` and `todo-postgres` example trees under `examples/` using the public materializer seam.

**Checked in generator-owned `todo-sqlite` and `todo-postgres` example trees under `examples/` using the public materializer seam.**

## What Happened

Ran the T01 materializer in `--write` mode so `examples/todo-sqlite` and `examples/todo-postgres` were created from the public `meshc init --template todo-api --db ...` path instead of by hand. The resulting trees were kept generator-owned: exact project names in `mesh.toml`, generated README content preserved as-is, SQLite retaining `tests/storage.test.mpl` and omitting `work.mpl` / `.env.example`, Postgres retaining `work.mpl`, `.env.example`, and the migration file, and no repo-only `examples/README.md`, build output, `target/`, `output/`, or `.env` files under `examples/`. No scaffold source, docs, or proof-app files were rewritten in this task; it only materialized and committed the generated example trees.

## Verification

`node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` now passes and reports both examples as exact matches against fresh public-CLI output. `node --test scripts/tests/verify-m049-s03-materialize-examples.test.mjs` still passes, so the materializer's red-path coverage for unsafe roots, malformed partial targets, invalid `meshc` overrides, generation failures, and named drift reporting remains intact. A boundary assertion confirmed the intentional SQLite/Postgres file-set split and the absence of build artifacts, `.env`, and `examples/README.md`. Slice-level status remains partial: `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` still fails because T03 has not added that target yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/tests/verify-m049-s03-materialize-examples.test.mjs` | 0 | ✅ pass | 10580ms |
| 2 | `boundary assertion for mode-specific files, no `examples/README.md`, and no `output` / `target` / `.env` under `examples/`` | 0 | ✅ pass | 111ms |
| 3 | `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` | 0 | ✅ pass | 1104ms |
| 4 | `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` | 101 | ❌ fail | 1331ms |


## Deviations

None.

## Known Issues

The slice-level `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` rail is still red because T03 has not added the target yet.

## Files Created/Modified

- `examples/todo-sqlite/mesh.toml`
- `examples/todo-sqlite/README.md`
- `examples/todo-sqlite/tests/storage.test.mpl`
- `examples/todo-postgres/mesh.toml`
- `examples/todo-postgres/README.md`
- `examples/todo-postgres/work.mpl`
- `examples/todo-postgres/.env.example`
- `examples/todo-postgres/migrations/20260402120000_create_todos.mpl`


## Deviations
None.

## Known Issues
The slice-level `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` rail is still red because T03 has not added the target yet.
