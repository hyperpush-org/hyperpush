---
id: S05
parent: M049
milestone: M049
provides:
  - `bash scripts/verify-m049-s05.sh` as the single assembled scaffold/example truth rail for M049.
  - One top-level assembled proof surface under `.tmp/m049-s05/verify/` with `status.txt`, `current-phase.txt`, `phase-report.txt`, and `latest-proof-bundle.txt`.
  - A retained proof bundle that combines delegated M039/M045/M047/M048 verifier trees with fresh M049 S01-S03 artifact buckets.
  - Bounded README/tooling discoverability plus fail-closed Node and Rust contract tests for the assembled verifier.
requires:
  - slice: S04
    provides: Public onboarding already points at scaffold plus generated `/examples`, and the retained clustered proof fixtures remain replayable through historical wrapper rails.
affects:
  - M049 milestone validation and closeout
  - Downstream roadmap reassessment for scaffold/examples-first public onboarding
key_files:
  - scripts/verify-m049-s05.sh
  - scripts/tests/verify-m049-s05-contract.test.mjs
  - compiler/meshc/tests/e2e_m049_s05.rs
  - compiler/meshc/tests/e2e_m039_s01.rs
  - scripts/verify-m047-s05.sh
  - README.md
  - website/docs/docs/tooling/index.md
  - .gsd/PROJECT.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Reuse lower-level S01-S04 and M048 proof rails inside one assembled wrapper instead of creating a new mega-test target.
  - Resolve the Postgres replay connection inside `scripts/verify-m049-s05.sh` from process env -> repo `.env` -> `.tmp/m049-s01/local-postgres/connection.env`, while recording only the source label and never the secret.
  - Repair the retained M039 node-loss rail by keeping the one-node membership assertion but allowing post-loss `replication_health` to be `unavailable` or `degraded`.
  - Keep public discoverability bounded to `README.md` and `website/docs/docs/tooling/index.md`, and describe the older M048 rail as the retained tooling verifier so mutation-based docs contracts do not collide.
  - Run the retained `e2e_m047_s05` replay under `RUST_TEST_THREADS=1` inside its wrapper when the host-level default concurrency produces `os error 35` flake.
patterns_established:
  - Assembled closeout verifiers should wrap existing lower-level rails and copy their verify trees plus fresh timestamped artifact buckets into one retained bundle instead of re-implementing those assertions.
  - When a retained historical rail is still the truthful proof surface but the host execution model is flaky, serialize the verifier-side test execution inside the wrapper rather than weakening or skipping the retained rail.
  - Bounded docs discoverability needs its own fail-closed contract test; otherwise exact-string mutation tests on older verifier paragraphs can be broken accidentally by a new command mention.
  - For retained bundle-shape checks, assert the exact artifact names the delegated lower-level rails actually emit rather than stale filename folklore.
observability_surfaces:
  - .tmp/m049-s05/verify/status.txt
  - .tmp/m049-s05/verify/current-phase.txt
  - .tmp/m049-s05/verify/phase-report.txt
  - .tmp/m049-s05/verify/latest-proof-bundle.txt
  - .tmp/m049-s05/verify/retained-proof-bundle/
  - .tmp/m039-s01/verify/phase-report.txt
drill_down_paths:
  - .gsd/milestones/M049/slices/S05/tasks/T01-SUMMARY.md
  - .gsd/milestones/M049/slices/S05/tasks/T02-SUMMARY.md
  - .gsd/milestones/M049/slices/S05/tasks/T03-SUMMARY.md
  - .gsd/milestones/M049/slices/S05/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T09:20:01.224Z
blocker_discovered: false
---

# S05: Assembled scaffold/example truth replay

**Closed M049's scaffold/example reset with one green assembled verifier that replays dual-db scaffold truth, generated `/examples` parity, proof-app retirement, and retained M048 tooling guardrails into a single retained bundle.**

## What Happened

S05 finished the public-surface reset by landing one named assembled verifier, `bash scripts/verify-m049-s05.sh`, that now replays the dual-database Todo scaffold rails, the direct `/examples` materializer check, the retained clustered proof wrappers, and the retained M048 tooling closeout under one top-level `.tmp/m049-s05/verify/` surface. The wrapper is deliberately thin: it reuses the existing S01-S04 and M048 proof surfaces, builds `target/debug/meshc` before the direct materializer check, resolves the Postgres replay connection internally instead of relying on an interactive shell, and then snapshot-copies fresh `m049-s01`, `m049-s02`, and `m049-s03` artifact buckets alongside delegated M039/M045/M047/M048 verify trees into one retained proof bundle.

To make that assembled closeout truthful, the slice also repaired the independently red retained M039 node-loss rail to current route-free startup-work truth. The retained expectation still demands one-node membership convergence after standby loss, but it now accepts post-loss authority `replication_health` of `unavailable` or `degraded` rather than timing out on the older `local_only` assumption. During final replay work, the slice also aligned the assembled retained-bundle check with the actual Postgres unmigrated-database artifact names and stabilized the retained M047 wrapper by serializing the full `e2e_m047_s05` replay with `RUST_TEST_THREADS=1` instead of weakening the retained proof.

Finally, S05 added one bounded README mention and one bounded tooling-doc mention for `bash scripts/verify-m049-s05.sh`, with a fail-closed Node contract that preserves the public split: SQLite remains the honest local starter, Postgres remains the serious shared/deployable path, and older clustered proof rails remain subordinate retained evidence. The slice now leaves downstream milestone validation with one named repo verifier, one phase report, one status/current-phase pair, and one retained bundle pointer instead of a pile of lower-level partial state.

