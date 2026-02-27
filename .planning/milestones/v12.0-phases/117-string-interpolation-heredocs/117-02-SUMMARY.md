---
phase: 117-string-interpolation-heredocs
plan: "02"
subsystem: compiler
tags: [mir, heredoc, string-interpolation, e2e, trimIndent]

requires:
  - phase: 117-01
    provides: "#{} interpolation in regular strings via lexer"

provides:
  - "Kotlin-style trimIndent for triple-quoted heredoc strings (\"\"\"...\"\"\")"
  - "E2E fixture and test for plain heredoc (STRG-02)"
  - "E2E fixture and test for heredoc with #{} interpolation (STRG-03)"

affects:
  - 118 (any further string feature work)

tech-stack:
  added: []
  patterns:
    - "Triple-quote detection via STRING_START token text length (starts_with(\"\\\"\\\"\\\"\"))"
    - "apply_heredoc_content() per-segment processing: strip leading newline on first, drop closing indent line on last, strip trim_level leading whitespace from each intermediate line"
    - "trim_level computed from last STRING_CONTENT token's final line (the closing indent line)"
    - "into_token() used for owned iteration over SyntaxElement children (avoids borrow errors vs as_token())"

key-files:
  created:
    - tests/e2e/heredoc_basic.mpl
    - tests/e2e/heredoc_interp.mpl
  modified:
    - crates/mesh-codegen/src/mir/lower.rs
    - crates/meshc/tests/e2e.rs

key-decisions:
  - "apply_heredoc_content() handles per-segment indentation stripping rather than a single trim_indent() pass — required to support interpolation boundaries correctly"
  - "Mid-line content segments after interpolations (no leading whitespace) are left untouched — only lines starting with >= trim_level whitespace get stripped"
  - "trim_level is read from the last STRING_CONTENT token (which ends with newline + closing indent), not from a separate computation"
  - "into_token() used instead of as_token() in .find()/.filter() chains to avoid Rust borrow lifetime errors"

requirements-completed: [STRG-02, STRG-03]

duration: 8min
completed: 2026-02-26
---

# Phase 117 Plan 02: Heredoc trimIndent + Interpolation Summary

**apply_heredoc_content() in MIR lowerer strips common leading indentation from triple-quoted heredoc strings, with correct handling of #{} interpolation segment boundaries**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-26T00:24:40Z
- **Completed:** 2026-02-26T00:32:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `apply_heredoc_content()` helper in `lower.rs` to process each STRING_CONTENT segment from a triple-quoted heredoc: strip leading newline from first segment, drop closing indent line from last segment, strip `trim_level` leading whitespace chars from each line
- Updated `lower_string_expr` to detect triple-quoted strings (STRING_START token text starts with `"""`) and compute `trim_level` from the last STRING_CONTENT token's final line
- Created `tests/e2e/heredoc_basic.mpl` with two `println` calls exercising 4-space-indented heredocs (STRG-02)
- Created `tests/e2e/heredoc_interp.mpl` with `#{id}` and `#{name}` interpolation inside a JSON-like heredoc (STRG-03)
- Added `e2e_heredoc_basic` and `e2e_heredoc_interp` test functions to `crates/meshc/tests/e2e.rs`
- All 4 string-related tests pass: `e2e_string_interp`, `e2e_string_interp_hash`, `e2e_heredoc_basic`, `e2e_heredoc_interp`

## Task Commits

Each task was committed atomically:

1. **Task 1: MIR lowerer — apply_heredoc_content() and triple-quote processing** - `f9fbe997` (feat)
2. **Task 2: E2E fixtures and tests for STRG-02 and STRG-03** - `cc1928a2` (feat)

## Files Created/Modified

