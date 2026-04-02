# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R040 — The M033 data-layer design should be shaped so SQLite-specific extras can be added later without backing out a PG-only abstraction.
- Class: constraint
- Status: active
- Description: The M033 data-layer design should be shaped so SQLite-specific extras can be added later without backing out a PG-only abstraction.
- Why it matters: The user wants a neutral code path with explicit vendor extras, not a one-off Postgres trap.
- Source: user
- Primary owning slice: M033/S01 (provisional)
- Supporting slices: M033/S02 (provisional)
- Validation: Design seam advanced by the combined M033/S01+S04 proof set: `bash scripts/verify-m033-s01.sh`, `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and `bash scripts/verify-m033-s04.sh`; full validation still depends on later vendor-extra slices.
- Notes: Further advanced by M033/S05: `website/docs/docs/databases/index.md` and `scripts/verify-m033-s05.sh` now enforce the portable core vs explicit `Pg.*` vs SQLite-later contract in the public docs, but runtime validation still depends on later vendor-extra slices.

### R049 — Keyed work completes with at-least-once, idempotent semantics without an external durable store.
- Class: continuity
- Status: active
- Description: Mesh should support a keyed request model where retries are safe and visible completion converges correctly even if the original worker dies.
- Why it matters: The user explicitly wants the language to prove more than clustering; it must prove a believable continuity story without outsourcing truth to a database.
- Source: user
- Primary owning slice: M044/S02
- Supporting slices: M044/S04
- Validation: mapped
- Notes: This remains at-least-once with idempotent completion, not exactly-once semantics. M044 productizes the contract through declared clustered handlers instead of proof-app-specific plumbing.

### R050 — In-flight continuity is replicated across live nodes with a configurable replica count and two-node safety as the default proof bar.
- Class: operability
- Status: active
- Description: The distributed runtime should replicate enough request ownership/progress state across live nodes that a default two-node deployment can lose any one node without losing active keyed work.
- Why it matters: Without replica-backed continuity, node-failure recovery is just best-effort re-execution folklore.
- Source: user
- Primary owning slice: M044/S02
- Supporting slices: M044/S04
- Validation: mapped
- Notes: Replica count should remain configurable upward even if the first proof uses two-node safety. M044 shifts this from proof-app continuity into the first-class clustered app model.

### R052 — The distributed proof runs from one Docker image with a small env-driven operator surface locally and on Fly.
- Class: launchability
- Status: active
- Description: An operator should be able to run the same image locally or on Fly, provide a small set of environment variables, and get automatic cluster behavior without hand-editing per-node peer lists.
- Why it matters: If the runtime is powerful but the real operator path feels bespoke, the language still fails the trust bar.
- Source: user
- Primary owning slice: M044/S03
- Supporting slices: M044/S05
- Validation: mapped
- Notes: M044 should replace proof-app-specific env dialect with a standard Mesh clustered-app contract while preserving the same-binary operator story.

### R077 — The primary clustered docs example is tiny enough that the language/runtime, not the example app, is visibly doing the distributed work.
- Class: launchability
- Status: validated
- Description: Mesh should present one small clustered example whose source is mostly business logic plus minimal ingress/declaration code, not proof-app-sized distributed glue.
- Why it matters: If the primary example is large or system-shaped, the docs still make clustering look manual even when the runtime owns more of the behavior.
- Source: user
- Primary owning slice: M045/S01
- Supporting slices: M045/S04, M045/S05
- Validation: Validated by M045/S01, S02, S04, and S05: clustered bootstrap moved behind `Node.start_from_env()` / `BootstrapStatus`, the scaffold stayed small while remote execution and completion moved into runtime/codegen, legacy `cluster-proof` glue was collapsed, and the assembled closeout `bash scripts/verify-m045-s05.sh` passed.
- Notes: This is a docs-grade simplicity requirement, not just a code-deletion goal.

### R078 — One local clustered example proves cluster formation, runtime-chosen remote execution, and failover end to end.
- Class: core-capability
- Status: validated
- Description: A single local example should run on two nodes, submit work, show the runtime choosing remote execution, and continue through primary loss without switching to a different proof app.
- Why it matters: The user wants one small example that shows the whole language-owned clustered story, not a simple demo plus a separate “real” failover example.
- Source: user
- Primary owning slice: M045/S02
- Supporting slices: M045/S03
- Validation: Validated by M045/S02 and S03: the scaffold-first two-node rail proves runtime-chosen remote execution, the retained S03 failover bundle records automatic recovery from `attempt-1` to `attempt-2` on the same request key, and the assembled closeout `bash scripts/verify-m045-s05.sh` replays that chain successfully.
- Notes: The proof bar is local-first and end-to-end, not just fixture-level.

### R079 — Example apps contain no app-owned clustering, failover, routing-choice, load-balancing, or status-truth logic.
- Class: constraint
- Status: validated
- Description: All cluster state, routing choice, authority/failover, and status truth for the primary example must come from the language/runtime instead of example-side helpers, placement logic, or translation seams.
- Why it matters: This is the core honesty boundary for M045: the example must stop helping the runtime do distributed-systems work.
- Source: user
- Primary owning slice: M045/S01
- Supporting slices: M045/S03, M045/S04
- Validation: Validated by M045/S01-S04: bootstrap, remote-owner execution, completion, failover, and status truth now live behind runtime/codegen plus `meshc cluster` CLI surfaces; the current proof rails depend on runtime CLI truth rather than app-owned status or placement helpers.
- Notes: Any example-owned distributed logic is suspect by default in this milestone.

### R080 — `meshc init --clustered` is the primary docs-grade clustered example surface.
- Class: launchability
- Status: validated
- Description: The clustered scaffold should become the main example readers learn from, rather than requiring them to reverse-engineer `cluster-proof` first.
- Why it matters: A first-class language feature needs a first-class entrypoint and teaching surface.
- Source: user
- Primary owning slice: M045/S02
- Supporting slices: M045/S05
- Validation: Validated by M045/S05: `/docs/getting-started/clustered-example/` now exists as the first-class clustered tutorial, `cargo test -p meshc --test e2e_m045_s05 m045_s05_ -- --nocapture` passed, and `npm --prefix website run build` passed inside the green assembled closeout `bash scripts/verify-m045-s05.sh`.
- Notes: `cluster-proof` can remain as a deeper proof rail, but it should not be the main teaching abstraction.

### R081 — Public docs teach the simple clustered example first and keep deeper proof rails secondary.
- Class: quality-attribute
- Status: validated
- Description: The docs should center the small scaffold-first clustered example, then point to deeper proof rails only when the reader needs the underlying failover/operator detail.
- Why it matters: Even if the runtime is truthful, the product story still feels too manual if the docs lead with the proof app instead of the simple language-owned example.
- Source: inferred
- Primary owning slice: M045/S05
- Supporting slices: M045/S02
- Validation: Validated by M045/S05: public docs/readme guidance now routes clustered readers to the scaffold-first Getting Started page before deeper proof material, the docs build passed, and `bash scripts/verify-m045-s05.sh` remained green while retaining the deeper S04/S03 proof chain as secondary evidence.
- Notes: This requirement is about ordering and emphasis in the public teaching surface, not removing deeper verifier rails entirely.

### R097 — `@cluster` and `@cluster(N)` replace `clustered(work)` as the public clustered function syntax.
- Class: core-capability
- Status: validated
- Description: Mesh source should declare clustered functions with `@cluster` and `@cluster(N)` instead of the current `clustered(work)` marker.
- Why it matters: The current syntax makes clustering look like a special proof-only mechanism instead of a normal language feature.
- Source: user
- Primary owning slice: M047/S01
- Supporting slices: M047/S04, M047/S06
- Validation: Validated by M047/S01 and M047/S04: source-first parser/compiler/LSP support landed, the hard cutover removed legacy public syntax, and the passed M047 validation + milestone closeout prove `@cluster` / `@cluster(N)` are now the supported public clustered function spellings.
- Notes: This is a hard cutover requirement, not an additive alias.

### R098 — Cluster counts mean replication counts, and omitted counts default to `2`.
- Class: continuity
- Status: validated
- Description: `@cluster(3)` and route-local clustered wrappers should express replication count, and `@cluster` should mean replication count `2` by default.
- Why it matters: If the numeric argument is ambiguous, the new syntax becomes another folklore surface instead of a clear contract.
- Source: user
- Primary owning slice: M047/S02
- Supporting slices: M047/S03, M047/S04
- Validation: Validated by M047/S02: replication counts flow into declared-handler runtime metadata and continuity truth, bare `@cluster` defaults to `2`, explicit counts are preserved, and unsupported higher fanout rejects durably instead of being silently clipped.
- Notes: The count is about replication, not just execution width.

### R099 — Clustering remains a general function capability, not an HTTP-only feature.
- Class: constraint
- Status: validated
- Description: Any supported function boundary Mesh clusters today should remain clusterable through the new source-first syntax; HTTP route clustering is an important consumer of the model, not the only model.
- Why it matters: Route-only clustering would regress the current runtime-owned startup/background/distributed work story and force non-route work back into awkward side channels.
- Source: user
- Primary owning slice: M047/S02
- Supporting slices: M047/S03, M047/S04
- Validation: Validated by M047/S01, S02, S04, and the passed milestone validation: clustering stayed a general function capability while the canonical public examples remained route-free `@cluster` first.
- Notes: Clustered routes should lower onto the same general clustered function capability.

### R100 — HTTP routes can opt into clustering with wrapper syntax like `HTTP.clustered(handler)` and `HTTP.clustered(3, handler)`.
- Class: launchability
- Status: validated
- Description: Router chains should support a route-local clustered wrapper so a single route can opt into clustering without awkward handler indirection or verb-specific API explosion.
- Why it matters: In a pipe-chained router, clustering has to be obvious where the route is declared or it becomes technically present but not obvious.
- Source: user
- Primary owning slice: M047/S03
- Supporting slices: M047/S05, M047/S06
- Validation: Validated by M047/S07 and fresh closeout replay: `HTTP.clustered(handler)` / `HTTP.clustered(N, handler)` typecheck, lower, execute, and pass `cargo test -p meshc --test e2e_m047_s07 -- --nocapture`.
- Notes: Wrapper style is preferred over adding a separate clustered verb helper for every HTTP method.

### R101 — For clustered HTTP, the route handler is the distributed boundary and normal downstream function calls run naturally inside that execution.
- Class: core-capability
- Status: validated
- Description: When a route uses the clustered wrapper, Mesh should treat the route handler as the clustered unit of work and execute its normal call graph inside that clustered request execution.
- Why it matters: This keeps the mental model honest and avoids pretending Mesh infers arbitrary deeper distributed intent from normal code.
- Source: user
- Primary owning slice: M047/S03
- Supporting slices: M047/S05
- Validation: Validated by M047/S07: continuity/runtime truth stays keyed to the real route handler runtime name, proving the route handler itself is the clustered boundary.
- Notes: The first route model should be explicit at the handler boundary rather than fully implicit.

### R102 — The old `clustered(work)` surface is removed instead of kept as a coequal public syntax.
- Class: constraint
- Status: validated
- Description: Mesh should migrate examples, docs, generated scaffolds, parser/typechecker messaging, and proof rails onto the new `@cluster` model instead of teaching both syntaxes side by side.
- Why it matters: Keeping both public models would preserve exactly the clutter and uncertainty this milestone is meant to remove.
- Source: user
- Primary owning slice: M047/S04
- Supporting slices: M047/S06
- Validation: Validated by M047/S04: legacy `clustered(work)` / `[cluster]` public surfaces were removed from examples, docs, generated outputs, and authoritative cutover rails.
- Notes: This is a language-surface reset, not a temporary sugar layer.

### R103 — Repo-owned clustered examples are dogfooded onto the new model.
- Class: quality-attribute
- Status: validated
- Description: The repo’s clustered examples and proof surfaces should use plain `@cluster` functions with ordinary user-facing names like `add()` or domain-specific verbs, and should use clustered route wrappers only where that feature is actually shipped, instead of continuing to demonstrate the old clustered-work shape or an `execute_declared_work(...)` special case.
- Why it matters: Mesh cannot claim the new syntax is the real direction if its own canonical examples keep a proof-shaped function contract.
- Source: user
- Primary owning slice: M047/S04
- Supporting slices: M047/S05, M047/S06
- Validation: Validated by M047/S04, S05, and S08: repo-owned clustered examples, scaffold output, proof packages, docs snippets, and verifier expectations now dogfood the new source-first model.
- Notes: Dogfooding includes proof packages, generated surfaces, docs snippets, and named verifier expectations. `execute_declared_work(...)` is now an explicit drift marker on public example/scaffold surfaces.

### R104 — `meshc` can scaffold a simple SQLite-backed Todo API that demonstrates ordinary `@cluster` usage, actors, rate limiting, several real routes, and a complete Dockerfile.
- Class: launchability
- Status: validated
- Description: The new scaffold should generate a simple but real Todo API with SQLite, several HTTP routes, actor-backed work, an obvious plain `@cluster` function surface, and a complete Dockerfile that users can build and run directly.
- Why it matters: The user wants a starting point, not another tiny proof package or an overbuilt pseudo-product.
- Source: user
- Primary owning slice: M047/S05
- Supporting slices: M047/S06
- Validation: Validated by M047/S05 and fresh closeout replay: the Todo scaffold generates a SQLite API with real routes, actor-backed rate limiting, native/Docker proof, and a complete Dockerfile.
- Notes: SQLite should be used in a simple way; the point is to show syntax and app shape, not maximal infrastructure. The starter now adopts explicit-count clustered read routes only where the shipped runtime truth supports them.

### R105 — The new scaffold makes clustering obvious, keeps boilerplate low, and feels like a starting point instead of a proof app.
- Class: differentiator
- Status: validated
- Description: The generated app should make clustering visually obvious through plain `@cluster` function names rather than proof-shaped helpers like `execute_declared_work(...)`, avoid excessive ceremony, and read like something a user could actually begin building from.
- Why it matters: The user explicitly called out the failure modes to avoid: technically present but not obvious clustering, too much boilerplate, and a proof-app feel.
- Source: user
- Primary owning slice: M047/S05
- Supporting slices: M047/S06
- Validation: Validated by M047/S05 and S08: the scaffold uses ordinary `@cluster` function names, low boilerplate, and selected explicit-count clustered read routes while remaining a usable starting point.
- Notes: If the scaffold proves the runtime but still reads like a verifier harness or keeps a proof-shaped public function contract, this requirement is not met.

### R106 — Public docs and migration guidance teach one source-first clustered model to both new and existing Mesh users.
- Class: quality-attribute
- Status: validated
- Description: Public docs, generated README guidance, CLI help, and verifier rails should teach the new source-first clustered model consistently, use plain `@cluster` function names instead of `execute_declared_work(...)` on public example surfaces, and make the migration off `clustered(work)` understandable for existing users.
- Why it matters: This milestone optimizes for both new Mesh users and existing users, so the new model has to be learnable and migratable at the same time.
- Source: inferred
- Primary owning slice: M047/S06
- Supporting slices: M047/S04, M047/S05
- Validation: Validated by M047/S06 and fresh `bash scripts/verify-m047-s06.sh`: public docs, README guidance, migration story, and assembled proof rails teach one coherent source-first clustered model.
- Notes: Migration guidance should be explicit enough that the hard cutover does not feel arbitrary, and docs must stay honest about what the Todo starter proves versus what the dedicated S07 two-node wrapper rail proves.

## Validated

### R085 — Clustered work declaration supports both manifest and source decorator forms.
- Class: core-capability
- Status: validated
- Description: Mesh should let app authors mark clustered work either in `mesh.toml` or directly in Mesh source with a decorator, with both forms compiling to the same declared runtime boundary.
- Why it matters: The user wants the language surface itself to denote what work gets replicated instead of forcing manifest-only configuration.
- Source: user
- Primary owning slice: M046/S01
- Supporting slices: M046/S05
- Validation: Validated by M046/S01: `cargo test -p mesh-parser --test parser_tests m046_s01_parser_ -- --nocapture`, `cargo test -p mesh-pkg m046_s01_ -- --nocapture`, `cargo test -p meshc --test e2e_m046_s01 m046_s01_ -- --nocapture`, `cargo test -p mesh-lsp m046_s01_ -- --nocapture`, `cargo test -p meshc --test e2e_m044_s01 m044_s01_ -- --nocapture`, and `cargo test -p meshc --test e2e_m044_s02 m044_s02_ -- --nocapture` proved source `clustered(work)` and manifest declarations converge on the same declared-handler runtime boundary.
- Notes: Public docs lead with the decorator while manifest support remains first-class.

### R086 — App code only marks clustered work; the runtime owns triggering, placement, replication, failover, recovery, and status semantics.
- Class: constraint
- Status: validated
- Description: Once work is marked clustered, Mesh runtime/tooling should own when it starts, where it runs, how it is replicated, how failover/recovery happen, how status truth is surfaced, and any proof-only timing or pending-window control needed to observe those behaviors.
- Why it matters: If app code still submits continuity work, chooses replica behavior, defines status semantics, or carries proof-only timing helpers, the clustered story is still not truly language-owned.
- Source: user
- Primary owning slice: M046/S02
- Supporting slices: M046/S03, M046/S04, M046/S06
- Validation: Validated by the assembled M046 closeout: S02 moved startup triggering/status truth into runtime/tooling, S03/S04 kept proof apps at `clustered(work)` + `Node.start_from_env()` only, and `bash scripts/verify-m046-s06.sh` plus `.gsd/milestones/M046/M046-VALIDATION.md` proved runtime-owned startup, placement, failover, recovery, and status semantics across scaffold, `tiny-cluster/`, and rebuilt `cluster-proof`.
- Notes: This stricter M046 bar moved the remaining trigger/control seam and failover-observability timing seam out of example apps and user-authored setup.

### R087 — Runtime/tooling can trigger clustered work without app-owned HTTP or explicit app-side continuity submission calls.
- Class: launchability
- Status: validated
- Description: A clustered proof app should be able to start, auto-run its clustered work, and expose proof only through runtime/tooling surfaces without app-owned HTTP submission routes or direct `Continuity.submit_declared_work(...)` calls in app code.
- Why it matters: The user explicitly wants route-free proofs where Mesh itself triggers and manages the clustered work lifecycle.
- Source: user
- Primary owning slice: M046/S02
- Supporting slices: M046/S03, M046/S04
- Validation: Validated by M046/S02 and carried through M046/S06: `cargo test -p mesh-rt startup_work_ -- --nocapture`, `cargo test -p meshc --test e2e_m046_s02 m046_s02_cli_ -- --nocapture`, and `cargo test -p meshc --test e2e_m046_s02 m046_s02_ -- --nocapture` proved route-free startup submission and inspection with no app-owned HTTP submit/status routes or explicit app-side `Continuity.submit_declared_work(...)` calls.
- Notes: The proof apps now start the work automatically on startup.

### R088 — `tiny-cluster/` exists as a local-first, route-free clustered proof using trivial `1 + 1` work.
- Class: launchability
- Status: validated
- Description: The repo should ship a new local `tiny-cluster/` package whose clustered work is intentionally trivial — effectively `1 + 1` — with no user-authored delay/sleep helpers or env normalization in package code, so any remaining complexity in the proof comes from Mesh rather than from the app.
- Why it matters: The user wants a brutally small local proof surface that makes platform complexity impossible to hide behind app code.
- Source: user
- Primary owning slice: M046/S03
- Supporting slices: M046/S05, M046/S06
- Validation: Validated by M046/S03 and retained in M046/S06: `cargo run -q -p meshc -- build tiny-cluster`, `cargo run -q -p meshc -- test tiny-cluster/tests`, `cargo test -p meshc --test e2e_m046_s03 m046_s03_tiny_cluster_package_ -- --nocapture`, `cargo test -p meshc --test e2e_m046_s03 m046_s03_tiny_cluster_startup_ -- --nocapture`, `cargo test -p meshc --test e2e_m046_s03 m046_s03_tiny_cluster_failover_ -- --nocapture`, and `bash scripts/verify-m046-s03.sh` proved `tiny-cluster/` is the shipped local-first route-free proof with trivial work and no app-owned timing hooks.
- Notes: No HTTP routes or app-owned timing hooks belong in this package.

### R089 — `cluster-proof/` is fully rebuilt as a tiny packaged proof app with no app-owned clustering, failover, routing, or status logic.
- Class: quality-attribute
- Status: validated
- Description: The existing packaged `cluster-proof/` surface should be deleted and rebuilt from zero around the same tiny route-free clustered-work contract instead of carrying forward legacy proof-app seams.
- Why it matters: The user explicitly asked to completely nuke `cluster-proof/` and start fresh because the current package still exposes too much app-shaped clustered behavior.
- Source: user
- Primary owning slice: M046/S04
- Supporting slices: M046/S06
- Validation: Validated by M046/S04 and retained in M046/S06: `cargo run -q -p meshc -- build cluster-proof`, `cargo run -q -p meshc -- test cluster-proof/tests && docker build -f cluster-proof/Dockerfile -t mesh-cluster-proof:m046-s04-local .`, `cargo test -p meshc --test e2e_m046_s04 m046_s04_ -- --nocapture`, `bash scripts/verify-m046-s04.sh`, and delegated M044/M045 wrapper rails proved `cluster-proof/` was rebuilt as the tiny packaged route-free proof with no app-owned clustering, failover, routing, or status logic.
- Notes: This preserves a packaged/deeper proof rail without preserving the old package shape.

### R090 — `meshc init --clustered`, `tiny-cluster/`, and rebuilt `cluster-proof/` remain equally canonical clustered examples.
- Class: quality-attribute
- Status: validated
- Description: The generated scaffold, the local proof package, and the packaged proof package should all express the same clustered-work story and be kept in behavioral lockstep instead of drifting into separate models.
- Why it matters: The user rejected a single primary example; all three surfaces must stay equally trustworthy.
- Source: user
- Primary owning slice: M046/S05
- Supporting slices: M046/S03, M046/S04, M046/S06
- Validation: Validated by M046/S05 and retained in M046/S06: `cargo test -p mesh-pkg scaffold_clustered_project_writes_public_cluster_contract -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_init_clustered_creates_project -- --nocapture`, the M044/M045 scaffold guards, `cargo test -p meshc --test e2e_m046_s05 m046_s05_ -- --nocapture`, and `bash scripts/verify-m046-s05.sh` proved `meshc init --clustered`, `tiny-cluster/`, and `cluster-proof/` stay behaviorally locked to one route-free clustered-work contract.
- Notes: Docs and verification now treat these as equal clustered-example surfaces, not “real” versus “toy” paths.

### R091 — Runtime-owned tooling surfaces are sufficient to inspect work state and failover truth for the route-free proof apps.
- Class: admin/support
- Status: validated
- Description: Built-in runtime/tooling surfaces should be sufficient to inspect cluster membership, work state, and failover truth for the tiny proof apps without app-owned status or operator endpoints.
- Why it matters: Route-free proof apps only stay usable if the runtime inspection surfaces are complete enough to replace custom status routes and proof-only app timing tricks.
- Source: inferred
- Primary owning slice: M046/S02
- Supporting slices: M046/S06
- Validation: Validated by M046/S02, S03, S04, and the assembled M046/S06 closeout: runtime-owned `meshc cluster status|continuity|diagnostics` surfaces were proven sufficient for startup and failover truth by the S02/S03/S04 rails and preserved under `.tmp/m046-s06/verify/latest-proof-bundle.txt` and `.gsd/milestones/M046/M046-VALIDATION.md`.
- Notes: `meshc cluster ...` is now the primary inspection path for the route-free proof apps.

### R092 — The public clustered story no longer depends on HTTP routes for proof or operator truth.
- Class: quality-attribute
- Status: validated
- Description: Mesh should teach and verify clustered behavior through language/runtime and tooling surfaces rather than through app-authored HTTP submission or status contracts.
- Why it matters: The user explicitly wants the proof story to stop depending on app routes as a stand-in for runtime ownership.
- Source: user
- Primary owning slice: M046/S05
- Supporting slices: M046/S06
- Validation: Validated by M046/S05 and M046/S06: `npm --prefix website run build`, routeful-string/content guards, `cargo test -p meshc --test e2e_m046_s05 m046_s05_ -- --nocapture`, `cargo test -p meshc --test e2e_m046_s06 m046_s06_ -- --nocapture`, and `bash scripts/verify-m046-s05.sh` / `bash scripts/verify-m046-s06.sh` proved the public clustered story and closeout rails no longer depend on HTTP routes for proof or operator truth.
- Notes: This is about the public proof story and docs emphasis, not forbidding HTTP in unrelated Mesh apps.

### R093 — The canonical clustered proof workload stays intentionally trivial so remaining complexity is attributable to Mesh.
- Class: differentiator
- Status: validated
- Description: The canonical proof workload should remain as small as possible — literally `1 + 1` or equivalent trivial arithmetic — so any remaining orchestration or failure-handling complexity is clearly Mesh-owned.
- Why it matters: A non-trivial proof payload or proof-only app timing helper would make it too easy to confuse app complexity with platform complexity.
- Source: user
- Primary owning slice: M046/S03
- Supporting slices: M046/S04
- Validation: Validated by M046/S03, S04, and S06: `tiny-cluster/work.mpl` and `cluster-proof/work.mpl` keep the canonical clustered proof workload at trivial `1 + 1`, while failover observability moved into Mesh-owned runtime seams and the retained S06 bundles replay both proofs under the final milestone pointer.
- Notes: This is a proof-shape requirement, not a claim that real apps should be this small. Proof-only timing or observability seams stay out of app code so the workload remains genuinely trivial.

### R061 — Clustered mode is an app-level opt-in declared in `mesh.toml` using the standard Mesh clustered-app contract.
- Class: core-capability
- Status: validated
- Description: An ordinary Mesh app should become clustered by opting in through `mesh.toml` and standard app metadata rather than by copying proof-app-specific clustering glue.
- Why it matters: The clustered story is not productized if activation still depends on hand-built app wiring or a proof-app env dialect.
- Source: user
- Primary owning slice: M044/S01
- Supporting slices: M044/S03
- Validation: Validated by M044/S01: optional `[cluster]` manifest parsing, shared compiler/LSP validation, `cluster-proof/mesh.toml`, the named `m044_s01_clustered_manifest_` / `m044_s01_manifest_` rails, and green `bash scripts/verify-m044-s01.sh`.
- Notes: The activation boundary should be metadata-driven and shared across clustered apps.

### R062 — Declared clustered handlers compile against typed public continuity and authority surfaces with no app-level continuity JSON parsing.
- Class: core-capability
- Status: validated
- Description: Mesh app code should receive typed values for continuity records, submit decisions, authority status, and promotion results instead of parsing JSON or working through `Result<String, String>` shims.
- Why it matters: A first-class clustered app model cannot depend on stringly proof-app translation code.
- Source: user
- Primary owning slice: M044/S01
- Supporting slices: M044/S02, M044/S05
- Validation: Validated by M044/S01: typed Mesh-facing `ContinuityAuthorityStatus`, `ContinuityRecord`, and `ContinuitySubmitDecision` values across typeck/MIR/codegen/runtime plus `cluster-proof` dogfood, proved by `m044_s01_typed_continuity_`, `m044_s01_continuity_compile_fail_`, and the S01 shim-absence checks.
- Notes: This requirement covers the public Mesh-facing API, not just the existing typed Rust structs already present in `mesh-rt`.

### R063 — Only declared clustered service/message/work handlers receive continuity and failover semantics; undeclared code stays ordinary local Mesh code.
- Class: constraint
- Status: validated
- Description: Mesh should make clustered execution explicit at the handler/message/work-unit boundary so that declared clustered handlers get continuity/failover guarantees while ordinary code continues to run locally with no distributed claim.
- Why it matters: Replicating “all server work” or “every function” would overclaim the platform and blur the safety boundary.
- Source: user
- Primary owning slice: M044/S01
- Supporting slices: M044/S02
- Validation: Validated by M044/S02: declared work/service handlers are the only clustered runtime path, undeclared behavior stays local, and the contract is proved by `m044_s02_declared_work_`, `m044_s02_service_`, `m044_s02_cluster_proof_`, and `bash scripts/verify-m044-s02.sh`.
- Notes: The honest product line is “clustered where declared, ordinary everywhere else.”

### R064 — The runtime owns placement, continuity replication, attempt fencing, authority state, and failover for declared clustered handlers.
- Class: continuity
- Status: validated
- Description: Once a handler is declared clustered, the runtime should decide placement, replicate the continuity record, fence stale attempts, track authority, and apply failover rules without app-authored clustering logic.
- Why it matters: If those mechanics stay in app code, Mesh has not actually become a clustered-app platform.
- Source: user
- Primary owning slice: M044/S02
- Supporting slices: M044/S04
- Validation: Validated by M044/S02+S04 closeout: runtime-owned declared-handler placement/submission/dispatch from S02 plus runtime-owned authority/failover/recovery/fencing from S04, proved by `bash scripts/verify-m044-s02.sh`, `automatic_promotion_`, `automatic_recovery_`, `m044_s04_auto_promotion_`, `m044_s04_auto_resume_`, and the assembled S04/S05 verifiers.
- Notes: This is the runtime-owned execution contract behind the language-owned declaration model.

### R065 — Clustered apps get built-in operator surfaces with runtime API first, CLI second, and HTTP optional.
- Class: admin/support
- Status: validated
- Description: A clustered Mesh app should expose standard operator truth for membership, authority, continuity status, and failover diagnostics through built-in runtime surfaces, with CLI support on top and HTTP exposure only when needed.
- Why it matters: App authors should not have to invent their own operator/debug contract for every clustered app.
- Source: user
- Primary owning slice: M044/S03
- Supporting slices: M044/S05
- Validation: Validated by M044/S03 and carried through S05: runtime-owned transient operator query transport plus `meshc cluster status|continuity|diagnostics --json`, proved by `operator_query_`, `operator_diagnostics_`, `m044_s03_operator_`, `bash scripts/verify-m044-s03.sh`, and the scaffold-first public operator story in S05.
- Notes: The default operator story is runtime API first, CLI second, HTTP optional.

### R066 — `meshc init --clustered` scaffolds a real clustered app that uses only public clustered-app surfaces.
- Class: launchability
- Status: validated
- Description: Mesh should be able to scaffold a clustered app whose business logic uses the public clustered declaration model and built-in operator surfaces without copying `cluster-proof` internals.
- Why it matters: The platform is not productized if the only path is reverse-engineering the proof app.
- Source: user
- Primary owning slice: M044/S03
- Supporting slices: M044/S05
- Validation: Validated by M044/S03: `meshc init --clustered` scaffolds a real clustered app on the public `MESH_*` contract, proved by `test_init_clustered_creates_project`, `m044_s03_scaffold_`, and `bash scripts/verify-m044-s03.sh`; reinforced by S05 docs/closeout.
- Notes: The scaffold should prove the standard config, declaration boundary, and default operator story together.

### R067 — Automatic promotion is auto-only, bounded, epoch/fencing-based, and fail-closed on ambiguity.
- Class: continuity
- Status: validated
- Description: The runtime may automatically promote a standby only when its explicit bounded safety rules are satisfied, and it must not promote when the situation is ambiguous.
- Why it matters: Automatic promotion is only credible if it stays inside a strict fail-closed contract instead of becoming naive timeout-based failover.
- Source: user
- Primary owning slice: M044/S04
- Supporting slices: none
- Validation: Validated by M044/S04: failover is auto-only, bounded, epoch/fencing-based, and manual promotion stays disabled, proved by `automatic_promotion_`, `m044_s04_auto_promotion_`, `m044_s04_manual_surface_`, and `bash scripts/verify-m044-s04.sh`.
- Notes: M044 explicitly excludes any manual promotion or operator override path.

### R068 — Declared clustered handler work survives primary loss through bounded automatic promotion when the runtime can prove the transition is safe.
- Class: continuity
- Status: validated
- Description: A clustered Mesh app should be able to lose the active primary and continue declared clustered work on the standby when the runtime has mirrored state, can advance authority safely, and can fence the stale primary on rejoin.
- Why it matters: This is the concrete product outcome ordinary app authors care about, not just typed APIs or internal runtime state.
- Source: user
- Primary owning slice: M044/S04
- Supporting slices: M044/S05
- Validation: Validated by M044/S04 and replayed in S05: declared clustered work survives primary loss through safe automatic promotion/recovery with stale-primary fencing, proved by `automatic_recovery_`, `m044_s04_auto_resume_`, retained failover artifacts, and `bash scripts/verify-m044-s04.sh` / `bash scripts/verify-m044-s05.sh`.
- Notes: Ambiguous cases should remain unavailable rather than overclaiming failover safety.

### R069 — `cluster-proof` is fully rewritten onto the new clustered-app standard and no longer carries the old explicit clustering path in its code.
- Class: quality-attribute
- Status: validated
- Description: The proof app should consume the same public clustered declaration model, runtime-owned operator surfaces, and bounded auto-promotion contract that ordinary apps use.
- Why it matters: The milestone is not done if the proof app still needs the old internal path to function.
- Source: user
- Primary owning slice: M044/S05
- Supporting slices: M044/S01, M044/S02, M044/S03, M044/S04
- Validation: Validated by M044/S05: `cluster-proof` now uses the public clustered-app `MESH_*` contract directly, the legacy explicit clustering path is gone, and the rewrite is proved by `cargo test -p meshc --test e2e_m044_s05 -- --nocapture`, `cargo run -q -p meshc -- build cluster-proof`, `cargo run -q -p meshc -- test cluster-proof/tests`, `test ! -e cluster-proof/work_legacy.mpl`, and `bash scripts/verify-m044-s05.sh`.
- Notes: This is a full dogfood rewrite, not a compatibility wrapper.

### R070 — The public docs and proof surfaces teach “build a clustered Mesh app” as the primary story.
- Class: launchability
- Status: validated
- Description: Mesh should present clustered apps as a first-class platform capability above the low-level distributed primitives, with docs and verifiers centered on the declared-handler model.
- Why it matters: The product story is still incomplete if users must begin with `cluster-proof` folklore instead of the public clustered-app path.
- Source: user
- Primary owning slice: M044/S05
- Supporting slices: M044/S03
- Validation: Validated by M044/S05: README + distributed/tooling/proof docs now teach `meshc init --clustered` and `meshc cluster` as the primary clustered-app story, proved by `cargo test -p meshc --test e2e_m044_s05 -- --nocapture`, `bash scripts/verify-m044-s05.sh`, and `npm --prefix website run build`.
- Notes: The distributed primitives remain available, but they are no longer the primary onboarding story.

### R051 — Full loss of the active cluster remains survivable through live replication to a standby cluster.
- Class: continuity
- Status: validated
- Description: Mesh should be able to replicate continuity state from an active primary cluster to a standby cluster so that full loss of the primary cluster does not destroy all active request truth.
- Why it matters: This is the user's real end goal for the language's distributed-runtime credibility.
- Source: user
- Primary owning slice: M043/S01
- Supporting slices: M043/S02, M043/S03, M043/S04
- Validation: Validated by M043. S01 proved mirrored primary→standby continuity truth with runtime-owned `cluster_role`, `promotion_epoch`, and `replication_health` on `/membership` and `/work/:request_key`; S02 then passed `bash scripts/verify-m043-s02.sh`, preserving `.tmp/m043-s02/verify/07-failover-artifacts/` that show explicit promotion to epoch 1, runtime-owned attempt rollover on the promoted standby, successful completion there, and fenced/deposed old-primary rejoin. S03 packaged the same contract into the same-image operator rail, and S04 aligned the public/read-only proof surfaces to that shipped failover boundary.
- Notes: M043 closes the bounded local/public disaster-continuity contract for explicit primary/standby failover. Automatic promotion, active-active intake, and destructive hosted failover remain out of scope.

### R045 — Mesh nodes form a cluster automatically through a general discovery seam without manual peer lists.
- Class: core-capability
- Status: validated
- Description: Mesh nodes should be able to discover live peers and form a cluster automatically through a general discovery contract, with DNS-based discovery as the first canonical provider.
- Why it matters: The repo already claims distributed clustering; manual peer lists are not an honest bar for that claim.
- Source: user
- Primary owning slice: M039/S01
- Supporting slices: M039/S04
- Validation: Validated by `bash scripts/verify-m039-s04.sh`, whose `.tmp/m039-s04/verify/05-dns-preflight/` and `06-pre-loss/pre-loss-node-a-membership.json` artifacts prove two nodes formed one cluster automatically from a shared DNS seed without manual peer lists.
- Notes: Fly is only a proof environment; the discovery architecture must stay general.

### R046 — Cluster membership is truthful and updates on join, loss, and rejoin.
- Class: failure-visibility
- Status: validated
- Description: A running Mesh cluster should expose membership state that reflects reality when nodes appear, disappear, partition, and rejoin.
- Why it matters: Fake or laggy membership makes every higher-level balancing or durability claim untrustworthy.
- Source: user
- Primary owning slice: M039/S01
- Supporting slices: M039/S03, M039/S04
- Validation: Validated by the assembled M039 continuity proof: `bash scripts/verify-m039-s03.sh` and `bash scripts/verify-m039-s04.sh` preserve truthful `/membership` artifacts showing join, self-only shrinkage after node loss, and two-node restoration after same-identity rejoin (`.tmp/m039-s04/verify/07-degraded/degraded-node-a-membership.json`, `.tmp/m039-s04/verify/08-post-rejoin/post-rejoin-node-a-membership.json`).
- Notes: This must be rechecked in local and Fly-backed proof environments.

### R047 — Mesh distributes work through runtime-native internal balancing rather than relying on an external front door as the real balancing mechanism.
- Class: differentiator
- Status: validated
- Description: Requests may enter through ordinary HTTP, but the runtime itself must be able to move work across nodes and prove which node accepted and which node executed the work.
- Why it matters: Front-door round robin alone would not prove Mesh is a distributed runtime.
- Source: user
- Primary owning slice: M039/S02
- Supporting slices: M039/S03
- Validation: Validated by `bash scripts/verify-m039-s02.sh` and re-proved by `bash scripts/verify-m039-s04.sh`; the preserved `/work` artifacts show distinct ingress and execution nodes with `routed_remotely=true` before loss and after rejoin (`.tmp/m039-s04/verify/06-pre-loss/pre-loss-work.json`, `.tmp/m039-s04/verify/08-post-rejoin/post-rejoin-work.json`).
- Notes: Public proof must distinguish ingress-node spread from internal work redistribution.

### R048 — A single Mesh cluster survives node failure and clean rejoin without manual repair.
- Class: continuity
- Status: validated
- Description: If an individual node dies or rejoins, the cluster should degrade safely, keep serving new work, and restore healthy membership without manual peer repair steps.
- Why it matters: A cluster that only works on the happy path is not a serious distributed story.
- Source: user
- Primary owning slice: M039/S03
- Supporting slices: M039/S04
- Validation: Validated by `bash scripts/verify-m039-s03.sh`, then re-proved from one image by `bash scripts/verify-m039-s04.sh`; the artifacts show safe self-only degrade after node loss, continued local work acceptance, same-identity rejoin, and restored remote routing without manual repair.
- Notes: This is single-cluster continuity only; cross-cluster disaster recovery is later.

### R053 — Public distributed-language claims are backed by canonical docs, verifiers, and replayable proof surfaces.
- Class: launchability
- Status: validated
- Description: Mesh should only claim what the distributed proof app, local verifiers, and Fly replay can actually prove.
- Why it matters: The current docs/runtime surface is ahead of the app-level proof surface; M039+ must close that gap instead of widening it.
- Source: inferred
- Primary owning slice: M039/S04
- Supporting slices: M041/S03 (provisional)
- Validation: Validated by `bash scripts/verify-m039-s04-proof-surface.sh`, `npm --prefix website run build`, `cluster-proof/README.md`, and `website/docs/docs/distributed-proof/index.md`, which now mechanically tie public distributed claims to the canonical verifier and runbook surfaces.
- Notes: README and distributed docs should reconcile to the canonical proof path when the milestone chain lands.

### R001 — Mesh has an explicit definition of what "production ready language needs to have" means for this repo, and that baseline can be checked through concrete proof rather than vague claims.
- Class: launchability
- Status: validated
- Description: Mesh has an explicit definition of what "production ready language needs to have" means for this repo, and that baseline can be checked through concrete proof rather than vague claims.
- Why it matters: Without a baseline contract, the work turns into an endless feature list and nobody can tell whether Mesh actually became more trustworthy.
- Source: inferred
- Primary owning slice: M028/S01
- Supporting slices: M028/S06
- Validation: validated
- Notes: Validated by the shipped `reference-backend/` package, canonical startup contract, and compiler e2e proof around API + DB + migrations + jobs.

### R002 — Mesh can power a real backend shape with an HTTP API, persistent database state, migrations, and background jobs in one coherent flow.
- Class: core-capability
- Status: validated
- Description: Mesh can power a real backend shape with an HTTP API, persistent database state, migrations, and background jobs in one coherent flow.
- Why it matters: This is the first serious proof target for trusting Mesh for a real production app backend in any capacity.
- Source: user
- Primary owning slice: M028/S01
- Supporting slices: M028/S02, M028/S04, M028/S05, M028/S06
- Validation: validated
- Notes: Validated through live end-to-end verification of `reference-backend/`.

### R003 — The runtime path behind the canonical backend flow is exercised by automated verification strongly enough that the path is not just "implemented," but trusted.
- Class: quality-attribute
- Status: validated
- Description: The runtime path behind the canonical backend flow is exercised by automated verification strongly enough that the path is not just "implemented," but trusted.
- Why it matters: A backend language loses credibility quickly if its basic runtime surfaces only work in isolated or manual scenarios.
- Source: inferred
- Primary owning slice: M028/S02
- Supporting slices: M028/S06
- Validation: validated
- Notes: Validated by live Postgres-backed compiler e2e coverage on the reference backend.

### R004 — Mesh concurrency and supervision are proven under crash, restart, and failure-reporting scenarios instead of only being advertised as features.
- Class: quality-attribute
- Status: validated
- Description: Mesh concurrency and supervision are proven under crash, restart, and failure-reporting scenarios instead of only being advertised as features.
- Why it matters: "Concurrency exists but isn't trustworthy" was an explicit failure state.
- Source: user
- Primary owning slice: M028/S05
- Supporting slices: M028/S02, M028/S06, M028/S07
- Validation: validated
- Notes: Validated by M028/S07 through the live recovery proof path, though the closeout rerun still recorded residual flake in one serial acceptance proof.

### R005 — Mesh's native-binary workflow is proven through a deployment path that feels closer to shipping a Go app than to assembling a fragile language stack.
- Class: launchability
- Status: validated
- Description: Mesh's native-binary workflow is proven through a deployment path that feels closer to shipping a Go app than to assembling a fragile language stack.
- Why it matters: Easier deployment is one of the first ways Mesh should beat Elixir for this repo's target use case.
- Source: user
- Primary owning slice: M028/S04
- Supporting slices: M028/S06
- Validation: validated
- Notes: Validated by the boring native deployment proof for `reference-backend/`.

### R006 — Diagnostics, formatter, LSP, tests, and the coverage story are credible enough that a backend engineer can use Mesh daily without fighting the toolchain.
- Class: quality-attribute
- Status: validated
- Description: Diagnostics, formatter, LSP, tests, and the coverage story are credible enough that a backend engineer can use Mesh daily without fighting the toolchain.
- Why it matters: Better DX is part of the explicit comparison target against Elixir.
- Source: user
- Primary owning slice: M028/S03
- Supporting slices: M030/S01 (provisional), M030/S02 (provisional)
- Validation: validated
- Notes: The toolchain is judged against real backend code, not toy fixtures.

### R007 — Mesh projects have a believable dependency/package workflow for building and shipping backend applications with reproducible inputs.
- Class: launchability
- Status: validated
- Description: Mesh projects have a believable dependency/package workflow for building and shipping backend applications with reproducible inputs.
- Why it matters: A language may have good runtime features and still fail as a serious backend option if dependency flow is rough or confidence-eroding.
- Source: inferred
- Primary owning slice: M030/S01 (provisional)
- Supporting slices: M030/S02 (provisional)
- Validation: `cargo test -p meshc --test e2e_m034_s01 scoped_installed_package_builds -- --nocapture`, `cargo test -p mesh-lsp scoped_installed_package -- --nocapture`, `bash -n scripts/verify-m034-s01.sh`, `rg -n '"your-login/your-package" = "1.0.0"' website/docs/docs/tooling/index.md`, `rg -n 'does not edit mesh.toml|updates mesh.lock' website/docs/docs/tooling/index.md compiler/meshpkg/src/install.rs`, and `set -a && source .env && set +a && bash scripts/verify-m034-s01.sh`
- Notes: Validated by M034/S01 after the real-registry proof closed: scoped installed packages resolve from the natural `.mesh/packages/<owner>/<package>@<version>` cache layout, and the authoritative live verifier now proves publish -> metadata/search/detail -> download checksum -> install -> named-install manifest stability -> `mesh.lock` truth -> consumer build/run -> duplicate publish 409 on the real registry path.

### R008 — Mesh documentation and examples show a production-style backend path and do not rely mainly on toy examples to make the language look ready.
- Class: launchability
- Status: validated
- Description: Mesh documentation and examples show a production-style backend path and do not rely mainly on toy examples to make the language look ready.
- Why it matters: The docs must prove real use, not only advertise features.
- Source: user
- Primary owning slice: M028/S06
- Supporting slices: M028/S01, M028/S03, M028/S04, M028/S05, M028/S07, M028/S08
- Validation: validated
- Notes: Validated through the reconciled production-proof surface.

### R009 — Mesh proves itself through a real reference backend that exercises the language as a backend platform instead of proving subsystems only in isolation.
- Class: differentiator
- Status: validated
- Description: Mesh proves itself through a real reference backend that exercises the language as a backend platform instead of proving subsystems only in isolation.
- Why it matters: Dogfooding is how the repo turns backend ambition into engineering pressure.
- Source: inferred
- Primary owning slice: M028/S06
- Supporting slices: M028/S01, M028/S02, M028/S05, M028/S07
- Validation: validated
- Notes: The reference backend remains the narrow proof target; `mesher/` is the broader pressure test.

### R010 — The project can point to specific ways Mesh is easier to deploy, measurably fast, and nicer for backend development rather than vaguely claiming it is "better than Elixir."
- Class: differentiator
- Status: validated
- Description: The project can point to specific ways Mesh is easier to deploy, measurably fast, and nicer for backend development rather than vaguely claiming it is "better than Elixir."
- Why it matters: The comparison target is clear, but the comparison needs grounded evidence rather than rhetoric.
- Source: user
- Primary owning slice: M032/S05
- Supporting slices: M028/S04, M028/S06
- Validation: Validated by the M028 native deploy proof plus the M032 closeout bundle: `bash scripts/verify-m032-s01.sh`, `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`, `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, and `cargo run -q -p meshc -- build mesher`, with the retained-limit ledger tying supported Mesher dogfood wins to honest remaining boundaries.
- Notes: M028 established the easier-deploy anchor through the boring native deployment proof; M032 closes the backend-development differentiator claim with current Mesher dogfood evidence instead of vague comparison language. M033 can deepen the data layer, but it no longer blocks this requirement.

