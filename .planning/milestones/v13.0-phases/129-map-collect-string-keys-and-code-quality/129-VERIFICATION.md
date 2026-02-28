---
phase: 129-map-collect-string-keys-and-code-quality
verified: 2026-02-27T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 129: Map.collect String Keys and Code Quality Verification Report

**Phase Goal:** Users can collect string-keyed iterators into maps, and the compiler builds without warnings
**Verified:** 2026-02-27
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria from ROADMAP

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | User can call `.collect()` on an iterator of `{String, V}` pairs and receive a `Map<String, V>` with all entries present | VERIFIED | `e2e_collect_map_string_keys_zip` passes — `Map.get(m,"a")` returns `1`, `Map.get(m,"b")` returns `2`, size is `3` |
| 2 | `cargo build --all` on the compiler workspace produces zero warnings | VERIFIED | `cargo build --all` and `RUSTFLAGS="-D warnings" cargo build --all` both complete with zero warnings |
| 3 | A middleware handler function compiles without requiring an explicit `:: Request` type annotation on its parameter | VERIFIED | `fn handler(request) do` in `stdlib_http_middleware_inferred.mpl` compiles and runs correctly; `e2e_http_middleware_inferred` passes outputting `"middleware_inferred_ok\n"` |

**Score:** 5/5 truths verified (3 success criteria + 2 regression checks)

### Observable Truths (from PLAN frontmatter)

**Plan 01 truths:**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can call `Iter.zip(string_keys, values) |> Map.collect()` and get a `Map<String, V>` with string-key lookup working correctly | VERIFIED | `e2e_collect_map_string_keys_zip` passes: output is `"1\n2\n3\n"` |
| 2 | `Map.get(m, 'a')` returns the correct value (not 0) when `m` was built via zip-then-collect | VERIFIED | Test asserts `output == "1\n2\n3\n"` and passes |
| 3 | Existing `Map.to_list` roundtrip collect test continues to pass | VERIFIED | `e2e_collect_map_string_keys` passes alongside the new test (2 passed, 0 failed) |

**Plan 02 truths:**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 4 | `cargo build --all` produces zero warnings (QUAL-01 confirmed and locked) | VERIFIED | `Finished dev profile` with no warning lines; `RUSTFLAGS="-D warnings"` build also clean |
| 5 | A middleware handler `fn handler(request) do` compiles and runs correctly without any `:: Request` annotation | VERIFIED | `stdlib_http_middleware_inferred.mpl` has `fn handler(request) do` with no annotation; `e2e_http_middleware_inferred` passes |
| 6 | The existing `stdlib_http_middleware` test passes | VERIFIED | `e2e_http_middleware` test passes; fixture retains `:: Request` annotations (correct — passthrough middleware requires them due to generalization limitation) |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/e2e/collect_map_string_keys_zip.mpl` | E2E fixture for zip-then-collect pattern | VERIFIED | File exists, 9 lines, contains `Iter.zip`, `Map.collect()`, `Map.get(m, "a")` |
| `compiler/mesh-codegen/src/mir/lower.rs` | Fixed `pipe_chain_has_string_keys` / result-type check | VERIFIED | Contains `rhs_is_iter_zip`, `pipe_source_has_string_list`, and `pipe.syntax().text_range()` result-type check at line 6557 |
| `tests/e2e/stdlib_http_middleware_inferred.mpl` | New fixture demonstrating middleware type inference without annotations | VERIFIED | File exists, 25 lines, `fn handler(request) do` (no annotation), `fn passthrough(request :: Request, next)` (annotation kept — correct) |
| `compiler/meshc/tests/e2e.rs` | `e2e_collect_map_string_keys_zip` test function | VERIFIED | Test at line 2956 with `assert_eq!(output, "1\n2\n3\n")` |
| `compiler/meshc/tests/e2e_stdlib.rs` | `e2e_http_middleware_inferred` test function | VERIFIED | Test at line 1586 with `assert_eq!(output, "middleware_inferred_ok\n")` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lower.rs:lower_pipe_expr` | `mesh_map_collect_string_keys` | `pipe_chain_has_string_keys` + `rhs_is_iter_zip` chain-walk | VERIFIED | Line 6562: `result_is_string_keyed || self.pipe_chain_has_string_keys(pipe)` dispatches to `mesh_map_collect_string_keys` |
| `collect_map_string_keys_zip.mpl` | `e2e.rs:e2e_collect_map_string_keys_zip` | `read_fixture + compile_and_run` | VERIFIED | Test at line 2957 calls `read_fixture("collect_map_string_keys_zip.mpl")` |
| `stdlib_http_middleware_inferred.mpl` | `e2e_stdlib.rs:e2e_http_middleware_inferred` | `read_fixture + compile_and_run` | VERIFIED | Test at line 1587 calls `read_fixture("stdlib_http_middleware_inferred.mpl")` |
| `stdlib_http_middleware.mpl` | `e2e_stdlib.rs:e2e_http_middleware` | `read_fixture + compile_and_start_server` | VERIFIED | Test at line 1500 uses the fixture; passes with annotations retained |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MAPCOL-01 | 129-01-PLAN.md | User can collect an iterator of `{String, V}` pairs into `Map<String, V>` via `.collect()` | SATISFIED | `e2e_collect_map_string_keys_zip` passes; `pipe_chain_has_string_keys` extended with Iter.zip detection via `rhs_is_iter_zip` + `pipe_source_has_string_list` |
| QUAL-01 | 129-02-PLAN.md | All 3 pre-existing compiler warnings resolved (clean `cargo build --all` output) | SATISFIED | `cargo build --all` and `RUSTFLAGS="-D warnings" cargo build --all` both produce zero warnings |
| QUAL-02 | 129-02-PLAN.md | Middleware handler parameter type is inferred without requiring explicit `:: Request` annotation | SATISFIED (scoped) | `fn handler(request)` works without annotation when body uses `Request.*` accessors; passthrough middleware (`next(request)` body only) still requires annotation due to generalization limitation — documented in fixture comments |

