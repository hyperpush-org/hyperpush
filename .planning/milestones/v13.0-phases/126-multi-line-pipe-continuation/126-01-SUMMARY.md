---
phase: 126-multi-line-pipe-continuation
plan: 01
subsystem: parser
tags: [parser, pipe, multi-line, tdd, snapshot-tests]
dependency_graph:
  requires: []
  provides: [trailing-pipe-continuation, PIPE-01-parser]
  affects: [compiler/mesh-parser]
tech_stack:
  added: []
  patterns: [pratt-parser, tdd-red-green, insta-snapshots]
key_files:
  created:
    - compiler/mesh-parser/tests/snapshots/parser_tests__pipe_multiline_leading.snap
    - compiler/mesh-parser/tests/snapshots/parser_tests__pipe_multiline_trailing.snap
    - compiler/mesh-parser/tests/snapshots/parser_tests__pipe_multiline_chain_leading.snap
    - compiler/mesh-parser/tests/snapshots/parser_tests__pipe_multiline_chain_trailing.snap
    - compiler/mesh-parser/tests/snapshots/parser_tests__slot_pipe_multiline_leading.snap
    - compiler/mesh-parser/tests/snapshots/parser_tests__slot_pipe_multiline_trailing.snap
  modified:
    - compiler/mesh-parser/src/parser/expressions.rs
    - compiler/mesh-parser/src/parser/mod.rs
    - compiler/mesh-parser/tests/parser_tests.rs
key_decisions:
  - Made is_newline_insignificant pub(crate) rather than adding a new method — minimal change, same effect
  - Inserted trailing-pipe skip after p.advance() in expr_bp infix branch — keeps leading-pipe logic unchanged
metrics:
  duration: 4m 7s
  completed: "2026-02-27"
  tasks_completed: 2
  files_modified: 8
requirements_satisfied:
  - PIPE-01
---

# Phase 126 Plan 01: Multi-line Pipe Continuation (Parser) Summary

Trailing-pipe multi-line continuation added to the Pratt parser, enabling `x |>\n  f()` symmetrically with the existing leading-pipe form `x\n  |> f()`.

## What Was Built

Extended `expr_bp` in the Pratt parser to skip newlines after consuming a `|>` or `|N>` infix operator when at the top level (outside delimiters). Previously, a NEWLINE after `|>` caused "expected expression" parse errors. Now both forms produce identical AST structure.

### Implementation

In `compiler/mesh-parser/src/parser/expressions.rs`, after `p.advance()` (consuming the pipe operator) in the infix branch:

```rust
// ── Trailing-pipe newline skip ──
// If the operator just consumed is |> or |N> and we are outside
// delimiters (newlines are significant), skip any newlines before
// parsing the RHS. This allows: `x |>\n  f()`.
if matches!(current, SyntaxKind::PIPE | SyntaxKind::SLOT_PIPE)
    && !p.is_newline_insignificant()
{
    p.skip_newlines_for_continuation();
}
```

In `compiler/mesh-parser/src/parser/mod.rs`, changed `fn is_newline_insignificant` to `pub(crate) fn is_newline_insignificant` so it is accessible from `expressions.rs`.

## Tests Added (6 snapshot tests)

| Test | Input | Purpose |
|------|-------|---------|
| `pipe_multiline_leading` | `x\n  \|> foo()` | Regression: leading-pipe still works |
| `pipe_multiline_trailing` | `x \|>\n  foo()` | New: trailing-pipe form |
| `pipe_multiline_chain_leading` | `x\n  \|> foo()\n  \|> bar()` | Regression: leading chain |
| `pipe_multiline_chain_trailing` | `x \|>\n  foo() \|>\n  bar()` | New: trailing chain |
| `slot_pipe_multiline_leading` | `x\n  \|2> foo(1)` | Regression: slot leading |
| `slot_pipe_multiline_trailing` | `x \|2>\n  foo(1)` | New: slot trailing |

## Verification

- `cargo test -p mesh-parser`: 237 passed, 0 failed
- `pipe_multiline_trailing` snapshot produces PIPE_EXPR with same child structure as `pipe_simple` (NAME_REF + PIPE + CALL_EXPR), with NEWLINE trivia preserved losslessly
- `slot_pipe_multiline_trailing` produces SLOT_PIPE_EXPR with correct children
- No regressions in any existing tests

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files verified:
- compiler/mesh-parser/src/parser/expressions.rs: FOUND
- compiler/mesh-parser/src/parser/mod.rs: FOUND
- compiler/mesh-parser/tests/parser_tests.rs: FOUND
- All 6 new snapshot files: FOUND

Commits verified:
- 8e92c8c8 (RED tests)
- 83695737 (GREEN implementation + snapshots)
