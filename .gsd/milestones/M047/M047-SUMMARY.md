---
id: M047
title: "Cluster Declaration Reset & Clustered Route Ergonomics"
status: complete
completed_at: 2026-04-02T05:32:29.019Z
key_decisions:
  - Use source-first `@cluster` / `@cluster(N)` as the public clustered function model and retire `clustered(work)` / `.toml` clustering from the public story, keeping compatibility only as a temporary bridge until the hard cutover landed.
  - Treat clustered counts as replication counts with default `2`, carry that count through shared mesh-pkg and declared-handler metadata, and reject unsupported higher fanout durably in continuity truth instead of silently downgrading it.
  - Implement `HTTP.clustered(handler)` / `HTTP.clustered(N, handler)` as wrapper syntax lowered to deterministic declared route shims on the same declared-handler runtime-name/replication-count seam as ordinary clustered work.
  - Keep route-free `@cluster` examples canonical and adopt `HTTP.clustered(1, ...)` only on selected Todo read routes while leaving default-count / two-node wrapper behavior under the dedicated S07 authority rail.
  - Package the Todo scaffold Docker image from the locally built `output` binary, and on non-Linux hosts prove the container truthfully by producing `output` from a Linux builder stage first.
  - Keep the closeout proof layered: S04 owns the hard-cutover verifier, S05 owns the Todo/native+Docker verifier, and S06 owns the final assembled wrapper that copies delegated verify bundles instead of sharing `.tmp` state.
key_files:
  - compiler/mesh-parser/src/parser/items.rs
  - compiler/mesh-parser/src/ast/item.rs
  - compiler/mesh-pkg/src/manifest.rs
  - compiler/mesh-pkg/src/scaffold.rs
  - compiler/mesh-codegen/src/declared.rs
  - compiler/mesh-codegen/src/codegen/mod.rs
  - compiler/mesh-rt/src/dist/node.rs
  - compiler/mesh-rt/src/dist/continuity.rs
  - compiler/mesh-rt/src/http/router.rs
  - compiler/mesh-rt/src/http/server.rs
  - compiler/mesh-typeck/src/infer.rs
  - compiler/mesh-typeck/tests/http_clustered_routes.rs
  - compiler/meshc/src/cluster.rs
  - compiler/meshc/src/main.rs
  - compiler/meshc/tests/e2e_m047_s01.rs
  - compiler/meshc/tests/e2e_m047_s02.rs
  - compiler/meshc/tests/e2e_m047_s05.rs
  - compiler/meshc/tests/e2e_m047_s06.rs
  - compiler/meshc/tests/e2e_m047_s07.rs
  - compiler/meshc/tests/support/m047_todo_scaffold.rs
  - cluster-proof/main.mpl
  - tiny-cluster/work.mpl
  - scripts/verify-m047-s04.sh
  - scripts/verify-m047-s05.sh
  - scripts/verify-m047-s06.sh
  - website/docs/docs/distributed/index.md
  - website/docs/docs/distributed-proof/index.md
  - website/docs/docs/getting-started/clustered-example/index.md
  - README.md
lessons_learned:
  - When milestone closeout runs on an already-merged `main`, a naive merge-base diff against `main` can be empty even though the milestone changed real code; use a pre-milestone baseline plus milestone-owned paths as the truthful equivalent.
  - The same declared-handler runtime-name seam can support both ordinary `@cluster` work and `HTTP.clustered(...)` wrappers; route-local shadow metadata would have created drift across compiler, runtime, CLI, and LSP surfaces.
  - Layered verifier ownership matters: S04, S05, and S06 stayed debuggable because each verifier owned its own `.tmp/.../verify` tree and retained delegated bundles by copy/pointer instead of mutating shared proof state.
  - For single-node Docker clustered-route proofs, host-published operator queries are not authoritative when the node advertises loopback inside the container; the truthful operator seam is a helper container sharing the target network namespace.
---

# M047: Cluster Declaration Reset & Clustered Route Ergonomics

**M047 replaced the old public clustered-work model with source-first `@cluster` declarations, shipped real `HTTP.clustered(...)` route wrappers, and dogfooded that reset into the canonical examples, Todo scaffold, Docker path, and final closeout rails.**

## What Happened

M047 started by resetting clustered authoring away from manifest-centered `clustered(work)` toward source-first `@cluster` / `@cluster(N)` declarations with shared parser, mesh-pkg, meshc, and mesh-lsp truth. S01 established the new syntax, preserved legacy compatibility only as a temporary bridge, and made diagnostics point at decorated source declarations. S02 carried replication-count metadata into the runtime declared-handler registry and continuity records so bare `@cluster` now means replication count `2`, explicit counts stay visible, and unsupported higher fanout rejects durably instead of being silently clipped.

