---
phase: 119-regular-expressions
plan: "03"
subsystem: compiler
tags: [regex, e2e, tests, runtime, typeck, codegen, bugfix]

# Dependency graph
requires:
  - phase: 119-02
    provides: mesh-rt regex runtime, LLVM intrinsics, JIT symbols, typeck wiring

provides:
  - 5 E2E fixture files covering all 6 regex requirements (REGEX-01 through REGEX-06)
  - 6 e2e_regex_* test functions in crates/meshc/tests/e2e.rs
  - Fix: "Regex" added to STDLIB_MODULE_NAMES in infer.rs
  - Fix: Regex.match renamed to Regex.is_match ("match" is a Mesh keyword)
  - Fix: Ty::Con("Regex") -> MirType::Ptr in types.rs (prevents LLVM opaque struct errors)

affects:
  - Downstream phases using Regex in Mesh programs (e.g., 120 Mesher dogfooding)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Opaque pointer types (like Regex) must be added to STDLIB_MODULE_NAMES in infer.rs AND MirType::Ptr mapping in types.rs"
    - "Multi-statement case arms require helper functions (case arm body is a single expression)"
    - "Mesh keywords (match, case, if, etc.) cannot be used as method names in module APIs"

key-files:
  created:
    - tests/e2e/regex_literal.mpl
    - tests/e2e/regex_compile.mpl
    - tests/e2e/regex_match.mpl
    - tests/e2e/regex_captures.mpl
    - tests/e2e/regex_replace_split.mpl
  modified:
    - crates/meshc/tests/e2e.rs
    - crates/mesh-typeck/src/infer.rs
    - crates/mesh-typeck/src/builtins.rs
    - crates/mesh-codegen/src/mir/lower.rs
    - crates/mesh-codegen/src/mir/types.rs

key-decisions:
  - "Regex.match renamed to Regex.is_match: 'match' is a reserved keyword in Mesh (MATCH_KW), so Regex.match causes parse error; is_match is the correct API name"
  - "Regex type maps to MirType::Ptr in resolve_con() in types.rs: opaque heap pointer at runtime, must be a first-class LLVM type"
  - "Helper function pattern used for multi-statement case arms (run_captures, run_match, run_replace_split): case arm bodies are single expressions in Mesh"

requirements-completed:
  - REGEX-01
  - REGEX-02
  - REGEX-03
  - REGEX-04
  - REGEX-05
  - REGEX-06

# Metrics
duration: 13min
completed: 2026-02-26
---

# Phase 119 Plan 03: Regex E2E Tests Summary

**6 E2E tests added covering all regex requirements; 3 compiler bugs auto-fixed; 270 total tests pass with zero regressions**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-26T02:30:48Z
- **Completed:** 2026-02-26T02:43:48Z
- **Tasks:** 2
- **Files modified:** 5
- **Files created:** 5

## Accomplishments

- 5 Mesh fixture files created in `tests/e2e/` covering all 6 REGEX requirements
- 6 `e2e_regex_*` test functions added to `crates/meshc/tests/e2e.rs`
- All 6 tests pass; total E2E suite grows from 264 to 270 tests
- Zero regressions in existing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create E2E fixture files for all 6 regex requirements** - `22b68e7e` (feat)
2. **Task 2: Add E2E test functions and fix regex compiler bugs** - `cc109d89` (feat)

## Files Created/Modified

- `tests/e2e/regex_literal.mpl` - Created: `~r/\d+/` and `~r/[a-z]+/i` literal + `Regex.is_match` (REGEX-01)
- `tests/e2e/regex_compile.mpl` - Created: `Regex.compile` Ok/Err cases (REGEX-02)
- `tests/e2e/regex_match.mpl` - Created: `Regex.is_match` true/false cases (REGEX-03)
- `tests/e2e/regex_captures.mpl` - Created: `Regex.captures` Some/None cases (REGEX-04)
- `tests/e2e/regex_replace_split.mpl` - Created: `Regex.replace` + `Regex.split` (REGEX-05, REGEX-06)
- `crates/meshc/tests/e2e.rs` - Modified: 6 test functions added at end of file
- `crates/mesh-typeck/src/infer.rs` - Modified: Added "Regex" to STDLIB_MODULE_NAMES; renamed "match" -> "is_match"
- `crates/mesh-typeck/src/builtins.rs` - Modified: Renamed "regex_match" -> "regex_is_match" + updated test assertion
- `crates/mesh-codegen/src/mir/lower.rs` - Modified: Renamed "regex_match" -> "regex_is_match" in map_builtin_name
- `crates/mesh-codegen/src/mir/types.rs` - Modified: Added "Regex" -> MirType::Ptr mapping in resolve_con

