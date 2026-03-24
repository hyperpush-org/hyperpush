---
id: T01
parent: S02
milestone: M031
provides:
  - Parenthesized import parsing (single-line, multiline, trailing comma)
  - E2e test coverage for parenthesized imports and trailing-comma function calls
key_files:
  - compiler/mesh-parser/src/parser/items.rs
  - compiler/mesh-parser/tests/parser_tests.rs
  - compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren.snap
  - compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren_trailing_comma.snap
  - compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren_multiline.snap
  - compiler/meshc/tests/e2e.rs
key_decisions:
  - Reused existing paren_depth mechanism for newline insignificance inside parenthesized imports rather than adding a new parser mode
patterns_established:
  - Optional delimiter wrapping in item parsers — check for L_PAREN, track has_parens bool, expect R_PAREN at end
observability_surfaces:
  - Parse errors on malformed paren imports emit "expected R_PAREN" with span info
  - Snapshot tests pin exact CST node structure for regression detection
duration: 15m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Parse parenthesized imports and add e2e tests for both features

**Added optional parenthesized form to `parse_from_import_decl` and 5 new e2e tests covering paren imports and trailing-comma calls**

## What Happened

Modified `parse_from_import_decl` in `items.rs` to optionally consume `L_PAREN` before the import name list and `R_PAREN` after. The `L_PAREN` advance naturally bumps the parser's `paren_depth`, making newlines insignificant inside the parens. Added `R_PAREN` to the trailing-comma break condition so the loop terminates cleanly for both forms. The resulting CST shape (`FROM_IMPORT_DECL` → `IMPORT_LIST` → `NAME` nodes) is identical to the non-paren form, with the parens appearing as leaf tokens in the `IMPORT_LIST`.

Added 3 parser snapshot tests (paren basic, paren trailing comma, paren multiline) and 5 e2e tests (3 paren import variants + 2 trailing-comma call variants). All pass. The full e2e suite shows 313 passed / 10 failed — same 10 pre-existing `try`-related failures, no regressions. Both `reference-backend` and `mesher` build clean.

## Verification

- `cargo test -p mesh-parser --lib` — 17 passed
- `cargo test -p mesh-parser --test parser_tests` — 241 passed (3 new snapshot tests included)
- `cargo test -p meshc --test e2e multiline_import` — 3 new tests passed
- `cargo test -p meshc --test e2e trailing_comma_call` — 2 new tests passed
- `cargo test -p meshc --test e2e` — 313 passed, 10 failed (pre-existing)
- `cargo run -p meshc -- build reference-backend` — success
- `cargo run -p meshc -- build mesher` — success

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p mesh-parser --lib` | 0 | ✅ pass | 3.2s |
| 2 | `cargo test -p mesh-parser --test parser_tests` | 0 | ✅ pass | 7.3s |
| 3 | `cargo test -p meshc --test e2e multiline_import` | 0 | ✅ pass | 24.6s |
| 4 | `cargo test -p meshc --test e2e trailing_comma_call` | 0 | ✅ pass | 28.0s |
| 5 | `cargo test -p meshc --test e2e` | 101 | ✅ pass (313 ok, 10 pre-existing failures) | 205s |
| 6 | `cargo run -p meshc -- build reference-backend` | 0 | ✅ pass | 10.7s |
| 7 | `cargo run -p meshc -- build mesher` | 0 | ✅ pass | 15.6s |

## Diagnostics

- Malformed paren imports (missing closing paren) produce `expected R_PAREN` parse error with source span.
- Snapshot files in `compiler/mesh-parser/tests/snapshots/` pin exact CST structure — any regression shows as a snapshot diff.
- No runtime diagnostics — this is a compile-time-only feature.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `compiler/mesh-parser/src/parser/items.rs` — Added optional `L_PAREN`/`R_PAREN` handling in `parse_from_import_decl`
- `compiler/mesh-parser/tests/parser_tests.rs` — Added 3 snapshot tests for parenthesized import variants
- `compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren.snap` — New snapshot for `from Math import (sqrt, pow)`
- `compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren_trailing_comma.snap` — New snapshot for trailing comma variant
- `compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren_multiline.snap` — New snapshot for multiline variant
- `compiler/meshc/tests/e2e.rs` — Added 5 e2e tests (3 paren import + 2 trailing-comma call)