### R011 — New language/runtime work after M028 should come from real backend friction discovered while using Mesh for actual backend code.
- Class: differentiator
- Status: validated
- Description: New language/runtime work after M028 should come from real backend friction discovered while using Mesh for actual backend code.
- Why it matters: This keeps the project from chasing clever language features that do not improve the target use case.
- Source: user
- Primary owning slice: M032/S01
- Supporting slices: M032/S02, M032/S03, M032/S04, M032/S05
- Validation: Validated by the M032 slice chain plus the final S05 replay: `bash scripts/verify-m032-s01.sh`, `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`, `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and the retained keep-site sweep over the real Mesher files.
- Notes: Validated by the full M032 dogfood wave: the language/runtime/tooling work came directly from Mesher pressure sites (inferred exports, request/handler cleanup, module-boundary JSON truth, and the final retained-limit ledger) instead of speculative language design.

### R013 — A blocking Mesh language/runtime/tooling limitation is not worked around indefinitely; it is fixed in Mesh and then used in mesher.
- Class: constraint
- Status: validated
- Description: A blocking Mesh language/runtime/tooling limitation is not worked around indefinitely; it is fixed in Mesh and then used in mesher.
- Why it matters: `mesher/` is a dogfooding vehicle as well as an application.
- Source: user
- Primary owning slice: M032/S02
- Supporting slices: M032/S03, M032/S04, M032/S05
- Validation: Validated by `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`, the `xmod_identity` cross-module repro inside that test, `bash scripts/verify-m032-s01.sh`, `cargo run -q -p meshc -- fmt --check mesher`, and `cargo run -q -p meshc -- build mesher` after moving `flush_batch` into `mesher/storage/writer.mpl` and importing it from `mesher/services/writer.mpl`.
- Notes: M032/S02 fixed the unconstrained inferred-export lowering bug in Mesh, replayed the old `xmod_identity` repro as a success path, dogfooded the repaired module-boundary export from mesher, and S05 closed the milestone with the integrated replay plus retained-limit ledger so the fix stays visible as current proof.

### R015 — `else if` chains produce the correct branch value instead of returning garbage or crashing on certain types.
- Class: core-capability
- Status: validated
- Description: `else if` chains produce the correct branch value instead of returning garbage or crashing on certain types.
- Why it matters: Silent wrong-value bugs in basic control flow undermine all language trust.
- Source: execution
- Primary owning slice: M031/S01
- Supporting slices: none
- Validation: validated
- Notes: Fixed by storing the resolved type in `infer_if`; backed by dedicated e2e coverage.

### R016 — Control-flow conditions ending in function calls parse correctly without workaround bindings.
- Class: core-capability
- Status: validated
- Description: Control-flow conditions ending in function calls parse correctly without workaround bindings.
- Why it matters: The old behavior forced awkward temporary variables and boolean comparison noise.
- Source: execution
- Primary owning slice: M031/S01
- Supporting slices: none
- Validation: validated
- Notes: Fixed with parser context suppression for trailing closures in condition positions.

### R017 — Multiline function calls resolve to the correct type instead of collapsing to `()`.
- Class: core-capability
- Status: validated
- Description: Multiline function calls resolve to the correct type instead of collapsing to `()`.
- Why it matters: Formatting long calls should not change semantics.
- Source: execution
- Primary owning slice: M031/S01
- Supporting slices: none
- Validation: validated
- Notes: Fixed in the AST layer by filtering trivia tokens in multiline literals.

### R018 — Parenthesized multiline imports parse into the same AST shape as flat imports.
- Class: quality-attribute
- Status: validated
- Description: Parenthesized multiline imports parse into the same AST shape as flat imports.
- Why it matters: Long import lines were unreadable and a recurring dogfood pain point.
- Source: user
- Primary owning slice: M031/S02
- Supporting slices: none
- Validation: validated
- Notes: Parser and e2e coverage prove single-line, multiline, and trailing-comma import groups.

### R019 — `fn_call(a, b, c,)` and multiline trailing-comma call formatting work correctly.
- Class: quality-attribute
- Status: validated
- Description: `fn_call(a, b, c,)` and multiline trailing-comma call formatting work correctly.
- Why it matters: This is basic multiline ergonomics and diff hygiene.
- Source: inferred
- Primary owning slice: M031/S02
- Supporting slices: none
- Validation: validated
- Notes: Backed by parser, formatter, and dedicated e2e coverage.

### R023 — `reference-backend/` has zero `let _ =` side-effect bindings, no `== true` noise, struct update syntax, and idiomatic pipe usage.
- Class: quality-attribute
- Status: validated
- Description: `reference-backend/` has zero `let _ =` side-effect bindings, no `== true` noise, struct update syntax, and idiomatic pipe usage.
- Why it matters: The reference backend is the primary proof surface and should model good Mesh code.
- Source: user
- Primary owning slice: M031/S03
- Supporting slices: none
- Validation: validated
- Notes: Proven by grep gates plus build, formatter, project tests, and e2e verification.

### R024 — `mesher/` has zero `let _ =` side-effect bindings, interpolation where appropriate, multiline imports, and idiomatic pipe usage.
- Class: quality-attribute
- Status: validated
- Description: `mesher/` has zero `let _ =` side-effect bindings, interpolation where appropriate, multiline imports, and idiomatic pipe usage.
- Why it matters: `mesher/` is the broader dogfood app and should reflect real language usability.
- Source: user
- Primary owning slice: M029/S02
- Supporting slices: M029/S01, M029/S03
- Validation: validated
- Notes: Validated by grep gates plus `meshc fmt --check mesher` and `meshc build mesher`.

### R025 — The suite covers bare expression statements, fn-call control-flow conditions, multiline calls/imports, trailing commas, service-handler struct updates, and related dogfood patterns.
- Class: quality-attribute
- Status: validated
- Description: The suite covers bare expression statements, fn-call control-flow conditions, multiline calls/imports, trailing commas, service-handler struct updates, and related dogfood patterns.
- Why it matters: These patterns had little or no regression coverage before the M031 wave.
- Source: user
- Primary owning slice: M031/S05
- Supporting slices: M031/S01, M031/S02
- Validation: validated
- Notes: Full suite baseline is 328 tests with the known try-family failures explicitly tracked in project knowledge.

### R026 — Formatter output keeps `Api.Router` intact and does not collapse or corrupt multiline import groups.
- Class: quality-attribute
- Status: validated
- Description: Formatter output keeps `Api.Router` intact and does not collapse or corrupt multiline import groups.
- Why it matters: Formatter corruption destroys trust quickly and blocks dogfood cleanup.
- Source: execution
- Primary owning slice: M029/S01
- Supporting slices: none
- Validation: validated
- Notes: Backed by formatter library tests, exact-output CLI tests, and clean `fmt --check` runs on both dogfood codebases.

### R027 — `reference-backend/` source files keep canonical dotted module paths and stay formatter-clean.
- Class: quality-attribute
- Status: validated
- Description: `reference-backend/` source files keep canonical dotted module paths and stay formatter-clean.
- Why it matters: Formatter-induced import corruption in the primary backend proof surface undermines tooling trust.
- Source: execution
- Primary owning slice: M029/S01
- Supporting slices: none
- Validation: validated
- Notes: Proven by repaired source plus `fmt --check reference-backend` and dot-path grep gates.

### R035 — Comments in `mesher/` that claim a Mesh limitation or workaround must reflect current verified reality, not stale folklore.
- Class: quality-attribute
- Status: validated
- Description: Comments in `mesher/` that claim a Mesh limitation or workaround must reflect current verified reality, not stale folklore.
- Why it matters: Stale limitation comments make Mesh look weaker than it is and hide the real regression surface.
- Source: execution
- Primary owning slice: M032/S01
- Supporting slices: M032/S03, M032/S04, M032/S05, M032/S06
- Validation: Validated by the named `e2e_m032_*` proofs, `bash scripts/verify-m032-s01.sh`, Mesher fmt/build, the negative grep over stale disproven limitation phrases, the positive grep over the retained keep-sites in `mesher/ingestion/routes.mpl`, `mesher/services/stream_manager.mpl`, `mesher/services/writer.mpl`, `mesher/ingestion/pipeline.mpl`, `mesher/services/event_processor.mpl`, `mesher/ingestion/fingerprint.mpl`, `mesher/services/retention.mpl`, `mesher/api/team.mpl`, `mesher/storage/queries.mpl`, `mesher/storage/writer.mpl`, `mesher/migrations/20260216120000_create_initial_schema.mpl`, `mesher/types/event.mpl`, and `mesher/types/issue.mpl`, plus the backfilled `.gsd/milestones/M032/slices/S01/S01-UAT.md` acceptance artifact that now replays the current proof bundle instead of a placeholder.
- Notes: S01 classified the stale-vs-real workaround families, S03 and S04 retired the disproven request/handler/control-flow and module-boundary JSON folklore, S05 closed the requirement with a short retained-limit ledger plus integrated proof replay, and S06 backfilled the missing S01 acceptance artifact so the limitation-truth proof stays replayable from the slice artifacts themselves.

### R036 — The ORM and migration surfaces should keep a neutral baseline API while allowing explicit PG or SQLite extras when the underlying capability is not honestly portable.
- Class: core-capability
- Status: validated
- Description: The ORM and migration surfaces should keep a neutral baseline API while allowing explicit PG or SQLite extras when the underlying capability is not honestly portable.
- Why it matters: Fake portability preserves raw SQL and hides capability boundaries instead of making them explicit.
- Source: user
- Primary owning slice: M033/S01
- Supporting slices: M033/S02, M033/S04
- Validation: Validated by the assembled M033 neutral-plus-explicit-extra proof set: `cargo test -p meshc --test e2e_m033_s01 expr_ -- --nocapture`, `cargo test -p meshc --test e2e_m033_s01 mesher_mutations -- --nocapture`, `cargo test -p meshc --test e2e_m033_s01 mesher_issue_upsert -- --nocapture`, `cargo test -p meshc --test e2e_m033_s02 -- --nocapture`, `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, `bash scripts/verify-m033-s01.sh`, `bash scripts/verify-m033-s02.sh`, and `bash scripts/verify-m033-s04.sh`.
- Notes: Validated through the shipped neutral `Expr` / `Query` / `Repo` core plus explicit `Pg` query/schema helpers on the real Mesher path. Neutral `Migration.create_index(...)` only grew honest name/order/partial support, while PostgreSQL-only schema behavior (extensions, partitioned parents, GIN/opclass indexes, and runtime partition lifecycle) stayed under `Pg` instead of leaking into the baseline API.

