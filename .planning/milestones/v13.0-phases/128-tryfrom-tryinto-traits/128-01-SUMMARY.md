---
phase: 128-tryfrom-tryinto-traits
plan: 01
subsystem: compiler
tags: [rust, typeck, traits, tryfrom, tryinto, type-checking]

# Dependency graph
requires:
  - phase: 127-type-aliases
    provides: Type alias infrastructure that may appear in TryFrom signatures
  - phase: 77-from-into-traits
    provides: From/Into trait registration and synthetic Into derivation pattern used as template
provides:
  - TryFrom and TryInto trait definitions registered in the TraitRegistry
  - Automatic TryInto synthesis when TryFrom impl is registered (parallel to From->Into)
affects:
  - 128-02-PLAN: e2e tests for user-defined TryFrom impls and try_into() call sites

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Synthetic trait derivation: registering TryFrom<A> for B automatically synthesizes TryInto<B> for A, same mechanism as From/Into"

key-files:
  created: []
  modified:
    - compiler/mesh-typeck/src/builtins.rs
    - compiler/mesh-typeck/src/traits.rs

key-decisions:
  - "No built-in TryFrom impls added -- TryFrom is entirely user-defined (unlike From which has Int->Float built-ins)"
  - "TryInto return_type set to None in synthetic impl (same as From/Into builtins) -- actual Result<T,E> is inferred from the user impl body"
  - "Extraction of synth_try_source_ty / synth_try_target_ty placed before existing_impls.push(impl_def) to avoid borrow-after-move"

patterns-established:
  - "Trait synthesis pattern: extract source/target before push, synthesize after push, insert directly to impls map to avoid recursion"

requirements-completed: [TRYFROM-01, TRYFROM-02]

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 128 Plan 01: TryFrom/TryInto Traits Summary

**TryFrom and TryInto registered as compiler-known traits with automatic TryInto synthesis from TryFrom impls, mirroring the From/Into derivation pattern from Phase 77**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-27T22:38:55Z
- **Completed:** 2026-02-27T22:41:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- TryFrom trait definition (static `try_from` method, returns `Result<Self, E>`) registered in the trait registry via builtins.rs
- TryInto trait definition (instance `try_into` method) registered in the trait registry via builtins.rs
- Synthetic TryInto generation in `register_impl`: any `impl TryFrom<A> for B` automatically produces a corresponding `impl TryInto<B> for A`
- All 13 existing mesh-typeck tests pass; full `cargo build --all` clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Register TryFrom and TryInto trait definitions in builtins.rs** - `ee6491da` (feat)
2. **Task 2: Add synthetic TryInto derivation in traits.rs register_impl** - `6d0bba13` (feat)

## Files Created/Modified

- `compiler/mesh-typeck/src/builtins.rs` - Added TryFrom and TryInto TraitDef registrations after the Into block
- `compiler/mesh-typeck/src/traits.rs` - Added TryInto synthesis block in register_impl alongside the existing Into synthesis

## Decisions Made

- No built-in TryFrom impls were added; unlike From (which ships Int->Float and Int->String conversions), TryFrom is entirely user-defined. This matches Rust semantics where primitive TryFrom impls only exist where conversions can fail.
- TryInto return_type is set to None in the synthesized impl, consistent with how the Into return_type was set in builtins.rs — the actual return type is resolved per-impl from the user's written body.
- Extraction variables (synth_try_source_ty, synth_try_target_ty) placed before `existing_impls.push(impl_def)` to avoid borrow-after-move, following the exact same pattern as the From/Into extraction.

## Deviations from Plan

None - plan executed exactly as written. The From/Into pattern translated 1:1 to TryFrom/TryInto with no unexpected issues.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TryFrom and TryInto are fully registered as compiler-known traits
- infer_impl_def needs no changes — existing GENERIC_ARG_LIST extraction already handles `impl TryFrom<Int> for Foo` (trait_name="TryFrom", trait_type_args=[Ty::int()])
- Ready for Phase 128-02: E2E tests covering user-defined TryFrom impls and .try_into() call sites

---
*Phase: 128-tryfrom-tryinto-traits*
*Completed: 2026-02-27*