## Verification

The slice-level closeout commands all passed from the current tree: `bash scripts/verify-m039-s01.sh`, `node --test scripts/tests/verify-m049-s05-contract.test.mjs`, `cargo test -p meshc --test e2e_m049_s05 -- --nocapture`, `node --test scripts/tests/verify-m048-s05-contract.test.mjs`, and `bash scripts/verify-m049-s05.sh`. The final assembled replay produced `.tmp/m049-s05/verify/status.txt` = `ok`, `.tmp/m049-s05/verify/current-phase.txt` = `complete`, `.tmp/m049-s05/verify/latest-proof-bundle.txt` pointing at `.tmp/m049-s05/verify/retained-proof-bundle`, and a `phase-report.txt` that shows passed phases for the public onboarding contract, dual-db scaffold filters, direct `/examples` materializer check, M049 S01-S03 e2es, retained M039/M045/M047/M048 replays, retained-copy phases, and `m049-s05-bundle-shape`.

## Operational Readiness

- **Health signal:** `.tmp/m049-s05/verify/status.txt` should read `ok`, `.tmp/m049-s05/verify/current-phase.txt` should read `complete`, and `.tmp/m049-s05/verify/phase-report.txt` should end with `m049-s05-bundle-shape\tpassed`.
- **Failure signal:** any retained replay failure surfaces as the active phase in `current-phase.txt` and the first incomplete or failed phase in `phase-report.txt` (for example `m039-s01-replay`, `m047-s05-replay`, or `m048-s05-replay`).
- **Recovery procedure:** debug from `.tmp/m049-s05/verify/phase-report.txt` and `.tmp/m049-s05/verify/latest-proof-bundle.txt` first, then open the delegated retained wrapper log or copied verify tree named by the failing phase. If the run was started concurrently with another verifier shell, kill the overlapping processes and rerun once cleanly.
- **Monitoring gaps:** the shell verifier family still has no cross-process lock, so concurrent runs can contend for shared `.tmp/.../verify` roots and create misleading drift before any single phase actually fails.

## Requirements Advanced

- R122 — The assembled verifier and bounded docs contract now keep the SQLite-local vs Postgres-shared/deployable split under one named replay, preventing public wording drift while later deployment slices still own the full operational proof.

## Requirements Validated

- R115 — `bash scripts/verify-m049-s05.sh` now replays the dual-db scaffold filters plus `e2e_m049_s01` and `e2e_m049_s02` inside one green assembled closeout, with fresh retained `m049-s01` and `m049-s02` artifact buckets copied into the final bundle.
- R116 — `bash scripts/verify-m049-s05.sh` passed with `status.txt=ok`, `current-phase.txt=complete`, and a retained bundle that contains delegated historical verify trees plus fresh M049 S01-S03 artifact buckets, proving scaffold plus generated `/examples` are the assembled onboarding truth surface.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T03 needed a small retained-proof repair pass beyond the original replay plan: the assembled bundle-shape check had to match the actual Postgres unmigrated-database filenames (`todos-unmigrated.http` and `todos-unmigrated.json`), `scripts/verify-m047-s05.sh` had to force `RUST_TEST_THREADS=1` for the full retained `e2e_m047_s05` replay on this host, and the bounded tooling-doc wording had to avoid colliding with the older M048 mutation-based docs contract. No product/runtime claim was weakened; the fixes kept the retained rails truthful.

## Known Limitations

The shell verifier family still has no cross-process lock, so overlapping `verify-m049-s05.sh` or delegated retained-wrapper runs can contend for shared `.tmp/.../verify` roots and produce misleading artifact drift. The GSD requirements DB still does not recognize the M049 requirement IDs even though decisions and the checked-in requirements projection are truthful.

## Follow-ups

Use `bash scripts/verify-m049-s05.sh` as the first resume point for M049 milestone validation and closeout. Separately repair the GSD requirements DB so M049 requirement IDs like `R115` and `R116` render from DB-backed status instead of relying on saved decisions plus the checked-in requirements projection.

## Files Created/Modified

- `scripts/verify-m049-s05.sh` — Added the assembled scaffold/example truth wrapper with explicit Postgres env resolution, retained-wrapper replays, and one copied proof bundle under `.tmp/m049-s05/verify/`.
- `scripts/tests/verify-m049-s05-contract.test.mjs` — Pinned the assembled wrapper order, retained bundle markers, actual Postgres unmigrated filenames, and bounded docs wording with a fail-closed Node contract.
- `compiler/meshc/tests/e2e_m049_s05.rs` — Added the Rust-side contract/e2e rail for the assembled verifier script and retained bundle markers.
- `compiler/meshc/tests/e2e_m039_s01.rs` — Updated the retained M039 node-loss expectation to current post-loss authority truth while preserving one-node membership convergence.
- `scripts/verify-m047-s05.sh` — Serialized the retained full `e2e_m047_s05` replay with `RUST_TEST_THREADS=1` to remove host-level verifier flake without weakening the proof contract.
- `README.md` — Added one bounded public mention for the assembled verifier in the main README without reviving historical proof rails as a public entrypoint.
- `website/docs/docs/tooling/index.md` — Added one bounded tooling-doc mention for the assembled verifier and described M048 as a retained tooling verifier to avoid docs-contract collisions.
- `.gsd/PROJECT.md` — Recorded the slice completion state and new assembled verifier surface in the project status artifact.
- `.gsd/KNOWLEDGE.md` — Recorded the repaired M039 truth, docs-contract collision gotcha, retained bundle-shape markers, and retained M047 serialization lesson for future agents.