### R037 — Mesh should expose PG-specific query and migration surfaces for the cases `mesher/` actually needs today: JSONB-heavy data access, expression-heavy updates, full-text search, crypto helpers, and partition-related DDL.
- Class: integration
- Status: validated
- Description: Mesh should expose PG-specific query and migration surfaces for the cases `mesher/` actually needs today: JSONB-heavy data access, expression-heavy updates, full-text search, crypto helpers, and partition-related DDL.
- Why it matters: Mesher's current escape hatches are concentrated in real PostgreSQL features, not generic SQL.
- Source: execution
- Primary owning slice: M033/S02
- Supporting slices: M033/S03, M033/S04
- Validation: Validated by `cargo test -p meshc --test e2e_m033_s02 -- --nocapture`, `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, `bash scripts/verify-m033-s02.sh`, and `bash scripts/verify-m033-s04.sh`.
- Notes: Validated by the combined S02+S04 PG-extra proof path: Mesh now exposes explicit PostgreSQL helpers on the real Mesher path for pgcrypto auth, JSONB insert/filter/breakdown/defaulting, full-text search ranking/query binding, helper-driven range-partitioned schema setup, GIN/jsonb_path_ops indexes, and runtime partition create/list/drop behavior proven against live catalogs and Mesher startup.

### R038 — After M033, `mesher/` should use stronger Mesh ORM and migration surfaces for the cases they honestly cover, while retaining only a short justified keep-list of raw SQL and DDL escape hatches.
- Class: quality-attribute
- Status: validated
- Description: After M033, `mesher/` should use stronger Mesh ORM and migration surfaces for the cases they honestly cover, while retaining only a short justified keep-list of raw SQL and DDL escape hatches.
- Why it matters: The goal is a better platform and cleaner dogfood, not a purity metric that damages the app or the API.
- Source: user
- Primary owning slice: M033/S03 (provisional)
- Supporting slices: M033/S04, M033/S05 (provisional)
- Validation: Validated by `npm --prefix website run build`, `bash scripts/verify-m033-s05.sh`, the exact-string docs-truth sweep over `website/docs/docs/databases/index.md`, and the serial replay of `bash scripts/verify-m033-s02.sh`, `bash scripts/verify-m033-s03.sh`, and `bash scripts/verify-m033-s04.sh`, which together prove the public contract, the explicit `Pg.*` boundary, and the short named raw SQL/DDL keep-list stay honest.
- Notes: Advanced through the S03 honest raw-read keep-list plus the S04 helper-driven migration/runtime partition collapse. `scripts/verify-m033-s03.sh` no longer exempts the old S04 partition/catalog helpers, and `scripts/verify-m033-s04.sh` now mechanically bans raw DDL/query regressions in the owned migration/runtime files while requiring the expected `Pg.*` and `Storage.Schema` helper boundaries.

### R039 — Mesh migrations should cover the recurring schema and partition-management cases that force `mesher/` into raw DDL today, with explicit extras where needed.
- Class: launchability
- Status: validated
- Description: Mesh migrations should cover the recurring schema and partition-management cases that force `mesher/` into raw DDL today, with explicit extras where needed.
- Why it matters: DDL gaps push real apps into hand-written SQL even when the patterns are common and stable.
- Source: user
- Primary owning slice: M033/S04 (provisional)
- Supporting slices: M033/S02 (provisional)
- Validation: Validated by `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and `bash scripts/verify-m033-s04.sh`.
- Notes: Validated by the helper-driven Mesher schema path: the initial migration now uses neutral `Migration.*` helpers for honest portable cases plus explicit `Pg.*` helpers for `pgcrypto`, the partitioned `events` parent, and the `idx_events_tags` GIN/jsonb_path_ops index, while runtime retention/startup partition lifecycle moved into `Storage.Schema` over `Pg.create_daily_partitions_ahead`, `Pg.list_daily_partitions_before`, and `Pg.drop_partition`. Catalog inspection and truly dynamic DDL can still remain explicit escape hatches when a dedicated surface would be dishonest or overly specific.

