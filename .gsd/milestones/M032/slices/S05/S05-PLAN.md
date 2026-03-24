# S05: Integrated mesher proof and retained-limit ledger

**Goal:** Turn the repaired Mesher proof surface into a current closeout bundle by fixing the last two overbroad limitation comments, freezing those truths with named regression tests, and publishing a short retained-limit ledger backed by live Mesher proof.
**Demo:** `mesher/ingestion/routes.mpl` and `mesher/services/writer.mpl` only describe real current limits, `compiler/meshc/tests/e2e.rs` carries named proof for the last two supported paths, `bash scripts/verify-m032-s01.sh` plus targeted test/grep gates stay green, and `S05-SUMMARY.md` / `S05-UAT.md` hand off only the still-real Mesh and ORM/migration limits to M033.

## Must-Haves

- `compiler/meshc/tests/e2e.rs` gains named regression coverage for nested-wrapper list `from_json` support and inline complex cast-body support, and the two remaining overbroad Mesher comments are rewritten to match that proof.
- Slice closeout reruns the authoritative Mesher proof surface — including `bash scripts/verify-m032-s01.sh`, `m032_inferred`, the live route-closure control, `meshc fmt --check mesher`, and `meshc build mesher` — so R013 stays visible through the final `xmod_identity` success path.
- `S05-SUMMARY.md` and `S05-UAT.md` publish a short retained-limit ledger that separates supported-now paths, still-real Mesh keep-sites, and family-level M033 ORM/migration follow-ons anchored to real Mesher files.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`
- `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`
- `bash scripts/verify-m032-s01.sh`
- `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`
- `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture`
- `cargo run -q -p meshc -- fmt --check mesher`
- `cargo run -q -p meshc -- build mesher`
- `bash -lc '! rg -n "not supported at the Mesh language level|complex expressions inside service dispatch codegen|query string parsing not available in Mesh|complex case expressions|parser limitation with if/else in cast handlers|cross-module from_json limitation|from_json limitation per decision \\[88-02\\]|Validation is done by the caller|caller is responsible for JSON parsing and field validation|services and inferred/polymorphic functions cannot be exported across modules|must stay in main\\.mpl" mesher'`
- `rg -n "HTTP routing does not support closures|avoids && codegen issue inside nested if blocks|Timer.send_after delivers raw bytes|single-expression case arm constraint|single-expression case arms|case arm extraction|^# ORM boundary:|Migration DSL does not support PARTITION BY|from_json" mesher/ingestion/routes.mpl mesher/services/stream_manager.mpl mesher/services/writer.mpl mesher/ingestion/pipeline.mpl mesher/services/event_processor.mpl mesher/ingestion/fingerprint.mpl mesher/services/retention.mpl mesher/api/team.mpl mesher/storage/queries.mpl mesher/storage/writer.mpl mesher/migrations/20260216120000_create_initial_schema.mpl mesher/types/event.mpl mesher/types/issue.mpl`
- `bash -lc 'test -s .gsd/milestones/M032/slices/S05/S05-SUMMARY.md && test -s .gsd/milestones/M032/slices/S05/S05-UAT.md'`
- `rg -n "\\[x\\] \\*\\*S05: Integrated mesher proof and retained-limit ledger\\*\\*" .gsd/milestones/M032/M032-ROADMAP.md`

## Observability / Diagnostics

- Runtime signals: named `e2e_m032_*` tests, the live closure-route failure control, and `verify-m032-s01` step logs remain the authoritative truth surface.
- Inspection surfaces: `bash scripts/verify-m032-s01.sh`, targeted `cargo test` commands, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- build mesher`, and grep sweeps over retained Mesher keep-sites.
- Failure visibility: exact failing test names or grep matches plus `.tmp/m032-s01/verify/*.log` when the replay script drifts.
- Redaction constraints: keep comments, summaries, and UAT notes structural only; do not add raw event JSON, credentials, or other payload contents.

## Integration Closure

- Upstream surfaces consumed: S02 `xmod_identity` / `m032_inferred` proof, S03 request/handler keep-sites, S04 JSONB/ORM boundary cleanup, and the live Mesher files under `mesher/`.
- New wiring introduced in this slice: no product runtime wiring; this slice integrates the final proof surfaces and GSD closeout artifacts into one current ledger.
- What remains before the milestone is truly usable end-to-end: nothing for M032; ORM/migration expansion work is explicitly handed to M033 as follow-on pressure instead of being left as folklore.

## Tasks

