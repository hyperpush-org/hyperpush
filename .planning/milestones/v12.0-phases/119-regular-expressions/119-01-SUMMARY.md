---
phase: 119-regular-expressions
plan: "01"
subsystem: compiler
tags: [regex, lexer, parser, typeck, codegen, mir, syntax, ast]

# Dependency graph
requires:
  - phase: 116-slot-pipe-operator
    provides: SlotPipeExpr pattern to follow for new expression types
  - phase: 115-tracking-corrections-and-api-acceptance
    provides: stable v11.0 compiler baseline

provides:
  - RegexLiteral(String, String) token variant in mesh-common/token.rs
  - REGEX_LITERAL (token) and REGEX_EXPR (node) SyntaxKind variants
  - Lexer ~r/pattern/flags recognition producing RegexLiteral tokens
  - RegexExpr AST node with pattern() and flags() extraction methods
  - Parser lhs() branch: REGEX_LITERAL -> REGEX_EXPR node
  - Type inference: Expr::RegexExpr => Ty::Con("Regex")
  - Regex type registered in builtins.rs type environment
  - MIR lowering: Expr::RegexExpr -> mesh_regex_from_literal(pattern, flags_bitmask)
  - mesh_regex_from_literal registered in known_functions and map_builtin_name
  - "Regex" added to STDLIB_MODULES list

affects:
  - 119-02 (runtime implementation of mesh_regex_from_literal)
  - 119-03 (E2E tests using ~r/pattern/flags in Mesh programs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Regex literal desugars to mesh_regex_from_literal(pattern_str, flags_bitmask) at MIR level"
    - "Flags bitmask encoding: i=1, m=2, s=4 (bitwise OR for combinations like 'ims' -> 7)"
    - "RegexExpr.pattern()/flags() parse token source text ~r/pat/flags via backslash-aware scan"
    - "New token/node kinds follow SlotPipe/AtomLiteral pattern established in prior phases"

key-files:
  modified:
    - crates/mesh-common/src/token.rs
    - crates/mesh-lexer/src/lib.rs
    - crates/mesh-parser/src/syntax_kind.rs
    - crates/mesh-parser/src/ast/expr.rs
    - crates/mesh-parser/src/parser/expressions.rs
    - crates/mesh-typeck/src/infer.rs
    - crates/mesh-typeck/src/builtins.rs
    - crates/mesh-codegen/src/mir/lower.rs
  created: []

key-decisions:
  - "RegexExpr.pattern()/flags() parse source text rather than carrying TokenKind payload fields (CST stores text, payload not accessible from SyntaxToken)"
  - "Flags bitmask i=1, m=2, s=4 chosen for compactness; only these three flags are valid (g/x and others produce lexer Error)"
  - "mesh_regex_from_literal call site wired in Plan 01; runtime symbol added in Plan 02"
  - "Regex type registered in builtins.rs as Scheme::mono(Ty::Con('Regex')) for annotation support"

patterns-established:
  - "Regex literal uses backslash-aware closing-delimiter scan in both lexer and AST (consistent handling of escaped slashes)"

requirements-completed:
  - REGEX-01

# Metrics
duration: 6min
completed: 2026-02-26
---

# Phase 119 Plan 01: Regular Expressions Summary

**~r/pattern/flags regex literal wired through lexer, parser, AST, type checker, and MIR lowerer with mesh_regex_from_literal call site**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-26T02:08:12Z
- **Completed:** 2026-02-26T02:14:12Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Full lexer support for ~r/pattern/flags: '~' dispatch, lex_regex_literal() method with backslash-aware pattern scanning, flag validation (only i/m/s valid)
- Complete token-to-MIR pipeline: RegexLiteral token -> REGEX_EXPR CST node -> Expr::RegexExpr AST -> Ty::Con("Regex") -> MirExpr::Call { mesh_regex_from_literal }
- Regex type registered in type environment (builtins.rs) and "Regex" added to STDLIB_MODULES
- All 700+ existing tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RegexLiteral token, REGEX_LITERAL/REGEX_EXPR SyntaxKinds, and lexer ~r/pat/flags support** - `0715b038` (feat)
2. **Task 2: Add RegexExpr AST node, parser lhs() branch, typeck inference, and MIR lowering** - `41cc4429` (feat)

## Files Created/Modified

- `crates/mesh-common/src/token.rs` - Added TokenKind::RegexLiteral(String, String) variant (literals: 8->9)
- `crates/mesh-lexer/src/lib.rs` - Added '~' dispatch and lex_regex_literal() with backslash-aware scan
- `crates/mesh-parser/src/syntax_kind.rs` - Added REGEX_LITERAL token kind, REGEX_EXPR node kind, From conversion
- `crates/mesh-parser/src/ast/expr.rs` - Added Expr::RegexExpr variant, RegexExpr struct, pattern()/flags() methods
- `crates/mesh-parser/src/parser/expressions.rs` - Added REGEX_LITERAL -> REGEX_EXPR lhs() branch
- `crates/mesh-typeck/src/infer.rs` - Added Expr::RegexExpr => Ty::Con("Regex") inference arm
- `crates/mesh-typeck/src/builtins.rs` - Registered Regex type for annotations
- `crates/mesh-codegen/src/mir/lower.rs` - Added MIR lowering, known_functions entry, map_builtin_name, STDLIB_MODULES

## Decisions Made

- RegexExpr.pattern() and flags() parse the CST source text (e.g. "~r/pat/ims") rather than accessing TokenKind fields, because the CST only stores text spans (SyntaxToken doesn't carry the Rust enum payload). This is consistent with how AtomLiteral.atom_text() works.
- Only 'i', 'm', 's' flags are valid; any other ASCII letter causes the lexer to emit an Error token.
- The mesh_regex_from_literal call site is wired in Plan 01 but the runtime symbol is added in Plan 02 (the binary won't link until 119-02 is complete, but the compiler pipeline is complete).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The Rust compiler caught an unused import warning (RegexExpr type was imported but not needed as a standalone type since pattern matching on enum variants doesn't require explicit type imports). Fixed inline.

## Next Phase Readiness

- Phase 119-02: mesh_regex_from_literal C runtime implementation is unblocked
- Phase 119-03: E2E tests using ~r/pattern/flags syntax are unblocked
- The compiler correctly handles ~r/pat/flags in all expression positions (let binding, function call arg, match arm)

---
*Phase: 119-regular-expressions*
*Completed: 2026-02-26*

## Self-Check: PASSED

- FOUND: crates/mesh-common/src/token.rs (contains RegexLiteral)
- FOUND: crates/mesh-lexer/src/lib.rs (contains lex_regex_literal)
- FOUND: crates/mesh-parser/src/syntax_kind.rs (contains REGEX_LITERAL, REGEX_EXPR)
- FOUND: crates/mesh-parser/src/ast/expr.rs (contains RegexExpr)
- FOUND: crates/mesh-parser/src/parser/expressions.rs (contains REGEX_LITERAL branch)
- FOUND: crates/mesh-typeck/src/infer.rs (contains RegexExpr arm)
- FOUND: crates/mesh-typeck/src/builtins.rs (contains Regex type registration)
- FOUND: crates/mesh-codegen/src/mir/lower.rs (contains mesh_regex_from_literal, Regex in STDLIB_MODULES)
- FOUND: .planning/phases/119-regular-expressions/119-01-SUMMARY.md
- FOUND commits: 0715b038, 41cc4429