## Deferred

### R012 — Mesh should continue from the reference-backend and mesher proof surfaces toward broader backend forms like long-running services, realtime systems, and distributed backends.
- Class: core-capability
- Status: deferred
- Description: Mesh should continue from the reference-backend and mesher proof surfaces toward broader backend forms like long-running services, realtime systems, and distributed backends.
- Why it matters: The long-term vision is broader than one app shape.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred behind the M032/M033 dogfood truth and data-layer work.

### R014 — The creator-token treasury and fund product loop remains part of the broader repo backlog but is not part of the current Mesh platform milestone sequence.
- Class: constraint
- Status: deferred
- Description: The creator-token treasury and fund product loop remains part of the broader repo backlog but is not part of the current Mesh platform milestone sequence.
- Why it matters: It keeps the current planning wave focused on Mesh and dogfood credibility instead of splitting attention across two unrelated fronts.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: The older product draft milestones remain deferred while the repo focus stays on Mesh maturity.

### R020 — Mesh eventually offers a stronger debugger/profiler/trace surface suitable for deeper production diagnostics.
- Class: operability
- Status: deferred
- Description: Mesh eventually offers a stronger debugger/profiler/trace surface suitable for deeper production diagnostics.
- Why it matters: Mature backend ecosystems are judged heavily on observability and debugging, but this should not swallow the current dogfood wave.
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred until the current trust and data-layer work lands.

