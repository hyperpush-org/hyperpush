---
phase: 127-type-aliases
plan: 01
subsystem: compiler
tags: [rust, parser, typeck, type-aliases, diagnostics, lsp]

# Dependency graph
requires: []
provides:
  - "pub type Url = String parses correctly with VISIBILITY node in TYPE_ALIAS_DEF"
  - "TypeAliasDef::visibility() and target_type_name() accessors"
  - "ALIAS-04: TypeError::UndefinedType error when alias targets unknown type"
  - "Pre-registration pass in infer_with_imports for struct/sum/alias stubs"
  - "E2E fixture: type_alias_basic.mpl exercising fn signatures, return types, let bindings"
affects: [128-tryfrom-tryinto, type-checking, compiler-error-messages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pre-registration pass pattern: scan items before main inference to register names for validation"
    - "Type alias validation post-registration: validate after all types known to handle forward refs"

key-files:
  created:
    - "tests/e2e/type_alias_basic.mpl"
    - "compiler/mesh-parser/tests/snapshots/parser_tests__type_alias_pub.snap"
  modified:
    - "compiler/mesh-parser/src/ast/item.rs"
    - "compiler/mesh-parser/src/parser/items.rs"
    - "compiler/mesh-parser/tests/parser_tests.rs"
    - "compiler/mesh-typeck/src/error.rs"
    - "compiler/mesh-typeck/src/infer.rs"
    - "compiler/mesh-typeck/src/diagnostics.rs"
    - "compiler/mesh-lsp/src/analysis.rs"
    - "compiler/mesh-typeck/tests/structs.rs"
    - "compiler/meshc/tests/e2e.rs"

key-decisions:
  - "Added target_type_name() to TypeAliasDef AST node returning first IDENT after EQ — returns None for complex generic types like (A, B), avoiding false positives"
  - "Validation skips generic aliases (type Pair<A,B> = ...) since type vars are not in registry — correct behavior"
  - "Pre-registration pass registers minimal stubs (no fields) for structs/sums so alias validation knows about locally-defined types"
  - "ALIAS-04 uses error code E0045 following established error code sequence"

patterns-established:
  - "parse_optional_visibility(p) called before keyword consumption in all parsers that support pub prefix"
  - "New TypeError variants require: error.rs definition, diagnostics.rs error_code + report match, mesh-lsp analysis.rs span match"

requirements-completed: [ALIAS-01, ALIAS-02, ALIAS-04]

# Metrics
duration: 18min
completed: 2026-02-27
---

# Phase 127 Plan 01: Type Aliases Summary

**pub type parsing fix, TypeAliasDef::visibility() accessor, and ALIAS-04 undefined alias type detection with E2E test coverage**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-27T19:53:59Z
- **Completed:** 2026-02-27T20:11:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Fixed `pub type Url = String` parsing: added `parse_optional_visibility(p)` call in `parse_type_alias` before consuming `TYPE_KW`, producing correct VISIBILITY node inside TYPE_ALIAS_DEF
- Added `TypeAliasDef::visibility()` and `target_type_name()` accessors to the AST
- Implemented ALIAS-04: `type Foo = NonExistentType` now emits `TypeError::UndefinedType` with E0045 error code, clear message naming both alias and target
- Added pre-registration pass in `infer_with_imports` so struct/sum/alias names are known before validation
- All 5 typeck unit tests pass, 3 parser snapshot tests pass, E2E test e2e_type_alias_basic passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix pub type parsing and add TypeAliasDef::visibility()** - `23ba70b5` (feat)
2. **Task 2: ALIAS-04 undefined alias type error + E2E test** - `ffba0af4` (feat)

## Files Created/Modified

- `compiler/mesh-parser/src/ast/item.rs` - Added visibility() and target_type_name() to TypeAliasDef
- `compiler/mesh-parser/src/parser/items.rs` - Fixed parse_type_alias to call parse_optional_visibility() first
- `compiler/mesh-parser/tests/parser_tests.rs` - Added type_alias_pub snapshot test
- `compiler/mesh-parser/tests/snapshots/parser_tests__type_alias_pub.snap` - New snapshot: VISIBILITY + TYPE_KW in TYPE_ALIAS_DEF
- `compiler/mesh-typeck/src/error.rs` - Added TypeError::UndefinedType { alias_name, target_name, span }
- `compiler/mesh-typeck/src/infer.rs` - Added is_known_type(), validate_type_aliases(), pre-registration pass
- `compiler/mesh-typeck/src/diagnostics.rs` - Added E0045 error code and ariadne diagnostic report for UndefinedType
- `compiler/mesh-lsp/src/analysis.rs` - Added UndefinedType to span extraction match
- `compiler/mesh-typeck/tests/structs.rs` - Added 3 new type alias unit tests
- `tests/e2e/type_alias_basic.mpl` - E2E fixture with aliases in fn sigs, return types, let bindings
- `compiler/meshc/tests/e2e.rs` - Added e2e_type_alias_basic test

## Decisions Made

- `target_type_name()` returns `None` for complex types like tuples and generic applications — only validates simple single-IDENT aliases. This avoids false positives for `type Pair<A,B> = (A,B)`.
- Generic type aliases (those with type parameters) are skipped from ALIAS-04 validation since their type parameter names look like undefined types.
- Pre-registration pass uses minimal StructDefInfo/SumTypeDefInfo stubs (no fields/variants) just to register the name — full registration happens in the main inference loop.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added UndefinedType to mesh-lsp analysis.rs**
- **Found during:** Task 2 (build verification after adding TypeError variant)
- **Issue:** mesh-lsp/src/analysis.rs has exhaustive TypeError match for span extraction; missed the new variant
- **Fix:** Added `TypeError::UndefinedType { span, .. } => Some(*span)` to the match
- **Files modified:** compiler/mesh-lsp/src/analysis.rs
- **Verification:** `cargo build --all` produces no errors
- **Committed in:** ffba0af4 (Task 2 commit)

**2. [Rule 1 - Bug] E2E fixture used top-level let bindings with println**
- **Found during:** Task 2 (E2E test execution)
- **Issue:** Top-level `let id :: UserId = 42` followed by `println("${id}")` caused "Unsupported binop type: String" error in codegen
- **Fix:** Moved let bindings and println calls inside a `fn main() do ... end` block, used function calls to exercise alias use sites
- **Files modified:** tests/e2e/type_alias_basic.mpl
- **Verification:** e2e_type_alias_basic test passes with correct output
- **Committed in:** ffba0af4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both necessary for correctness. No scope creep.

## Issues Encountered

- `println` expects String type — Int values need `"${id}"` string interpolation or `.to_string()`. For the E2E fixture, used `"${get_user(id)}"` to test the alias in fn return position while also exercising the int-to-string path.

## Next Phase Readiness

- ALIAS-01, ALIAS-02, ALIAS-04 requirements complete
- Plan 02 handles remaining requirements (ALIAS-03: pub type visibility in modules, ALIAS-05: alias in struct fields)
- Type alias infrastructure solid — visibility accessor and undefined-type validation operational

## Self-Check: PASSED

- compiler/mesh-parser/src/ast/item.rs: FOUND
- compiler/mesh-parser/src/parser/items.rs: FOUND
- compiler/mesh-typeck/src/infer.rs: FOUND
- tests/e2e/type_alias_basic.mpl: FOUND
- .planning/phases/127-type-aliases/127-01-SUMMARY.md: FOUND
- Commit 23ba70b5: FOUND
- Commit ffba0af4: FOUND

---
*Phase: 127-type-aliases*
*Completed: 2026-02-27*
