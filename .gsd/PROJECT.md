# Project

## What This Is

Mesh is a programming language and backend application platform repository aimed at being trustworthy for real backend and distributed-systems work, not just toy examples. The repo contains the compiler, runtime, formatter, LSP, REPL, package tooling, docs site, package registry, package website, and dogfood applications used to pressure-test the language.

M047 is complete. M046 already proved route-free clustered work strongly enough that `tiny-cluster/`, rebuilt `cluster-proof/`, and `meshc init --clustered` could stay tiny and runtime-owned; M047/S04 completed the hard public cutover to source-first `@cluster` declarations, S05 rebaselined the public clustered surfaces onto ordinary function names and shipped the SQLite Todo starter, S06 closed the docs/migration/assembled-proof layer with `bash scripts/verify-m047-s06.sh` as the retained closeout rail, S07 shipped the real `HTTP.clustered(...)` compiler/runtime seam with live two-node HTTP proof, and S08 adopted that shipped wrapper into the Todo starter, public docs, and assembled closeout rails without displacing the canonical route-free `@cluster` story. The repo now has a truthful clustered-route wrapper implementation plus native and Docker proof that the Todo starter's selected read routes execute through explicit-count clustered route wrappers end to end. No new milestone has been started in this worktree yet.

## Core Value

If Mesh claims it can cluster, route work, survive node loss, and report truthful runtime status, those claims must be proven through small docs-grade examples where the language/runtime owns the magic instead of the example app reimplementing distributed behavior — including the syntax users actually write.

## Current State

Mesh already ships a broad backend-oriented stack:
- Rust workspace crates under `compiler/` for lexing, parsing, type checking, code generation, runtime, formatter, LSP, REPL, package tooling, and CLI commands
- native compilation to standalone binaries
- runtime support for actors, supervision, HTTP, WebSocket, JSON, database access, migrations, files, env, crypto, datetime, and collections
- a distributed runtime surface with node start/connect/list/monitor, remote spawn/send, continuity, authority, and clustered-app tooling
- dogfooded applications: `reference-backend/` as the narrow backend proof surface, `mesher/` as the broader pressure test, `tiny-cluster/` as the local route-free clustered proof, and `cluster-proof/` as the packaged route-free clustered proof
- a real package registry service in `registry/`, a public packages website in `packages-website/`, and editor surfaces including the VS Code extension and repo-owned Neovim pack

Recent distributed-runtime state:
- M039 proved automatic cluster formation, truthful membership, runtime-native internal balancing, and single-cluster degrade/rejoin on a narrow proof app
- M042 moved single-cluster keyed continuity into `mesh-rt` behind a Mesh-facing `Continuity` API
- M043 proved cross-cluster primary/standby continuity, bounded promotion, and packaged same-image failover/operator rails
- M044 productized clustered apps: manifest opt-in, runtime-owned declared-handler execution, built-in read-only operator/CLI surfaces, `meshc init --clustered`, bounded automatic promotion/recovery, and a rewritten `cluster-proof` on the public clustered-app contract
- M045 simplified the clustered example story around runtime-owned bootstrap, runtime-chosen remote execution, automatic failover, and scaffold-first docs
- M046 closed the route-free clustered proof wave: `tiny-cluster/`, rebuilt `cluster-proof/`, and `meshc init --clustered` now share one tiny `1 + 1` clustered-work contract, and the authoritative closeout rail is `bash scripts/verify-m046-s06.sh`

The current clustered declaration surface has now crossed the public cutover line. M047/S01 and S02 landed the source-first `@cluster` / `@cluster(N)` parsing, shared mesh-pkg declaration provenance/count metadata, source-ranged meshc diagnostics, range-accurate mesh-lsp diagnostics, runtime registration keyed by generic declared-handler runtime names, and continuity records that preserve public `replication_count`. M047/S04 then removed the old public compatibility bridge: parser/pkg/compiler flows now reject legacy `clustered(work)` and `[cluster]` with migration guidance, and `bash scripts/verify-m047-s04.sh` remains the authoritative cutover verifier.

M047 is now closed through S08 on the current source-first clustered model. The declared-work wrapper/codegen seam supports ordinary zero-arg `@cluster` functions, `tiny-cluster/`, `cluster-proof/`, and `meshc init --clustered` dogfood ordinary names like `add()`, and `meshc init --template todo-api` generates a SQLite Todo API with CRUD routes, actor-backed write limiting, restart-persistent SQLite state, a route-free clustered `sync_todos()` function, explicit-count `HTTP.clustered(1, ...)` on the selected read routes, and a Dockerfile that packages the binary produced by `meshc build .`. S06 added the dedicated built-package SQLite regression (`cargo test -p meshc --test e2e_sqlite_built_package -- --nocapture`), finished the public docs/migration story, and made `bash scripts/verify-m047-s06.sh` the assembled closeout rail that wraps S05 and owns the retained `.tmp/m047-s06/verify` bundle. S07 then landed the real clustered HTTP route wrapper: `HTTP.clustered(handler)` / `HTTP.clustered(N, handler)` now type-check with wrapper-specific diagnostics, lower to deterministic `__declared_route_<runtime_name>` shims that register through the shared declared-handler seam, execute the route handler itself as the clustered boundary, and surface continuity/runtime truth through the same runtime-name/replication-count fields used by ordinary clustered work. S08 completed the adoption layer by updating the scaffold, docs, and retained closeout rails to prove the Todo starter's selected clustered read routes natively and inside Docker while preserving the route-free `@cluster` surfaces as the canonical public model.

