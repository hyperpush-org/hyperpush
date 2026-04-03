# S04: Retire top-level proof-app onboarding surfaces

**Goal:** Retire `tiny-cluster/` and `cluster-proof/` as repo-root onboarding projects by moving them into stable internal fixture paths, repointing public clustered teaching surfaces to scaffold plus generated `/examples`, and keeping the retained clustered proof rails green under the new fixture layout.
**Demo:** After this: `tiny-cluster/` and `cluster-proof/` are gone as top-level onboarding projects, and repo references now point at `/examples` or lower-level fixtures/support instead.

## Tasks
- [x] **T01: Relocated tiny-cluster into scripts/fixtures/clustered/tiny-cluster and switched the retained M046 route-free rail to the fixture path.** — Move the minimal `tiny-cluster` proof package out of the repo root into a stable internal fixture location under `scripts/fixtures/clustered/tiny-cluster` and teach the shared route-free helper plus the tiny-cluster-specific e2e rail to resolve the new package path without changing package identity, runtime names, or log prefixes.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `compiler/meshc/tests/support/m046_route_free.rs` path helper | Fail closed on the first missing fixture path and surface the new expected fixture location. | N/A — local path resolution only. | Reject partial fixture roots or wrong package directories instead of silently falling back to `tiny-cluster/`. |
| `meshc build` / `meshc test` against the moved fixture | Stop before any root-directory deletion and archive the failing path/command. | Keep the failing command and temp artifact directory so the move can be replayed. | Treat missing `mesh.toml`, `main.mpl`, `work.mpl`, or `tests/work.test.mpl` as fixture drift. |
| `compiler/meshc/tests/e2e_m046_s03.rs` retained startup/failover rail | Fail before the slice claims the tiny-cluster proof survived relocation. | Keep `.tmp/m046-s03/...` evidence and named test output for diagnosis. | Treat stale repo-root path reads or changed runtime/log names as contract drift. |

## Load Profile

- **Shared resources**: local `meshc` builds, `.tmp/m046-s03` retained artifacts, and the shared route-free helper used by later clustered rails.
- **Per-operation cost**: one fixture build, one fixture test run, and the retained `e2e_m046_s03` target.
- **10x breakpoint**: compile/build time and artifact churn grow before CPU or memory; the task should not introduce duplicate fixture trees or fallback path searches.

## Negative Tests

- **Malformed inputs**: missing fixture root files, stale `repo_root().join("tiny-cluster")` reads, or partial package moves.
- **Error paths**: `meshc build` / `meshc test` still pointed at the deleted root package, or helper functions silently resolving the wrong directory.
- **Boundary conditions**: runtime names, package name, README wording, and failover logs must stay `tiny-cluster` even though the package path moved.

## Steps

1. Move `tiny-cluster` into `scripts/fixtures/clustered/tiny-cluster/` without renaming its package, runtime, or log identities.
2. Extend `compiler/meshc/tests/support/m046_route_free.rs` with stable clustered-fixture path helpers so later rails stop open-coding repo-root package paths.
3. Retarget `compiler/meshc/tests/e2e_m046_s03.rs` to the new helper/path while keeping its source-contract, package build/test, startup, and failover assertions intact.
4. Prove the moved fixture through direct `meshc build` / `meshc test` plus the named retained Rust rail before any root-directory removal happens.

## Must-Haves

- [ ] `tiny-cluster` exists only under `scripts/fixtures/clustered/tiny-cluster/` as an internal fixture location.
- [ ] The shared route-free helper exposes a stable tiny-cluster fixture path for later Rust and bash consumers.
- [ ] The retained `e2e_m046_s03` rail and direct `meshc build` / `meshc test` commands stay green against the moved fixture with unchanged runtime-facing names.
  - Estimate: 1h15m
  - Files: scripts/fixtures/clustered/tiny-cluster/mesh.toml, scripts/fixtures/clustered/tiny-cluster/main.mpl, scripts/fixtures/clustered/tiny-cluster/work.mpl, scripts/fixtures/clustered/tiny-cluster/tests/work.test.mpl, scripts/fixtures/clustered/tiny-cluster/README.md, compiler/meshc/tests/support/m046_route_free.rs, compiler/meshc/tests/e2e_m046_s03.rs
  - Verify: - `cargo run -q -p meshc -- test scripts/fixtures/clustered/tiny-cluster/tests`
