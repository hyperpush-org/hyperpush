---
phase: 119-regular-expressions
plan: "02"
subsystem: compiler
tags: [regex, runtime, mesh-rt, typeck, codegen, mir, intrinsics, jit]

# Dependency graph
requires:
  - phase: 119-01
    provides: mesh_regex_from_literal call site in MIR lowerer, Regex type in STDLIB_MODULES

provides:
  - mesh_regex_from_literal runtime function (mesh-rt/src/regex.rs)
  - mesh_regex_compile runtime function (returns Result<Regex, String>)
  - mesh_regex_match runtime function (returns Bool)
  - mesh_regex_captures runtime function (returns Option<List<String>>)
  - mesh_regex_replace runtime function (returns String)
  - mesh_regex_split runtime function (returns List<String>)
  - LLVM external function declarations for all 6 mesh_regex_* functions (intrinsics.rs)
  - JIT symbol registrations for all 6 mesh_regex_* functions (jit.rs)
  - Type signatures for regex_compile/match/captures/replace/split in builtins.rs
  - Regex module entry in stdlib_modules() with all 5 methods (infer.rs)
  - known_functions entries and map_builtin_name arms for all 6 runtime names (lower.rs)

affects:
  - 119-03 (E2E tests using Regex.compile/match/captures/replace/split in Mesh programs)

# Tech tracking
tech-stack:
  added:
    - "regex = \"1\" crate in mesh-rt (RegexBuilder with case_insensitive/multi_line/dot_matches_new_line flags)"
  patterns:
    - "Regex object stored as Box::into_raw(Box::new(rx)) as *mut u8 — opaque heap pointer, GC-managed (never freed)"
    - "MeshOption layout used for both Option and Result returns: tag=0 Ok/Some, tag=1 Err/None"
    - "mesh_list_builder_new + mesh_list_builder_push pattern for building List<String> returns"
    - "Bool return type uses i8 (same as mesh_string_contains and other Bool-returning stdlib fns)"

key-files:
  created:
    - crates/mesh-rt/src/regex.rs
  modified:
    - crates/mesh-rt/Cargo.toml
    - crates/mesh-rt/src/lib.rs
    - crates/mesh-codegen/src/codegen/intrinsics.rs
    - crates/mesh-repl/src/jit.rs
    - crates/mesh-typeck/src/builtins.rs
    - crates/mesh-typeck/src/infer.rs
    - crates/mesh-codegen/src/mir/lower.rs

key-decisions:
  - "Bool return for mesh_regex_match uses i8 (not i1/bool) to match existing convention from mesh_string_contains"
  - "Regex object is a raw pointer to Box<regex::Regex> on the Rust heap; never freed (GC programs don't free stdlib objects)"
  - "No bare 'replace' or 'split' mappings added to map_builtin_name — they already map to mesh_string_replace/split; only module-qualified regex_replace/regex_split are unambiguous"
  - "mesh_regex_from_literal panics on invalid pattern (it's a compile-time literal); mesh_regex_compile returns Result for runtime validation"

requirements-completed:
  - REGEX-02
  - REGEX-03
  - REGEX-04
  - REGEX-05
  - REGEX-06

# Metrics
duration: 10min
completed: 2026-02-26
---

# Phase 119 Plan 02: Regex Runtime and Compiler Wiring Summary

**Full Regex stdlib implemented: 6 runtime functions in mesh-rt, LLVM intrinsics declared, JIT symbols registered, typeck type signatures added, MIR wiring complete**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-26T02:16:00Z
- **Completed:** 2026-02-26T02:26:42Z
- **Tasks:** 2
- **Files modified:** 7
- **Files created:** 1

## Accomplishments

- Full Rust regex runtime in `crates/mesh-rt/src/regex.rs`: 6 `#[no_mangle] extern "C"` functions using the `regex` crate's `RegexBuilder` API with bitmask flags (i=1, m=2, s=4)
- Regex objects stored as heap-allocated `Box<regex::Regex>` raw pointers; `mesh_regex_compile` returns `MeshOption` (tag=0 Ok, tag=1 Err), `mesh_regex_captures` returns `MeshOption<List<String>>`
- `mesh_regex_split` and `mesh_regex_captures` use `mesh_list_builder_new`/`mesh_list_builder_push` pattern consistent with `mesh_string_split`
- All 6 functions exported from `mesh-rt/src/lib.rs` via `pub use regex::{...}`
- LLVM intrinsic declarations for all 6 functions in `intrinsics.rs` (Bool return uses i8 to match existing convention)
- JIT symbol table registrations for all 6 functions in `jit.rs`
- Type signatures for `regex_compile/match/captures/replace/split` in `builtins.rs`
- `Regex` module with `compile/match/captures/replace/split` entries added to `stdlib_modules()` in `infer.rs`
- `known_functions` entries and `map_builtin_name` arms for all 6 runtime names in `lower.rs`
- All 547 mesh-rt tests pass + 9 new regex tests; full workspace builds clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement mesh-rt regex runtime** - `7903f530` (feat)
2. **Task 2: Wire compiler pipeline** - `264a7b22` (feat)

## Files Created/Modified

- `crates/mesh-rt/src/regex.rs` - Created: 6 runtime functions + 9 unit tests
- `crates/mesh-rt/Cargo.toml` - Added `regex = "1"` dependency
- `crates/mesh-rt/src/lib.rs` - Added `pub mod regex` + 6 re-exports
- `crates/mesh-codegen/src/codegen/intrinsics.rs` - Added LLVM external declarations + 6 test assertions
- `crates/mesh-repl/src/jit.rs` - Added 6 JIT symbol registrations
- `crates/mesh-typeck/src/builtins.rs` - Added 5 regex function type signatures + 5 test assertions
- `crates/mesh-typeck/src/infer.rs` - Added Regex module to stdlib_modules() with 5 methods
- `crates/mesh-codegen/src/mir/lower.rs` - Added 6 known_functions entries + 6 map_builtin_name arms

## Decisions Made

- Bool return for `mesh_regex_match` uses `i8` (matching `mesh_string_contains` convention), not `i1`/`bool`
- Regex object is a raw pointer to `Box<regex::Regex>` — GC-managed programs never free stdlib objects
- No bare "replace" or "split" regex mappings in `map_builtin_name` (already mapped to string variants); module-qualified paths (`regex_replace`, `regex_split`) are unambiguous
- `mesh_regex_from_literal` panics on invalid pattern (literal = compile-time, should never fail in production); `mesh_regex_compile` returns `Result` for runtime user-provided patterns

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- FOUND: crates/mesh-rt/src/regex.rs (contains mesh_regex_from_literal)
- FOUND: crates/mesh-rt/Cargo.toml (contains regex = "1")
- FOUND: crates/mesh-rt/src/lib.rs (contains pub mod regex)
- FOUND: crates/mesh-codegen/src/codegen/intrinsics.rs (contains mesh_regex_from_literal LLVM declaration)
- FOUND: crates/mesh-repl/src/jit.rs (contains mesh_regex_from_literal JIT symbol)
- FOUND: crates/mesh-typeck/src/builtins.rs (contains regex_compile type signature)
- FOUND: crates/mesh-typeck/src/infer.rs (contains Regex module in stdlib_modules)
- FOUND: crates/mesh-codegen/src/mir/lower.rs (contains mesh_regex_compile known_function)
- FOUND commits: 7903f530, 264a7b22

---
*Phase: 119-regular-expressions*
*Completed: 2026-02-26*
