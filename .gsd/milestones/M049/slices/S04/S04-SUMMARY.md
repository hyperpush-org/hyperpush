---
id: S04
parent: M049
milestone: M049
provides:
  - Internal clustered proof fixtures at `scripts/fixtures/clustered/tiny-cluster` and `scripts/fixtures/clustered/cluster-proof`.
  - Public clustered onboarding, docs, and skills that point at scaffold plus generated `/examples` instead of repo-root proof apps.
  - Helper-backed Rust and shell verifier seams for the relocated clustered fixtures.
  - Green authoritative and historical wrapper rails with retained verify bundles that S05 can assemble into the final reset replay.
requires:
  - slice: S03
    provides: Generated `/examples/todo-sqlite` and `/examples/todo-postgres` plus the materializer/check seam that S04 repointed public onboarding toward.
affects:
  - S05
key_files:
  - scripts/fixtures/clustered/tiny-cluster
  - scripts/fixtures/clustered/cluster-proof
  - compiler/meshc/tests/support/m046_route_free.rs
  - scripts/lib/clustered_fixture_paths.sh
  - scripts/tests/verify-m049-s04-onboarding-contract.test.mjs
  - scripts/verify-m039-s01.sh
  - scripts/verify-m045-s02.sh
  - scripts/verify-m047-s04.sh
  - scripts/verify-m047-s05.sh
  - README.md
  - compiler/mesh-pkg/src/scaffold.rs
  - website/docs/docs/distributed-proof/index.md
  - tools/skill/mesh/skills/clustering/SKILL.md
  - .gsd/PROJECT.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Public clustered onboarding is now scaffold/examples-first; `tiny-cluster` and `cluster-proof` survive only as internal fixtures plus retained verifier surfaces.
  - `scripts/lib/clustered_fixture_paths.sh` is the single fail-closed shell owner of the relocated clustered fixture roots.
  - Historical M045/M046 wrapper aliases stay on the existing M047 cutover chain; closeout work updates their contract readers instead of rerouting the aliases.
  - `scripts/verify-m045-s02.sh` must validate the current `e2e_m045_s02` retained artifact contract instead of older remote-runtime filename folklore.
patterns_established:
  - Rust-owned retained rails should resolve relocated clustered proofs through `compiler/meshc/tests/support/m046_route_free.rs` instead of repo-root literals.
  - Shell verifiers should resolve relocated clustered proofs through `scripts/lib/clustered_fixture_paths.sh` and fail closed on missing fixture files.
  - Public onboarding drift should be guarded by a dedicated repo-owned contract test that also rejects reintroduced repo-root proof-package directories.
  - Retained bundle-shape checks must assert the actual current e2e artifact contract rather than stale filename folklore.
observability_surfaces:
  - node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs
  - .tmp/m039-s01/verify/{status.txt,phase-report.txt}
  - .tmp/m045-s02/verify/{status.txt,current-phase.txt,phase-report.txt,latest-proof-bundle.txt}
  - .tmp/m047-s04/verify/{status.txt,current-phase.txt,phase-report.txt,latest-proof-bundle.txt}
  - .tmp/m047-s05/verify/{status.txt,current-phase.txt,phase-report.txt,latest-proof-bundle.txt,m047-s05-fixture-provenance.log}
drill_down_paths:
  - .gsd/milestones/M049/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M049/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M049/slices/S04/tasks/T03-SUMMARY.md
  - .gsd/milestones/M049/slices/S04/tasks/T04-SUMMARY.md
  - .gsd/milestones/M049/slices/S04/tasks/T05-SUMMARY.md
  - .gsd/milestones/M049/slices/S04/tasks/T06-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T04:46:57.671Z
blocker_discovered: false
---

# S04: Retire top-level proof-app onboarding surfaces

**Retired repo-root `tiny-cluster` and `cluster-proof` as onboarding projects, moved them to internal clustered fixtures, and made the retained cutover/history rails green against the fixture-backed public story.**

## What Happened

S04 finished the public proof-app retirement that S03 set up. The old repo-root `tiny-cluster` and `cluster-proof` packages were moved under `scripts/fixtures/clustered/` as stable internal proof fixtures, and both Rust- and shell-side consumers were pushed through shared helpers instead of hardcoded repo-root paths. That kept the internal package/runtime/log identities stable while making the repo root stop teaching from proof-app-shaped projects.

On the public surface, README, scaffold README text, website docs, and the Mesh clustering skill were rewritten so the first-contact clustered story is `meshc init --clustered` plus generated `examples/todo-sqlite` / `examples/todo-postgres`, with the retained clustered proofs demoted to lower-level internal fixtures and verifier-oriented docs. `scripts/tests/verify-m049-s04-onboarding-contract.test.mjs` now fails closed on stale proof-app README links, generic `meshc init --template todo-api` wording, and even the reappearance of repo-root `tiny-cluster/` or `cluster-proof/` directories.

The retained rails were then brought along to that new structure. Rust contract/history targets (`e2e_m045_*`, `e2e_m046_*`, `e2e_m047_*`) now resolve the relocated fixtures and assert the new public story, older direct bash verifiers resolve fixture roots through `scripts/lib/clustered_fixture_paths.sh`, and the closeout wrappers (`verify-m047-s04.sh`, `verify-m047-s05.sh`) now retain truthful bundle/provenance state while rejecting repo-root proof-package resurrection. Final slice closeout exposed one last stale assumption in `scripts/verify-m045-s02.sh`: its retained bundle-shape check still expected the older remote-runtime JSON/log output from `e2e_m045_s02`. Updating that wrapper to the current source-parity/reference bundle plus renamed local continuity artifacts brought the last historical verifier back to green without changing runtime behavior.

