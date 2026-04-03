---
id: M049
title: "Scaffold & Example Reset"
status: complete
completed_at: 2026-04-03T10:11:12.970Z
key_decisions:
  - Split `todo-api` scaffolding behind a typed `--db` seam so SQLite and Postgres can diverge honestly while keeping `meshc init` stable.
  - Keep the Postgres starter migration-first and fail closed on missing/invalid config before runtime bootstrap.
  - Treat the SQLite starter as explicitly local/single-node and preserve the old clustered SQLite Todo contract only as an internal fixture-backed retained proof.
  - Make `/examples/todo-postgres` and `/examples/todo-sqlite` generator-owned outputs with mechanical parity checks against scaffold output.
  - Retire repo-root proof-app onboarding surfaces and close the milestone with one assembled verifier plus a retained proof bundle.
key_files:
  - compiler/mesh-pkg/src/scaffold.rs
  - compiler/mesh-pkg/src/lib.rs
  - compiler/meshc/src/main.rs
  - compiler/meshc/tests/tooling_e2e.rs
  - compiler/meshc/tests/e2e_m049_s01.rs
  - compiler/meshc/tests/e2e_m049_s02.rs
  - compiler/meshc/tests/e2e_m049_s03.rs
  - compiler/meshc/tests/e2e_m049_s05.rs
  - compiler/meshc/tests/support/m049_todo_postgres_scaffold.rs
  - compiler/meshc/tests/support/m049_todo_sqlite_scaffold.rs
  - compiler/meshc/tests/support/m049_todo_examples.rs
  - examples/todo-postgres/README.md
  - examples/todo-sqlite/README.md
  - scripts/fixtures/m047-s05-clustered-todo/README.md
  - scripts/tests/verify-m049-s03-materialize-examples.mjs
  - scripts/tests/verify-m049-s04-onboarding-contract.test.mjs
  - scripts/tests/verify-m049-s05-contract.test.mjs
  - scripts/verify-m047-s05.sh
  - scripts/verify-m049-s05.sh
  - README.md
  - website/docs/docs/tooling/index.md
  - tools/skill/mesh/SKILL.md
  - tools/skill/mesh/skills/clustering/SKILL.md
  - tools/skill/mesh/skills/http/SKILL.md
lessons_learned:
  - When a public scaffold contract changes, freeze the retired behavior behind internal fixtures and retained rails instead of leaving a hidden legacy mode in `meshc init`.
  - Generator-owned examples plus mechanical parity checks are more trustworthy than hand-maintained showcase trees for docs-facing onboarding.
  - Runtime proof is not enough for starter resets; README/docs/skill wording also needs fail-closed contract tests.
  - Assembled closeout verifiers should write explicit phase reports and retained bundles so milestone reconciliation can validate behavior without re-deriving slice state.
---

# M049: Scaffold & Example Reset

**M049 replaced Mesh’s proof-app-shaped onboarding with an honest dual-database scaffold-and-examples story: Postgres is the migration-first shared/deployable path, SQLite is the explicit local-only path, generated `/examples` now mirror scaffold output, and one assembled verifier replays the whole contract together with retained guardrails.**

## What Happened

M049 reset Mesh’s public starter story away from repo-root proof apps and toward generator-owned scaffold output that says exactly what the runtime actually supports. S01 introduced a typed `--db` seam for `meshc init --template todo-api`, kept invalid flag combinations fail-closed, and shipped the real Postgres starter with migrations, pool-backed startup, helper-based CRUD, `/health` truth, and live redacted runtime proof. S02 used that seam to make the SQLite starter explicitly local/single-node, froze the old clustered SQLite Todo contract behind committed internal fixtures instead of a hidden public mode, and rewrote README/docs/skills so the public story is now SQLite-local vs Postgres-shared/deployable rather than one ambiguous scaffold.