## Decisions Made

- `Regex.match` renamed to `Regex.is_match`: `match` is a reserved keyword in Mesh (`MATCH_KW`), so it cannot be used as a method name; the parser emits "expected IDENT" at the token
- `Regex` type maps to `MirType::Ptr`: the runtime representation is `Box<regex::Regex>` cast to `*mut u8`, which is an opaque heap pointer; without this mapping, `resolve_con` falls through to `MirType::Struct("Regex")` which becomes an LLVM opaque struct — not a first-class type
- Helper functions used for multi-statement case arm bodies (`run_captures`, `run_match`, `run_replace_split`): Mesh case arm bodies are single expressions only (not statement blocks)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] "Regex" missing from STDLIB_MODULE_NAMES in infer.rs**
- **Found during:** Task 2 (first test run)
- **Issue:** `Regex.compile(...)` caused "no method compile on type Regex" error because the typechecker checked method access on a value of type Regex instead of treating Regex as a module
- **Fix:** Added `"Regex"` to the `STDLIB_MODULE_NAMES` constant in `crates/mesh-typeck/src/infer.rs`
- **Files modified:** `crates/mesh-typeck/src/infer.rs`
- **Commit:** cc109d89

**2. [Rule 1 - Bug] Regex.match conflicts with Mesh "match" keyword**
- **Found during:** Task 2 (first test run)
- **Issue:** `match` is a `MATCH_KW` token in the Mesh lexer; using `Regex.match(rx, str)` causes parse error "expected IDENT"
- **Fix:** Renamed method from `"match"` to `"is_match"` in `infer.rs` (stdlib_modules Regex entry), `builtins.rs` (env key `regex_match` -> `regex_is_match`), and `lower.rs` (map_builtin_name arm); updated fixture files to use `Regex.is_match`
- **Files modified:** `crates/mesh-typeck/src/infer.rs`, `crates/mesh-typeck/src/builtins.rs`, `crates/mesh-codegen/src/mir/lower.rs`, all fixture files
- **Commit:** cc109d89

**3. [Rule 1 - Bug] Ty::Con("Regex") maps to MirType::Struct causing LLVM verification failure**
- **Found during:** Task 2 (second test run, after fixing bugs 1 and 2)
- **Issue:** `resolve_con` in `types.rs` fell through to the default case `MirType::Struct(name)` for unknown type constructors; `MirType::Struct("Regex")` produced an LLVM opaque struct type which cannot be used as function argument or alloca'd — causing "Cannot allocate unsized type %Regex" LLVM verification failures
- **Fix:** Added `"Regex"` to the opaque pointer pattern in `resolve_con` so it maps to `MirType::Ptr` (consistent with its runtime representation as `*mut u8`)
- **Files modified:** `crates/mesh-codegen/src/mir/types.rs`
- **Commit:** cc109d89

## Self-Check: PASSED

- FOUND: tests/e2e/regex_literal.mpl (contains `~r/`)
- FOUND: tests/e2e/regex_compile.mpl (contains `Regex.compile`)
- FOUND: tests/e2e/regex_match.mpl (contains `Regex.is_match`)
- FOUND: tests/e2e/regex_captures.mpl (contains `Regex.captures`)
- FOUND: tests/e2e/regex_replace_split.mpl (contains `Regex.replace`)
- FOUND: crates/meshc/tests/e2e.rs (contains `fn e2e_regex_literal`)
- FOUND commit: 22b68e7e (Task 1)
- FOUND commit: cc109d89 (Task 2)
- VERIFIED: 270 E2E tests pass (0 failures)

---
*Phase: 119-regular-expressions*
*Completed: 2026-02-26*
