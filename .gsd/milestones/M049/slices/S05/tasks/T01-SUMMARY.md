---
id: T01
parent: S05
milestone: M049
provides: []
requires: []
affects: []
key_files: ["scripts/verify-m049-s05.sh", "scripts/tests/verify-m049-s05-contract.test.mjs", "compiler/meshc/tests/e2e_m049_s05.rs", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M049/slices/S05/tasks/T01-SUMMARY.md"]
key_decisions: ["Reused the M048 assembled-wrapper shell structure and copied upstream verify directories verbatim instead of inventing a second retained-artifact format.", "Resolved the Postgres scaffold connection source inside the wrapper from process env, then repo `.env`, then `.tmp/m049-s01/local-postgres/connection.env`, while recording only the source label and never the secret value."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed. `cargo test -p meshc --test e2e_m049_s05 -- --nocapture` passed. `bash scripts/verify-m049-s05.sh` ran all new M049 phases successfully, then failed closed at `m039-s01-replay`; the phase report and replay log under `.tmp/m049-s05/verify/` point to the retained upstream failure. A direct rerun of `bash scripts/verify-m039-s01.sh` reproduced the same red `e2e_m039_s01_membership_updates_after_node_loss` seam outside the new wrapper."
completed_at: 2026-04-03T05:32:41.789Z
blocker_discovered: true
---

# T01: Added the M049 assembled verifier and wrapper contract tests, but the full replay now stops on the independently red M039 retained rail.

> Added the M049 assembled verifier and wrapper contract tests, but the full replay now stops on the independently red M039 retained rail.

## What Happened
---
id: T01
parent: S05
milestone: M049
key_files:
  - scripts/verify-m049-s05.sh
  - scripts/tests/verify-m049-s05-contract.test.mjs
  - compiler/meshc/tests/e2e_m049_s05.rs
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M049/slices/S05/tasks/T01-SUMMARY.md
key_decisions:
  - Reused the M048 assembled-wrapper shell structure and copied upstream verify directories verbatim instead of inventing a second retained-artifact format.
  - Resolved the Postgres scaffold connection source inside the wrapper from process env, then repo `.env`, then `.tmp/m049-s01/local-postgres/connection.env`, while recording only the source label and never the secret value.
duration: ""
verification_result: mixed
completed_at: 2026-04-03T05:32:41.791Z
blocker_discovered: true
---

# T01: Added the M049 assembled verifier and wrapper contract tests, but the full replay now stops on the independently red M039 retained rail.

**Added the M049 assembled verifier and wrapper contract tests, but the full replay now stops on the independently red M039 retained rail.**

## What Happened

Implemented `scripts/verify-m049-s05.sh` as the new assembled scaffold/example replay wrapper using the existing M048 verifier structure. The wrapper now runs the fast M049 public/static checks first, builds `target/debug/meshc` before the direct materializer check, resolves the Postgres scaffold connection source internally from process env -> repo `.env` -> `.tmp/m049-s01/local-postgres/connection.env`, snapshots fresh `.tmp/m049-s01`/`s02`/`s03` artifact buckets, and is prepared to copy retained upstream verify dirs plus fresh M049 artifacts into one top-level retained bundle with fail-closed bundle-shape checks. I also added `scripts/tests/verify-m049-s05-contract.test.mjs` and `compiler/meshc/tests/e2e_m049_s05.rs` so the wrapper command list, replay order, fallback-source marker, and retained-bundle names are pinned from both Node and Rust. The new M049 phases pass through `m049-s03-e2e`, but the assembled wrapper currently fails at `m039-s01-replay`. A direct standalone rerun of `bash scripts/verify-m039-s01.sh` fails the same way, so the blocker is the independently red retained M039 node-loss rail, not the new M049 wrapper logic.

## Verification

`node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed. `cargo test -p meshc --test e2e_m049_s05 -- --nocapture` passed. `bash scripts/verify-m049-s05.sh` ran all new M049 phases successfully, then failed closed at `m039-s01-replay`; the phase report and replay log under `.tmp/m049-s05/verify/` point to the retained upstream failure. A direct rerun of `bash scripts/verify-m039-s01.sh` reproduced the same red `e2e_m039_s01_membership_updates_after_node_loss` seam outside the new wrapper.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/tests/verify-m049-s05-contract.test.mjs` | 0 | ✅ pass | 1146ms |
| 2 | `cargo test -p meshc --test e2e_m049_s05 -- --nocapture` | 0 | ✅ pass | 2826ms |
| 3 | `bash scripts/verify-m049-s05.sh` | 1 | ❌ fail | 289700ms |


## Deviations

Added the repo-owned Node and Rust wrapper contract tests in T01 instead of waiting for T02 because the slice-level verification already named those tests and this is the first task in the slice. I did not start the README/tooling discoverability edits from T02 once the retained M039 rail proved independently red, because that docs work no longer unblocks a green assembled verifier.

## Known Issues

`bash scripts/verify-m049-s05.sh` currently exits 1 at `m039-s01-replay` before it reaches the retained-copy phases, so `.tmp/m049-s05/verify/latest-proof-bundle.txt` and the copied retained bundle are not produced yet. `bash scripts/verify-m039-s01.sh` is independently red on the current tree at `e2e_m039_s01_membership_updates_after_node_loss` after the startup `Work.add` record hits `owner_lost` and `automatic_promotion_rejected:not_standby` on the surviving primary. The README/tooling discoverability work for `verify-m049-s05` is still unstarted because the slice now needs replan around that retained M039 blocker first.

## Files Created/Modified

- `scripts/verify-m049-s05.sh`
- `scripts/tests/verify-m049-s05-contract.test.mjs`
- `compiler/meshc/tests/e2e_m049_s05.rs`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M049/slices/S05/tasks/T01-SUMMARY.md`


## Deviations
Added the repo-owned Node and Rust wrapper contract tests in T01 instead of waiting for T02 because the slice-level verification already named those tests and this is the first task in the slice. I did not start the README/tooling discoverability edits from T02 once the retained M039 rail proved independently red, because that docs work no longer unblocks a green assembled verifier.

## Known Issues
`bash scripts/verify-m049-s05.sh` currently exits 1 at `m039-s01-replay` before it reaches the retained-copy phases, so `.tmp/m049-s05/verify/latest-proof-bundle.txt` and the copied retained bundle are not produced yet. `bash scripts/verify-m039-s01.sh` is independently red on the current tree at `e2e_m039_s01_membership_updates_after_node_loss` after the startup `Work.add` record hits `owner_lost` and `automatic_promotion_rejected:not_standby` on the surviving primary. The README/tooling discoverability work for `verify-m049-s05` is still unstarted because the slice now needs replan around that retained M039 blocker first.