S03 checked in `examples/todo-postgres` and `examples/todo-sqlite` as generator-owned outputs and paired them with parity rails so example drift now fails mechanically instead of being rediscovered later in docs or runtime tests. S04 completed the public-surface reset by removing repo-root `tiny-cluster/` and `cluster-proof/` onboarding surfaces, relocating retained proof material under `scripts/fixtures/clustered/`, and repointing docs plus retained rails at scaffold/examples-first surfaces. S05 then assembled the milestone into one named verifier, `bash scripts/verify-m049-s05.sh`, which replays the dual-db scaffold rails, direct example parity, proof-app retirement, and retained M039/M045/M047/M048 guardrails, then publishes one retained bundle under `.tmp/m049-s05/verify/retained-proof-bundle`.

## Decision Re-evaluation

| Decision | Outcome in delivered repo | Still valid? | Revisit next milestone? |
| --- | --- | --- | --- |
| Split `todo-api` scaffolding behind a typed `--db` seam and make SQLite vs Postgres explicit instead of keeping one ambiguous starter. | Enabled S01/S02/S03 to diverge honestly without breaking `meshc init` or the old SQLite-default wrapper. The shipped starter story now matches runtime truth and passed scaffold/tooling/e2e verification. | Yes | No |
| Preserve the historical clustered SQLite Todo contract as internal fixture-backed proof instead of as a hidden public scaffold mode. | Kept the old M047 retained rail green while removing clustered-SQLite overclaiming from public onboarding. The fixture-backed wrapper and retained verifiers now own that legacy proof. | Yes | No |
| Make `/examples` generator-owned outputs and verify parity mechanically rather than hand-maintained showcase trees. | `examples/todo-postgres` and `examples/todo-sqlite` now match scaffold output through parity rails, which removed a major drift source from README/docs surfaces. | Yes | No |
| Close the reset with one assembled verifier and retained proof bundle rather than a loose set of slice-local commands. | `bash scripts/verify-m049-s05.sh` passed end to end and produced the retained bundle expected by the contract tests, making closeout reproducible and inspectable. | Yes | No |
| Keep generated SQLite package tests at compile/import proof while live behavior stays in the Rust e2e harness until the storage negative-path compiler drift is fixed. | This kept the public SQLite story truthful and green, but it remains a bounded compromise rather than the final ideal testing shape. | Yes | Yes — revisit when the `meshc test` `expected (), found Int` instability is repaired. |

## Success Criteria Results

# Success Criteria Results

- [x] **The public starter story is now an honest dual-database split instead of proof-app-shaped onboarding.**
  - Evidence: `cargo test -p mesh-pkg m049_s0 -- --nocapture` and `cargo test -p meshc --test tooling_e2e test_init_todo_template_ -- --nocapture` passed inside the assembled verifier, and the shipped public surfaces now distinguish `--db sqlite` from `--db postgres` in `README.md`, `website/docs/docs/tooling/index.md`, and the generated example READMEs.
- [x] **Postgres is the serious shared/deployable path and remains migration-first, pool-backed, and live-tested.**
  - Evidence: `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` passed in the assembled verifier; the current repo ships `examples/todo-postgres/` with `.env.example`, `migrations/`, `work.mpl`, and migration-first startup guidance.
- [x] **SQLite is explicitly local-first/single-node and does not project fake clustered durability claims.**
  - Evidence: `cargo test -p meshc --test e2e_m049_s02 -- --nocapture` passed in the assembled verifier; the current repo ships `examples/todo-sqlite/` with local-only health/config/runtime surfaces and no `work.mpl` clustered runtime story.
- [x] **`/examples/todo-postgres` and `/examples/todo-sqlite` exist as generated outputs and match scaffold output mechanically.**
  - Evidence: the example trees exist on disk and `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` passed inside `bash scripts/verify-m049-s05.sh`.
- [x] **Repo onboarding no longer teaches from repo-root proof apps.**
  - Evidence: a repo-root directory scan shows `./examples` but no repo-root `tiny-cluster/` or `cluster-proof/`, and the `m049-s04-onboarding-contract` phase passed inside the assembled verifier.