- `cargo run -q -p meshc -- build scripts/fixtures/clustered/tiny-cluster`
- `cargo test -p meshc --test e2e_m046_s03 -- --nocapture`
- [x] **T02: Relocated `cluster-proof` into `scripts/fixtures/clustered/cluster-proof` and retargeted the route-free package, scaffold, and Todo Docker consumers.** — Move `cluster-proof` into `scripts/fixtures/clustered/cluster-proof`, preserve its package identity plus Docker/Fly packaging contract, and retarget the main package-build/test rails plus the Todo Linux builder dependency so retained cluster-proof consumers point at the new internal fixture instead of the repo root.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `cluster-proof` package files (`README.md`, `Dockerfile`, `fly.toml`) | Stop before any root-directory deletion and keep the original package content restorable. | N/A — local file move only. | Treat missing package files or changed package/log identity as fixture drift. |
| `compiler/meshc/tests/e2e_m046_s04.rs` and `compiler/meshc/tests/e2e_m045_s02.rs` | Fail the retained package/scaffold rails before the slice claims cluster-proof survived relocation. | Preserve `.tmp/m046-s04/...` or `.tmp/m045-s02/...` artifacts for diagnosis. | Reject stale repo-root references or wrong Docker/Fly package expectations. |
| `compiler/meshc/tests/support/m047_todo_scaffold.rs` Linux-output builder seam | Fail the Todo builder phase rather than silently building from a dead Dockerfile path. | Preserve the Docker build log and image-inspect log if the builder image cannot be rebuilt. | Treat missing `Dockerfile` or wrong fixture path as a hard error. |

## Load Profile

- **Shared resources**: Docker builder image cache, route-free fixture builds/tests, retained `.tmp/m046-s04` and `.tmp/m045-s02` bundles, and the shared route-free helper.
- **Per-operation cost**: one moved package build/test, one retained route-free Rust rail, and one scaffold/Todo helper replay.
- **10x breakpoint**: Docker rebuild time and route-free package compilation show up before CPU or memory; the task should not duplicate cluster-proof assets or keep two competing builder paths alive.

## Negative Tests

- **Malformed inputs**: stale `repo_root().join("cluster-proof")` reads, missing `Dockerfile` / `fly.toml`, or missing fixture tests.
- **Error paths**: Todo helper still building `cluster-proof/Dockerfile`, or route-free e2e rails still asserting the deleted root package.
- **Boundary conditions**: package name, runtime/log prefixes, Docker entrypoint text, and Fly discovery seed must stay `cluster-proof`-shaped even though the path moved.

## Steps

1. Move `cluster-proof` into `scripts/fixtures/clustered/cluster-proof/` without renaming its package, binary, runtime, Docker, or Fly identities.
2. Retarget `compiler/meshc/tests/e2e_m046_s04.rs` and `compiler/meshc/tests/e2e_m045_s02.rs` so their package/scaffold assertions read the moved fixture path.
3. Update `compiler/meshc/tests/support/m047_todo_scaffold.rs` to build its Linux output-helper image from the moved fixture Dockerfile path.
4. Prove the moved fixture through direct `meshc build` / `meshc test` plus the retained package/scaffold Rust rails before any root-directory removal happens.

## Must-Haves

- [ ] `cluster-proof` exists only under `scripts/fixtures/clustered/cluster-proof/` as an internal proof fixture.
- [ ] Retained package/scaffold consumers stop reading `repo_root()/cluster-proof` directly.
- [ ] The Todo Linux-output builder seam resolves the moved `cluster-proof` Dockerfile successfully.
  - Estimate: 1h30m
  - Files: scripts/fixtures/clustered/cluster-proof/main.mpl, scripts/fixtures/clustered/cluster-proof/work.mpl, scripts/fixtures/clustered/cluster-proof/README.md, scripts/fixtures/clustered/cluster-proof/Dockerfile, scripts/fixtures/clustered/cluster-proof/fly.toml, compiler/meshc/tests/e2e_m046_s04.rs, compiler/meshc/tests/support/m047_todo_scaffold.rs, compiler/meshc/tests/e2e_m045_s02.rs
  - Verify: - `cargo run -q -p meshc -- test scripts/fixtures/clustered/cluster-proof/tests`
