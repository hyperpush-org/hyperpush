# S03: Generated `/examples` from scaffold output

**Goal:** Commit `/examples/todo-sqlite` and `/examples/todo-postgres` as public scaffold outputs generated through the public `meshc init` path, and prove exact parity plus `meshc test` / `meshc build --output` against those checked-in trees without retiring proof-app onboarding surfaces yet.
**Demo:** After this: `/examples/todo-postgres` and `/examples/todo-sqlite` exist as generated outputs that build, test, and match scaffold output mechanically.

## Tasks
- [x] **T01: Locked the SQLite scaffold banner to `--db sqlite` and added a repo-owned public-CLI example materializer/check script with temp-root tests.** — Before checking in `/examples`, stabilize the generator inputs and the regeneration seam. Tighten the SQLite README banner to the explicit `--db sqlite` command, then add a repo-owned materializer/check script that generates both example trees through the public `meshc init` CLI into temp space. The script must support `--write` and `--check` modes, fail closed on unsafe target paths or partial output, and have a small Node test so future refreshes do not depend on ad hoc copy steps.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public `meshc init` CLI | Stop and surface stdout/stderr from generation; do not write partial example trees. | Bound each generation call and fail with the command plus temp path if it hangs. | Reject generated trees missing expected root files instead of diffing partial output. |
| `compiler/mesh-pkg/src/scaffold.rs` and `compiler/meshc/tests/tooling_e2e.rs` wording assertions | Fail tests before any example refresh lands. | N/A — local test execution only. | Treat generic SQLite wording or mixed local/clustered guidance as contract drift. |
| Local filesystem target paths | Refuse to write outside `examples/todo-sqlite` and `examples/todo-postgres`. | N/A — local filesystem work only. | Reject symlinks, partial target trees, or unexpected target roots instead of overwriting blindly. |

## Load Profile

- **Shared resources**: temp workspaces, repo example roots, and the local `meshc` binary path used by the materializer.
- **Per-operation cost**: two `meshc init` runs plus recursive manifest/diff generation.
- **10x breakpoint**: repeated scaffold generation and filesystem churn show up before CPU; the script should leave no partial temp trees behind.

## Negative Tests

- **Malformed inputs**: unknown mode/flag, invalid `MESHC_BIN` / `--meshc-bin`, and missing expected scaffold files.
- **Error paths**: generic SQLite README wording surviving, generation failure, or an unsafe write target outside the two example roots.
- **Boundary conditions**: check mode on a temp examples root, write mode replacing an existing example tree atomically, and the intentional SQLite/Postgres file-set differences.

## Steps

1. Update `compiler/mesh-pkg/src/scaffold.rs` so the SQLite README banner uses the explicit `meshc init --template todo-api --db sqlite` form and extend nearby scaffold assertions to pin that wording.
2. Add `scripts/tests/verify-m049-s03-materialize-examples.mjs` with `--write` and `--check` modes, public-CLI generation, temp staging, allowed-target validation, and exact recursive diff output.
3. Add `scripts/tests/verify-m049-s03-materialize-examples.test.mjs` covering temp-root write/check behavior and drift detection without touching the tracked repo examples.
4. Extend `compiler/meshc/tests/tooling_e2e.rs` so the SQLite init path fails closed on stale generic wording.

## Must-Haves

- [ ] SQLite public scaffold surfaces use explicit `--db sqlite` wording.
- [ ] One repo-owned script can regenerate or check both example trees through `meshc init`, not private scaffold internals.
- [ ] Script red paths name missing/extra/changed files and refuse unsafe target paths.
  - Estimate: 1h30m
  - Files: compiler/mesh-pkg/src/scaffold.rs, compiler/meshc/tests/tooling_e2e.rs, scripts/tests/verify-m049-s03-materialize-examples.mjs, scripts/tests/verify-m049-s03-materialize-examples.test.mjs
  - Verify: - `cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture`
- `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_sqlite_ -- --nocapture`
- `node --test scripts/tests/verify-m049-s03-materialize-examples.test.mjs`
- [x] **T02: Checked in generator-owned `todo-sqlite` and `todo-postgres` example trees under `examples/` using the public materializer seam.** — Use the T01 materializer to create the tracked example apps as generated outputs, not hand-edited showcase projects. This task owns the committed trees only: `examples/todo-sqlite` and `examples/todo-postgres` should be generated with those exact project names, stay free of build artifacts, and stop at example content. It must not rewrite repo docs or retire proof apps; that boundary remains S04 work.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| T01 materializer/check script | Stop on any generation or drift failure; do not hand-fix generated files. | Bound the script call and keep its temp output path for diagnosis. | Reject partial writes or half-generated example dirs instead of normalizing them by hand. |
| Current scaffold templates | Regenerate from the public CLI and compare before accepting the tree. | N/A — local generation only. | Reject unexpected file additions/removals rather than silently checking them in. |
| Tracked example directories | Replace from staged temp output and keep repo paths free of build artifacts and secrets. | N/A — local filesystem work only. | Refuse dirty unexpected non-generated files or unsafe path shapes under `examples/`. |

