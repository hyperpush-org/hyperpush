# S02: Trailing Commas & Multiline Imports

**Goal:** Parenthesized multiline imports (`from Module import (\n  a,\n  b\n)`) parse and compile correctly; trailing commas in function call args have test coverage; the formatter handles both features.
**Demo:** New e2e tests pass for multiline parenthesized imports and trailing comma calls; `cargo run -p meshc -- build reference-backend && cargo run -p meshc -- build mesher` still succeeds; `cargo test -p mesh-fmt --lib` passes with new formatter tests.

## Must-Haves

- `from Module import (\n  a,\n  b\n)` parses into the same AST shape as `from Module import a, b` (R018)
- Trailing comma variant `from Module import (a, b,)` also parses correctly (R018)
- Trailing commas in function call args `fn_call(a, b,)` confirmed by e2e tests (R019)
- Formatter emits parenthesized multiline imports with one name per line when parens are present
- Formatter suppresses trailing space before `)` after a trailing comma
- All existing e2e tests (308+ passing) still pass
- Both dogfood codebases still build clean

## Verification

- `cargo test -p mesh-parser --lib` — parser snapshot tests pass including new paren import cases
- `cargo test -p meshc --test e2e` — all e2e tests pass, including new multiline import and trailing comma tests
- `cargo test -p mesh-fmt --lib` — formatter tests pass including new paren import formatting tests
- `cargo run -p meshc -- build reference-backend` — still builds
- `cargo run -p meshc -- build mesher` — still builds
- `cargo test -p mesh-parser --test parser_tests from_import_paren` — parenthesized import parse-error diagnostics are clear on malformed input

## Observability / Diagnostics

- **Parse errors:** Malformed parenthesized imports (`from M import (a, b` without closing paren) emit a clear `expected R_PAREN` diagnostic with span info — the same error surface as other delimiter mismatches.
- **Failure visibility:** Snapshot tests pin the exact CST shape, so any accidental regression in the import-list node structure will show a diff in CI.
- **No runtime signals:** This is a compile-time-only feature; no runtime observability changes.

## Tasks

- [x] **T01: Parse parenthesized imports and add e2e tests for both features** `est:45m`
  - Why: R018 is blocked — the parser rejects `(` after `import`. R019 already works but has zero test coverage. Both need e2e proof.
  - Files: `compiler/mesh-parser/src/parser/items.rs`, `compiler/mesh-parser/tests/parser_tests.rs`, `compiler/meshc/tests/e2e.rs`
  - Do: In `parse_from_import_decl`, after consuming `import`, check `p.at(L_PAREN)` — if true, advance (bumps `paren_depth`, making newlines insignificant). Parse name list as before. Add `R_PAREN` to the break condition after comma. After loop, expect `R_PAREN`. Add parser snapshot tests for: paren single-line, paren multiline, paren with trailing comma. Add e2e tests using `compile_multifile_and_run` for: paren import basic, paren import multiline, paren import trailing comma, trailing comma in fn call single-line, trailing comma in fn call multiline.
  - Verify: `cargo test -p mesh-parser --lib && cargo test -p meshc --test e2e multiline_import && cargo test -p meshc --test e2e trailing_comma && cargo run -p meshc -- build reference-backend && cargo run -p meshc -- build mesher`
  - Done when: All new tests pass, all existing 308+ passing e2e tests still pass, both dogfood codebases build.

- [ ] **T02: Formatter support for parenthesized imports and trailing comma cleanup** `est:30m`
  - Why: Without formatter support, `meshc fmt` will collapse parenthesized imports or produce malformed output. Trailing commas currently produce `a, b, )` with an ugly space — needs suppression.
  - Files: `compiler/mesh-fmt/src/walker.rs`
  - Do: In `walk_from_import_decl`, add explicit `L_PAREN`/`R_PAREN` arms. When parens are detected, emit names on separate indented lines (hardline between names) to preserve the multiline intent. In `walk_paren_list`, suppress the trailing space after COMMA when the next sibling token is `R_PAREN`. Add formatter unit tests: paren import single-line → multiline output, paren import multiline → preserved multiline, trailing comma in arg list → clean `, )` without extra space.
  - Verify: `cargo test -p mesh-fmt --lib && cargo test -p meshc --test e2e`
  - Done when: New formatter tests pass, all existing formatter tests pass, all e2e tests still pass.

## Files Likely Touched

- `compiler/mesh-parser/src/parser/items.rs`
- `compiler/mesh-parser/tests/parser_tests.rs`
- `compiler/mesh-parser/tests/snapshots/` (new snapshot files)
- `compiler/meshc/tests/e2e.rs`
- `compiler/mesh-fmt/src/walker.rs`