- `/Users/sn0w/Documents/dev/snow/crates/mesh-codegen/src/mir/lower.rs` - Added `apply_heredoc_content()` helper and updated `lower_string_expr` to detect triple-quoted strings and apply per-segment indentation stripping
- `/Users/sn0w/Documents/dev/snow/tests/e2e/heredoc_basic.mpl` - E2E fixture with two plain heredocs using 4-space indent
- `/Users/sn0w/Documents/dev/snow/tests/e2e/heredoc_interp.mpl` - E2E fixture with heredoc containing `#{id}` and `#{name}` interpolations
- `/Users/sn0w/Documents/dev/snow/crates/meshc/tests/e2e.rs` - Added `e2e_heredoc_basic` and `e2e_heredoc_interp` test functions

## Decisions Made

- `apply_heredoc_content()` processes each STRING_CONTENT segment independently rather than assembling all content first. This correctly handles interpolation boundaries where content between two `#{...}` expressions does not start with leading whitespace.
- Mid-line content (no leading whitespace) after an interpolation is left untouched — the stripping logic checks actual leading whitespace count before removing chars, not blindly slicing `trim_level` chars.
- `into_token()` used instead of `as_token()` when chaining `.find()` and `.filter()` on `children_with_tokens()` iterator results, to satisfy Rust's borrow checker (avoids "returns value referencing function parameter" error).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect indentation stripping of mid-line content after interpolations**
- **Found during:** Task 2 (E2E test run for `e2e_heredoc_interp`)
- **Issue:** `apply_heredoc_content()` was using `line[trim_level..]` unconditionally when `line.len() >= trim_level`, even for lines without leading whitespace (e.g., `, "name": "` after an interpolation boundary). This stripped 4 non-whitespace chars from the segment, producing `me": "` instead of `, "name": "`.
- **Fix:** Changed the stripping logic to count actual leading whitespace chars first. Only strip if the line starts with `>= trim_level` whitespace chars; if it has partial whitespace, strip only what's there; if no leading whitespace, leave it as-is.
- **Files modified:** `crates/mesh-codegen/src/mir/lower.rs` (apply_heredoc_content)
- **Committed in:** cc1928a2 (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed Rust borrow error with as_token() in iterator chains**
- **Found during:** Task 1 (first cargo build attempt)
- **Issue:** `children_with_tokens().find(|c| ...).and_then(|c| c.as_token())` returned a value referencing the `c` parameter, causing E0515 borrow error.
- **Fix:** Replaced `.find(|c| c.kind() == ...).and_then(|c| c.as_token())` with `.filter_map(|c| c.into_token()).find(|t| t.kind() == ...)` — using `into_token()` which takes ownership.
- **Files modified:** `crates/mesh-codegen/src/mir/lower.rs` (lower_string_expr)
- **Committed in:** f9fbe997 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 logic bug + Rule 3 Rust borrow error)
**Impact on plan:** Both fixed inline. Semantics match the plan exactly.

## Issues Encountered

Pre-existing test failures in `e2e_http_crash_isolation` and `e2e_http_server_runtime` (HTTP header parsing issue unrelated to heredocs) were verified to exist before our changes. These are out of scope and not modified.

## User Setup Required

None.

## Next Phase Readiness

- `"""..."""` heredocs fully operational: trimIndent, trailing newline strip, `#{expr}` interpolation
- All STRG-01 (#{} in regular strings), STRG-02 (heredoc), and STRG-03 (heredoc + interpolation) requirements are complete
- Phase 118 can proceed with any further string feature work

---
*Phase: 117-string-interpolation-heredocs*
*Completed: 2026-02-26*

## Self-Check: PASSED

- FOUND: crates/mesh-codegen/src/mir/lower.rs
- FOUND: tests/e2e/heredoc_basic.mpl
- FOUND: tests/e2e/heredoc_interp.mpl
- FOUND: crates/meshc/tests/e2e.rs
- FOUND: .planning/phases/117-string-interpolation-heredocs/117-02-SUMMARY.md
- FOUND commit: f9fbe997 (Task 1)
- FOUND commit: cc1928a2 (Task 2)
