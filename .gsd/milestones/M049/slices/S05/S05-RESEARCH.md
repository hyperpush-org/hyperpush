# S05 Research — Assembled scaffold/example truth replay

## Summary

- **Primary requirement focus:** `R116` is the owner for this slice because S05 is the milestone-level proof that scaffold + generated `/examples` replaced the old proof-app onboarding story. `R115` is the main supporting requirement because the assembled rail still has to replay the dual-database Todo scaffold truth from S01/S02. `R127` stays in scope because proof-app-shaped public onboarding must remain retired across the older retained rails. `R112` / `R113` / `R114` are guardrails via the existing M048 assembled verifier. `R122` constrains the wording and proof split: SQLite stays explicitly local-only; Postgres stays the shared/deployable clustered path.
- The repo already has all the lower-level rails. **What is missing is the assembler.** There is no `scripts/verify-m049-s05.sh`, no `scripts/tests/verify-m049-s05-contract.test.mjs`, and no `compiler/meshc/tests/e2e_m049_s05.rs` yet.
- The best implementation starting point is **M048’s assembled verifier skeleton** (`scripts/verify-m048-s05.sh`) for phase/status/log/pointer/bundle machinery, combined with **M047’s retained-wrapper pattern** (`scripts/verify-m047-s05.sh`) for replaying an upstream verifier and copying its whole `verify/` directory into a new bundle.
- The proof families are complementary and should stay that way. **No single existing rail covers all of S05**:
  - S01/S02 prove dual-db scaffold generation and live runtime behavior.
  - S03 proves public example parity plus example `meshc test` / `meshc build` truth.
  - S04’s Node onboarding contract proves public copy, scaffold README template, clustering skill, and absence of repo-root proof dirs.
  - Older retained bash rails (`verify-m039-s01.sh`, `verify-m045-s02.sh`, `verify-m047-s05.sh`) prove the relocated internal fixtures did not break historical proof surfaces.
  - `verify-m048-s05.sh` already owns the retained entrypoint/update/editor guardrails.
- Two non-obvious ordering constraints matter:
  1. `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` defaults to `target/debug/meshc`, so it should not be the first phase on a clean tree.
  2. `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` requires an explicit `DATABASE_URL` load; non-interactive shells in this repo do **not** inherit the needed env automatically.

## Requirements Focus

- **R116 — owner / likely validation target**
  - One named repo verifier should prove that scaffold + generated examples are now the truthful onboarding surface.
  - S05 is the place to gather S03 example parity, S04 onboarding retirement, and retained-clustered proof replays under one retained bundle.
- **R115 — support**
  - The assembled rail still has to replay both sides of the Todo starter split:
    - `meshc init --template todo-api --db sqlite`
    - `meshc init --template todo-api --db postgres`
  - Current lower-level rails already exist in `mesh-pkg`, `tooling_e2e`, and `e2e_m049_s01` / `e2e_m049_s02`.
- **R127 — support**
  - Proof-app-shaped public onboarding must stay retired, and the historical fixture-backed rails must remain green after the repo-root package move.
- **R112 / R113 / R114 — non-regression guardrails**
  - Do not re-spell M048’s entrypoint/update/editor proof by hand. Reuse `bash scripts/verify-m048-s05.sh`.
- **R122 — constraint**
  - Any assembled contract or doc mention must preserve the public split:
    - SQLite Todo starter = honest local single-node starter
    - Postgres Todo starter = serious shared/deployable clustered starter

## Skills Discovered

- **Loaded existing skill:** `test`
  - Relevant rules used here:
    - detect the project’s real test frameworks and conventions before adding new rails
    - match the existing test style instead of inventing a new harness pattern
    - verify using the project’s actual runners, not ad hoc substitutes
  - Result: S05 should stay on the repo’s existing proof seams:
    - Rust integration/unit tests via `cargo test`
    - Node contract tests via `node:test` under `scripts/tests/*.test.mjs`
    - bash assembled verifiers under `scripts/verify-*.sh`