- `cargo run -q -p meshc -- build scripts/fixtures/clustered/cluster-proof`
- `cargo test -p meshc --test e2e_m046_s04 -- --nocapture`
- `cargo test -p meshc --test e2e_m045_s02 -- --nocapture`
- [x] **T03: Repointed public clustered onboarding to the scaffold plus generated examples and added a fail-closed onboarding contract test.** — Replace the old equal-surface proof-app story with the new scaffold/examples-first story across README, site docs, generated clustered README text, and the Mesh clustering skill. Public surfaces must point readers to `meshc init --clustered`, `examples/todo-postgres`, and `examples/todo-sqlite`, keep `reference-backend` as the deeper backend proof, and preserve the explicit SQLite-local vs Postgres-clustered split.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public docs and README copy | Fail the new onboarding contract test before stale proof-app links ship. | N/A — local content checks only. | Treat missing example-first replacements or wrong SQLite/Postgres split text as contract drift. |
| `compiler/mesh-pkg/src/scaffold.rs` generated README text | Fail clustered scaffold wording tests before a stale generated README lands. | N/A — local unit/tooling tests only. | Reject README text that still frames `tiny-cluster` / `cluster-proof` as the public first-contact story. |
| `tools/skill/mesh/skills/clustering/SKILL.md` plus M048 guardrails | Fail the skill/docs contract rails before stale onboarding reaches the shipped skill bundle. | N/A — Node test execution only. | Reject unsplit `todo-api` guidance or any text that projects clustered claims onto the SQLite starter. |

## Load Profile

- **Shared resources**: static Markdown content, the clustering skill file, the scaffold template source, and Node-based contract tests.
- **Per-operation cost**: one docs build plus a small set of deterministic content-contract tests.
- **10x breakpoint**: review noise and content drift appear before runtime cost; the task should keep one clear public starter story instead of adding a second transitional layer.

## Negative Tests

- **Malformed inputs**: stale `tiny-cluster/README.md` or `cluster-proof/README.md` onboarding links, missing `examples/todo-sqlite` / `examples/todo-postgres` references, or generic `meshc init --template todo-api` wording.
- **Error paths**: SQLite described as clustered/operator-capable, Postgres no longer described as the serious shared starter, or `reference-backend` promoted back to a coequal starter.
- **Boundary conditions**: public docs may still mention retained verifier commands and deeper proof surfaces, but they must stop teaching the proof fixtures as first-contact onboarding.

## Steps

1. Rewrite `README.md`, `compiler/mesh-pkg/src/scaffold.rs`, and `tools/skill/mesh/skills/clustering/SKILL.md` so the public clustered story points at scaffold plus generated `/examples` while keeping `reference-backend` later/deeper.
2. Rewrite the clustered onboarding pages in `website/docs/docs/getting-started/clustered-example/index.md`, `website/docs/docs/distributed/index.md`, `website/docs/docs/distributed-proof/index.md`, and `website/docs/docs/tooling/index.md` to retire proof-app-first language.
3. Add `scripts/tests/verify-m049-s04-onboarding-contract.test.mjs` so stale proof-app onboarding links, missing example-first replacements, or broken SQLite/Postgres split wording fail closed.
  - Estimate: 1h15m
  - Files: README.md, compiler/mesh-pkg/src/scaffold.rs, website/docs/docs/getting-started/clustered-example/index.md, website/docs/docs/distributed/index.md, website/docs/docs/distributed-proof/index.md, website/docs/docs/tooling/index.md, tools/skill/mesh/skills/clustering/SKILL.md, scripts/tests/verify-m049-s04-onboarding-contract.test.mjs
  - Verify: - `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`