- [x] **One named verifier now replays the assembled scaffold/examples-first story together with retained guardrails.**
  - Evidence: `node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed in this closeout session, and `bash scripts/verify-m049-s05.sh` completed successfully and wrote `.tmp/m049-s05/verify/retained-proof-bundle`.
- [x] **The milestone stayed within its planned proof boundary.**
  - Evidence: all required proof came from local scaffold generation, example parity, runtime e2e rails, docs/contract checks, and retained bundle replay; no live deployment proof was claimed or required for M049.

## Definition of Done Results

# Definition of Done Results

- [x] **All roadmap slices are complete.**
  - Evidence: the preloaded roadmap marks S01, S02, S03, S04, and S05 as done, and this closeout found summary artifacts for all five slices under `.gsd/milestones/M049/slices/`.
- [x] **All slice summaries exist.**
  - Evidence: `find .gsd/milestones/M049/slices -maxdepth 2 -name 'S*-SUMMARY.md' | sort` returned S01-S05 summary files.
- [x] **Cross-slice integration works as assembled, not just slice-by-slice.**
  - Evidence: `bash scripts/verify-m049-s05.sh` passed end to end, replaying S01 Postgres scaffold truth, S02 SQLite scaffold truth, S03 example parity, S04 onboarding retirement, and retained M039/M045/M047/M048 guardrails in one run.
- [x] **The milestone produced real non-`.gsd` code and repo-surface changes.**
  - Evidence: because closeout is running on local `main`, the honest equivalent diff baseline is `origin/main`; `git diff --stat origin/main -- ':!.gsd/'` showed 121 changed non-`.gsd` files across compiler code, tests, examples, fixtures, scripts, README/docs, and skills.
- [x] **Horizontal checklist addressed.**
  - Evidence: no separate horizontal checklist was present in the preloaded M049 roadmap beyond the verification classes already covered by the assembled verifier and milestone validation.

## Requirement Outcomes

# Requirement Outcomes

- **R115 — Active -> Validated.**
  - Evidence: the milestone closed the full dual-database scaffold contract with the verified command set already recorded by the slice evidence and revalidated by the assembled replay. The key proofs include `cargo test -p meshc --test tooling_e2e test_init_todo_template_db_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_todo_template_postgres_ -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_clustered_todo_ -- --nocapture`, `cargo test -p mesh-pkg m049_s01_postgres_scaffold_ -- --nocapture`, `cargo test -p mesh-pkg m049_s02_sqlite_scaffold_ -- --nocapture`, `cargo test -p meshc --test e2e_m049_s01 -- --nocapture`, `cargo test -p meshc --test e2e_m049_s02 -- --nocapture`, `cargo test -p meshc --test e2e_m049_s03 -- --nocapture`, and the assembled `bash scripts/verify-m049-s05.sh` replay.
- **R122 — Remains Active, materially advanced.**
  - Evidence: S01 established the Postgres half of the honest starter split, S02 established the explicit SQLite-local half, S03 checked in the generated examples, and S05 proved the assembled public contract with one retained verifier. The requirement advanced substantially but was not closed as a separate status transition in this milestone.
- **Invalidated or re-scoped requirements:** None.

## Deviations

Two implementation deviations mattered during delivery: (1) the generated Postgres starter needed a boot-order repair so missing `DATABASE_URL` fails closed before runtime keepalive actors start, and (2) the generated SQLite package-test contract was intentionally narrowed to compile/import coverage while live behavior moved into `compiler/meshc/tests/e2e_m049_s02.rs` because the current `meshc test` path still hits an `expected (), found Int` compiler instability on the negative storage helper rail.

## Follow-ups

- Revisit the SQLite generated storage-test negative-path instability once `meshc test` stops drifting into `expected (), found Int`, so more behavioral proof can move back into generated package tests.
- Carry the honest starter split forward into M050’s evaluator-facing docs rewrite and M053’s deploy-truth work so the serious Postgres path gains the later deployment evidence M049 intentionally did not claim.
- Keep future public-surface removals examples-first and fixture-backed rather than reviving repo-root proof-app onboarding surfaces.