- **Installed new skill:** `bash-scripting` (`sickn33/antigravity-awesome-skills@bash-scripting`, 399 installs)
  - Reason: this slice’s main new implementation surface is a bash assembled verifier.
- **No additional skill installs were needed.** The current slice is mostly repo-local Rust/Node/bash integration work, and the existing `test` skill already covers the test-pattern side.

## Implementation Landscape

### 1. There is no M049 assembled verifier yet

Missing files right now:

- `scripts/verify-m049-s05.sh`
- `scripts/tests/verify-m049-s05-contract.test.mjs` (optional but the natural public-contract slot if the new verifier is documented)
- `compiler/meshc/tests/e2e_m049_s05.rs` (natural Rust contract/e2e slot if the repo wants a script-content/bundle-shape assertion like M047 used)

The closest existing templates are:

- `scripts/verify-m048-s05.sh`
  - strongest template for:
    - `status.txt`
    - `current-phase.txt`
    - `phase-report.txt`
    - `full-contract.log`
    - `latest-proof-bundle.txt`
    - retained-bundle shape checks
    - snapshot/copy of new timestamped `.tmp/...` artifact directories
- `scripts/verify-m047-s05.sh`
  - strongest template for:
    - replaying a higher-level existing verifier (`bash scripts/verify-m047-s04.sh`)
    - copying an entire upstream `verify/` directory into a new bundle
    - treating historical proof rails as retained subrails instead of re-explaining them

**Recommendation:** start from the M048 shell structure, but borrow M047’s retained-upstream-verify pattern for M047/M048 subrails.

### 2. S01/S02 already own the dual-db scaffold truth; S05 should replay them, not replace them

#### Static scaffold-generation seams

- `compiler/mesh-pkg/src/scaffold.rs`
  - Postgres filter: `m049_s01_postgres_scaffold_`
  - SQLite filter: `m049_s02_sqlite_scaffold_`
- `compiler/meshc/tests/tooling_e2e.rs`
  - SQLite/general db split filter: `test_init_todo_template_db_sqlite_` or broader `test_init_todo_template_db_`
  - Postgres filter: `test_init_todo_template_postgres_`

These are the **fast fail-first phases**. They validate generator content and CLI fail-closed behavior before the expensive runtime replays.

#### Live runtime seams

- `compiler/meshc/tests/e2e_m049_s01.rs`
  - creates timestamped artifacts under `.tmp/m049-s01/` with these prefixes:
    - `todo-api-postgres-runtime-truth`
    - `todo-api-postgres-missing-database-url`
    - `todo-api-postgres-unmigrated-database`
  - **Requires `DATABASE_URL`.**
- `compiler/meshc/tests/e2e_m049_s02.rs`
  - creates timestamped artifacts under `.tmp/m049-s02/` with these prefixes:
    - `todo-api-sqlite-runtime-truth`
    - `todo-api-sqlite-bad-db-path`

Important current-tree detail from S01 closeout: the green Postgres replay used a repo-local env file at `.tmp/m049-s01/local-postgres/connection.env` because plain non-interactive shell runs were not inheriting the needed env. That path exists in the current tree, but it is **session state**, not tracked source. S05 should not silently depend on it unless it is treated as an explicit local convenience/fallback rather than the durable contract.

### 3. S03 already owns the example parity seam; direct Node check and Rust e2e do different jobs

Public parity command:

- `scripts/tests/verify-m049-s03-materialize-examples.mjs --check`
  - generates both examples through the public `meshc init` CLI
  - checks the committed trees against generated output
  - emits named lines such as:
    - `phase=manifest ...`
    - `phase=check example=todo-sqlite ...`
    - `phase=check example=todo-postgres ...`
    - `phase=materialize mode=check result=pass ...`

Key constraint from the script itself:

- its default binary is `target/debug/meshc`
- on success it cleans up its temp session directory
- so **it is a log-only public seam**, not a retained-artifact seam

Rust parity/build seam:

- `compiler/meshc/tests/e2e_m049_s03.rs`
  - creates timestamped artifacts under `.tmp/m049-s03/` with these prefixes:
    - `todo-examples-parity`
    - `todo-examples-missing-root`
    - `todo-examples-drift-report`
    - `todo-sqlite-test-build`
    - `todo-postgres-test-build`
  - this is the place that retains generated trees, manifests, and build/test evidence under repo-local `.tmp`

**Recommendation:** keep both layers.

- The direct Node `--check` command is the public parity/update seam and should appear as a phase.
- The retained bundle should come from `e2e_m049_s03`, not from modifying the Node materializer to keep temp dirs around.

### 4. S04 retirement proof is spread across complementary rails; do not collapse it to one command

#### Public onboarding contract test

- `scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`

It covers the public/source contract that the bash historical rails do **not** cover completely:

- `README.md`
- clustered README template extracted from `compiler/mesh-pkg/src/scaffold.rs`
- `website/docs/docs/getting-started/clustered-example/index.md`
- `website/docs/docs/distributed/index.md`
- `website/docs/docs/distributed-proof/index.md`
- `website/docs/docs/tooling/index.md`
- `tools/skill/mesh/skills/clustering/SKILL.md`
- absence of repo-root `tiny-cluster/` and `cluster-proof/`

#### Historical retained rails still worth replaying

- `bash scripts/verify-m039-s01.sh`
  - older direct clustered proof rail
  - writes `.tmp/m039-s01/verify/phase-report.txt` and phase logs
  - **does not** have `status.txt`, `current-phase.txt`, or `latest-proof-bundle.txt`
- `bash scripts/verify-m045-s02.sh`
  - repaired retained historical rail with:
    - `status.txt`
    - `current-phase.txt`
    - `phase-report.txt`
    - `full-contract.log`
    - `latest-proof-bundle.txt`
- `bash scripts/verify-m047-s05.sh`
  - already wraps `bash scripts/verify-m047-s04.sh`
  - replays the cutover rail, the fixture-backed historical Todo rail, docs build, and retained provenance/bundle checks

Important blind-spot finding:

- `verify-m047-s05.sh` is **not** a replacement for `verify-m049-s04-onboarding-contract.test.mjs`
  - it checks root-dir absence and example README/public guide drift
  - it does **not** check the clustered scaffold README template in `compiler/mesh-pkg/src/scaffold.rs`
  - it does **not** check the Mesh clustering skill contract
- `verify-m049-s04-onboarding-contract.test.mjs` is **not** a replacement for the historical rails
  - it does not replay `m039`, `m045`, or `m047` retained fixture-backed proof paths

So the honest S04 replay inside S05 is:

- `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`
- `bash scripts/verify-m039-s01.sh`
- `bash scripts/verify-m045-s02.sh`
- `bash scripts/verify-m047-s05.sh`

### 5. M048 non-regression is already assembled; replay the wrapper verbatim

- `bash scripts/verify-m048-s05.sh`

Why reuse it instead of unrolling its internals:

- it already owns the named M048 acceptance story
- it already knows how to preflight and retain:
  - `.tmp/m036-s02/lsp`
  - `.tmp/m036-s02/syntax`
  - `.tmp/m036-s03/vscode-smoke`
  - `.tmp/m048-s01/*`
  - `.tmp/m048-s03/*`
- it already guards the public docs/tooling command mentions for `verify-m048-s05.sh`
- it already imports the non-M049 dependencies that matter here:
  - `NEOVIM_BIN` / Neovim smoke
  - VS Code smoke through `npm --prefix tools/editors/vscode-mesh run test:smoke`

**Recommendation:** treat `verify-m048-s05.sh` as a retained upstream verify dir copied into the M049 bundle, not as phases to rewrite locally.

### 6. Ordering matters more than usual

Recommended order inside the new bash wrapper:

1. **Fast public/static phases first**
   - `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`
   - `cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`
   - `cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture`
   - `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_sqlite_ -- --nocapture`
   - `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`
2. **Then the direct public parity command**
   - `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`
   - but only after a cargo phase has produced `target/debug/meshc`