### R021 — Registry, publishing flow, package trust, and ecosystem polish should rise from credible to mature.
- Class: admin/support
- Status: deferred
- Description: Registry, publishing flow, package trust, and ecosystem polish should rise from credible to mature.
- Why it matters: It matters for adoption, but it should not displace the present dogfood and ORM pressure work.
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: M030 keeps the nearer-term package and tooling trust work active.

### R022 — Operators eventually get richer admin controls, manual retries, and deeper operational tooling.
- Class: operability
- Status: deferred
- Description: Operators eventually get richer admin controls, manual retries, and deeper operational tooling.
- Why it matters: It improves long-term operability once the core platform and data-path ergonomics are stronger.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Day-one requirement is failure visibility and trustworthy dogfood, not a full operator cockpit.

### R041 — SQLite-specific ORM and migration extras should be implemented after the neutral core and PG extras are proven on real pressure.
- Class: integration
- Status: deferred
- Description: SQLite-specific ORM and migration extras should be implemented after the neutral core and PG extras are proven on real pressure.
- Why it matters: The design should leave a clean SQLite path, but current implementation pressure is coming from Postgres-backed mesher work.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: M033 should shape the extension points so this later work is straightforward.

### R054 — Additional discovery providers beyond the DNS-first provider should remain possible once the core distributed proof path is established.
- Class: admin/support
- Status: deferred
- Description: Mesh should remain open to later discovery adapters such as seed-node, gossip, or control-plane-backed discovery after the DNS-first proof path is real.
- Why it matters: The user wants general architecture, but the first milestone should prove one provider well instead of pretending all discovery modes are equally mature.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: The first wave should prove the abstraction seam and the DNS provider, not every future adapter.

