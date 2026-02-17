# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Expressive, readable concurrency -- writing concurrent programs should feel as natural and clean as writing sequential code, with the safety net of supervision and fault tolerance built into the language.
**Current focus:** v11.0 Query Builder -- Defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-17 — Milestone v11.0 started

## Performance Metrics

**All-time Totals:**
- Plans completed: 311
- Phases completed: 105
- Milestones shipped: 20 (v1.0-v10.0)
- Lines of Rust: ~98,850
- Lines of website: ~5,500
- Lines of Mesh: ~4,020
- Timeline: 12 days (2026-02-05 -> 2026-02-17)

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 104   | 01   | 12min    | 2     | 3     |
| 105   | 01   | 18min    | 3     | 1     |
| 105   | 02   | 8min     | 3     | 4     |
| 105.1 | 02   | 9min     | 1     | 1     |
| 105.1 | 01   | 17min    | 2     | 5     |
| 105.1 | 03   | 9min     | 2     | 2     |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 103: All application database access flows through Repo.* or Json.* APIs (Pool.query reserved for runtime internals only)
- Phase 102: Cross-module Schema metadata requires both trait impl registration during deriving(Schema) and env re-registration during struct import
- Phase 103: Repo.query_raw/execute_raw typeck changed from Ptr to concrete types for type-safe Mesh compilation
- Phase 104: Repo.insert/get/get_by/all/delete typeck changed from Ptr to concrete Result types matching runtime behavior
- Phase 104: Schema metadata functions must be registered in MIR known_functions for cross-module imports (same pattern as FromJson/ToJson/FromRow)
- Phase 105: Migration runner synthetic main must use single-expression match arms and from-import syntax (Mesh parser constraint)
- Phase 105: Env.get returns Option<String> requiring case unwrap before passing to Pool.open
- Phase 105: Returning multi-field struct in Result caused ABI segfault -- FIXED in Phase 105.1 Plan 01 (pointer-boxing), workaround reverted in Plan 03
- Phase 105: EventProcessor service call has ABI segfault in reply deserialization (deferred to future codegen fix)
- Phase 105.1: Pass MIR return type to codegen_service_call_helper for type-aware reply conversion instead of always converting to pointer
- Phase 105.1: Use target_data.get_store_size threshold (<=8 bytes) to match tuple encoding for struct state extraction
- Phase 105.1: Construction-side fix only for struct-in-Result: existing codegen_leaf deref logic handles destructuring; no pattern.rs changes needed
- Phase 105.1: Auth workaround reverted -- authenticate_request returns Project!String directly, confirmed working end-to-end
- Phase 105.1: EventProcessor service call SIGSEGV persists in background processing despite Plan 02 reply conversion fix -- needs dedicated investigation

### Roadmap Evolution

- Phase 105.1 inserted after Phase 105: Fix codegen ABI issues and workarounds from Phase 105 (URGENT)

### Pending Todos

None.

### Blockers/Concerns

- Event ingestion (POST /api/v1/events) crashes during background EventProcessor service call after HTTP response is sent. Auth pipeline (struct-in-Result) works. The SIGSEGV persists in asynchronous service call processing despite Plan 02 reply conversion fix. Requires deeper investigation of EventProcessor service loop state or call dispatch.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 5 | Update article with new changes and additions from git history | 2026-02-17 | 86b0384d | [5-update-article-with-new-changes-and-addi](./quick/5-update-article-with-new-changes-and-addi/) |

## Session Continuity

Last session: 2026-02-17
Stopped at: Milestone v11.0 initialization
Resume file: None
Next action: Define requirements, create roadmap