3. **Then the expensive runtime/parity replays**
   - `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` with explicit env loading
   - `cargo test -p meshc --test e2e_m049_s02 -- --nocapture`
   - `cargo test -p meshc --test e2e_m049_s03 -- --nocapture`
4. **Then the retained historical rails**
   - `bash scripts/verify-m039-s01.sh`
   - `bash scripts/verify-m045-s02.sh`
   - `bash scripts/verify-m047-s05.sh`
5. **M048 wrapper last**
   - `bash scripts/verify-m048-s05.sh`

Why this order:

- it fails fast on obvious scaffold/docs/example drift before spending time on editor smoke
- it avoids the direct materializer check failing early on a missing `target/debug/meshc`
- it keeps the website build phases serial, because both `verify-m047-s05.sh` and `verify-m048-s05.sh` already rebuild docs internally

### 7. The retained-bundle story should combine fixed verify dirs plus new timestamped M049 artifacts

Best bundle shape for `.tmp/m049-s05/verify/retained-proof-bundle/`:

- fixed retained verify dirs copied whole after replay:
  - `retained-m039-s01-verify`
  - `retained-m045-s02-verify`
  - `retained-m047-s05-verify`
  - `retained-m048-s05-verify`
- new timestamped M049 artifact directories copied via before/after snapshot:
  - `retained-m049-s01-artifacts`
  - `retained-m049-s02-artifacts`
  - `retained-m049-s03-artifacts`
- manifest files for the timestamped buckets, analogous to M048:
  - `retained-m049-s01-artifacts.manifest.txt`
  - `retained-m049-s02-artifacts.manifest.txt`
  - `retained-m049-s03-artifacts.manifest.txt`

Important detail:

- `.tmp/m049-s01` already contains a fixed sibling `local-postgres/`
- do **not** hardcode “all directories under `.tmp/m049-s01` are replay artifacts”
- use before/after snapshots and copy only the new names created by the replay

Bundle-shape assertions should be asymmetric:

- for `m039-s01`, assert only what that older script actually owns (`phase-report.txt` plus its phase logs)
- for `m045-s02`, `m047-s05`, and `m048-s05`, assert `status.txt`, `phase-report.txt`, and `latest-proof-bundle.txt`
- for the M049 slice buckets, assert the expected prefix families rather than a loose “non-empty directory” rule

### 8. Public discoverability is currently absent; treat doc exposure as a conscious choice

There is currently **no public mention** of any `verify-m049-s05.sh` command in:

- `README.md`
- `website/docs/docs/tooling/index.md`
- `website/docs/docs/distributed-proof/index.md`

Natural doc slots if the new verifier is meant to be discoverable now:

- `README.md`
  - near the scaffold/examples guidance, or in a new assembled starter/example proof note
- `website/docs/docs/tooling/index.md`
  - near the existing “Assembled contract verifier” section that currently points at `verify-m048-s05.sh`
- `website/docs/docs/distributed-proof/index.md`
  - only if the new rail is meant to be part of the distributed-proof map, not just the M049 scaffold/example milestone closeout

Natural contract-test pattern if docs are updated:

- `scripts/tests/verify-m049-s05-contract.test.mjs`
  - modeled after `scripts/tests/verify-m048-s05-contract.test.mjs`
  - mutate README/tooling/distributed-proof mentions and fail closed when the new verifier name disappears or drifts

If the slice wants to keep the rail internal, skip the docs work and keep S05 to script + contract/e2e only.

## Recommendation

1. **Add `scripts/verify-m049-s05.sh` as the single assembled acceptance rail.**
   - Start from `scripts/verify-m048-s05.sh` for helper structure.
   - Reuse M047’s pattern for replaying upstream verifiers and copying their `verify/` directories verbatim.

2. **Keep the proof families separate inside the wrapper instead of inventing a new mega-test target.**
   - Replay the existing unit, tooling, e2e, Node contract, and historical bash rails.
   - Do not replace them with one new Rust target that reimplements their assertions.