### R055 — Active-active request intake across clusters may be added later after active-primary disaster continuity is proven.
- Class: operability
- Status: deferred
- Description: Mesh may later accept and coordinate work intake across multiple active clusters, but this is not the first disaster-recovery proof target.
- Why it matters: It is a materially larger consistency and routing problem than active-primary with standby replication.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: The first honest disaster shape is primary with live replication to standby.

### R056 — Stronger exactly-once completion semantics may be explored later if the at-least-once idempotent model proves insufficient.
- Class: continuity
- Status: deferred
- Description: The platform may later pursue stronger exactly-once visible completion semantics, but the first truthful target is at-least-once with idempotent completion.
- Why it matters: Exactly-once claims are easy to overstate and would distort the initial continuity milestone if brought forward too early.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Current user direction explicitly accepted at-least-once plus idempotency for the first honest design.


### R071 — Clustered apps may later gain richer operator controls beyond the built-in inspection and diagnostics surfaces.
- Class: admin/support
- Status: deferred
- Description: Mesh may later add broader operator controls, richer remediation tools, or a deeper clustered-app admin cockpit once the core clustered model is productized.
- Why it matters: It is useful later, but it should not displace the core declaration/runtime/failover contract in M044.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: M044 focuses on truthful inspection, diagnostics, and bounded automatic failover.

### R072 — Mesh may later support broader failover topologies than one active primary plus one standby.
- Class: operability
- Status: deferred
- Description: Mesh may later expand beyond the bounded primary/standby model once the first clustered-app execution model is proven honestly.
- Why it matters: Wider failover topologies materially change the authority and safety story and should not be smuggled into M044.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: M044 stays strictly inside the one-primary/one-standby topology.

### R082 — Hosted and same-image operator rails may remain as deeper proof surfaces after the simple clustered example is cleaned up.
- Class: admin/support
- Status: deferred
- Description: Mesh may continue to ship deeper Docker/Fly/operator proof rails for clustered apps, but those should remain secondary to the simple local language-owned example.
- Why it matters: The simple example should be the primary teaching surface without forcing the repo to delete deeper proof and operator verification paths that still provide confidence.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: This preserves room for deeper verifier and deployment surfaces without making them the primary docs story.

### R094 — A general-purpose decorator or annotation system beyond clustered-work declaration can wait until the clustered decorator shape is proven.
- Class: core-capability
- Status: deferred
- Description: Mesh may later generalize decorators/annotations beyond clustered-work declaration, but M046 only needs the decorator shape required to mark clustered work in source.
- Why it matters: A broad annotation system would widen the milestone and risk turning an example-truth milestone into a general language-design sprint.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Prove the clustered-work decorator first; generalize later only if the shape holds up.

### R107 — The scaffold may grow into broader production surfaces later, but M047 does not need to include auth, external integrations, or a heavier app platform.
- Class: launchability
- Status: deferred
- Description: Broader production surfaces such as auth, external services, admin panels, or richer platform features can be added later if the simpler clustered Todo starting point proves insufficient.
- Why it matters: The current milestone is about making the clustering syntax obvious and usable, not about shipping a mini-platform in one scaffold.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: SQLite stays in scope for M047; heavier production concerns are deferred.

### R108 — Additional route ergonomics beyond the first wrapper form can wait until real usage shows they are necessary.
- Class: admin/support
- Status: deferred
- Description: Broader route-decorator shapes or verb-specific clustered helpers can be revisited later if the first wrapper form still feels awkward in practice.
- Why it matters: The first honest step is one elegant wrapper surface, not an explosion of API variants before users have experience with it.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: M047 should prove the wrapper form before designing a bigger route-annotation family.

## Out of Scope

### R030 — The current planning wave is not a frontend-first language push.
- Class: anti-feature
- Status: out-of-scope
- Description: The current planning wave is not a frontend-first language push.
- Why it matters: This prevents scope confusion and preserves the explicit backend bias from the discussion.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Mesh remains general-purpose, but the proof and planning direction are backend-led.

### R031 — M032 should not turn into a wide language-design sweep unrelated to proven mesher blockers.
- Class: anti-feature
- Status: out-of-scope
- Description: M032 should not turn into a wide language-design sweep unrelated to proven mesher blockers.
- Why it matters: This keeps the milestone honest and dogfood-driven.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: New syntax or broad semantics changes need a stronger justification than a stale comment.

### R032 — The repo will not claim production readiness based only on feature lists, benchmarks, or toy examples.
- Class: constraint
- Status: out-of-scope
- Description: The repo will not claim production readiness based only on feature lists, benchmarks, or toy examples.
- Why it matters: This blocks exactly the weak proof mode the project rejects.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Honest proof remains non-negotiable.