Public docs/readmes now teach the three canonical route-free `@cluster` surfaces first, then layer on the Todo starter as the fuller example with explicit-count `HTTP.clustered(1, ...)` on `GET /todos` and `GET /todos/:id` while pointing default-count/two-node wrapper behavior at the S07 rail. The current closeout proof surface is `cargo test -p meshc --test e2e_m047_s06 -- --nocapture`, `cargo test -p meshc --test e2e_sqlite_built_package -- --nocapture`, and `bash scripts/verify-m047-s06.sh`, with retained status/phase/bundle pointers under `.tmp/m047-s06/verify/`. `HTTP.clustered(...)` lands in compiler/runtime/e2e through the S07 rails (`cargo test -p mesh-typeck m047_s07 -- --nocapture`, `cargo test -p mesh-lsp m047_s07 -- --nocapture`, `cargo test -p mesh-codegen m047_s07 -- --nocapture`, `cargo test -p mesh-rt m047_s07 -- --nocapture`, and `cargo test -p meshc --test e2e_m047_s07 -- --nocapture`), while S05/S06 now adopt the shipped wrapper truthfully through the Todo starter and assembled native/Docker closeout rails (`cargo test -p meshc --test e2e_m047_s05 -- --nocapture` and `bash scripts/verify-m047-s05.sh`).

## Architecture / Key Patterns

- Rust workspace under `compiler/` with separate crates for parser, type checker, codegen, runtime, formatter, LSP, CLI, REPL, package tooling, and package manager code
- backend-first proof surfaces through narrow reference apps and shell verifiers, not marketing-only examples
- proof-first dogfooding: reproduce a real runtime/platform limitation, fix it at the correct layer, then prove the repaired path end to end
- explicit honesty boundaries when behavior is genuinely environment-specific; avoid claiming portability or automation that the runtime does not really own
- assembled closeout verifiers own a fresh `.tmp/<slice>/verify` bundle and retain delegated subrails by copying their verify trees plus bundle pointers, rather than sharing or mutating lower-level `.tmp/.../verify` directories directly
- current clustered runtime surface lives primarily in `compiler/mesh-rt/src/dist/`, `compiler/mesh-codegen/`, `compiler/mesh-typeck/`, and `compiler/meshc/`, with user-facing docs in `website/docs/docs/distributed/` and the scaffold path in `compiler/mesh-pkg/src/scaffold.rs`
- clustered HTTP routes now reuse the same declared-handler seam as ordinary clustered work: compiler lowering rewrites `HTTP.clustered(...)` to deterministic `__declared_route_<runtime_name>` bare shims, router registration reverse-maps those shims onto declared-handler runtime metadata, and continuity/operator views stay keyed by the real handler runtime name rather than the shim symbol
- for the next wave, clustered ergonomics should stay source-first and obvious: one general clustered function model, route-local wrapper sugar for HTTP, and examples that look like starting points rather than proof apps

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M028: Language Baseline Audit & Hardening — prove the first honest API + DB + migrations + jobs backend path
- [x] M029: Mesher & Reference-Backend Dogfood Completion — fix formatter corruption and complete the dogfood cleanup wave
- [x] M031: Language DX Audit & Rough Edge Fixes — retire real dogfood rough edges through compiler and parser fixes
- [x] M032: Mesher Limitation Truth & Mesh Dogfood Retirement — audit workaround folklore, fix real blockers in Mesh, and dogfood those repairs back into `mesher/`
- [x] M033: ORM Expressiveness & Schema Extras — strengthen the neutral data layer, add PG-first extras now, and leave a clean path for SQLite extras later
- [x] M034: Delivery Truth & Public Release Confidence — harden CI/CD, prove the package manager end to end, and make the public release path trustworthy instead of artifact-only
- [x] M036: Editor Parity & Multi-Editor Support — make editor support match real Mesh syntax and give at least one non-VSCode editor a first-class path
- [x] M038: Fix Windows MSVC Build — repair the hosted Windows release lane so the shipped compiler path is trustworthy
- [x] M039: Auto-Discovery & Native Cluster Balancing — prove discovery, truthful membership, runtime-native internal balancing, and single-cluster failure/rejoin on a narrow proof app
- [x] M042: Runtime-Native Distributed Continuity Core — move single-cluster distribution, replication, and keyed continuity into `mesh-rt` behind a simple Mesh-facing API
- [x] M043: Runtime-Native Cross-Cluster Disaster Continuity — extend the same runtime-owned continuity model across primary/standby clusters
- [x] M044: First-Class Clustered Apps & Bounded Auto-Promotion — turn runtime continuity/failover into the default productized clustered-app model for ordinary Mesh services
- [x] M045: Language-Owned Clustered Example Simplification — make the primary clustered example tiny, docs-grade, and fully language/runtime-owned instead of proof-app-shaped
- [x] M046: Language-Owned Tiny Cluster Proofs — make clustered work auto-triggered, decorator-declarable, route-free, and equally proven through `meshc init --clustered`, `tiny-cluster/`, and rebuilt `cluster-proof/`
- [x] M047: Cluster Declaration Reset & Clustered Route Ergonomics — replace `clustered(work)` with `@cluster`, reset canonical examples/scaffolds to ordinary `@cluster` function names, continue the clustered-route wrapper work honestly, and ship a clear SQLite Todo scaffold with a complete Dockerfile that makes clustering obvious without looking like a proof app
- [ ] M035: Test Framework Hardening — get Mesh's testing story ready to test `mesher` thoroughly during development
- [ ] M037: Package Experience & Ecosystem Polish — improve the package manager experience, website-first, once the underlying trust path is proven
