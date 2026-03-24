---
estimated_steps: 4
estimated_files: 3
skills_used:
  - debug-like-expert
  - test
---

# T01: Route PATH nodes through dot-aware formatter logic

**Slice:** S01 — Formatter dot-path and multiline import fix
**Milestone:** M029

## Description

Localize the formatter fix to `PATH` nodes so dotted module names stop going through generic inline spacing. This task owns the root-cause code change and the first exact-output regressions in the formatter itself.

## Steps

1. Read `compiler/mesh-fmt/src/walker.rs` around the dispatcher, `walk_from_import_decl`, `walk_import_list`, and `walk_tokens_inline`, then confirm how `compiler/mesh-parser/src/parser/items.rs` reuses `PATH` for both imports and qualified impl headers.
2. Implement a dedicated `PATH` formatting path in `compiler/mesh-fmt/src/walker.rs` and route `SyntaxKind::PATH` to it instead of the generic inline spacer.
3. Add walker-level exact-output tests for `from Api.Router import build_router`, `from Api.Router import ( ... )`, and `impl Foo.Bar for Baz.Qux do ... end` in `compiler/mesh-fmt/src/walker.rs`.
4. Run `cargo test -q -p mesh-fmt --lib` and keep the task scoped to localized `PATH` behavior unless a failing proof forces broader formatter changes.

## Must-Haves

- [ ] `PATH` no longer relies on generic `walk_tokens_inline` spacing for dotted names.
- [ ] Import module paths and qualified impl headers both format as `Foo.Bar`, never `Foo. Bar`.
- [ ] Parenthesized import formatting still uses the existing multiline import path and stays green under the formatter lib suite.

## Verification

- `cargo test -q -p mesh-fmt --lib`
- Walker-level expectations in `compiler/mesh-fmt/src/walker.rs` include `from Api.Router import (` and `impl Foo.Bar for Baz.Qux do`

## Inputs

- `compiler/mesh-fmt/src/walker.rs` — current dispatcher and formatter helpers that mishandle `PATH`
- `compiler/mesh-parser/src/parser/items.rs` — parser evidence that imports and impl headers both reuse `PATH`
- `compiler/mesh-fmt/src/lib.rs` — existing formatter regression surface to keep consistent with the localized fix

## Expected Output

- `compiler/mesh-fmt/src/walker.rs` — dedicated `PATH` formatting logic plus exact-output unit regressions for dotted imports and qualified impl headers

## Observability Impact

- The future inspection surface for this task is the walker-level exact-output test suite in `compiler/mesh-fmt/src/walker.rs`; when `PATH` formatting regresses, the failing assertions should show the exact spaced output (`Foo. Bar`) versus the canonical expected output (`Foo.Bar`).
- `SyntaxKind::PATH` formatting becomes locally inspectable in one dispatcher branch instead of being hidden inside generic inline token spacing, which reduces the search space for future formatter regressions.
- This task adds no runtime logs and must not emit secrets; diagnostics stay confined to formatter unit-test output and `meshc fmt --check` diffs.