- `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`
- `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs`
- `node --test scripts/tests/verify-m048-s05-contract.test.mjs`
- `npm --prefix website run build`
- [x] **T04: Retarget retained Rust contract rails to the internal clustered fixtures** — Once the packages and public copy are moved, the retained Rust e2e rails still need to resolve lower-level fixtures instead of the old root dirs. Update the contract, equal-surface, and historical clustered tests to read from the new shared helper paths and assert the new public story rather than repo-root onboarding runbooks.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Rust e2e targets that still read repo-root proof packages | Fail compilation or assertions before the slice claims root-package retirement is safe. | Keep named Cargo target logs and retained `.tmp/...` bundles for diagnosis. | Reject stale root-path strings or old public-story assertions as contract drift. |
| Shared helper paths in `m046_route_free` | Fail closed if a consumer still bypasses the helper or resolves the wrong fixture. | N/A — local path resolution only. | Treat helper/path mismatches as structural drift rather than auto-falling back. |
| Updated public-story assertions in `e2e_m047_s04.rs` | Fail before the authoritative contract target claims the new onboarding story is real. | Preserve the target log and contract snapshots if it times out. | Reject tests that still require `tiny-cluster/README.md` or `cluster-proof/README.md` as public onboarding surfaces. |

## Load Profile

- **Shared resources**: Cargo integration target compilation, retained `.tmp` artifact bundles, and the shared route-free helper module.
- **Per-operation cost**: several targeted `meshc` integration test targets with snapshot/artifact capture.
- **10x breakpoint**: compile time dominates; the task should reuse the helper and avoid duplicating fixture-path logic across tests.

## Negative Tests

- **Malformed inputs**: stale root-path joins, old scenario metadata naming deleted root packages as public surfaces, or outdated README assertions.
- **Error paths**: `e2e_m047_s04` still demanding root-package onboarding links, or historical rails still referencing the deleted root dirs.
- **Boundary conditions**: internal fixtures may stay named `tiny-cluster` / `cluster-proof`, but public-story assertions must point at scaffold/examples first.

## Steps

1. Retarget the main Rust consumers of the old root package paths (`compiler/meshc/tests/e2e_m045_s01.rs`, `compiler/meshc/tests/e2e_m045_s02.rs`, `compiler/meshc/tests/e2e_m046_s05.rs`, and `compiler/meshc/tests/e2e_m047_s04.rs`) to the shared fixture helpers or the new onboarding contract expectations.
2. Update retained source/readme assertions so internal fixtures remain valid proof surfaces without requiring repo-root onboarding runbooks.
3. Keep scenario metadata and retained artifact labels clear enough that later slices can still localize failures after the path move.
4. Verify the updated Rust rails fail closed on stale root-path assumptions and stay green on the moved fixtures.

## Must-Haves

- [ ] Retained Rust contract/equal-surface/history rails stop reading the deleted repo-root proof packages directly.
- [ ] `e2e_m047_s04` asserts the new public onboarding story rather than the old equal-surface runbook story.
- [ ] Historical Rust rails preserve useful retained artifact names after the path move.
  - Estimate: 1h15m
  - Files: compiler/meshc/tests/support/m046_route_free.rs, compiler/meshc/tests/e2e_m045_s01.rs, compiler/meshc/tests/e2e_m045_s02.rs, compiler/meshc/tests/e2e_m046_s05.rs, compiler/meshc/tests/e2e_m047_s04.rs
  - Verify: - `cargo test -p meshc --test e2e_m045_s01 -- --nocapture`
