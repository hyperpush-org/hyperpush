# S01: Postgres starter contract

**Goal:** Ship an additive Postgres `todo-api` starter contract: `meshc init --template todo-api --db postgres <name>` generates a migration-first Todo API that proves the serious clustered/deployable path honestly while the legacy SQLite starter and M048 guardrails stay intact until later slices replace them.
**Demo:** After this: `meshc init --template todo-api --db postgres <name>` emits a modern starter that builds, tests, and tells the serious clustered/deployable story honestly.

## Tasks
- [x] **T01: Added typed `--db` init validation and a DB-aware todo-api scaffold seam without regressing the existing SQLite starter.** — - Why: The slice needs a typed `--db` seam before Postgres content can land without breaking the legacy SQLite starter.
- Do: Add a typed todo-database selector to `meshc init`, reject invalid `--db`/`--template`/`--clustered` combinations explicitly, and route `todo-api` generation through a DB-aware scaffold entrypoint while preserving the no-flag SQLite path and existing public errors.
- Done when: `meshc init --template todo-api --db postgres <name>` is a valid dispatch path, invalid flag combinations fail cleanly, and the current SQLite init contract still passes its existing tests.
  - Estimate: 1h
  - Files: compiler/meshc/src/main.rs, compiler/mesh-pkg/src/lib.rs, compiler/mesh-pkg/src/scaffold.rs, compiler/meshc/tests/tooling_e2e.rs
  - Verify: - `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_ -- --nocapture`
- `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture`
- `cargo test -p mesh-pkg m047_s05_scaffold_todo_api_project_ -- --nocapture`
- [x] **T02: Shipped a real Postgres todo-api scaffold with migrations, pool-backed startup, helper-based CRUD, and static contract checks.** — - Why: R115 and R122 depend on a real migration-first Postgres starter, not a renamed SQLite scaffold.
- Do: Emit the Postgres-specific starter files from the scaffold (`config.mpl`, `migrations/`, `tests/`, `storage/`, README/Dockerfile/.env example) using `DATABASE_URL`, `Pool.open`, and `Migration`/`Repo`/`Query`/`Pg` helpers, and add generator/CLI assertions that the Postgres template stays honest without regressing SQLite.
- Done when: The generated Postgres project contains the new files and contract text, omits SQLite-only env and startup DDL, and its static scaffold tests pass alongside the legacy SQLite scaffold tests.
  - Estimate: 2h
  - Files: compiler/mesh-pkg/src/scaffold.rs, compiler/mesh-pkg/src/lib.rs, compiler/meshc/tests/tooling_e2e.rs
  - Verify: - `cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`
- `cargo test -p mesh-pkg m047_s05_scaffold_todo_api_project_ -- --nocapture`
- `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`
- `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture`
- [ ] **T03: Prove the generated Postgres starter on the live runtime path** — - Why: The slice is not done until the generated Postgres starter migrates, builds, tests, boots, and exposes diagnosable failure paths.
- Do: Add a dedicated M049 Postgres scaffold harness that creates an isolated database, runs `meshc migrate <project> up`, `meshc test <project>`, `meshc build <project>`, boots the starter, exercises `/health` plus CRUD/error paths, and archives logs/HTTP output without leaking `DATABASE_URL`.
- Done when: `compiler/meshc/tests/e2e_m049_s01.rs` proves the generated Postgres starter end-to-end and the M048 non-regression contract still passes if the CLI/help surface changed.
  - Estimate: 2h
  - Files: compiler/meshc/tests/e2e_m049_s01.rs, compiler/meshc/tests/support/m049_todo_postgres_scaffold.rs, compiler/meshc/tests/support/mod.rs
  - Verify: - `cargo test -p meshc --test e2e_m049_s01 -- --nocapture`
- `node --test scripts/tests/verify-m048-s05-contract.test.mjs`