**Documentation gap noted:** REQUIREMENTS.md still shows QUAL-01 and QUAL-02 as `[ ]` (unchecked) in the checklist and "Pending" in the tracking table (lines 84-85), even though the code evidence demonstrates both are complete. MAPCOL-01 is correctly marked `[x]`. This is a documentation inconsistency, not a code gap — the implementations exist and all tests pass.

**Orphaned requirements check:** No additional Phase 129 requirements found in REQUIREMENTS.md beyond MAPCOL-01, QUAL-01, QUAL-02. All three are accounted for.

### Implementation Notes

**Plan 01 deviation (documented):** The plan's primary fix strategy (checking `self.types.get(&pipe.syntax().text_range())` for `Map<String,V>`) does not fire in practice due to Hindley-Milner let-generalization — the `let m = ... |> Map.collect()` binding generalizes `K` to a forall type scheme before downstream `Map.get(m,"a")` calls can unify `K=String`. The actual fix extends `pipe_chain_has_string_keys` with two new helpers:
- `rhs_is_iter_zip(pipe)` — checks if the pipe RHS is a `FieldAccess` call to `Iter.zip`
- `pipe_source_has_string_list(expr)` — walks back to the root LHS and checks for `List<String>` type

The result-type check is retained in the code as an opportunistic fallback. The chain-walk is the working mechanism.

**Plan 02 deviation (documented):** The plan premise that all `:: Request` annotations could be removed from `stdlib_http_middleware.mpl` was incorrect. Passthrough middleware (`fn pass(req, next) do next(req) end`) causes SIGBUS when the annotation is removed: the type variable is generalized to `forall T` since the body contains no `Request.*` accessor calls to constrain it; codegen then emits LLVM `{}` (empty struct) instead of `ptr`, corrupting the ABI. `stdlib_http_middleware.mpl` retains its original annotations. A new fixture (`stdlib_http_middleware_inferred.mpl`) demonstrates the working inference pattern — handler functions that use `Request.*` in their body do infer correctly without annotation.

### Commit Verification

All commits claimed in SUMMARY files exist and are reachable:

| Commit | Description |
|--------|-------------|
| `dad85fcd` | test(129-01): add failing test for Map.collect string keys via Iter.zip |
| `7d6a86d5` | feat(129-01): fix Map.collect string key dispatch for Iter.zip pattern |
| `f10ed2d4` | feat(129-02): add e2e_http_middleware_inferred test for QUAL-02 type inference |

### Anti-Patterns Found

No anti-patterns detected in new/modified files:
- `collect_map_string_keys_zip.mpl` — no TODO/FIXME/placeholder comments; substantive implementation
- `stdlib_http_middleware_inferred.mpl` — no TODO/FIXME/placeholder comments; substantive with documented limitation
- `lower.rs` (modified region) — no empty implementations; both new helpers (`rhs_is_iter_zip`, `pipe_source_has_string_list`) are fully implemented with real logic

### Human Verification Required

None. All success criteria are verifiable programmatically via tests that were run and passed.

## Gaps Summary

No gaps. All five truths are verified, all required artifacts exist and are substantive and wired, all three requirement IDs are satisfied, and the build is clean. The two implementation deviations from plan (let-generalization preventing result-type check, annotation removal causing SIGBUS) were correctly identified and handled during execution — the final state is correct and tests pass.

The only administrative gap is that REQUIREMENTS.md shows QUAL-01 and QUAL-02 as `[ ]` (unchecked) in the text, though MAPCOL-01 is `[x]`. This does not block the phase goal — it is a documentation hygiene issue.

---

_Verified: 2026-02-27_
_Verifier: Claude (gsd-verifier)_