The milestone then closed the public cutover and feature gap in two phases. S04 ended the compatibility bridge in code and public surfaces by rejecting legacy `clustered(work)` / `[cluster]` while keeping the route-free `@cluster` model canonical. S05 shipped the SQLite Todo scaffold with ordinary `@cluster` function names, actor-backed rate limiting, restart-persistent SQLite state, native and Docker proof rails, and a Dockerfile that packages the prebuilt binary. S06 added the built-package SQLite regression and the assembled closeout verifier/documentation layer. The original route-wrapper slice was not sufficient on its first pass, so remediation round 1 added S07 and S08: S07 shipped the real `HTTP.clustered(handler)` / `HTTP.clustered(N, handler)` compiler/runtime seam using declared route shims on the shared declared-handler runtime-name/replication-count path, and S08 adopted that shipped wrapper into the Todo starter's selected read routes, public docs, and assembled closeout rails without displacing the canonical route-free `@cluster` story.

Milestone closeout was re-verified on the current tree rather than trusting stale artifacts. Because this worktree is already on merged `main` (`HEAD == main == origin/main`), the naive `git diff HEAD $(git merge-base HEAD main) -- ':!.gsd/'` check is empty here; the truthful equivalent baseline is the last commit before the M047 work window (`56e46372` from 2026-03-27) restricted to M047-owned paths. That targeted diff shows real non-`.gsd/` delivery across compiler, runtime, scaffold, verifier, and docs surfaces: 118 files changed with 56,724 insertions and 668 deletions under `compiler/mesh-*`, `cluster-proof/`, `tiny-cluster/`, `scripts/verify-m047-*.sh`, and `website/docs/`. Fresh closeout verification also passed: `bash scripts/verify-m047-s05.sh`, `cargo test -p meshc --test e2e_m047_s06 m047_s06_ -- --nocapture`, `bash scripts/verify-m047-s06.sh`, and `cargo test -p meshc --test e2e_m047_s07 -- --nocapture` all completed successfully, and the retained proof markers now exist again under `.tmp/m047-s05/verify/` and `.tmp/m047-s06/verify/` with `status.txt = ok`, `current-phase.txt = complete`, and valid `latest-proof-bundle.txt` pointers.

## Success Criteria Results

- [x] **Users can declare clustered functions with `@cluster` / `@cluster(N)` and see replication-count semantics reflected in real compiler/runtime truth.**
  - Evidence: S01 delivered parser, mesh-pkg, meshc, and mesh-lsp support for source-first clustered declarations with source-ranged diagnostics; S02 preserved default/explicit replication counts into runtime continuity truth and `meshc cluster continuity`; validation recorded this criterion as met; requirement R098 was validated by the S02 rails.
- [x] **Users can cluster selected HTTP routes with `HTTP.clustered(...)` inside ordinary router chains, and live route behavior proves the handler is the clustered boundary.**
  - Evidence: S07 shipped the wrapper/compiler/runtime seam; fresh verification passed via `cargo test -p meshc --test e2e_m047_s07 -- --nocapture` (3 passed), and M047 validation records that continuity/runtime truth remains keyed to the real route handler runtime name.
- [x] **Canonical examples, scaffold output, docs, and proof rails no longer teach `clustered(work)` or `.toml` clustering as the public model.**
  - Evidence: S04 completed the hard cutover and validation records the public syntax reset as met; `bash scripts/verify-m047-s05.sh` replayed `bash scripts/verify-m047-s04.sh` successfully; S06 closeout docs checks regenerated under `.tmp/m047-s06/verify/` and passed.
- [x] **A dedicated scaffold command generates a simple SQLite Todo API with actors, rate limiting, clustered routes, and a complete Dockerfile that reads like a starting point.**
  - Evidence: S05 shipped the Todo scaffold and native/Docker proof; fresh `bash scripts/verify-m047-s05.sh` passed and regenerated retained bundles including `todo-scaffold-runtime-truth-*` and `todo-scaffold-clustered-route-truth-*` artifacts under `.tmp/m047-s05/`.
- [x] **One final closeout rail proves the syntax reset, clustered routes, dogfooded examples, scaffold, Docker path, and migration/docs story together.**
  - Evidence: fresh `cargo test -p meshc --test e2e_m047_s06 m047_s06_ -- --nocapture` passed (3 passed), `bash scripts/verify-m047-s06.sh` passed, `.tmp/m047-s06/verify/status.txt` now reads `ok`, `.tmp/m047-s06/verify/current-phase.txt` reads `complete`, and the assembled bundle pointer `.tmp/m047-s06/verify/latest-proof-bundle.txt` points at the retained proof bundle.

## Definition of Done Results