- `cargo test -p meshc --test e2e_m045_s02 -- --nocapture`
- `cargo test -p meshc --test e2e_m046_s05 -- --nocapture`
- `cargo test -p meshc --test e2e_m047_s04 -- --nocapture`
- [x] **T05: Centralized clustered-fixture shell paths for the older verifier family and moved the M044 declared-work LLVM replay onto the current source-first @cluster contract.** — Split the broad bash path churn into one bounded task: add a shared shell helper for clustered fixture roots and retarget the older direct verifier family that still shells out to `tiny-cluster` / `cluster-proof` repo-root paths.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Older direct bash verifiers (`m039`–`m045`) | Fail before any root-directory deletion and name the remaining stale script. | Keep the phase log and command label so the stale consumer is obvious. | Treat stale path constants or regex checks as contract drift. |
| Shared shell helper/fixture constants | Fail closed if a script cannot resolve the moved fixture location. | N/A — local path helper only. | Reject missing fixture roots rather than auto-falling back to repo-root directories. |
| Representative older retained rails | Stop the task if migrated scripts no longer run on the moved fixtures. | Preserve `.tmp/...` verifier logs for diagnosis. | Reject malformed output or missing `running N test` markers where those rails already require them. |

## Load Profile

- **Shared resources**: the older direct bash verifier family, shared `.tmp` verifier trees, and the moved internal fixtures.
- **Per-operation cost**: grep/build/test phases with retained logs rather than live services.
- **10x breakpoint**: execution time and review churn dominate; the task should centralize fixture-path constants instead of open-coding another round of replacements.

## Negative Tests

- **Malformed inputs**: stale `tiny-cluster/` or `cluster-proof/` path literals in older direct scripts, missing helper sourcing, or helper constants that still point at repo-root directories.
- **Error paths**: older direct rails no longer finding retained bundles or continuing to shell out to deleted root-package paths.
- **Boundary conditions**: internal scripts may still consume the relocated fixtures, but they must do it through the shared helper instead of duplicated literals.

## Steps

