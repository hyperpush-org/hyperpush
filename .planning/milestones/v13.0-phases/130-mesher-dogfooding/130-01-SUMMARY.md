---
phase: 130-mesher-dogfooding
plan: 01
subsystem: compiler/typeck, mesher
tags: [mesher, dogfooding, multi-line-pipe, type-alias, fingerprint, DOGFOOD-01, DOGFOOD-02]

requires:
  - phase: 126-multi-line-pipe
    provides: multi-line |> pipe syntax accepted by parser and codegen
  - phase: 127-type-aliases
    provides: pub type Alias = Type declaration and cross-module import support

provides:
  - DOGFOOD-01: mesher/main.mpl router chain as explicit let binding with multi-line |> pipe (36 routes)
  - DOGFOOD-02: pub type Fingerprint = String in mesher/types/event.mpl; used in fingerprint.mpl return types
  - Bug fix: FromImportDecl handler in infer.rs now accepts pub type alias names in from-import lists

affects: [131-documentation]

tech-stack:
  added: []
  patterns:
    - "Multi-line let router = HTTP.router() |> ... binding pattern for large route chains"
    - "pub type Fingerprint = String alias for semantic documentation of string values"
    - "Type alias import by name: from Module import ..., AliasName"

key-files:
  created: []
  modified:
    - mesher/main.mpl
    - mesher/types/event.mpl
    - mesher/ingestion/fingerprint.mpl
    - mesher/ingestion/ws_handler.mpl
    - compiler/mesh-typeck/src/infer.rs

key-decisions:
  - "Auto-fixed ws_on_close/on_ws_close :: Int and :: String annotations — pre-existing LLVM type mismatch blocked meshc build; same root cause as Phase 129-02 passthrough middleware issue"
  - "Auto-fixed FromImportDecl handler in infer.rs to accept pub type alias names — type_aliases were pre-registered in type_registry but the from-import name validation loop did not check mod_exports.type_aliases, causing E0034 errors"
  - "36 routes in mesher/main.mpl (plan described 37 — the original code also had 36; plan description was a rounding error)"

patterns-established:
  - "Router extraction pattern: let router = HTTP.router() |> routes... then HTTP.serve(router, port)"
  - "Type alias import pattern: from Types.Event import ..., Fingerprint"

requirements-completed: [DOGFOOD-01, DOGFOOD-02]

duration: 7min
completed: 2026-02-28
---

# Phase 130 Plan 01: Mesher Dogfooding Summary

**v13.0 multi-line pipe and type alias features dogfooded in Mesher production code: 36-route router extracted to let binding, Fingerprint type alias declared and imported across modules, compiler bug fixed for type alias named imports**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-28T01:24:10Z
- **Completed:** 2026-02-28T01:31:11Z
- **Tasks:** 2
- **Files modified:** 5 (including 1 compiler file)

## Accomplishments

- DOGFOOD-01: mesher/main.mpl 36-route HTTP.router() pipe chain extracted from inline HTTP.serve() argument to explicit `let router = HTTP.router()` let binding with clean multi-line |> formatting
- DOGFOOD-02: `pub type Fingerprint = String` declared in mesher/types/event.mpl; imported by name in fingerprint.mpl and used in normalize_message, fingerprint_from_frames, and compute_fingerprint return types
- Auto-fixed pre-existing LLVM build failure in ws_on_close by adding `:: Int` and `:: String` parameter annotations
- Auto-fixed compiler bug: `from Module import ..., TypeAlias` was rejected with E0034 because FromImportDecl handler never checked mod_exports.type_aliases
- All 3 type alias E2E tests pass after compiler fix; meshc build mesher/ succeeds

## Task Commits

1. **Task 1: Reformat main.mpl router chain (DOGFOOD-01)** - `390b37a4` (feat)
2. **Task 2: Add Fingerprint alias and use in fingerprint.mpl (DOGFOOD-02)** - `c6e3f54d` (feat)

## Files Created/Modified

- `mesher/main.mpl` - Router extracted to let binding; on_ws_close :: Int/String annotations added
- `mesher/types/event.mpl` - pub type Fingerprint = String alias added before Severity
- `mesher/ingestion/fingerprint.mpl` - Fingerprint imported and used in 3 function return types
- `mesher/ingestion/ws_handler.mpl` - ws_on_close :: Int :: String annotations added
- `compiler/mesh-typeck/src/infer.rs` - FromImportDecl handler fixed to accept type alias names

