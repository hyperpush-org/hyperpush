---
plan: 132-01
phase: 132
status: complete
---

# Plan 132-01 Summary: Frontend Pipeline — Lexer, Parser, Type Checker

## What Was Built

Added the `json` keyword through the full compiler frontend: lexer token, syntax kinds, AST nodes with field accessors, parser grammar, and type inference returning a `Json` newtype.

## Key Files Created/Modified

### key-files.modified
- `compiler/mesh-common/src/token.rs` — Added `JsonKw` token kind and `"json"` keyword mapping
- `compiler/mesh-parser/src/syntax_kind.rs` — Added `JSON_KW`, `JSON_EXPR`, `JSON_FIELD` syntax kinds and `TokenKind::JsonKw => SyntaxKind::JSON_KW` mapping
- `compiler/mesh-parser/src/ast/expr.rs` — Added `JsonExpr(JsonExpr)` variant to `Expr` enum, `JsonExpr` AST node with `fields()` iterator, and `JsonField` with `key_text()` and `value()` methods
- `compiler/mesh-parser/src/parser/expressions.rs` — Added `parse_json_literal` function dispatched from `parse_atom` on `JSON_KW`; supports empty `json {}`, multi-line, and error recovery on non-identifier keys
- `compiler/mesh-typeck/src/ty.rs` — Added `Ty::json()` constructor returning `Con("Json")` newtype
- `compiler/mesh-typeck/src/unify.rs` — Added `json_string_compatible()` rule enabling Json→String coercion at call sites
- `compiler/mesh-typeck/src/infer.rs` — Added `infer_json_expr()` returning `Ty::json()` with per-field type checking
- `compiler/mesh-codegen/src/mir/lower.rs` — Added `Expr::JsonExpr` stub arm (full codegen in 132-02)

## Decisions Made

- `Json` is represented as `Ty::Con(TyCon::new("Json"))` — a named newtype, not `Ty::String`; this allows codegen to detect it by name and embed nested values raw
- `json_string_compatible()` in unify.rs makes Json↔String bidirectionally compatible, so `HTTP.response(200, json { ... })` works without explicit conversion
- The codegen stub uses `todo!()` so the frontend can be tested independently before 132-02

## Self-Check: PASSED

- `cargo check --workspace` — zero errors
- `cargo test -p mesh-common` — 23 tests pass (includes keyword_from_str test)
- `cargo test -p mesh-parser -p mesh-typeck` — all tests pass, no regressions