1. Add `scripts/lib/clustered_fixture_paths.sh` with shared constants/helpers for `scripts/fixtures/clustered/tiny-cluster` and `scripts/fixtures/clustered/cluster-proof`.
2. Retarget the older direct verifier family (`scripts/verify-m039-s01.sh`, `scripts/verify-m039-s02.sh`, `scripts/verify-m039-s03.sh`, `scripts/verify-m040-s01.sh`, `scripts/verify-m042-s01.sh`, `scripts/verify-m043-s01.sh`, `scripts/verify-m045-s02.sh`, plus remaining same-pattern direct consumers found by the task's initial sweep) to source or use that helper.
3. Keep their retained phase/artifact behavior intact while replacing repo-root build/test commands with fixture-backed commands.
4. Prove the helper-backed older rails on representative direct consumers before moving to wrapper/closeout deletion work.

## Must-Haves

- [ ] Older direct bash verifiers stop open-coding repo-root `tiny-cluster` / `cluster-proof` paths.
- [ ] One shared helper owns the clustered fixture roots for bash consumers.
- [ ] Representative older retained rails still pass against the moved fixtures.

## Verification

- `bash scripts/verify-m039-s01.sh`
- `bash scripts/verify-m045-s02.sh`

## Observability Impact

- Signals added/changed: older direct verifier phase logs should now name the shared helper-backed fixture paths.
- How a future agent inspects this: rerun the representative scripts above and inspect their `.tmp/.../verify` logs if a stale consumer remains.
- Failure state exposed: missing helper sourcing or stale root literals fail as named script-phase errors instead of as ambiguous missing-file crashes.
  - Estimate: 1h15m
  - Files: scripts/lib/clustered_fixture_paths.sh, scripts/verify-m039-s01.sh, scripts/verify-m039-s02.sh, scripts/verify-m039-s03.sh, scripts/verify-m040-s01.sh, scripts/verify-m042-s01.sh, scripts/verify-m043-s01.sh, scripts/verify-m045-s02.sh
  - Verify: - `bash scripts/verify-m039-s01.sh`
- `bash scripts/verify-m045-s02.sh`
- [x] **T06: Update wrapper/closeout rails, delete the root proof-package dirs, and close the slice** — Finish the retirement by updating the wrapper/closeout rails to the fixture-backed/public-story contract, deleting the top-level `tiny-cluster/` and `cluster-proof/` directories, and rerunning the authoritative verifier plus the retained historical clustered Todo subrail.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Wrapper and closeout scripts (`m045`/`m046` aliases plus `m047` rails) | Fail before the root directories are removed or before the slice claims final closeout. | Preserve the wrapper/closeout logs and retained bundle pointers for diagnosis. | Treat stale root-path literals, stale public-story regexes, or broken retained-bundle checks as contract drift. |
| Root-directory deletion | Do not remove the top-level proof packages until wrapper/closeout rails point at the moved fixtures. | N/A — local file removal only. | Treat any remaining repo-root proof-package dependency as a blocker, not a warning. |
| Authoritative cutover and retained Todo rails | Stop the slice closeout if the fixture-backed/public-story contract is not really assembled. | Preserve `.tmp/m047-s04/verify` and `.tmp/m047-s05/verify` for diagnosis. | Reject missing `running N test` markers, stale public-story assertions, or wrong fixture commands. |

## Load Profile

- **Shared resources**: wrapper/closeout verifier scripts, shared `.tmp/m047-s04` and `.tmp/m047-s05` bundles, and the moved internal fixtures.
- **Per-operation cost**: scripted grep/build/test phases with retained logs rather than live services.
- **10x breakpoint**: execution time dominates; the task should keep one authoritative cutover rail and one retained Todo subrail instead of introducing another wrapper layer.

## Negative Tests

- **Malformed inputs**: stale root literals in wrapper/closeout scripts, missing retained-bundle pointers, or deletion of the repo-root dirs before the wrappers move.
- **Error paths**: wrapper aliases no longer delegating to the correct fixture-backed rail, or `scripts/verify-m047-s04.sh` still teaching root-package onboarding text.
- **Boundary conditions**: the repo root must lose the proof-package directories entirely, but the retained rails still need meaningful artifact pointers and fixture-backed commands after deletion.

## Steps

1. Retarget `scripts/verify-m047-s04.sh`, `scripts/verify-m047-s05.sh`, and `scripts/verify-m047-s06.sh` to the moved fixtures and new public onboarding contract.
2. Retarget the thin historical wrapper aliases (`scripts/verify-m045-s04.sh`, `scripts/verify-m045-s05.sh`, `scripts/verify-m046-s04.sh`, `scripts/verify-m046-s05.sh`, and `scripts/verify-m046-s06.sh`) so they still delegate and validate retained bundle state after the path move.
3. Delete the repo-root `tiny-cluster/` and `cluster-proof/` directories once the wrapper/closeout layer no longer depends on them.
4. Rerun the authoritative cutover rail, the retained historical clustered Todo subrail, and the new onboarding contract test as the final proof that the root proof-package surfaces are gone.

## Must-Haves

- [ ] Wrapper/closeout rails stop depending on the repo-root proof-package directories.
- [ ] The repo root no longer contains `tiny-cluster/` or `cluster-proof/` as onboarding project directories.
- [ ] `bash scripts/verify-m047-s04.sh`, `bash scripts/verify-m047-s05.sh`, and the onboarding contract test all pass after deletion.

## Verification

- `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`
- `bash scripts/verify-m047-s04.sh`
- `bash scripts/verify-m047-s05.sh`

## Observability Impact

- Signals added/changed: wrapper/closeout phase logs and bundle pointers should resolve the moved fixtures explicitly and still name the authoritative cutover vs retained Todo rails clearly.
- How a future agent inspects this: rerun the verification commands above and inspect `.tmp/m047-s04/verify` or `.tmp/m047-s05/verify` when a wrapper/closeout expectation regresses.
- Failure state exposed: stale wrapper literals, broken retained-bundle checks, or root-directory deletion happening too early fail in named wrapper phases instead of as ambiguous missing-path errors.
  - Estimate: 1h30m
  - Files: scripts/verify-m047-s04.sh, scripts/verify-m047-s05.sh, scripts/verify-m047-s06.sh, scripts/verify-m045-s04.sh, scripts/verify-m045-s05.sh, scripts/verify-m046-s04.sh, scripts/verify-m046-s05.sh, scripts/verify-m046-s06.sh
  - Verify: - `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`
- `bash scripts/verify-m047-s04.sh`
- `bash scripts/verify-m047-s05.sh`