### R033 — Native mobile is not part of the current Mesh platform milestone sequence.
- Class: constraint
- Status: out-of-scope
- Description: Native mobile is not part of the current Mesh platform milestone sequence.
- Why it matters: It keeps attention on the backend and dogfood platform surfaces.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Web and backend flows remain the primary proof surfaces.

### R034 — M033 should not chase broad generic data-layer abstractions that do not retire a real pressure point from `mesher/`.
- Class: anti-feature
- Status: out-of-scope
- Description: M033 should not chase broad generic data-layer abstractions that do not retire a real pressure point from `mesher/`.
- Why it matters: Over-generalizing the ORM would make the API worse while still missing the real dogfood gaps.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The right bar is honest pressure coverage, not a giant clever DSL.

### R043 — The success bar is pragmatic reduction with a justified keep-list, not raw-SQL purity.
- Class: anti-feature
- Status: out-of-scope
- Description: The success bar is pragmatic reduction with a justified keep-list, not raw-SQL purity.
- Why it matters: A fake zero target would incentivize dishonest abstractions and brittle rewrites.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Remaining escape hatches should be short, named, and justified.

### R044 — `mesher/` should remain behaviorally stable from the product point of view while the platform underneath it improves.
- Class: constraint
- Status: out-of-scope
- Description: `mesher/` should remain behaviorally stable from the product point of view while the platform underneath it improves.
- Why it matters: This keeps the milestones focused on Mesh and data-layer capability rather than smuggling in a product redesign.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Narrow app changes are acceptable only when required to dogfood the repaired or expanded platform path.

### R057 — Mesh will not claim generic consensus-backed global state for arbitrary application data in this planning wave.
- Class: anti-feature
- Status: out-of-scope
- Description: The distributed-runtime milestones should not quietly expand into a general-purpose consensus platform for all application data.
- Why it matters: That would sprawl the work, blur the proof target, and encourage fake-complete claims.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The target is truthful clustered work routing and continuity, not a universal distributed database.

### R058 — The project will not claim durability when no surviving replica exists anywhere.
- Class: constraint
- Status: out-of-scope
- Description: If every replica holding the continuity state is gone, Mesh should not pretend the request truth still exists.
- Why it matters: This is the hard honesty boundary for a no-external-store design.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Disaster continuity depends on surviving replicas, not magic resurrection.

### R059 — Front-door HTTP spreading alone does not count as proof of Mesh runtime-native balancing.
- Class: anti-feature
- Status: out-of-scope
- Description: External request distribution by a proxy or platform is not sufficient evidence that Mesh itself is balancing work across nodes.
- Why it matters: The user explicitly rejected that weaker proof mode.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The proof app must show ingress-node truth separately from execution-node truth.

### R060 — Fly-specific clustering behavior is not the architecture.
- Class: constraint
- Status: out-of-scope
- Description: Fly may be used as a real proof environment, but the discovery and runtime design must not collapse into Fly-only assumptions.
- Why it matters: The user wants Fly as one deployment target, not as the definition of Mesh distribution.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: DNS is the first provider because it generalizes beyond Fly.


### R073 — M044 will not ship a manual promotion or operator-override failover path.
- Class: anti-feature
- Status: out-of-scope
- Description: The first-class clustered-app model will not expose a manual promotion boundary in M044.
- Why it matters: The user explicitly wants automatic promotion when safe and fail-closed behavior otherwise, not a fallback manual override surface.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: If the runtime cannot prove promotion is safe, it must not promote.

### R074 — M044 will not claim active-active writes or general replicated application state.
- Class: anti-feature
- Status: out-of-scope
- Description: The clustered-app platform will not claim that arbitrary app state or active-active writes are replicated safely across nodes.
- Why it matters: That would turn the milestone into a much larger distributed-state system than the user asked for.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The target is declared clustered handlers with continuity records, not universal replicated app state.

### R075 — M044 will not introduce a consensus-backed global control plane or arbitrary distributed transactions.
- Class: anti-feature
- Status: out-of-scope
- Description: The clustered-app model will not expand into quorum-managed global state, general elections, or arbitrary distributed transaction semantics.
- Why it matters: The user explicitly wants bounded automatic failover, not a consensus platform.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Automatic promotion must stay bounded, epoch-based, and fail-closed.

### R076 — M044 will not claim exactly-once execution semantics.
- Class: anti-feature
- Status: out-of-scope
- Description: Mesh will not claim exactly-once completion or side-effect semantics for clustered work in this milestone.
- Why it matters: Exactly-once claims would overstate what the current continuity model can prove honestly.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The honest target remains at-least-once with idempotent completion.

### R083 — M045 will not expand the clustered model into a broader active-active balancing or new consensus feature set.
- Class: anti-feature
- Status: out-of-scope
- Description: The example-simplification milestone will not quietly turn into a new distributed-systems feature wave beyond the existing clustered-app runtime contract.
- Why it matters: The goal is to make the current language-owned clustered model simple and honest, not to smuggle in a larger active-active or consensus platform redesign.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: If broader balancing or consensus work is needed later, it should land as a separate milestone with its own proof bar.

### R084 — M045 will not preserve example-side distributed mechanics just to keep the old proof-app structure intact.
- Class: constraint
- Status: out-of-scope
- Description: Example-owned bootstrap, placement, failover, routing, or status layers should not survive merely because the old proof app happened to grow them.
- Why it matters: This milestone exists specifically to stop the example from helping the runtime do distributed work.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The cleanup bar is language/runtime ownership, not compatibility with legacy proof-app shape.

### R095 — M046 will not invent stronger distributed guarantees just to make the tiny proofs look more magical.
- Class: anti-feature
- Status: out-of-scope
- Description: M046 will not claim new consensus, active-active, or stronger delivery semantics unless the runtime truly proves them as part of the work.
- Why it matters: The user wants honesty first; fake simplicity through overstated guarantees would make the new proofs worse than the old ones.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: M046 is allowed to improve runtime ownership, not to overclaim a broader distributed model.

### R096 — M046 will not preserve legacy `cluster-proof` HTTP or operator routes just for compatibility with the old proof package shape.
- Class: constraint
- Status: out-of-scope
- Description: Route-based proof and operator surfaces in `cluster-proof` should not survive merely to preserve the old package contract once runtime/tooling-owned proof exists.
- Why it matters: The user explicitly asked for a route-free proof app where everything except clustered-work declaration is handled by the language/runtime.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: If route-free runtime/tooling proof is insufficient, M046 should improve Mesh rather than keep legacy routes.

### R109 — `mesh.toml` will not remain a second clustered declaration surface in the new public model.
- Class: anti-feature
- Status: out-of-scope
- Description: M047 will not preserve or redesign manifest-based clustered declarations as a coequal way to declare clustering.
- Why it matters: This prevents the milestone from solving the syntax problem while quietly keeping the duplicate-surface problem.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The clustering model is source-first after this milestone.

### R110 — Mesh will not keep `clustered(work)` as a long-term coequal public syntax.
- Class: anti-feature
- Status: out-of-scope
- Description: The old `clustered(work)` syntax is not meant to survive as an equal public option after the new `@cluster` model lands.
- Why it matters: This prevents a soft migration that leaves the language surface permanently cluttered.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Historical compatibility can be handled during execution if needed, but it is not part of the desired end state.

