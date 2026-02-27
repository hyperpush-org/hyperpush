---
phase: 118-env-var-stdlib
plan: "02"
subsystem: compiler
tags: [stdlib, env, e2e, migration, typeck]

# Dependency graph
requires:
  - phase: 118-01
    provides: Env.get and Env.get_int runtime functions wired end-to-end
provides:
  - E2E test fixtures for Env.get (STRG-04) and Env.get_int (STRG-05)
  - compile_and_run_with_env helper in e2e.rs
  - mesher/main.mpl fully migrated to 2-arg Env.get API
  - migrate.rs embedded Mesh template migrated to 2-arg Env.get API
  - stdlib_modules() Env entry updated to 2-arg get, get_int, and args signatures
affects: [119-regex, 120-mesher-dogfooding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "compile_and_run_with_env helper injects env vars via Command::env() before running compiled binary"
    - "Env.get_int fixture uses string interpolation (\"${val}\") to print integers via println"
    - "Env module stdlib_modules() entry mirrors builtins.rs: 2-arg get, get_int, args"

key-files:
  created:
    - tests/e2e/env_get.mpl
    - tests/e2e/env_get_int.mpl
  modified:
    - crates/meshc/tests/e2e.rs
    - crates/mesh-typeck/src/infer.rs
    - mesher/main.mpl
    - crates/meshc/src/migrate.rs

key-decisions:
  - "stdlib_modules() Env entry in infer.rs was stale (old 1-arg Option-returning get); updated to match builtins.rs 2-arg signatures"
  - "env_get_int fixture uses string interpolation (${val}) since println requires String; fixture outputs integers as strings"
  - "get_env_or_default helper removed entirely from mesher/main.mpl; callers migrated to direct Env.get(key, default) calls"

patterns-established:
  - "E2E tests needing env vars use compile_and_run_with_env(&source, &[(key, val), ...]) helper"
  - "Printing Int values in Mesh E2E fixtures: println(\"${val}\") not println(val)"

requirements-completed: [STRG-04, STRG-05]

# Metrics
duration: 13min
completed: 2026-02-26
---

# Phase 118 Plan 02: Env Var Stdlib E2E and Migration Summary

**E2E test fixtures and test functions for STRG-04/STRG-05, compile_and_run_with_env helper, and migration of all Mesh source callsites from 1-arg to 2-arg Env.get API**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-26T01:29:43Z
- **Completed:** 2026-02-26T01:42:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `tests/e2e/env_get.mpl` and `tests/e2e/env_get_int.mpl` E2E fixtures for STRG-04 and STRG-05
- Added `compile_and_run_with_env` helper to `crates/meshc/tests/e2e.rs` that compiles a Mesh program and runs it with injected environment variables
- Added `e2e_env_get` and `e2e_env_get_int` test functions; both pass with exact expected output
- Migrated `mesher/main.mpl`: removed `get_env_or_default` helper, updated 5 call sites to 2-arg `Env.get(key, default)` form, converted Option `case` patterns to `if/else` on empty string
- Migrated `crates/meshc/src/migrate.rs` embedded Mesh template: `Env.get("DATABASE_URL")` with case -> `Env.get("DATABASE_URL", "")` with if/else
- Fixed stale `stdlib_modules()` Env entry in `infer.rs` (was 1-arg returning Option<String>; updated to 2-arg String->String with get_int and args added)
- All 264 E2E tests pass (262 prior + 2 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: E2E fixtures and test functions for Env.get and Env.get_int** - `9ccfa817` (feat)
2. **Task 2: Migrate mesher/main.mpl and migrate.rs to 2-arg Env.get API** - `4cc8c7e2` (feat)

## Files Created/Modified

- `tests/e2e/env_get.mpl` - Fixture: 3 scenarios (missing var, set var, empty var)
- `tests/e2e/env_get_int.mpl` - Fixture: 4 scenarios (missing, valid int, non-numeric, negative)
- `crates/meshc/tests/e2e.rs` - Added compile_and_run_with_env helper; added e2e_env_get and e2e_env_get_int tests
- `crates/mesh-typeck/src/infer.rs` - Fixed stdlib_modules() Env entry: 2-arg get, get_int, args
- `mesher/main.mpl` - Removed get_env_or_default; migrated 5 callsites to Env.get(key, default)
- `crates/meshc/src/migrate.rs` - Updated embedded Mesh template to 2-arg Env.get

## Decisions Made

- The `stdlib_modules()` Env entry in `infer.rs` was not updated in Phase 118-01 (builtins.rs was updated but infer.rs was missed). Fixed as Rule 1 (bug fix) — the old 1-arg signature caused "undefined variable: Env" errors at the qualified call lookup stage.
- Integer printing in fixtures must use `"${val}"` string interpolation since Mesh `println` requires String. This affects the expected output assertion in `e2e_env_get_int`.
- `libmesh_rt.a` was stale and needed a `cargo build -p mesh-rt` rebuild to pick up the new runtime functions from Phase 118-01. This was a one-time artifact of the build cache state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale stdlib_modules() Env entry in infer.rs**
- **Found during:** Task 1, first test run
- **Issue:** The `stdlib_modules()` function in `infer.rs` had the old 1-arg `Env.get` registered with `Option<String>` return type. It also lacked `Env.get_int` and `Env.args`. This caused "undefined variable: Env" errors when compiling E2E fixtures.
- **Fix:** Updated the Env module entry to 2-arg `get(String, String) -> String`, added `get_int(String, Int) -> Int`, and `args() -> List<String>`
- **Files modified:** `crates/mesh-typeck/src/infer.rs`
- **Commit:** `9ccfa817` (bundled with Task 1)

**2. [Rule 1 - Bug] env_get_int fixture used plain println(int) instead of string interpolation**
- **Found during:** Task 1, second test run
- **Issue:** The plan-specified fixture used `println(missing)` for Int values, but Mesh `println` requires String. Compilation failed with "expected String, found Int".
- **Fix:** Updated `env_get_int.mpl` to use `"${missing}"` string interpolation for all four println calls
- **Files modified:** `tests/e2e/env_get_int.mpl`
- **Commit:** `9ccfa817` (bundled with Task 1)

**3. [Rule 3 - Blocking] Stale libmesh_rt.a missing mesh_env_get_with_default symbol**
- **Found during:** Task 1, linker error
- **Issue:** Phase 118-01 added `mesh_env_get_with_default` to mesh-rt source but the compiled `libmesh_rt.a` was from before that change. Linker couldn't find `_mesh_env_get_with_default`.
- **Fix:** Ran `cargo build -p mesh-rt` to rebuild the static library
- **Commit:** N/A (build step, not a source change)

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 118 is now complete: runtime functions wired (Plan 01), E2E tests passing, all callers migrated (Plan 02)
- Phase 119 (Regex) can proceed - depends only on Phase 115
- Phase 120 (Mesher dogfooding) can proceed after 118 - stdlib Env API is stable
- No blockers

## Self-Check: PASSED

- FOUND: tests/e2e/env_get.mpl
- FOUND: tests/e2e/env_get_int.mpl
- FOUND: crates/meshc/tests/e2e.rs (compile_and_run_with_env + test functions)
- FOUND: crates/mesh-typeck/src/infer.rs (stdlib_modules Env entry updated)
- FOUND: mesher/main.mpl (no 1-arg Env.get calls, no get_env_or_default)
- FOUND: crates/meshc/src/migrate.rs (2-arg Env.get in template)
- FOUND: commit 9ccfa817 (Task 1)
- FOUND: commit 4cc8c7e2 (Task 2)
- All 264 E2E tests pass

---
*Phase: 118-env-var-stdlib*
*Completed: 2026-02-26*
