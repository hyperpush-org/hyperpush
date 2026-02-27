---
phase: 116-slot-pipe-operator
plan: "01"
subsystem: lexer-parser
tags: [lexer, parser, ast, slot-pipe, token]
dependency_graph:
  requires: []
  provides: [SlotPipe-token, SLOT_PIPE_EXPR-node, SlotPipeExpr-ast]
  affects: [mesh-common, mesh-lexer, mesh-parser, mesh-typeck, mesh-codegen]
tech_stack:
  added: []
  patterns: [pratt-parser, ast-node-macro, infix-binding-power]
key_files:
  created: []
  modified:
    - crates/mesh-common/src/token.rs
    - crates/mesh-lexer/src/lib.rs
    - crates/mesh-parser/src/syntax_kind.rs
    - crates/mesh-parser/src/ast/expr.rs
    - crates/mesh-parser/src/parser/expressions.rs
    - crates/mesh-typeck/src/infer.rs
    - crates/mesh-codegen/src/mir/lower.rs
decisions:
  - "|0> and |1> emit TokenKind::Error at lex time (hard error by design, not recoverable parse error)"
  - "SlotPipe uses same Pratt binding power (3, 4) as Pipe -- they chain with equal precedence"
  - "todo!() placeholders added to mesh-typeck and mesh-codegen to unblock builds until Plan 02"
metrics:
  duration: "4min"
  completed: "2026-02-25"
  tasks_completed: 2
  files_modified: 7
---

# Phase 116 Plan 01: Slot Pipe Lexer and Parser Summary

SlotPipe(u32) token emitted by lexer for `|N>` patterns (N >= 2), with SLOT_PIPE_EXPR CST node and SlotPipeExpr AST node exposing lhs(), slot(), rhs() accessors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Lexer: emit SlotPipe(n) token for |N> syntax | d77d1de3 | mesh-common/token.rs, mesh-lexer/lib.rs |
| 2 | Parser + AST: SLOT_PIPE_EXPR node with slot() accessor | 346358ba | syntax_kind.rs, expr.rs, expressions.rs, infer.rs, lower.rs |

## What Was Built

### Task 1: Lexer
- Added `SlotPipe(u32)` variant to `TokenKind` enum in `mesh-common/src/token.rs` (in operators section, after `Pipe`)
- Extended `lex_pipe()` in `mesh-lexer/src/lib.rs` to handle digit sequences between `|` and `>`:
  - `|2>` → `TokenKind::SlotPipe(2)`
  - `|10>` → `TokenKind::SlotPipe(10)`
  - `|0>` → `TokenKind::Error` (0-indexed is meaningless)
  - `|1>` → `TokenKind::Error` (use `|>` for first-argument pipe)
  - `|>` → `TokenKind::Pipe` (unchanged)
  - `|` → `TokenKind::Bar` (unchanged)
- Added 6 lexer unit tests covering all cases

### Task 2: Parser + AST
- Added `SLOT_PIPE` and `SLOT_PIPE_EXPR` to `SyntaxKind` enum
- Added `TokenKind::SlotPipe(_) => SyntaxKind::SLOT_PIPE` to the `From<TokenKind>` impl
- Added `SlotPipeExpr(SlotPipeExpr)` variant to `Expr` enum
- Implemented `SlotPipeExpr` AST node with:
  - `lhs()` — first child expression (value being piped)
  - `slot()` — extracts N from the `|N>` token text via string parsing
  - `rhs()` — second child expression (function receiving piped value)
- Updated `infix_binding_power()` to return `Some((3, 4))` for `SLOT_PIPE`
- Updated `expr_bp()` kind selection to emit `SLOT_PIPE_EXPR` for `SLOT_PIPE` tokens
- Extended multi-line continuation check to handle both `PIPE | SLOT_PIPE`
- Added `todo!()` placeholders in `mesh-typeck` and `mesh-codegen` to unblock compilation

## Verification

All criteria met:
- `TokenKind::SlotPipe(u32)` exists, lexer emits it for `|N>` (N >= 2)
- `TokenKind::Error` emitted for `|0>` and `|1>`
- `SLOT_PIPE_EXPR` SyntaxKind exists, parser produces it for `x |N> f(args)`
- `SlotPipeExpr` AST node with `lhs()`, `slot()`, `rhs()` accessors implemented
- All existing pipe tests pass (no regressions)
- 36 mesh-lexer tests pass (6 new slot pipe tests)
- 231 mesh-parser tests pass (no regressions)
- Workspace builds cleanly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added todo!() placeholders in downstream crates**
- **Found during:** Task 2
- **Issue:** Adding `SlotPipeExpr` variant to `Expr` enum caused non-exhaustive match errors in `mesh-typeck/src/infer.rs` and `mesh-codegen/src/mir/lower.rs`
- **Fix:** Added `Expr::SlotPipeExpr(_) => todo!("...")` placeholder arms so workspace builds cleanly and mesh-parser tests can run
- **Files modified:** `crates/mesh-typeck/src/infer.rs`, `crates/mesh-codegen/src/mir/lower.rs`
- **Commit:** 346358ba (included in Task 2 commit)

**2. [Rule 1 - Bug] Updated token count in tests**
- **Found during:** Task 1
- **Issue:** `token_kind_variant_count` and `all_token_kinds_convert_to_syntax_kind` tests used hardcoded counts that would fail with new `SlotPipe(u32)` variant
- **Fix:** Updated operator count from 24→25, total count from 97→98 in both test files; added `TokenKind::SlotPipe(0)` to exhaustive test array
- **Files modified:** `crates/mesh-common/src/token.rs`, `crates/mesh-parser/src/syntax_kind.rs`

## Self-Check: PASSED

- FOUND: crates/mesh-common/src/token.rs
- FOUND: crates/mesh-lexer/src/lib.rs
- FOUND: crates/mesh-parser/src/syntax_kind.rs
- FOUND: crates/mesh-parser/src/ast/expr.rs
- FOUND: crates/mesh-parser/src/parser/expressions.rs
- FOUND: .planning/phases/116-slot-pipe-operator/116-01-SUMMARY.md
- FOUND commit: d77d1de3 (Task 1)
- FOUND commit: 346358ba (Task 2)
