---
id: S02
milestone: M031
title: "Trailing Commas & Multiline Imports"
status: done
started: 2026-03-24
completed: 2026-03-24
tasks_completed: 2
tasks_total: 2
---

# S02: Trailing Commas & Multiline Imports

## What This Slice Delivered

Parenthesized multiline imports and trailing-comma formatting support in the Mesh parser and formatter.

**Parser (T01):** `parse_from_import_decl` in `compiler/mesh-parser/src/parser/items.rs` now checks for `L_PAREN` after `import` and enters paren-delimited mode. This reuses the existing `paren_depth` mechanism — bumping paren depth makes newlines insignificant inside the import list, so `from Module import (\n  a,\n  b\n)` parses into the same AST shape as `from Module import a, b`. Trailing commas before `)` are accepted. Three parser snapshot tests pin the exact CST structure for single-line paren, multiline paren, and trailing-comma paren imports.

**Formatter (T02):** A dedicated `walk_import_list` function in `compiler/mesh-fmt/src/walker.rs` handles the `IMPORT_LIST` node. When parens are detected among children, it emits names on separate indented lines inside `(\n  name1,\n  name2\n)`. Non-paren imports fall through to `walk_tokens_inline` unchanged. `walk_paren_list` now suppresses trailing space after COMMA when the next non-trivia sibling is `R_PAREN`, so `fn_call(a, b,)` formats cleanly. Four formatter unit tests pin the exact output.

**E2e tests (T01):** Five new e2e tests cover the feature surface: `multiline_import_paren_basic`, `multiline_import_paren_multiline`, `multiline_import_paren_trailing_comma`, `trailing_comma_call_single_line`, `trailing_comma_call_multiline`.

## What Changed

| File | Change |
|------|--------|
| `compiler/mesh-parser/src/parser/items.rs` | Paren-delimited import parsing in `parse_from_import_decl` |
| `compiler/mesh-parser/tests/parser_tests.rs` | 3 new snapshot tests for paren imports |
| `compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren.snap` | New snapshot |
| `compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren_trailing_comma.snap` | New snapshot |
| `compiler/mesh-parser/tests/snapshots/parser_tests__from_import_paren_multiline.snap` | New snapshot |
| `compiler/meshc/tests/e2e.rs` | 5 new e2e tests for multiline imports and trailing commas |
| `compiler/mesh-fmt/src/walker.rs` | `walk_import_list` function, `IMPORT_LIST` routing, trailing-comma space suppression in `walk_paren_list`, 4 unit tests |

## Patterns Established

- **Optional delimiter wrapping in item parsers:** Check for `L_PAREN`, track a `has_parens` bool, expect `R_PAREN` at end. Reuse `paren_depth` for newline insignificance inside delimiters rather than adding parser modes.
- **Paren-aware formatter node handlers:** Check first child for `L_PAREN`, collect name nodes, emit hardline-separated indent block; fall through to `walk_tokens_inline` for the non-paren form.

## What the Next Slice Should Know

- S03 (reference-backend cleanup) and S04 (mesher cleanup) can now use `from Module import (\n  a,\n  b\n)` for long import lines. The 310-character mesher import lines are the most obvious candidates.
- Trailing commas in function calls already worked at the parser level before this slice — S02 added e2e test coverage and formatter handling.
- The CST places `L_PAREN`/`R_PAREN` inside `IMPORT_LIST`, not as direct children of `FROM_IMPORT_DECL`. Future formatter work on import-related nodes should look at that level.
- 10 pre-existing `try_*`/`from_try_*` e2e test failures remain (runtime crashes, exit code None). Unrelated to S02 or S01 work.

## Verification Evidence

| # | Check | Result |
|---|-------|--------|
| 1 | `cargo test -p mesh-parser --lib` | 17 passed |
| 2 | `cargo test -p mesh-parser --test parser_tests from_import_paren` | 3 passed |
| 3 | `cargo test -p mesh-fmt --lib` | 119 passed |
| 4 | `cargo test -p meshc --test e2e multiline_import` | 3 passed |
| 5 | `cargo test -p meshc --test e2e trailing_comma` | 3 passed |
| 6 | `cargo test -p meshc --test e2e` (full) | 313 passed, 10 pre-existing failures |
| 7 | `cargo run -p meshc -- build reference-backend` | success |
| 8 | `cargo run -p meshc -- build mesher` | success |
