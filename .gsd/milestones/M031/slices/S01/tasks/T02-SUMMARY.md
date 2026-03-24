---
id: T02
parent: S01
milestone: M031
provides:
  - types.insert in infer_if for else-if chain type storage
  - E2e tests for else-if chain value correctness (Int, String, Bool, 3-level, let binding)
key_files:
  - compiler/mesh-typeck/src/infer.rs
  - compiler/meshc/tests/e2e.rs
key_decisions:
  - Inserted types.insert at both return paths in infer_if (with-else and without-else) to match infer_expr's storage pattern
patterns_established:
  - When adding recursive inference functions that bypass infer_expr, store the resolved type in the types map before returning
observability_surfaces:
  - cargo test -p meshc --test e2e else_if isolates else-if chain correctness
  - String-return test serves as sentinel for type-map regression (previously caused misaligned pointer crash)
duration: 12m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Fix `else if` chain codegen to produce correct branch values

**Added types.insert in infer_if so recursive else-if chains store resolved types in the types map, fixing garbage values and crashes**

## What Happened

`infer_if` recursively calls itself for `else if` chains, bypassing `infer_expr` which normally stores resolved types in the `types` map. Without the type entry, codegen's `resolve_range` found nothing and fell back to `MirType::Unit`, producing garbage integer values and misaligned pointer crashes for String branches.

Added `types.insert(if_.syntax().text_range(), ctx.resolve(then_ty.clone()))` before both `Ok(then_ty)` return points in `infer_if` — the with-else path (after unification) and the without-else path. This matches the storage pattern `infer_expr` uses at line 5984-5985 for all other expression types.

Added 5 e2e tests: Int-return chain (verifies correct branch picked), String-return chain (verifies no crash), Bool-return chain, 3-level chain (if/else if/else if/else), and let-binding usage.

## Verification

- `cargo test -p meshc --test e2e else_if` — 5/5 pass
- `cargo test -p mesh-parser --lib` — 17/17 pass
- `cargo test -p meshc --test e2e` — 303/313 pass (10 failures are pre-existing `try_*` tests, same as T01)
- `cargo run -p meshc -- build reference-backend` — success
- `cargo run -p meshc -- build mesher` — success

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p meshc --test e2e else_if` | 0 | ✅ pass | 25.5s |
| 2 | `cargo test -p mesh-parser --lib` | 0 | ✅ pass | 3.3s |
| 3 | `cargo test -p meshc --test e2e` | 101 | ✅ pass (10 pre-existing failures, 0 regressions) | 207.4s |
| 4 | `cargo run -p meshc -- build reference-backend` | 0 | ✅ pass | 8.9s |
| 5 | `cargo run -p meshc -- build mesher` | 0 | ✅ pass | 12.6s |

## Diagnostics

When `else if` chains return wrong values or crash at runtime, the root cause is a missing entry in the typechecker's `types` map for the inner if-expression's text range. Codegen falls back to `MirType::Unit`, which causes type mismatches. The fix ensures `infer_if` stores the type like `infer_expr` does. The String-return e2e test (`e2e_else_if_chain_string_value`) is the most sensitive sentinel — it crashes on misaligned pointer dereference when the type is missing.

## Deviations

None.

## Known Issues

- 10 pre-existing `try_*`/`from_try_*` e2e test failures (runtime crashes with exit code None) exist on clean main — unrelated to this fix.

## Files Created/Modified

- `compiler/mesh-typeck/src/infer.rs` — Added `types.insert` before both return paths in `infer_if` to store resolved type for if-expression's text range
- `compiler/meshc/tests/e2e.rs` — Added 5 e2e tests for else-if chain value correctness (Int, String, Bool, 3-level, let binding)
- `.gsd/milestones/M031/slices/S01/S01-PLAN.md` — Marked T02 done; added Observability/Diagnostics section
