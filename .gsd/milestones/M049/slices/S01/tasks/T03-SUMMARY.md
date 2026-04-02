---
id: T03
parent: S01
milestone: M049
provides:
  - A redacted Postgres runtime harness for the generated todo-api starter, plus a live e2e rail that now reproduces the remaining scaffold-compile seam with retained artifacts.
key_files:
  - compiler/meshc/tests/support/m049_todo_postgres_scaffold.rs
  - compiler/meshc/tests/e2e_m049_s01.rs
  - compiler/mesh-pkg/src/scaffold.rs
key_decisions:
  - Keep the live M049 Postgres rail secret-safe by capturing phase stdout/stderr to temporary files first and only writing redacted artifacts into `.tmp/m049-s01/`.
  - Move the generated Postgres HTTP handlers toward the existing helper-chain Mesh pattern and replace direct `Todo ! String` `?` unwrapping in storage helpers with explicit `case` dispatch, because the first live compile pass exposed those shapes as the real scaffold blocker.
patterns_established:
  - Use a disposable local Postgres admin URL for verification, then have the harness create and later drop a unique per-test database so migrate/build/boot failures localize cleanly without reusing state.
observability_surfaces:
  - `.tmp/m049-s01/*` phase logs (`init`, `migrate-up`, `meshc-test`, `build`, runtime stdout/stderr, HTTP snapshots, database metadata)
  - redacted phase metadata files under the same artifact roots
  - retained failing generated project tree under `generated-project/`
duration: partial
verification_result: failed
completed_at: 2026-04-02T21:38:35Z
blocker_discovered: false
---

# T03: Prove the generated Postgres starter on the live runtime path

**Built the redacted live Postgres harness and surfaced the remaining generated-starter compile seam, but the task is not finished yet.**

## What Happened

Replaced the placeholder `compiler/meshc/tests/support/m049_todo_postgres_scaffold.rs` with a real secret-safe harness: unique artifact roots under `.tmp/m049-s01/`, isolated database creation/drop from an admin `DATABASE_URL`, phase-specific command capture with timeouts, redacted runtime stdout/stderr handling, and HTTP snapshot helpers that fail closed on malformed JSON. Replaced `compiler/meshc/tests/e2e_m049_s01.rs` with three live rails: the full migrate/test/build/boot/CRUD proof, a missing-`DATABASE_URL` startup diagnostic proof, and an unmigrated-database error-path proof.

The first live replay exposed that the generated Postgres scaffold itself still does not compile on the serious path. The failing seam is in the Mesh source emitted from `compiler/mesh-pkg/src/scaffold.rs`, not in the Rust harness: the generated Postgres `storage/todos.mpl` and `api/todos.mpl` used shapes that the static T02 checks did not exercise. I patched the scaffold templates once already by (1) moving the generated Postgres HTTP handlers toward the same helper-chain style used in working repo handlers and (2) replacing direct `Todo ! String` `?` unwrapping in the generated storage toggle/delete helpers with explicit `case` dispatch. I also fixed the Rust-side build helper so a failed `meshc build` reports the real compiler output instead of a secondary “missing binary” assertion.

At wrap-up time, the target recompiles cleanly with `cargo test -p meshc --test e2e_m049_s01 --no-run`, but I have not rerun the live Postgres rail after the latest scaffold patch. The retained failing bundles from the first live replay are still the correct resume point.

## Verification

Ran the M049 target compile-only rail before and after the scaffold patch, then ran the live target once against a disposable local Postgres container by supplying a temporary admin `DATABASE_URL` at invocation time. The first live replay failed in the generated Postgres scaffold compile phase, which is now localized to the emitted Mesh source rather than the Rust harness. I did **not** rerun the live rail or the M048 contract script after the final scaffold patch because the context-budget wrap-up instruction landed first.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p meshc --test e2e_m049_s01 --no-run` | 0 | ✅ pass | 17540ms |
| 2 | `DATABASE_URL=<temp-postgres-admin-url> cargo test -p meshc --test e2e_m049_s01 -- --nocapture` | 101 | ❌ fail | 11660ms |
| 3 | `cargo test -p meshc --test e2e_m049_s01 --no-run` | 0 | ✅ pass | 24560ms |

## Diagnostics

Start from the retained first-failure bundles under:

- `.tmp/m049-s01/todo-api-postgres-runtime-truth-1775165601595675000/`
- `.tmp/m049-s01/todo-api-postgres-missing-database-url-1775165601595310000/`
- `.tmp/m049-s01/todo-api-postgres-unmigrated-database-1775165601595681000/`

The key artifacts from the failed live replay are:

- `generated-project/storage/todos.mpl`
- `generated-project/api/todos.mpl`
- `generated-project/api/router.mpl`
- `meshc-test.stdout.log` / `meshc-test.stderr.log`
- `build.stdout.log` / `build.stderr.log` / `build.meta.txt`
- `database.json`

The first live replay showed the real breakage clearly:

- generated Postgres `meshc test <project>` failed on `storage/todos.mpl` / `api/todos.mpl`
- the earlier Rust build helper also over-asserted on a missing output binary after a failed compile, which is now fixed
- no secret leak was observed in the retained artifacts from that replay; the new harness writes redacted artifacts only

## Deviations

I used a disposable local Postgres Docker container during verification instead of relying on a repo-managed `DATABASE_URL`, but kept the committed harness env-driven so it can create/drop an isolated database from whatever admin URL the verification environment provides.

## Known Issues

- The task is **not complete**.
- The latest scaffold patch has only been compile-checked with `--no-run`; the live Postgres rail still needs a full rerun.
- `node --test scripts/tests/verify-m048-s05-contract.test.mjs` has **not** been rerun after the latest scaffold patch.
- Resume in this order:
  1. rerun `DATABASE_URL=<temp-postgres-admin-url> cargo test -p meshc --test e2e_m049_s01 -- --nocapture`
  2. if the live rail is green, rerun `node --test scripts/tests/verify-m048-s05-contract.test.mjs`
  3. only after both pass, write the final closeout summary and call `gsd_complete_task`

## Files Created/Modified

- `compiler/meshc/tests/support/m049_todo_postgres_scaffold.rs` — added the live Postgres harness with isolated DB lifecycle, redacted phase capture, runtime process control, and HTTP artifact helpers.
- `compiler/meshc/tests/e2e_m049_s01.rs` — replaced the static scaffold checks with live runtime, missing-`DATABASE_URL`, and unmigrated-database rails.
- `compiler/mesh-pkg/src/scaffold.rs` — patched the generated Postgres todo-api Mesh templates toward working helper-chain/result-dispatch shapes after the first live replay exposed scaffold compile failures.
- `.gsd/milestones/M049/slices/S01/tasks/T03-SUMMARY.md` — recorded the incomplete state and exact resume point.