- [x] **All roadmap slices complete.** `S01` through `S08` are complete, and `gsd_complete_milestone` validated slice completion before writing this record.
- [x] **All slice summaries exist.** `find .gsd/milestones/M047 -type f | rg 'S0[1-8]-SUMMARY\\.md$'` returned all eight slice summaries, plus their task summaries.
- [x] **The milestone produced real code, not only planning artifacts.** Because `HEAD == main == origin/main` in this merged worktree, the truthful integration-branch baseline is the last commit before the M047 work window (`56e46372`) restricted to M047-owned paths; `git diff --stat "$BASE" HEAD -- compiler/mesh-common compiler/mesh-lexer compiler/mesh-parser compiler/mesh-pkg compiler/mesh-codegen compiler/mesh-rt compiler/mesh-typeck compiler/meshc cluster-proof tiny-cluster website/docs scripts/verify-m047-s04.sh scripts/verify-m047-s05.sh scripts/verify-m047-s06.sh` showed 118 non-`.gsd/` files changed with 56,724 insertions and 668 deletions.
- [x] **Cross-slice integration works correctly.** S01/S02’s declaration + replication-count seam is the same seam S07 uses for route wrappers; S04 preserved the hard cutover; S05/S06 were honestly route-free when first landed and S08 rebased the scaffold/docs/verifier layer onto the shipped wrapper truth. Fresh `bash scripts/verify-m047-s05.sh`, `cargo test -p meshc --test e2e_m047_s06 m047_s06_ -- --nocapture`, `bash scripts/verify-m047-s06.sh`, and `cargo test -p meshc --test e2e_m047_s07 -- --nocapture` all passed.
- [x] **Milestone validation passed after remediation.** `.gsd/milestones/M047/M047-VALIDATION.md` records verdict `pass` at remediation round `1`, and the fresh closeout replays are consistent with that validation artifact.

## Requirement Outcomes

- **R097** — `active -> validated`. Evidence: S01 established `@cluster` / `@cluster(N)` as the source-first declaration surface; S04 completed the public cutover by rejecting legacy `clustered(work)` and `[cluster]`; validation records the requirement as met.
- **R098** — `active -> validated`. Evidence: S02 carried replication counts into the declared-handler registry and continuity truth so omitted counts default to `2`, explicit counts remain visible, and unsupported higher fanout rejects durably; S02 validation and milestone validation both record this requirement as met.
- **R099** — `active -> validated`. Evidence: S01/S02 preserved clustering as a general function capability rather than an HTTP-only feature, and S04/S06 kept the canonical examples route-free `@cluster` first; milestone validation records this requirement as covered and met.
- **R100** — `active -> validated`. Evidence: S07 shipped real `HTTP.clustered(handler)` / `HTTP.clustered(N, handler)` support across typecheck, lowering, runtime, and e2e; fresh `cargo test -p meshc --test e2e_m047_s07 -- --nocapture` passed.
- **R101** — `active -> validated`. Evidence: S07’s runtime and e2e rails prove the route handler runtime name remains the clustered boundary and continuity/operator views are keyed to that handler instead of a hidden route-local side channel.
- **R102** — `active -> validated`. Evidence: S04 removed the old public `clustered(work)` / `[cluster]` model from examples, docs, generated surfaces, and cutover verifiers; validation records the requirement as met.
- **R103** — `active -> validated`. Evidence: S04 migrated repo-owned clustered examples and proof surfaces onto the new model, S05 moved the scaffold/examples onto ordinary `@cluster` function names, and S08 kept public clustered-route claims narrow and truthful.
- **R104** — `active -> validated`. Evidence: S05 shipped `meshc` Todo scaffolding with SQLite, actors, rate limiting, several real routes, and a complete Dockerfile; fresh `bash scripts/verify-m047-s05.sh` passed and retained native/Docker Todo artifacts.
- **R105** — `active -> validated`. Evidence: S05 and S08 keep the starter readable and low-ceremony, using ordinary `@cluster` names and only explicit-count clustered read routes where the runtime truth supports them; the generated Todo starter remains a starting point instead of a proof harness.
- **R106** — `active -> validated`. Evidence: S06 closed the docs/migration/assembled-proof layer; fresh `bash scripts/verify-m047-s06.sh` passed and regenerated docs/content checks under `.tmp/m047-s06/verify/`, while validation records the public teaching surface as coherent and source-first.

**Verification note:** the checked-in `.gsd/REQUIREMENTS.md` still listed `R097`–`R106` as `active` before milestone closeout even though the evidence above proves them. This milestone summary records the validated transitions explicitly, and the requirement contract was updated afterward to reflect that visible state.

## Deviations

The milestone did not pass on its first assembled validation. The original S03/S06 plan left the clustered HTTP wrapper and downstream adoption incomplete, so remediation round 1 added S07 for the real wrapper/compiler/runtime/e2e seam and S08 for scaffold/docs/closeout adoption. The final delivered milestone still matches the roadmap vision, but the wrapper feature and public adoption landed as remediation slices rather than inside the original S03/S06 scope.

## Follow-ups

Future milestone work can expand runtime fanout beyond the current one-required-replica limit, but it should preserve the source-first declaration semantics and durable rejection truth that M047 established. Any broader HTTP route ergonomics or generic route-closure support should remain separate from the shipped `HTTP.clustered(...)` wrapper seam unless there is fresh proof that a wider ABI change is honest. The GSD requirements DB should also be repaired so the visible checked-in requirement contract and tool-managed requirement state no longer drift for the M047 family.