3. **Make env handling explicit for the Postgres phase.**
   - Do not rely on inherited shell state.
   - Either:
     - require `DATABASE_URL` up front with a clear preflight failure, or
     - explicitly load a known local env file inside the wrapper
   - Avoid silently depending on the current session’s `.tmp/m049-s01/local-postgres/connection.env` as if it were durable source.

4. **Retain logs for public-command phases and retain copied artifacts for timestamped Rust e2e phases.**
   - The Node materializer check is log-only.
   - The retained M049 evidence should come from `e2e_m049_s01`, `e2e_m049_s02`, and `e2e_m049_s03` snapshots.

5. **If discoverability matters, add one Node contract test and only minimal doc mentions.**
   - `README.md` + `website/docs/docs/tooling/index.md` are the least surprising public slots.
   - Do not over-expand into more docs unless the slice explicitly decides the new verifier is public-facing.

## Verification Strategy

### Minimum truthful assembled replay

- `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`
- `cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`
- `cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture`
- `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_sqlite_ -- --nocapture`
- `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`
- `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`
- explicit-env `cargo test -p meshc --test e2e_m049_s01 -- --nocapture`
- `cargo test -p meshc --test e2e_m049_s02 -- --nocapture`
- `cargo test -p meshc --test e2e_m049_s03 -- --nocapture`
- `bash scripts/verify-m039-s01.sh`
- `bash scripts/verify-m045-s02.sh`
- `bash scripts/verify-m047-s05.sh`
- `bash scripts/verify-m048-s05.sh`

### Optional expansion if the planner wants stronger fail-closed coverage

- `node --test scripts/tests/verify-m049-s03-materialize-examples.test.mjs`
  - useful if S05 wants the materializer’s red-path behavior re-proven in the assembled rail, not just the public `--check` green path

## Natural Task Seams

### Task 1 — New assembled shell wrapper

Files:

- `scripts/verify-m049-s05.sh`

Owns:

- phase sequencing
- status/current-phase/phase-report/full-contract log files
- Postgres env preflight/loading
- upstream verify-dir retention
- snapshot/copy of new `.tmp/m049-s01|02|03` artifacts
- final retained-bundle shape assertion

### Task 2 — Script contract test (Rust and/or Node)

Likely files:

- `compiler/meshc/tests/e2e_m049_s05.rs` (Rust script-content / bundle-shape assertions)
- optionally `scripts/tests/verify-m049-s05-contract.test.mjs` if docs are updated

Owns:

- fail-closed check that the script still replays the intended rails
- fail-closed check that retained bundle markers/pointer files stay truthful
- doc mention checks only if the new verifier becomes public-facing

### Task 3 — Optional docs/discoverability pass

Possible files:

- `README.md`
- `website/docs/docs/tooling/index.md`
- possibly `website/docs/docs/distributed-proof/index.md`
- `scripts/tests/verify-m049-s05-contract.test.mjs`

Owns:

- only the explicit mention of the new verifier command
- no new product/runtime behavior

## Risks / Gotchas

- **Direct materializer ordering bug:** `scripts/tests/verify-m049-s03-materialize-examples.mjs --check` will fail on a clean tree if `target/debug/meshc` does not exist yet.
- **Postgres env drift:** `e2e_m049_s01` needs `DATABASE_URL`; a wrapper that forgets to preflight/load it will look flaky even when code is fine.
- **S04 blind spot if rails are collapsed:** onboarding Node contract and historical bash rails cover different files and different failure modes.
- **Older verify-dir asymmetry:** `.tmp/m039-s01/verify` does not follow the newer `status.txt` / `latest-proof-bundle.txt` convention, so bundle-shape logic must not assume it does.
- **Serial docs builds only:** `verify-m047-s05.sh` and `verify-m048-s05.sh` both rebuild the website; keep the whole replay serial.
- **No need for new support module by default:** `compiler/meshc/tests/support/mod.rs` already exports the M049 helper modules; a new Rust contract test can probably reuse existing support + `m046_route_free::repo_root()` without new helper plumbing.