### R111 — Mesh will not make clustering fully implicit for arbitrary code paths without an explicit clustered function or route wrapper boundary.
- Class: constraint
- Status: out-of-scope
- Description: M047 will not claim that Mesh can infer distributed intent from arbitrary normal code without either `@cluster` or a clustered route wrapper boundary.
- Why it matters: This prevents the new route story from becoming magical in a way that is hard to reason about or verify honestly.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The explicit boundary is the clustered function or clustered route handler.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | launchability | validated | M028/S01 | M028/S06 | validated |
| R002 | core-capability | validated | M028/S01 | M028/S02, M028/S04, M028/S05, M028/S06 | validated |
| R003 | quality-attribute | validated | M028/S02 | M028/S06 | validated |
| R004 | quality-attribute | validated | M028/S05 | M028/S02, M028/S06, M028/S07 | validated |
| R005 | launchability | validated | M028/S04 | M028/S06 | validated |
| R006 | quality-attribute | validated | M028/S03 | M030/S01 (provisional), M030/S02 (provisional) | validated |
| R007 | launchability | validated | M030/S01 (provisional) | M030/S02 (provisional) | `cargo test -p meshc --test e2e_m034_s01 scoped_installed_package_builds -- --nocapture`, `cargo test -p mesh-lsp scoped_installed_package -- --nocapture`, `bash -n scripts/verify-m034-s01.sh`, `rg -n '"your-login/your-package" = "1.0.0"' website/docs/docs/tooling/index.md`, `rg -n 'does not edit mesh.toml|updates mesh.lock' website/docs/docs/tooling/index.md compiler/meshpkg/src/install.rs`, and `set -a && source .env && set +a && bash scripts/verify-m034-s01.sh` |
| R008 | launchability | validated | M028/S06 | M028/S01, M028/S03, M028/S04, M028/S05, M028/S07, M028/S08 | validated |
| R009 | differentiator | validated | M028/S06 | M028/S01, M028/S02, M028/S05, M028/S07 | validated |
| R010 | differentiator | validated | M032/S05 | M028/S04, M028/S06 | Validated by the M028 native deploy proof plus the M032 closeout bundle: `bash scripts/verify-m032-s01.sh`, `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`, `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, and `cargo run -q -p meshc -- build mesher`, with the retained-limit ledger tying supported Mesher dogfood wins to honest remaining boundaries. |
| R011 | differentiator | validated | M032/S01 | M032/S02, M032/S03, M032/S04, M032/S05 | Validated by the M032 slice chain plus the final S05 replay: `bash scripts/verify-m032-s01.sh`, `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`, `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`, `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and the retained keep-site sweep over the real Mesher files. |
| R012 | core-capability | deferred | none | none | unmapped |
| R013 | constraint | validated | M032/S02 | M032/S03, M032/S04, M032/S05 | Validated by `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`, the `xmod_identity` cross-module repro inside that test, `bash scripts/verify-m032-s01.sh`, `cargo run -q -p meshc -- fmt --check mesher`, and `cargo run -q -p meshc -- build mesher` after moving `flush_batch` into `mesher/storage/writer.mpl` and importing it from `mesher/services/writer.mpl`. |
| R014 | constraint | deferred | none | none | unmapped |
| R015 | core-capability | validated | M031/S01 | none | validated |
| R016 | core-capability | validated | M031/S01 | none | validated |
| R017 | core-capability | validated | M031/S01 | none | validated |
| R018 | quality-attribute | validated | M031/S02 | none | validated |
| R019 | quality-attribute | validated | M031/S02 | none | validated |
| R020 | operability | deferred | none | none | unmapped |
| R021 | admin/support | deferred | none | none | unmapped |
| R022 | operability | deferred | none | none | unmapped |
| R023 | quality-attribute | validated | M031/S03 | none | validated |
| R024 | quality-attribute | validated | M029/S02 | M029/S01, M029/S03 | validated |
| R025 | quality-attribute | validated | M031/S05 | M031/S01, M031/S02 | validated |
| R026 | quality-attribute | validated | M029/S01 | none | validated |
| R027 | quality-attribute | validated | M029/S01 | none | validated |
| R030 | anti-feature | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |
| R032 | constraint | out-of-scope | none | none | n/a |
| R033 | constraint | out-of-scope | none | none | n/a |
| R034 | anti-feature | out-of-scope | none | none | n/a |
| R035 | quality-attribute | validated | M032/S01 | M032/S03, M032/S04, M032/S05, M032/S06 | Validated by the named `e2e_m032_*` proofs, `bash scripts/verify-m032-s01.sh`, Mesher fmt/build, the negative grep over stale disproven limitation phrases, the positive grep over the retained keep-sites in `mesher/ingestion/routes.mpl`, `mesher/services/stream_manager.mpl`, `mesher/services/writer.mpl`, `mesher/ingestion/pipeline.mpl`, `mesher/services/event_processor.mpl`, `mesher/ingestion/fingerprint.mpl`, `mesher/services/retention.mpl`, `mesher/api/team.mpl`, `mesher/storage/queries.mpl`, `mesher/storage/writer.mpl`, `mesher/migrations/20260216120000_create_initial_schema.mpl`, `mesher/types/event.mpl`, and `mesher/types/issue.mpl`, plus the backfilled `.gsd/milestones/M032/slices/S01/S01-UAT.md` acceptance artifact that now replays the current proof bundle instead of a placeholder. |
| R036 | core-capability | validated | M033/S01 | M033/S02, M033/S04 | Validated by the assembled M033 neutral-plus-explicit-extra proof set: `cargo test -p meshc --test e2e_m033_s01 expr_ -- --nocapture`, `cargo test -p meshc --test e2e_m033_s01 mesher_mutations -- --nocapture`, `cargo test -p meshc --test e2e_m033_s01 mesher_issue_upsert -- --nocapture`, `cargo test -p meshc --test e2e_m033_s02 -- --nocapture`, `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, `bash scripts/verify-m033-s01.sh`, `bash scripts/verify-m033-s02.sh`, and `bash scripts/verify-m033-s04.sh`. |
| R037 | integration | validated | M033/S02 | M033/S03, M033/S04 | Validated by `cargo test -p meshc --test e2e_m033_s02 -- --nocapture`, `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, `bash scripts/verify-m033-s02.sh`, and `bash scripts/verify-m033-s04.sh`. |
| R038 | quality-attribute | validated | M033/S03 (provisional) | M033/S04, M033/S05 (provisional) | Validated by `npm --prefix website run build`, `bash scripts/verify-m033-s05.sh`, the exact-string docs-truth sweep over `website/docs/docs/databases/index.md`, and the serial replay of `bash scripts/verify-m033-s02.sh`, `bash scripts/verify-m033-s03.sh`, and `bash scripts/verify-m033-s04.sh`, which together prove the public contract, the explicit `Pg.*` boundary, and the short named raw SQL/DDL keep-list stay honest. |
| R039 | launchability | validated | M033/S04 (provisional) | M033/S02 (provisional) | Validated by `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and `bash scripts/verify-m033-s04.sh`. |
| R040 | constraint | active | M033/S01 (provisional) | M033/S02 (provisional) | Design seam advanced by the combined M033/S01+S04 proof set: `bash scripts/verify-m033-s01.sh`, `cargo test -p meshc --test e2e_m033_s04 -- --nocapture`, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and `bash scripts/verify-m033-s04.sh`; full validation still depends on later vendor-extra slices. |
| R041 | integration | deferred | none | none | unmapped |
| R043 | anti-feature | out-of-scope | none | none | n/a |
| R045 | core-capability | validated | M039/S01 | M039/S04 | validated |
| R046 | failure-visibility | validated | M039/S01 | M039/S03, M039/S04 | validated |
| R047 | differentiator | validated | M039/S02 | M039/S03 | validated |
| R048 | continuity | validated | M039/S03 | M039/S04 | validated |
| R049 | continuity | active | M044/S02 | M044/S04 | mapped |
| R050 | operability | active | M044/S02 | M044/S04 | mapped |
| R051 | continuity | validated | M043/S01 | M043/S02, M043/S03, M043/S04 | validated |
| R052 | launchability | active | M044/S03 | M044/S05 | mapped |
| R053 | launchability | validated | M039/S04 | M041/S03 (provisional) | validated |
| R054 | admin/support | deferred | none | none | unmapped |
| R055 | operability | deferred | none | none | unmapped |
| R056 | continuity | deferred | none | none | unmapped |
| R057 | anti-feature | out-of-scope | none | none | n/a |
| R058 | constraint | out-of-scope | none | none | n/a |
| R059 | anti-feature | out-of-scope | none | none | n/a |
| R060 | constraint | out-of-scope | none | none | n/a |
| R061 | core-capability | validated | M044/S01 | M044/S03 | Validated by M044/S01: optional `[cluster]` manifest parsing, shared compiler/LSP validation, `cluster-proof/mesh.toml`, the named `m044_s01_clustered_manifest_` / `m044_s01_manifest_` rails, and green `bash scripts/verify-m044-s01.sh`. |
| R062 | core-capability | validated | M044/S01 | M044/S02, M044/S05 | Validated by M044/S01: typed Mesh-facing `ContinuityAuthorityStatus`, `ContinuityRecord`, and `ContinuitySubmitDecision` values across typeck/MIR/codegen/runtime plus `cluster-proof` dogfood, proved by `m044_s01_typed_continuity_`, `m044_s01_continuity_compile_fail_`, and the S01 shim-absence checks. |
| R063 | constraint | validated | M044/S01 | M044/S02 | Validated by M044/S02: declared work/service handlers are the only clustered runtime path, undeclared behavior stays local, and the contract is proved by `m044_s02_declared_work_`, `m044_s02_service_`, `m044_s02_cluster_proof_`, and `bash scripts/verify-m044-s02.sh`. |
| R064 | continuity | validated | M044/S02 | M044/S04 | Validated by M044/S02+S04 closeout: runtime-owned declared-handler placement/submission/dispatch from S02 plus runtime-owned authority/failover/recovery/fencing from S04, proved by `bash scripts/verify-m044-s02.sh`, `automatic_promotion_`, `automatic_recovery_`, `m044_s04_auto_promotion_`, `m044_s04_auto_resume_`, and the assembled S04/S05 verifiers. |
| R065 | admin/support | validated | M044/S03 | M044/S05 | Validated by M044/S03 and carried through S05: runtime-owned transient operator query transport plus `meshc cluster status|continuity|diagnostics --json`, proved by `operator_query_`, `operator_diagnostics_`, `m044_s03_operator_`, `bash scripts/verify-m044-s03.sh`, and the scaffold-first public operator story in S05. |
| R066 | launchability | validated | M044/S03 | M044/S05 | Validated by M044/S03: `meshc init --clustered` scaffolds a real clustered app on the public `MESH_*` contract, proved by `test_init_clustered_creates_project`, `m044_s03_scaffold_`, and `bash scripts/verify-m044-s03.sh`; reinforced by S05 docs/closeout. |
| R067 | continuity | validated | M044/S04 | none | Validated by M044/S04: failover is auto-only, bounded, epoch/fencing-based, and manual promotion stays disabled, proved by `automatic_promotion_`, `m044_s04_auto_promotion_`, `m044_s04_manual_surface_`, and `bash scripts/verify-m044-s04.sh`. |
| R068 | continuity | validated | M044/S04 | M044/S05 | Validated by M044/S04 and replayed in S05: declared clustered work survives primary loss through safe automatic promotion/recovery with stale-primary fencing, proved by `automatic_recovery_`, `m044_s04_auto_resume_`, retained failover artifacts, and `bash scripts/verify-m044-s04.sh` / `bash scripts/verify-m044-s05.sh`. |
| R069 | quality-attribute | validated | M044/S05 | M044/S01, M044/S02, M044/S03, M044/S04 | Validated by M044/S05: `cluster-proof` now uses the public clustered-app `MESH_*` contract directly, the legacy explicit clustering path is gone, and the rewrite is proved by `cargo test -p meshc --test e2e_m044_s05 -- --nocapture`, `cargo run -q -p meshc -- build cluster-proof`, `cargo run -q -p meshc -- test cluster-proof/tests`, `test ! -e cluster-proof/work_legacy.mpl`, and `bash scripts/verify-m044-s05.sh`. |
| R070 | launchability | validated | M044/S05 | M044/S03 | Validated by M044/S05: README + distributed/tooling/proof docs now teach `meshc init --clustered` and `meshc cluster` as the primary clustered-app story, proved by `cargo test -p meshc --test e2e_m044_s05 -- --nocapture`, `bash scripts/verify-m044-s05.sh`, and `npm --prefix website run build`. |
| R071 | admin/support | deferred | none | none | unmapped |
| R072 | operability | deferred | none | none | unmapped |
| R073 | anti-feature | out-of-scope | none | none | n/a |
| R074 | anti-feature | out-of-scope | none | none | n/a |
| R075 | anti-feature | out-of-scope | none | none | n/a |
| R076 | anti-feature | out-of-scope | none | none | n/a |
| R077 | launchability | validated | M045/S01 | M045/S04, M045/S05 | validated |
| R078 | core-capability | validated | M045/S02 | M045/S03 | validated |
| R079 | constraint | validated | M045/S01 | M045/S03, M045/S04 | validated |
| R080 | launchability | validated | M045/S02 | M045/S05 | validated |
| R081 | quality-attribute | validated | M045/S05 | M045/S02 | validated |
| R082 | admin/support | deferred | none | none | unmapped |
| R083 | anti-feature | out-of-scope | none | none | n/a |
| R084 | constraint | out-of-scope | none | none | n/a |
| R085 | core-capability | validated | M046/S01 | M046/S05 | validated |
| R086 | constraint | validated | M046/S02 | M046/S03, M046/S04, M046/S06 | validated |
| R087 | launchability | validated | M046/S02 | M046/S03, M046/S04 | validated |
| R088 | launchability | validated | M046/S03 | M046/S05, M046/S06 | validated |
| R089 | quality-attribute | validated | M046/S04 | M046/S06 | validated |
| R090 | quality-attribute | validated | M046/S05 | M046/S03, M046/S04, M046/S06 | validated |
| R091 | admin/support | validated | M046/S02 | M046/S06 | validated |
| R092 | quality-attribute | validated | M046/S05 | M046/S06 | validated |
| R093 | differentiator | validated | M046/S03 | M046/S04 | validated |
| R094 | core-capability | deferred | none | none | unmapped |
| R095 | anti-feature | out-of-scope | none | none | n/a |
| R096 | constraint | out-of-scope | none | none | n/a |

| R097 | core-capability | validated | M047/S01 | M047/S04, M047/S06 | mapped |
| R098 | continuity | validated | M047/S02 | M047/S03, M047/S04 | mapped |
| R099 | constraint | validated | M047/S02 | M047/S03, M047/S04 | mapped |
| R100 | launchability | validated | M047/S03 | M047/S05, M047/S06 | mapped |
| R101 | core-capability | validated | M047/S03 | M047/S05 | mapped |
| R102 | constraint | validated | M047/S04 | M047/S06 | mapped |
| R103 | quality-attribute | validated | M047/S04 | M047/S06 | mapped |
| R104 | launchability | validated | M047/S05 | M047/S03, M047/S06 | mapped |
| R105 | differentiator | validated | M047/S05 | M047/S06 | mapped |
| R106 | quality-attribute | validated | M047/S06 | M047/S04, M047/S05 | mapped |
| R107 | launchability | deferred | none | none | unmapped |
| R108 | admin/support | deferred | none | none | unmapped |
| R109 | anti-feature | out-of-scope | none | none | n/a |
| R110 | anti-feature | out-of-scope | none | none | n/a |
| R111 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 14
- Mapped to slices: 14
- Validated: 57 (R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011, R013, R015, R016, R017, R018, R019, R023, R024, R025, R026, R027, R035, R036, R037, R038, R039, R045, R046, R047, R048, R051, R053, R061, R062, R063, R064, R065, R066, R067, R068, R069, R070, R077, R078, R079, R080, R081, R085, R086, R087, R088, R089, R090, R091, R092, R093)
- Unmapped active requirements: 0