## Decisions Made

- Auto-fixed ws_on_close/on_ws_close unannotated `code` and `reason` parameters: same root cause as Phase 129-02 passthrough middleware SIGBUS — parameters generalized to `{}` type without annotations. Fix: add `:: Int` and `:: String` annotations.
- Auto-fixed compiler bug in infer.rs: `from Types.Event import ..., Fingerprint` failed with "Fingerprint is not exported by module Types.Event" because the FromImportDecl handler's name lookup chain checked functions/structs/sum_types/actors/services but not type_aliases. Fix: add `else if mod_exports.type_aliases.contains_key(&name)` branch to silently accept the import (alias already pre-registered in type_registry from the earlier pre-registration pass).
- 36 routes in mesher (plan stated 37 — both the original and updated code have 36 routes; the plan description was slightly off).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ws_on_close LLVM type mismatch blocking meshc build**
- **Found during:** Task 1 (build verification)
- **Issue:** Pre-existing LLVM error — `ws_on_close(i64, i64, ptr)` call mismatched function signature because `code` and `reason` parameters had no type annotations, causing them to be inferred as `{}` (empty struct). Same root cause as Phase 129-02 passthrough middleware SIGBUS.
- **Fix:** Added `:: Int` to `code` and `:: String` to `reason` in both `pub fn ws_on_close` (ws_handler.mpl) and the wrapper `fn on_ws_close` (main.mpl)
- **Files modified:** mesher/ingestion/ws_handler.mpl, mesher/main.mpl
- **Verification:** `meshc build mesher/` compiled successfully after fix
- **Committed in:** 390b37a4 (Task 1 commit)

**2. [Rule 1 - Bug] FromImportDecl handler doesn't check type_aliases for named imports**
- **Found during:** Task 2 (first build attempt after adding Fingerprint import)
- **Issue:** `from Types.Event import EventPayload, StackFrame, ExceptionInfo, Fingerprint` produced E0034 error: "Fingerprint is not exported by module Types.Event". The alias WAS in `mod_exports.type_aliases` (correctly collected by collect_exports) but the import name validation loop in infer.rs only checked functions/structs/sum_types/actors/services — not type_aliases. The pre-registration pass (lines 1567-1579) correctly registered the alias in type_registry, but the validation rejected the import before type-checking could use it.
- **Fix:** Added `else if mod_exports.type_aliases.contains_key(&name) { /* pre-registered, silently accept */ }` branch in the FromImportDecl name loop, before the else-error block. Also added `type_aliases.keys()` to the `available` list in the error message.
- **Files modified:** compiler/mesh-typeck/src/infer.rs
- **Verification:** `from Types.Event import ..., Fingerprint` accepted; all 3 e2e_type_alias tests pass; meshc build mesher/ succeeds
- **Committed in:** c6e3f54d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking pre-existing build failure, 1 compiler bug)
**Impact on plan:** Both auto-fixes necessary to achieve the plan's stated success criteria. The compiler fix is a genuine bug fix that generalizes to any `from Module import TypeAlias` pattern.

## Issues Encountered

None beyond the auto-fixed items above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DOGFOOD-01 and DOGFOOD-02 requirements satisfied; Mesher compiles with v13.0 features
- The Fingerprint named-import compiler fix (infer.rs) unlocks using type aliases in real multi-module Mesh code
- Phase 131 (Documentation) can proceed: examples sourced from verified Mesher patterns are now confirmed to compile

## Self-Check: PASSED

Files verified:
- FOUND: mesher/main.mpl
- FOUND: mesher/types/event.mpl
- FOUND: mesher/ingestion/fingerprint.mpl
- FOUND: mesher/ingestion/ws_handler.mpl
- FOUND: compiler/mesh-typeck/src/infer.rs
- FOUND: .planning/phases/130-mesher-dogfooding/130-01-SUMMARY.md
- FOUND: commit 390b37a4 (Task 1)
- FOUND: commit c6e3f54d (Task 2)

---
*Phase: 130-mesher-dogfooding*
*Completed: 2026-02-28*