## Load Profile

- **Shared resources**: repo example directories, temp generation roots, and the working tree diff.
- **Per-operation cost**: two scaffold generations and one recursive check replay.
- **10x breakpoint**: working tree churn and review noise show up before CPU; the task should keep the example trees generator-owned and boring.

## Negative Tests

- **Malformed inputs**: wrong project name, missing SQLite storage test, or missing Postgres migration / `.env.example` file.
- **Error paths**: extra hand-edited files under an example tree or partial generation output.
- **Boundary conditions**: SQLite and Postgres intentionally keep different file sets, and S03 must not add an `examples/README.md`, repo doc rewires, or proof-app deletions.

## Steps

1. Run the T01 materializer in write mode to generate `examples/todo-sqlite` and `examples/todo-postgres` through the public CLI with those exact project names.
2. Keep the checked-in trees generator-owned: no hand-maintained content, no build outputs, no `.env` secrets, and no extra S04 public-surface rewiring.
3. Confirm the mode-specific files remain intact (`tests/storage.test.mpl` only on SQLite; `work.mpl`, `.env.example`, and the migration file only on Postgres).
4. Rerun the materializer in check mode so the committed examples are exactly reproducible.

## Must-Haves

- [ ] `examples/todo-sqlite` and `examples/todo-postgres` exist as checked-in scaffold output, not hand-maintained variants.
- [ ] The checked-in trees use the exact project names that future docs can reference directly.
- [ ] No build artifacts, secrets, or S04 doc rewires land with the example trees.
  - Estimate: 45m
  - Files: examples/todo-sqlite/mesh.toml, examples/todo-sqlite/README.md, examples/todo-sqlite/tests/storage.test.mpl, examples/todo-postgres/mesh.toml, examples/todo-postgres/README.md, examples/todo-postgres/migrations/20260402120000_create_todos.mpl
  - Verify: - `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`
- [ ] **T03: Add a slice-owned parity, test, and build rail for the committed examples** — Prove the checked-in examples are not decorative. Add a dedicated `meshc` integration target that regenerates fresh examples through the public CLI, compares them byte-for-byte against the committed trees, runs `meshc test` on both examples, and builds both examples to `.tmp` outputs. Reuse the T01 materializer/check seam instead of copying generation logic again.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Materializer script plus public `meshc init` | Fail before any build/test claims and archive generated trees plus diff output. | Bound generation and command phases with retained logs. | Reject partial generation output instead of diffing nonsense. |
| Committed example trees | Fail with named missing/extra/changed file reports and retain committed-vs-generated snapshots. | N/A — local filesystem comparison only. | Reject silent normalization or ignored diffs. |
| `meshc test` / `meshc build --output` on the example dirs | Archive stdout/stderr and stop on the first failing example. | Bound each phase and retain timeout artifacts. | Reject wrong pass counts, missing binaries, or accidental repo-tree build outputs. |

## Load Profile

- **Shared resources**: temp workspaces, `.tmp/m049-s03` artifacts, the local `meshc` binary, and the static runtime archive used by `meshc build`.
- **Per-operation cost**: two fresh generations, two `meshc test` runs, and two `meshc build --output` runs.
- **10x breakpoint**: compile/build time and temp artifact churn appear before CPU; no live DB or network should be required.

## Negative Tests

- **Malformed inputs**: missing example root, extra hand-edited file, unexpected project name, or a missing Postgres migration / SQLite storage test.
- **Error paths**: check-mode diff, `meshc test` not reporting the expected pass count, or `meshc build --output` not emitting the requested binary.
- **Boundary conditions**: SQLite/Postgres divergent file sets stay intentional, and both examples must build from tracked dirs without writing outputs back into the repo tree.

## Steps

1. Add `compiler/meshc/tests/support/m049_todo_examples.rs` with helpers to run the materializer/check script, archive fresh generated trees and diff manifests, and reuse the existing scaffold helpers for `meshc test` / `meshc build --output` against the committed examples.
2. Register the helper in `compiler/meshc/tests/support/mod.rs`.
3. Add `compiler/meshc/tests/e2e_m049_s03.rs` with named tests covering exact SQLite/Postgres parity plus `meshc test` and `meshc build --output` for both `examples/` projects.
4. Retain `.tmp/m049-s03/...` artifacts containing generated trees, diff output, test logs, and build metadata so S04/S05 can debug example drift quickly.

## Must-Haves

- [ ] `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` fails on any committed/generated drift in either example tree.
- [ ] The same target proves `meshc test` reports the expected generated-package pass counts for both examples.
- [ ] The same target proves both examples build through `meshc build --output <tmp>` without polluting the repo tree.
  - Estimate: 1h30m
  - Files: compiler/meshc/tests/support/m049_todo_examples.rs, compiler/meshc/tests/support/mod.rs, compiler/meshc/tests/e2e_m049_s03.rs
  - Verify: - `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`
- `cargo test -p meshc --test e2e_m049_s03 -- --nocapture`
