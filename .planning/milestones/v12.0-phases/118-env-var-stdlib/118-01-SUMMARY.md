---
phase: 118-env-var-stdlib
plan: "01"
subsystem: compiler
tags: [stdlib, env, runtime, llvm, typeck, mir]

# Dependency graph
requires:
  - phase: 117-string-interpolation-and-heredocs
    provides: string interpolation and heredoc support already merged
provides:
  - mesh_env_get_with_default runtime function (key, default) -> MeshString
  - mesh_env_get_int runtime function (key, default) -> i64
  - LLVM intrinsic declarations for both new env functions
  - Type signatures for Env.get(key, default)->String and Env.get_int(key, default)->Int
  - map_builtin_name routing env_get -> mesh_env_get_with_default (2-arg)
  - JIT symbol registrations for new runtime functions
affects: [119-regex, 120-mesher-dogfooding, stdlib-env-usage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Env stdlib functions use module-qualified naming: Env.get -> prefixed env_get -> map_builtin_name -> mesh_env_*"
    - "New runtime functions are #[no_mangle] pub extern C with unit tests for missing/invalid env var cases"
    - "env_get_with_default replaces old Option-returning env_get in builtins.rs; no alias kept"

key-files:
  created: []
  modified:
    - crates/mesh-rt/src/env.rs
    - crates/mesh-rt/src/lib.rs
    - crates/mesh-codegen/src/codegen/intrinsics.rs
    - crates/mesh-typeck/src/builtins.rs
    - crates/mesh-codegen/src/mir/lower.rs
    - crates/mesh-repl/src/jit.rs

key-decisions:
  - "Old bare env_get (Option-returning) removed entirely from builtins.rs; env_get now routes to 2-arg mesh_env_get_with_default"
  - "env_get_int silently returns default on any parse failure (non-numeric, overflow) — no stderr warning required"
  - "env_args type signature upgraded to Ty::list(Ty::string()) in builtins.rs"

patterns-established:
  - "New stdlib module functions follow: typeck entry -> map_builtin_name match arm -> known_functions entry -> LLVM intrinsic -> JIT add_sym -> runtime #[no_mangle]"

requirements-completed: [STRG-04, STRG-05]

# Metrics
duration: 10min
completed: 2026-02-26
---

# Phase 118 Plan 01: Env Var Stdlib Summary

**Env.get(key, default)->String and Env.get_int(key, default)->Int stdlib functions wired end-to-end from runtime through LLVM intrinsics, type-checker, MIR lowerer, and JIT symbol table**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-26T01:16:32Z
- **Completed:** 2026-02-26T01:26:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Implemented `mesh_env_get_with_default` and `mesh_env_get_int` as `#[no_mangle] pub extern "C"` functions in mesh-rt with unit tests (538 tests pass)
- Replaced old Option-returning `env_get` in typeck builtins with `env_get_with_default` and `env_get_int` entries; added `env_args` entry with proper `List<String>` type
- Wired full pipeline: LLVM intrinsic declarations, known_functions entries in MIR lowerer, map_builtin_name routing, JIT symbol registrations
- All 262 E2E tests pass; mesh-codegen (179), mesh-typeck (13), mesh-rt (538) test suites pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement runtime functions mesh_env_get_with_default and mesh_env_get_int** - `bb6c55a9` (feat)
2. **Task 2: Wire compiler — intrinsics, typeck, MIR lowerer, JIT** - `11260fa5` (feat)

## Files Created/Modified

- `crates/mesh-rt/src/env.rs` - Added mesh_env_get_with_default and mesh_env_get_int functions with unit tests
- `crates/mesh-rt/src/lib.rs` - Re-exported new runtime functions
- `crates/mesh-codegen/src/codegen/intrinsics.rs` - Declared LLVM intrinsics for new env functions; updated test assertions
- `crates/mesh-typeck/src/builtins.rs` - Replaced env_get with env_get_with_default + env_get_int + env_args entries; updated test assertions
- `crates/mesh-codegen/src/mir/lower.rs` - Added known_functions entries and map_builtin_name routing for new functions
- `crates/mesh-repl/src/jit.rs` - Registered JIT symbols for mesh_env_get_with_default and mesh_env_get_int

## Decisions Made

- Old bare `env_get` (Option-returning) removed entirely — no alias kept. The `env_get` map_builtin_name arm now routes directly to `mesh_env_get_with_default` since `Env.get` requires 2 args.
- `env_get_int` parse failure (non-numeric string, overflow) silently returns default — no stderr output. This matches plan specification.
- `env_args` type signature in builtins.rs set to `Ty::list(Ty::string())` (previously absent from builtins.rs entirely; only existed in STDLIB_MODULES dispatch).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Env.get(key, default) and Env.get_int(key, default) are fully wired and ready for use in Mesh source programs
- Env.args() already existed; env_args type entry added to builtins.rs confirms it is properly typed
- Phase 118 Plan 02 can proceed with E2E tests and any additional stdlib work
- No blockers

## Self-Check: PASSED

- FOUND: crates/mesh-rt/src/env.rs
- FOUND: crates/mesh-codegen/src/codegen/intrinsics.rs
- FOUND: crates/mesh-typeck/src/builtins.rs
- FOUND: crates/mesh-codegen/src/mir/lower.rs
- FOUND: crates/mesh-repl/src/jit.rs
- FOUND: .planning/phases/118-env-var-stdlib/118-01-SUMMARY.md
- FOUND: commit bb6c55a9 (Task 1)
- FOUND: commit 11260fa5 (Task 2)

---
*Phase: 118-env-var-stdlib*
*Completed: 2026-02-26*
