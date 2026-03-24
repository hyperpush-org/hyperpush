---
id: T01
parent: S05
milestone: M032
provides:
  - named `e2e_m032_*` proof for nested wrapper-list JSON decoding and inline writer-style cast bodies
  - narrowed Mesher limitation comments in `routes.mpl` and `writer.mpl` so they only describe current retained limits
key_files:
  - compiler/meshc/tests/e2e.rs
  - mesher/ingestion/routes.mpl
  - mesher/services/writer.mpl
key_decisions:
  - "Mesher comment claims now follow named proof: wrapper-list JSON decode and inline writer-style cast bodies are treated as supported, while the route-closure and Timer.send_after notes remain the retained keep-sites."
patterns_established:
  - "Retire Mesher folklore by adding a named `e2e_m032_*` regression before narrowing the corresponding in-source limitation comment."
observability_surfaces:
  - "cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture"
  - "cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture"
  - "bash scripts/verify-m032-s01.sh"
duration: 18m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Freeze the last two supported paths and correct the remaining overbroad Mesher comments

**Added named e2e proofs for nested wrapper-list JSON decode and inline writer cast bodies, then narrowed the two stale Mesher limitation comments.**

## What Happened

Added two self-contained regressions to `compiler/meshc/tests/e2e.rs`:

- `e2e_m032_supported_nested_wrapper_list_from_json` proves a `deriving(Json)` wrapper struct with a `List < BulkEvent >` field can decode nested JSON array payloads.
- `e2e_m032_supported_inline_writer_cast_body` proves a writer-style `cast ... do|state|` body can inline append, capacity trimming, and rebuilt-state branches without helper extraction.

With those proofs in place, I narrowed the remaining overbroad Mesher comments:

- `mesher/ingestion/routes.mpl` now says the `/events/bulk` path keeps the raw request body because it does not decode a bare top-level bulk array before handing work to `StorageWriter`, instead of claiming array element parsing is unsupported in Mesh generally.
- `mesher/services/writer.mpl` now frames `writer_store(...)` as a readability/local-reuse helper instead of a workaround for service-dispatch codegen.

I left the retained keep-sites untouched: the top-level route-closure note in `mesher/ingestion/routes.mpl` and the `Timer.send_after` notes in `mesher/services/writer.mpl` and `mesher/ingestion/pipeline.mpl` still match the live failure surface.

## Verification

Task-level verification passed directly:

- both new named `e2e_m032_*` tests passed
- the stale phrases disappeared from the two edited Mesher files
- the retained route-closure and timer keep-sites still matched the targeted grep

I also ran the full slice verification matrix to see what T01 already satisfies versus what remains for T02. Checks 1-9 passed, including `verify-m032-s01`, `m032_inferred`, the live route-closure failure control, `meshc fmt --check mesher`, `meshc build mesher`, and the stale/retained comment sweeps. The only failures were the expected T02 closeout-artifact checks for missing `S05-SUMMARY.md` / `S05-UAT.md` and the not-yet-checked roadmap entry.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture` | 0 | ✅ pass | 31.60s |
| 2 | `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture` | 0 | ✅ pass | 30.40s |
| 3 | `bash scripts/verify-m032-s01.sh` | 0 | ✅ pass | 116.62s |
| 4 | `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture` | 0 | ✅ pass | 8.93s |
| 5 | `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture` | 0 | ✅ pass | 8.56s |
| 6 | `cargo run -q -p meshc -- fmt --check mesher` | 0 | ✅ pass | 8.63s |
| 7 | `cargo run -q -p meshc -- build mesher` | 0 | ✅ pass | 15.58s |
| 8 | `bash -lc '! rg -n "not supported at the Mesh language level|complex expressions inside service dispatch codegen|query string parsing not available in Mesh|complex case expressions|parser limitation with if/else in cast handlers|cross-module from_json limitation|from_json limitation per decision \[88-02\]|Validation is done by the caller|caller is responsible for JSON parsing and field validation|services and inferred/polymorphic functions cannot be exported across modules|must stay in main\.mpl" mesher'` | 0 | ✅ pass | 0.19s |
| 9 | `rg -n "HTTP routing does not support closures|avoids && codegen issue inside nested if blocks|Timer.send_after delivers raw bytes|single-expression case arm constraint|single-expression case arms|case arm extraction|^# ORM boundary:|Migration DSL does not support PARTITION BY|from_json" mesher/ingestion/routes.mpl mesher/services/stream_manager.mpl mesher/services/writer.mpl mesher/ingestion/pipeline.mpl mesher/services/event_processor.mpl mesher/ingestion/fingerprint.mpl mesher/services/retention.mpl mesher/api/team.mpl mesher/storage/queries.mpl mesher/storage/writer.mpl mesher/migrations/20260216120000_create_initial_schema.mpl mesher/types/event.mpl mesher/types/issue.mpl` | 0 | ✅ pass | 0.11s |
| 10 | `bash -lc 'test -s .gsd/milestones/M032/slices/S05/S05-SUMMARY.md && test -s .gsd/milestones/M032/slices/S05/S05-UAT.md'` | 1 | ❌ fail | 0.08s |
| 11 | `rg -n "\[x\] \*\*S05: Integrated mesher proof and retained-limit ledger\*\*" .gsd/milestones/M032/M032-ROADMAP.md` | 1 | ❌ fail | 0.03s |

## Diagnostics

The durable inspection surface for this task is the pair of named regressions in `compiler/meshc/tests/e2e.rs`. Future agents should start with:

- `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`
- `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`
- `bash scripts/verify-m032-s01.sh`

If the slice replay drifts, inspect the failing test name or grep match first, then the `.tmp/m032-s01/verify/*.log` artifacts from the replay script.

## Deviations

None.

## Known Issues

- Slice-level closeout remains incomplete until T02 writes `.gsd/milestones/M032/slices/S05/S05-SUMMARY.md` and `.gsd/milestones/M032/slices/S05/S05-UAT.md`.
- `.gsd/milestones/M032/M032-ROADMAP.md` is still unchecked for S05 because the slice closeout task has not run yet.
- `bash -lc` commands still print `/Users/sn0w/.profile: line 1: /Users/sn0w/.cargo/env: No such file or directory` on stderr in this environment; the verification commands above still exited with the listed codes.

## Files Created/Modified

- `compiler/meshc/tests/e2e.rs` — added named regressions for wrapper-list JSON decode and inline writer-style cast-body support
- `mesher/ingestion/routes.mpl` — narrowed the bulk-route limitation comment to the remaining bare top-level array endpoint surface
- `mesher/services/writer.mpl` — rewrote the writer helper comment as readability/local-reuse guidance instead of stale codegen folklore
