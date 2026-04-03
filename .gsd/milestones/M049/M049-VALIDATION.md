---
verdict: pass
remediation_round: 0
---

# Milestone Validation: M049

## Success Criteria Checklist
# Success Criteria Checklist

_Checked against the milestone vision plus the roadmap slice/demo contract, since the rendered roadmap for M049 expresses success through the slice overview and verification classes._

- [x] **The public starter story is now an honest dual-database split instead of proof-app-shaped onboarding.**
  - Evidence: `cargo test -p mesh-pkg m049_s0 -- --nocapture` passed, `cargo test -p meshc --test tooling_e2e test_init_todo_template_ -- --nocapture` passed, and the generated example READMEs now state distinct contracts for `--db postgres` vs `--db sqlite`.
- [x] **Postgres is the serious shared/deployable path and remains migration-first, pool-backed, and live-tested.**
  - Evidence: S01 delivered the typed `--db postgres` scaffold seam and live harness; `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` passed; `examples/todo-postgres/README.md` documents the migration-first clustered/shared contract.
- [x] **SQLite is explicitly local-first/single-node and does not project fake clustered durability claims.**
  - Evidence: `cargo test -p meshc --test e2e_m049_s02 -- --nocapture` passed; `examples/todo-sqlite/README.md` now explicitly says there is no `work.mpl`, `HTTP.clustered(...)`, or `meshc cluster` story in that starter.
- [x] **`/examples/todo-postgres` and `/examples/todo-sqlite` exist as generated outputs and match scaffold output mechanically.**
  - Evidence: `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` reported `result=match` for both examples; `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` passed.
- [x] **Repo onboarding no longer teaches from repo-root proof apps.**
  - Evidence: repo-root directory scan found `./examples` but no repo-root `tiny-cluster/` or `cluster-proof/`; `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs` passed.
- [x] **One named verifier now replays the assembled scaffold/examples-first story together with retained guardrails.**
  - Evidence: `node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed and `bash scripts/verify-m049-s05.sh` passed, producing `.tmp/m049-s05/verify/retained-proof-bundle`.
- [x] **The milestone stayed within its planned proof boundary.**
  - Evidence: operational proof is local/repeatable scaffold/example regeneration plus retained verification bundles; no live deployment proof was claimed by the plan, and none was required to pass this milestone.

## Slice Delivery Audit
| Slice | Roadmap deliverable claim | Delivered evidence | Result |
|---|---|---|---|
| S01 | `meshc init --template todo-api --db postgres <name>` emits a modern serious starter that builds, tests, and tells the clustered/shared story honestly. | S01 summary/UAT plus passing rails: `cargo test -p mesh-pkg m049_s0 -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_todo_template_ -- --nocapture`, and `cargo test -p meshc --test e2e_m049_s01 -- --nocapture`. Current repo ships `examples/todo-postgres/` with migration-first README, `.env.example`, `work.mpl`, and Postgres-only runtime/storage surfaces. | Pass |
| S02 | `meshc init --template todo-api --db sqlite <name>` emits the honest local-first starter with explicit single-node guidance and no fake clustered claims. | Passing rail `cargo test -p meshc --test e2e_m049_s02 -- --nocapture`; current repo ships `examples/todo-sqlite/` with local-only README, no `work.mpl`, generated package tests, and explicit guidance toward Postgres or `meshc init --clustered` when clustered behavior is needed. | Pass |
| S03 | `/examples/todo-postgres` and `/examples/todo-sqlite` are generated outputs that build, test, and match scaffold output mechanically. | `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` passed with `result=match` for both examples; `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` passed; the example trees exist on disk with the expected file sets. | Pass |
| S04 | `tiny-cluster/` and `cluster-proof/` are gone as top-level onboarding projects, and repo references now point at `/examples` or lower-level fixtures/support. | Repo-root scan found no root `tiny-cluster/` or `cluster-proof/`; fixture-backed retained rails now live under `scripts/fixtures/clustered/`; `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs` passed, proving README/docs/skills point at `/examples` and fixture paths instead of deleted root proof-app runbooks. | Pass |
| S05 | One named repo verifier proves dual-db scaffold generation, generated-example parity, proof-app removal, and M048 non-regression together. | `scripts/verify-m049-s05.sh` exists and completed successfully; phase report shows all M049 phases plus retained M039/M045/M047/M048 replays passed; `node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed; retained proof bundle written to `.tmp/m049-s05/verify/retained-proof-bundle`. | Pass |

