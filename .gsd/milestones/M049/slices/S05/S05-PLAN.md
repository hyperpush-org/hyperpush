# S05: Assembled scaffold/example truth replay

**Goal:** Add one assembled repo verifier that proves dual-database Todo scaffolds, committed `/examples`, proof-app retirement, and retained M048/editor guardrails together, with one retained bundle and no drift from the SQLite-local vs Postgres-clustered split.
**Demo:** After this: One named repo verifier proves dual-db scaffold generation, generated-example parity, proof-app removal, and M048 non-regression guardrails together.

## Tasks
- [x] **T01: Added the M049 assembled verifier and wrapper contract tests, but the full replay now stops on the independently red M039 retained rail.** — Implement the single assembled acceptance wrapper `scripts/verify-m049-s05.sh`. It should fail fast on public/docs/static drift, build `target/debug/meshc` before the direct materializer check, handle Postgres `DATABASE_URL` explicitly instead of assuming shell inheritance, replay the retained clustered and M048 wrappers serially, and retain one copied proof bundle under `.tmp/m049-s05/verify/`.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Postgres env resolution for `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` | Fail closed before the S01 replay starts and name the missing env source instead of silently running with no `DATABASE_URL`. | Keep the preflight log and stop before long Cargo phases. | Reject malformed `DATABASE_URL` or unreadable fallback env files rather than leaking them into retained artifacts. |
| `target/debug/meshc` requirement for `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` | Run a cargo phase that produces the binary before the materializer check; if it is still missing, stop with a named preflight failure. | N/A — local binary presence only. | Reject wrong binary path or missing executable bit before claiming example parity. |
| Retained upstream verifiers (`scripts/verify-m039-s01.sh`, `scripts/verify-m045-s02.sh`, `scripts/verify-m047-s05.sh`, `scripts/verify-m048-s05.sh`) | Stop at the failing phase and point to the upstream log/bundle rather than papering over a historical regression. | Preserve the failing phase log and copied verify directory path. | Treat missing `status.txt`, `phase-report.txt`, manifests, or pointer files as retained-proof drift. |
| Fresh `.tmp/m049-s01`, `.tmp/m049-s02`, `.tmp/m049-s03` artifact capture | Fail closed if the replay produced no new directories or if the copied bundle omits expected scenario families. | Preserve the before/after snapshot and artifact-copy log for diagnosis. | Reject empty or malformed copied bundles instead of treating any non-empty directory as success. |

## Load Profile

- **Shared resources**: Cargo build/test outputs, `target/debug/meshc`, website build temp dirs inside retained wrappers, `.tmp/m049-s01`, `.tmp/m049-s02`, `.tmp/m049-s03`, `.tmp/m039-s01/verify`, `.tmp/m045-s02/verify`, `.tmp/m047-s05/verify`, and `.tmp/m048-s05/verify`.
- **Per-operation cost**: several cargo test targets, one direct Node materializer check, multiple wrapper replays, and copied retained bundles/manifests.
- **10x breakpoint**: compile/docs-build time and retained artifact churn dominate first; the task should keep the replay serial and avoid duplicating the website build or M048 internals.

## Negative Tests

- **Malformed inputs**: missing `DATABASE_URL`, unreadable fallback env file, missing `target/debug/meshc`, or malformed retained bundle pointer paths.
- **Error paths**: named Cargo filters silently running 0 tests, materializer check running before a built binary exists, or historical wrapper output missing required verify files.
- **Boundary conditions**: the retained bundle must include both fixed upstream verify dirs and fresh timestamped M049 artifact buckets; `m039-s01` is the older asymmetric case and should only be checked against the files it truly owns.

## Steps

1. Create `scripts/verify-m049-s05.sh` from the M048 assembled-wrapper pattern rather than inventing a new shell structure.
2. Replay the fast public/static phases first (S04 onboarding contract, mesh-pkg/tooling scaffold filters), then the direct S03 materializer check, then the expensive M049 runtime/parity replays, then the retained `m039`/`m045`/`m047` rails, and `bash scripts/verify-m048-s05.sh` last.
3. Resolve Postgres `DATABASE_URL` explicitly inside the wrapper and fail closed if no truthful env source exists; do not rely on inherited interactive shell state.
4. Snapshot-copy fresh `.tmp/m049-s01`, `.tmp/m049-s02`, and `.tmp/m049-s03` replay artifacts plus the retained upstream verify dirs into `.tmp/m049-s05/verify/retained-proof-bundle/`.
5. Assert the final `status.txt`, `current-phase.txt`, `phase-report.txt`, `full-contract.log`, and `latest-proof-bundle.txt` contract plus bundle-shape markers before printing `verify-m049-s05: ok`.

## Must-Haves