- [x] **T01: Freeze the last two supported paths and correct the remaining overbroad Mesher comments** `est:1h`
  - Why: S05 cannot publish a truthful retained-limit ledger while `mesher/ingestion/routes.mpl` and `mesher/services/writer.mpl` still overstate Mesh limitations and the evidence for the real current behavior lives only in research notes.
  - Files: `compiler/meshc/tests/e2e.rs`, `mesher/ingestion/routes.mpl`, `mesher/services/writer.mpl`
  - Do: Add two named `e2e` regressions that prove nested wrapper-list `from_json` decoding and inline writer-style cast-body logic already work; then rewrite the bulk-ingest and writer-helper comments to match that proof without touching the real route-closure or timer keep-sites.
  - Verify: `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture && cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture && bash -lc '! rg -n "not supported at the Mesh language level|complex expressions inside service dispatch codegen" mesher/ingestion/routes.mpl mesher/services/writer.mpl' && rg -n "HTTP routing does not support closures|Timer.send_after delivers raw bytes" mesher/ingestion/routes.mpl mesher/services/writer.mpl mesher/ingestion/pipeline.mpl`
  - Done when: the two new supported-path truths are regression-covered, the overbroad phrases are gone, and the adjacent real keep-sites still read as current constraints.
- [ ] **T02: Replay the full M032 proof and publish the retained-limit closeout bundle** `est:1h`
  - Why: R010 is the slice owner here; the milestone is not closed by comment cleanup alone. The repo needs one final, current evidence bundle that proves the repaired paths still hold in Mesher and names only the still-real follow-on limits.
  - Files: `.gsd/milestones/M032/slices/S05/S05-SUMMARY.md`, `.gsd/milestones/M032/slices/S05/S05-UAT.md`, `.gsd/milestones/M032/M032-ROADMAP.md`, `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/KNOWLEDGE.md`
  - Do: Rerun the integrated Mesher proof matrix, including the new T01 regressions, `verify-m032-s01`, `m032_inferred`, the live closure-route control, Mesher fmt/build, and the stale/retained comment greps; then write the slice summary/UAT and refresh roadmap/project/requirements/knowledge so the final ledger keeps `xmod_identity` visible, names the still-real Mesh keep-sites, and groups ORM/migration follow-ons at the M033 family level.
  - Verify: `bash scripts/verify-m032-s01.sh && cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture && cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture && cargo test -q -p meshc --test e2e m032_inferred -- --nocapture && cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture && cargo run -q -p meshc -- fmt --check mesher && cargo run -q -p meshc -- build mesher && bash -lc '! rg -n "not supported at the Mesh language level|complex expressions inside service dispatch codegen|query string parsing not available in Mesh|complex case expressions|parser limitation with if/else in cast handlers|cross-module from_json limitation|from_json limitation per decision \\[88-02\\]|Validation is done by the caller|caller is responsible for JSON parsing and field validation|services and inferred/polymorphic functions cannot be exported across modules|must stay in main\\.mpl" mesher' && rg -n "HTTP routing does not support closures|avoids && codegen issue inside nested if blocks|Timer.send_after delivers raw bytes|single-expression case arm constraint|single-expression case arms|case arm extraction|^# ORM boundary:|Migration DSL does not support PARTITION BY|from_json" mesher/ingestion/routes.mpl mesher/services/stream_manager.mpl mesher/services/writer.mpl mesher/ingestion/pipeline.mpl mesher/services/event_processor.mpl mesher/ingestion/fingerprint.mpl mesher/services/retention.mpl mesher/api/team.mpl mesher/storage/queries.mpl mesher/storage/writer.mpl mesher/migrations/20260216120000_create_initial_schema.mpl mesher/types/event.mpl mesher/types/issue.mpl && bash -lc 'test -s .gsd/milestones/M032/slices/S05/S05-SUMMARY.md && test -s .gsd/milestones/M032/slices/S05/S05-UAT.md' && rg -n "\\[x\\] \\*\\*S05: Integrated mesher proof and retained-limit ledger\\*\\*" .gsd/milestones/M032/M032-ROADMAP.md`
  - Done when: the full closeout gate passes, the slice artifacts exist and name the right supported vs retained surfaces, and the repo-level GSD docs reflect S05 as the milestone closeout slice.

## Files Likely Touched

- `compiler/meshc/tests/e2e.rs`
- `mesher/ingestion/routes.mpl`
- `mesher/services/writer.mpl`
- `.gsd/milestones/M032/slices/S05/S05-SUMMARY.md`
- `.gsd/milestones/M032/slices/S05/S05-UAT.md`
- `.gsd/milestones/M032/M032-ROADMAP.md`
- `.gsd/PROJECT.md`
- `.gsd/REQUIREMENTS.md`
- `.gsd/KNOWLEDGE.md`