## Cross-Slice Integration
# Cross-Slice Integration Audit

- **S01 -> S02/S03:** The typed `--db` scaffold seam introduced for the Postgres path was successfully consumed by the SQLite-local starter and the example materializer. Evidence: `cargo test -p meshc --test tooling_e2e test_init_todo_template_ -- --nocapture`, `cargo test -p meshc --test e2e_m049_s02 -- --nocapture`, and `cargo test -p meshc --test e2e_m049_s03 -- --nocapture` all passed.
- **S02 -> S03:** The SQLite-local contract carried through into the committed example surface without drift. Evidence: `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` reported `result=match` for `todo-sqlite`, and the committed example omits `work.mpl` while keeping generated local tests.
- **S01/S02 -> S03:** The generated examples reflect the intended split cleanly: `examples/todo-postgres` contains `.env.example`, `migrations/`, and `work.mpl`; `examples/todo-sqlite` contains generated local tests and no clustered surface. No contradictory files were found in either tree.
- **S03 -> S04:** Public onboarding now consumes the generated examples rather than retired root proof apps. Evidence: the onboarding-contract test passed, README/docs/skills point at `examples/todo-postgres` and `examples/todo-sqlite`, and retained clustered fixtures live under `scripts/fixtures/clustered/`.
- **S04 -> S05:** The assembled verifier successfully composes the new public surfaces with retained historical guardrails. Evidence: `bash scripts/verify-m049-s05.sh` passed through `m049-s04-onboarding-contract`, `m049-s03-materialize-direct`, `m049-s01-e2e`, `m049-s02-e2e`, `m049-s03-e2e`, and the retained M039/M045/M047/M048 replay phases.

## Boundary mismatches

None found. The only legacy clustered proof surfaces that remain are explicitly fixture-backed/internal (`scripts/fixtures/clustered/...`) or retained verification rails, which matches the milestone plan. No slice claimed live deploy proof, so the absence of deployment evidence is not an integration gap for M049.

## Requirement Coverage
# Requirement Coverage

| Requirement | Coverage status | Evidence |
|---|---|---|
| R122 | Advanced | S01 established the Postgres half of the honest starter split with a migration-first scaffold and live runtime proof; S03 committed the generated `examples/todo-postgres` output; S05 replayed the assembled scaffold/examples-first story end to end. |
| R115 | Validated | Validated by the listed command set for this unit: `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture`, `cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`, `cargo test -p mesh-pkg m047_s05_scaffold_todo_api_project_ -- --nocapture`, `set -a && . .tmp/m049-s01/local-postgres/connection.env && set +a && cargo test -p meshc --test e2e_m049_s01 -- --nocapture`, and `node --test scripts/tests/verify-m048-s05-contract.test.mjs`; the assembled `bash scripts/verify-m049-s05.sh` replay also passed. |

No unaddressed active M049 requirement surfaced in the roadmap/slice evidence supplied for this validation pass. No requirements were invalidated or re-scoped.

## Verdict Rationale
Pass. Every planned slice has substantiated delivered output, and the repo state matches the milestone’s intended public split: Postgres is the serious shared/deployable starter, SQLite is the honest local starter, `/examples` are generated/parity-checked, root proof-app onboarding is retired, and one assembled verifier now replays the whole story together with retained historical guardrails.

Verification classes are all covered:

- **Contract:** addressed by the package/compiler/tooling contract tests plus the onboarding/materializer/verifier contract tests.
- **Integration:** addressed by the real scaffold-generation and end-to-end rails for S01, S02, and S03, along with the migrated README/docs/skill surfaces proven by the S04 contract test.
- **Operational:** addressed by the successful repeatable `bash scripts/verify-m049-s05.sh` run, which rebuilt the milestone proof stack, replayed retained guardrails, and wrote a retained bundle under `.tmp/m049-s05/verify/retained-proof-bundle`. The milestone intentionally did not claim live deployment proof beyond local repeatable verification.
- **UAT:** addressed by the slice UAT artifacts supplied for validation and corroborated by the now-truthful user-facing README/docs/example surfaces. No UAT contradiction or missing public deliverable surfaced during reconciliation.

No material gaps, regressions, or cross-slice boundary mismatches were found, so remediation is not required.