- [ ] `scripts/verify-m049-s05.sh` is the single assembled rail for R116 and reuses lower-level S01-S04 and M048 proofs rather than reimplementing them.
- [ ] The wrapper handles the Postgres env and materializer ordering truthfully instead of depending on interactive shell state or lucky prior builds.
- [ ] `.tmp/m049-s05/verify/retained-proof-bundle/` contains copied retained verify dirs plus fresh `m049-s01`, `m049-s02`, and `m049-s03` artifact buckets with fail-closed manifests/pointers.
  - Estimate: 1h30m
  - Files: scripts/verify-m049-s05.sh, scripts/verify-m048-s05.sh, scripts/verify-m047-s05.sh, scripts/verify-m045-s02.sh, scripts/verify-m039-s01.sh, scripts/tests/verify-m049-s03-materialize-examples.mjs, compiler/meshc/tests/e2e_m049_s01.rs
  - Verify: - `bash scripts/verify-m049-s05.sh`
  - Blocker: `bash scripts/verify-m049-s05.sh` currently exits 1 at `m039-s01-replay` before it reaches the retained-copy phases, so `.tmp/m049-s05/verify/latest-proof-bundle.txt` and the copied retained bundle are not produced yet. `bash scripts/verify-m039-s01.sh` is independently red on the current tree at `e2e_m039_s01_membership_updates_after_node_loss` after the startup `Work.add` record hits `owner_lost` and `automatic_promotion_rejected:not_standby` on the surviving primary. The README/tooling discoverability work for `verify-m049-s05` is still unstarted because the slice now needs replan around that retained M039 blocker first.
- [x] **T02: Repaired the retained M039 node-loss rail to current post-loss authority truth and restored a green standalone verifier bundle.** — Use the retained `.tmp/m039-s01` failure artifacts to update the independently red `scripts/verify-m039-s01.sh` / `compiler/meshc/tests/e2e_m039_s01.rs` seam to current route-free startup-work truth.

1. Reproduce the retained `m039-s01` failure and read the archived `cluster-status-primary-after-loss` snapshots instead of guessing.
2. Update the node-loss expectation so the rail keeps asserting one-node membership convergence after standby loss, while post-loss authority `replication_health` may truthfully reflect the runtime-owned startup continuity state (`unavailable` or `degraded`) instead of the older `local_only` assumption.
3. Preserve the retained phase/file contract that `verify-m049-s05` already replays; do not rename phase markers or relax real membership drift.
4. Re-run the standalone M039 verifier until it is green and the retained verify directory is complete again.
  - Estimate: 1h30m
  - Files: compiler/meshc/tests/e2e_m039_s01.rs, compiler/meshc/tests/support/m046_route_free.rs, scripts/verify-m039-s01.sh
  - Verify: bash scripts/verify-m039-s01.sh
- [x] **T03: Replayed the assembled M049 verifier to a green retained bundle and fixed the remaining retained-proof drift that blocked completion.** — After the retained M039 rail is green again, rerun the assembled M049 wrapper end-to-end.

1. Replay `scripts/verify-m049-s05.sh` with the current Postgres env-resolution contract and the repaired retained M039 dependency.
2. Update `scripts/verify-m049-s05.sh` plus its pinned wrapper tests only if the repaired M039 truth changes a copied marker or phase assumption.
3. Confirm the wrapper reaches the retained-copy phases and emits `status.txt`, `current-phase.txt`, `phase-report.txt`, and `latest-proof-bundle.txt`.
4. Validate that the copied bundle contains retained M039/M045/M047/M048 verifier dirs plus fresh M049 S01-S03 artifact buckets.
  - Estimate: 1h
  - Files: scripts/verify-m049-s05.sh, scripts/tests/verify-m049-s05-contract.test.mjs, compiler/meshc/tests/e2e_m049_s05.rs
  - Verify: node --test scripts/tests/verify-m049-s05-contract.test.mjs
cargo test -p meshc --test e2e_m049_s05 -- --nocapture
bash scripts/verify-m049-s05.sh
- [x] **T04: Added bounded README/tooling discoverability for the green assembled verifier and pinned that wording with a fail-closed Node docs contract.** — Once the assembled verifier is actually green, add minimal discoverability for `bash scripts/verify-m049-s05.sh` in `README.md` and `website/docs/docs/tooling/index.md`.

1. Add one bounded README mention and one tooling-doc mention for the assembled verifier.
2. Keep the public wording narrow: scaffold/examples-first onboarding, SQLite stays local while Postgres is the clustered path, and historical clustered proof rails remain subordinate retained surfaces.
3. Extend the existing Node contract test so missing verifier text or a collapsed SQLite/Postgres split fails closed.
4. Avoid turning historical proof rails into a second public onboarding entrypoint.
  - Estimate: 45m
  - Files: README.md, website/docs/docs/tooling/index.md, scripts/tests/verify-m049-s05-contract.test.mjs
  - Verify: node --test scripts/tests/verify-m049-s05-contract.test.mjs