## Verification

Slice-level verification passed from the current tree. Explicitly rerun rails included `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`, `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`, `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs`, `node --test scripts/tests/verify-m048-s05-contract.test.mjs`, `cargo test -p meshc --test e2e_m046_s03 -- --nocapture`, `cargo test -p meshc --test e2e_m046_s04 -- --nocapture`, `cargo test -p meshc --test e2e_m045_s01 -- --nocapture`, `cargo test -p meshc --test e2e_m045_s02 -- --nocapture`, `cargo test -p meshc --test e2e_m046_s05 -- --nocapture`, `cargo test -p meshc --test e2e_m047_s05 m047_s05_public_clustered_surfaces_use_source_first_names_and_todo_template -- --nocapture`, `bash scripts/verify-m039-s01.sh`, `bash scripts/verify-m045-s02.sh`, `bash scripts/verify-m047-s04.sh`, and `bash scripts/verify-m047-s05.sh`. The authoritative closeout wrappers also replay the relocated fixture build/test commands, docs build, retained provenance checks, and bundle-shape checks under `.tmp/m047-s04/verify`, `.tmp/m047-s05/verify`, and `.tmp/m045-s02/verify`.

## Requirements Advanced

- R116 — S04 retired the repo-root proof-app onboarding surfaces, moved the retained clustered proofs under `scripts/fixtures/clustered/`, and repointed docs/skills/verifiers to scaffold plus generated `/examples`.

## Requirements Validated

- R116 — `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`, `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`, `bash scripts/verify-m039-s01.sh`, `bash scripts/verify-m045-s02.sh`, `bash scripts/verify-m047-s04.sh`, and `bash scripts/verify-m047-s05.sh` all passed from the current tree.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Besides the planned M047 closeout-rail updates, final slice closeout also had to repair `scripts/verify-m045-s02.sh` because its retained bundle-shape check still expected the pre-move `e2e_m045_s02` artifact set. No runtime/product behavior changed; only the historical verifier contract was brought back into line with the current truthful e2e output.

## Known Limitations

M050 still needs the broader evaluator-facing docs rewrite; deeper/internal proof pages and runbooks remain in the repo for verifier use even though they are no longer public first-contact onboarding. The GSD requirements DB also still rejects M049 requirement IDs like `R116`, so saved requirement decisions plus the checked-in `REQUIREMENTS.md` remain the authoritative visible status until the DB is repaired.

## Follow-ups

- S05 should assemble one named verifier that replays dual-db scaffold generation, generated-example parity, proof-app retirement, and the retained M048 non-regression guardrails through a single retained bundle.
- The GSD requirements DB still rejects M049 IDs like `R116`; repair that separately so saved requirement decisions can flow back into the rendered requirements projection.

## Files Created/Modified

- `scripts/fixtures/clustered/tiny-cluster` — Moved the minimal clustered proof package to an internal fixture, preserved its package/runtime identity, and kept its smoke test/readme route-free and source-first.
- `scripts/fixtures/clustered/cluster-proof` — Moved the packaged clustered proof fixture, including README, Dockerfile, Fly config, and Mesh smoke test, out of the repo root.
- `compiler/meshc/tests/support/m046_route_free.rs` — Centralized relocated clustered-fixture discovery and validation for Rust-owned rails and helpers.
- `scripts/lib/clustered_fixture_paths.sh` — Added a shared shell helper so historical verifiers stop open-coding repo-root `tiny-cluster`/`cluster-proof` paths.
- `compiler/meshc/tests/e2e_m045_s01.rs` — Retargeted retained Rust contract/history rails to the relocated fixtures and the new public onboarding story.
- `compiler/meshc/tests/e2e_m045_s02.rs` — Retargeted retained Rust contract/history rails to the relocated fixtures and the new public onboarding story.
- `compiler/meshc/tests/e2e_m046_s03.rs` — Retargeted retained Rust contract/history rails to the relocated fixtures and the new public onboarding story.
- `compiler/meshc/tests/e2e_m046_s04.rs` — Retargeted retained Rust contract/history rails to the relocated fixtures and the new public onboarding story.
- `compiler/meshc/tests/e2e_m046_s05.rs` — Retargeted retained Rust contract/history rails to the relocated fixtures and the new public onboarding story.
- `scripts/verify-m047-s04.sh` — Updated the public onboarding contract expectations, cutover/Todo closeout rails, and the historical M045 wrapper bundle-shape check.
- `scripts/verify-m047-s05.sh` — Updated the public onboarding contract expectations, cutover/Todo closeout rails, and the historical M045 wrapper bundle-shape check.
- `scripts/verify-m045-s02.sh` — Updated the historical M045 retained-bundle contract to the current `e2e_m045_s02` artifact shape.
- `README.md` — Rewrote the public clustered onboarding story around scaffold plus generated `/examples` and added a fail-closed repo-owned contract test.
- `compiler/mesh-pkg/src/scaffold.rs` — Rewrote the public clustered onboarding story around scaffold plus generated `/examples` and added a fail-closed repo-owned contract test.
- `website/docs/docs/distributed-proof/index.md` — Rewrote the public clustered onboarding story around scaffold plus generated `/examples` and added a fail-closed repo-owned contract test.
- `tools/skill/mesh/skills/clustering/SKILL.md` — Rewrote the public clustered onboarding story around scaffold plus generated `/examples` and added a fail-closed repo-owned contract test.
- `.gsd/KNOWLEDGE.md` — Recorded the relocated-fixture and retained-bundle lessons for downstream slices and refreshed current project state.
- `.gsd/PROJECT.md` — Recorded the relocated-fixture and retained-bundle lessons for downstream slices and refreshed current project state.
