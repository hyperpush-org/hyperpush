---
phase: 116-slot-pipe-operator
plan: "02"
subsystem: typeck-codegen
tags: [typechecker, mir-lowering, slot-pipe, e2e-tests, error-variants]

dependency_graph:
  requires:
    - phase: 116-01
      provides: SlotPipeExpr AST node with lhs(), slot(), rhs() accessors
  provides:
    - SlotPositionConflict and SlotPipeOutOfRange TypeError variants
    - infer_slot_pipe() type checker function for |N> expressions
    - lower_slot_pipe_expr() MIR desugaring of |N> to repositioned call args
    - E2E test fixtures: slot_pipe_basic.mpl, slot_pipe_chain.mpl, slot_pipe_arity_error.mpl
    - 4 e2e_slot_pipe_* test functions in crates/meshc/tests/e2e.rs
  affects: [mesh-typeck, mesh-codegen, mesh-lsp, meshc]

tech-stack:
  added: []
  patterns:
    - "Slot pipe insertion: x |N> f(a,b,c) = f(a[0..N-2], x, a[N-2..]) — insert at 0-indexed slot-1 position"
    - "Type checker mirrors infer_pipe pattern: infer callee, collect explicit args, build full_args, unify Fun type"
    - "MIR lowerer mirrors lower_pipe_expr pattern: insert lhs at actual_idx = slot-1 clamped to len"

key-files:
  created:
    - tests/e2e/slot_pipe_basic.mpl
    - tests/e2e/slot_pipe_chain.mpl
    - tests/e2e/slot_pipe_arity_error.mpl
  modified:
    - crates/mesh-typeck/src/error.rs
    - crates/mesh-typeck/src/diagnostics.rs
    - crates/mesh-typeck/src/infer.rs
    - crates/mesh-codegen/src/mir/lower.rs
    - crates/mesh-lsp/src/analysis.rs
    - crates/meshc/tests/e2e.rs

key-decisions:
  - "Slot pipe uses insertion semantics: x |2> f(a,b,c) = f(a, x, b, c) — explicit args shift, not conflict"
  - "SlotPositionConflict error variant retained in enum but not emitted in insertion case (arity unification handles mismatches)"
  - "SlotPipeOutOfRange emitted when slot > known function arity (resolved Ty::Fun params length check)"

patterns-established:
  - "New Expr variants need arms in: infer.rs (infer_expr), lower.rs (lower_expr), mesh-lsp/analysis.rs (type_error_span)"

requirements-completed: [PIPE-01, PIPE-02, PIPE-03, PIPE-04]

duration: 8min
completed: "2026-02-25"
tasks_completed: 2
files_modified: 6
---

# Phase 116 Plan 02: Slot Pipe Type Checker and MIR Lowering Summary

**SlotPipe |N> operator fully wired: type inference inserts lhs at argument position N, MIR lowering desugars to repositioned call args, with arity-range error for out-of-bounds slots.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-25T23:45:43Z
- **Completed:** 2026-02-25T23:53:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Type checker handles `x |N> f(a, b, c)` — inserts lhs_ty at 0-indexed position N-1 in the full arg list, unifies with callee type
- MIR lowering desugars `|N>` to `f(a[0..N-2], x, a[N-2..])` — exactly parallel to `lower_pipe_expr`
- Clear error message for out-of-range slots: "slot position 5 is out of range: `add` takes 2 arguments, so valid slot positions are 2–2"
- E2E tests pass: basic `10 |2> add(1)` = 11, chained `3 |2> add(2) |2> multiply(4)` = 20, arity error confirmed

## Task Commits

1. **Task 1: Type checker — error variants and infer_slot_pipe** - `37cbeb9a` (feat)
2. **Task 2: MIR lowering + E2E tests for slot pipe** - `1becf1f9` (feat)

## Files Created/Modified
- `crates/mesh-typeck/src/error.rs` - SlotPositionConflict and SlotPipeOutOfRange TypeError variants with Display impl
- `crates/mesh-typeck/src/diagnostics.rs` - Error codes E0043/E0044, ariadne rendering, JSON span rendering
- `crates/mesh-typeck/src/infer.rs` - infer_slot_pipe() function + Expr::SlotPipeExpr arm in infer_expr
- `crates/mesh-codegen/src/mir/lower.rs` - lower_slot_pipe_expr() + Expr::SlotPipeExpr arm in lower_expr
- `crates/mesh-lsp/src/analysis.rs` - SlotPositionConflict/SlotPipeOutOfRange arms in type_error_span()
- `crates/meshc/tests/e2e.rs` - 4 e2e_slot_pipe_* test functions
- `tests/e2e/slot_pipe_basic.mpl` - basic |2> test fixture
- `tests/e2e/slot_pipe_chain.mpl` - chained |2> |> test fixture
- `tests/e2e/slot_pipe_arity_error.mpl` - |5> on 2-arg function

## Decisions Made
- Slot pipe uses true insertion semantics: `x |2> f(a, b, c)` = `f(a, x, b, c)`. The plan's interfaces section described a "conflict" check at `insert_idx < explicit_arg_types.len()` that would have rejected valid programs. The test fixtures are authoritative — insertion shifts explicit args to higher positions. The arity unification catches actual mismatches.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-exhaustive match in mesh-lsp/analysis.rs**
- **Found during:** Task 2 (workspace build after adding lower_slot_pipe_expr)
- **Issue:** `type_error_span()` in mesh-lsp/analysis.rs had no arms for the two new TypeError variants, causing compilation failure
- **Fix:** Added `TypeError::SlotPositionConflict { span, .. } => Some(*span)` and `TypeError::SlotPipeOutOfRange { span, .. } => Some(*span)` arms
- **Files modified:** `crates/mesh-lsp/src/analysis.rs`
- **Verification:** `cargo build --workspace` succeeds
- **Committed in:** 1becf1f9 (Task 2 commit)

**2. [Rule 1 - Bug] Conflict check incorrectly rejected valid slot pipe programs**
- **Found during:** Task 2 (e2e_slot_pipe_basic test run)
- **Issue:** The plan's interfaces section described a conflict check `if insert_idx < explicit_arg_types.len()` that fires for `"world" |2> concat3("hello ", " !")` — but the test fixture expects this to succeed as `concat3("hello ", "world", " !")`. The conflict check was incompatible with insertion semantics.
- **Fix:** Replaced the conflict check + gap-filling build logic with a single `Vec::insert(actual_idx, lhs_ty)` call (insert semantics). The arity unification via `Ty::Fun` naturally rejects wrong-arity calls.
- **Files modified:** `crates/mesh-typeck/src/infer.rs`
- **Verification:** All 4 e2e_slot_pipe_* tests pass
- **Committed in:** 1becf1f9 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. The insertion semantics fix is the correct interpretation of the |N> operator based on the test fixtures.

## Issues Encountered
- `nr.text()` returns `Option<String>` not `Option<&str>`, requiring `unwrap_or_default()` instead of `unwrap_or("")` — caught at compile time, fixed immediately.

## Next Phase Readiness
- |N> operator fully operational: lexer + parser (Plan 01) + type checker + MIR lowering (Plan 02)
- Phase 116 complete: all PIPE-01 through PIPE-04 requirements met
- Ready for Phase 117

---
*Phase: 116-slot-pipe-operator*
*Completed: 2026-02-25*

## Self-Check: PASSED
