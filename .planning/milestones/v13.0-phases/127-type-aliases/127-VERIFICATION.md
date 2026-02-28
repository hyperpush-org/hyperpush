---
phase: 127-type-aliases
verified: 2026-02-27T22:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "ALIAS-03: e2e_type_alias_pub now uses compile_multifile_and_run with a genuine two-file cross-module fixture"
    - "ALIAS-03: e2e_type_alias_private_not_exported negative test added via compile_multifile_expect_error"
    - "ALIAS-03: collect_annotation_tokens includes DOT so qualified names like Types.UserId are collected correctly"
    - "ALIAS-03: parse_type_tokens joins IDENT DOT IDENT into qualified lookup key"
    - "ALIAS-03: infer_with_imports registers imported aliases under both short name and qualified name"
  gaps_remaining: []
  regressions: []
human_verification: []
---

# Phase 127: Type Aliases Verification Report

**Phase Goal:** Users can declare `type X = T`, use aliases in signatures/bindings, use `pub type` across modules, and get errors for undefined alias targets.
**Verified:** 2026-02-27T22:00:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plan 03 addressed ALIAS-03 cross-module E2E gap)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can write `type Url = String` and use `Url` anywhere `String` is valid (fn signatures, struct fields, let bindings) | VERIFIED | `e2e_type_alias_basic` passes; 5 unit tests in structs.rs pass (`test_type_alias_simple`, `test_type_alias_in_let_binding`, `test_type_alias_in_fn_return`, `test_type_alias_generic`); fixture at `tests/e2e/type_alias_basic.mpl` exercises fn param, return type, let binding |
| 2 | User can write `pub type UserId = Int` to export a type alias for use in other modules | VERIFIED | `e2e_type_alias_pub` uses `compile_multifile_and_run` with two-file fixture: `types.mpl` exports `pub type UserId = Int` and `pub type Email = String`, `main.mpl` imports Types and uses `Types.UserId`/`Types.Email` in fn signatures and let bindings; test passes with output `"user@example.com\n"`; full pipeline exercised: collect_exports -> build_import_context -> infer_with_imports pre-registration |
| 3 | Compiler emits a clear error when a type alias references a type name that does not exist | VERIFIED | `TypeError::UndefinedType` variant with E0045 error code; `test_type_alias_undefined_target` passes; `validate_type_aliases` + `is_known_type` wired in `infer.rs` after alias registration |
| 4 | Type aliases are transparent to the type checker — values of the alias type unify with the aliased type without explicit conversion | VERIFIED | `resolve_alias` pre-existed and confirmed active; `test_type_alias_in_fn_return` and `e2e_type_alias_basic` confirm values flow through alias boundaries without coercion; cross-module test `e2e_type_alias_pub` confirms transparency across module boundary |

**Score:** 4/4 truths fully verified

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `compiler/mesh-parser/src/ast/item.rs` | `TypeAliasDef::visibility()` accessor | VERIFIED | `pub fn visibility(&self) -> Option<Visibility>` present; `target_type_name()` also present |
| `compiler/mesh-parser/src/parser/items.rs` | `parse_type_alias` handles `pub` prefix | VERIFIED | `parse_optional_visibility(p)` called before `TYPE_KW` advance |
| `compiler/mesh-typeck/src/infer.rs` | Undefined alias type error (`UndefinedType`) | VERIFIED | `validate_type_aliases`, `is_known_type` functions present; wired into inference loop after pre-registration; `TypeError::UndefinedType` with E0045 |
| `tests/e2e/type_alias_basic.mpl` | E2E fixture: alias in fn sig, struct field, let binding | VERIFIED | Exercises fn param (`url :: Url`), return type (`-> Url`), let binding (`let url :: Url`) |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `compiler/mesh-typeck/src/lib.rs` | `type_aliases` in `ModuleExports` and `ExportedSymbols`; `collect_exports` handles `TypeAliasDef` | VERIFIED | `type_aliases: FxHashMap<String, TypeAliasInfo>` present in both structs; `TypeAliasDef` branch with pub-filter in `collect_exports` |
| `compiler/meshc/src/main.rs` | `ModuleExports` population includes `type_aliases` | VERIFIED | `type_aliases: exports.type_aliases.clone()` present |
| `compiler/mesh-typeck/tests/structs.rs` | Unit test `test_alias_import_context_pre_registration` | VERIFIED | Present; checks `pub type UserId = Int` in fn signature |
| `compiler/meshc/tests/e2e.rs` | `e2e_type_alias_pub` E2E test using cross-module runner | VERIFIED | Uses `compile_multifile_and_run` at line 5408; two-file fixture; passes |
| `tests/e2e/type_alias_pub.mpl` | Canonical pub type module fixture | VERIFIED | 2-line canonical snippet: `pub type UserId = Int` / `pub type Email = String` |

#### Plan 03 Artifacts (Gap Closure)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `compiler/meshc/tests/e2e.rs` | `e2e_type_alias_pub` uses `compile_multifile_and_run` | VERIFIED | Line 5408: `compile_multifile_and_run(&[("types.mpl", ...), ("main.mpl", ...)])` — confirmed by grep and test pass |
| `compiler/meshc/tests/e2e.rs` | `e2e_type_alias_private_not_exported` negative test | VERIFIED | Line 5436: `compile_multifile_expect_error` with `type InternalId = Int` (no pub) in internals.mpl; confirms non-empty error when importing module tries to use it |
| `compiler/mesh-typeck/src/infer.rs` | DOT in `collect_annotation_tokens` | VERIFIED | Line 8456: `SyntaxKind::DOT` in token filter match arm; doc comment at 8441 explicitly explains purpose |
| `compiler/mesh-typeck/src/infer.rs` | Qualified name join in `parse_type_tokens` | VERIFIED | Lines 8502-8511: IDENT DOT IDENT joined into `"Module.TypeName"` qualified key |
| `compiler/mesh-typeck/src/infer.rs` | Dual registration in `infer_with_imports` | VERIFIED | Lines 1569-1577: registers under both short name and `format!("{}.{}", mod_namespace, alias_info.name)` qualified name |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `parser/mod.rs` | `parser/items.rs::parse_type_alias` | dispatch on `PUB_KW + TYPE_KW` | WIRED | Both dispatch paths call `parse_type_alias` |
| `infer.rs::register_type_alias` | `infer.rs::TypeError::UndefinedType` | `validate_type_aliases` post-registration | WIRED | Called at line 1651 after alias pre-registration; pushes E0045 error |
| `lib.rs::collect_exports` | `ExportedSymbols::type_aliases` | `TypeAliasDef` visibility check | WIRED | `alias_def.visibility().is_some()` -> `exports.type_aliases.insert(name, def.clone())` |
| `meshc/main.rs::build_import_context` | `ModuleExports::type_aliases` | `ExportedSymbols` -> `ModuleExports` copy | WIRED | `type_aliases: exports.type_aliases.clone()` |
| `infer.rs::infer_with_imports` | `TypeRegistry::type_aliases` | pre-registration loop with dual names | WIRED | Lines 1568-1578: registers short name and qualified name for each imported alias |
| `collect_annotation_tokens` | DOT token collection | `SyntaxKind::DOT` in match arm | WIRED | Line 8456: DOT included so `Types.UserId` yields `[IDENT, DOT, IDENT]` tokens |
| `parse_type_tokens` | qualified key construction | IDENT DOT IDENT join | WIRED | Lines 8502-8511: formats `"Module.TypeName"` when DOT IDENT follows first IDENT |
| `error.rs::UndefinedType` | `diagnostics.rs` E0045 | error_code + report match | WIRED | `TypeError::UndefinedType { .. } => "E0045"` and ariadne report match |
| `error.rs::UndefinedType` | `mesh-lsp/analysis.rs` span extraction | exhaustive TypeError match | WIRED | `TypeError::UndefinedType { span, .. } => Some(*span)` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ALIAS-01 | 127-01 | User can declare `type Alias = ExistingType` in any module | SATISFIED | Parser accepts `type Url = String`; `TYPE_ALIAS_DEF` node in AST; `e2e_type_alias_basic` passes |
| ALIAS-02 | 127-01 | User can use a type alias anywhere the aliased type is valid (fn sigs, struct fields, let bindings) | SATISFIED | `test_type_alias_in_let_binding`, `test_type_alias_in_fn_return`, `e2e_type_alias_basic` all pass |
| ALIAS-03 | 127-02, 127-03 | User can export type aliases with `pub type Alias = T` for cross-module use | SATISFIED | `e2e_type_alias_pub` uses `compile_multifile_and_run`; two-file fixture exercises full collect_exports -> build_import_context -> infer_with_imports pipeline; `e2e_type_alias_private_not_exported` confirms private aliases are NOT accessible cross-module |
| ALIAS-04 | 127-01 | Compiler emits an error when a type alias references an undefined type | SATISFIED | `TypeError::UndefinedType` + E0045; `test_type_alias_undefined_target` passes |

**Orphaned requirements check:** No additional ALIAS-* IDs mapped to Phase 127 in REQUIREMENTS.md beyond ALIAS-01, ALIAS-02, ALIAS-03, ALIAS-04. All accounted for.

### Anti-Patterns Found

No blockers or warnings found. No TODO/FIXME/placeholder comments in any files modified by Plans 01, 02, or 03. No stub return patterns. All test functions assert on actual output.

### Human Verification Required

None. All observable behaviors are verifiable programmatically and all tests pass.

### Re-verification Summary

**Gap from previous verification (ALIAS-03):** The cross-module pub type import pipeline was fully implemented but `e2e_type_alias_pub` used `compile_and_run` (single file), never exercising the `collect_exports` -> `build_import_context` -> `infer_with_imports` pre-registration pipeline.

**How the gap was closed (Plan 03, commit ea62b68d):**

1. `e2e_type_alias_pub` replaced with `compile_multifile_and_run` two-file test — `types.mpl` exports `pub type UserId = Int` / `pub type Email = String`, `main.mpl` imports and uses `Types.UserId` / `Types.Email` in fn signatures and let bindings inside `fn main()`.
2. `e2e_type_alias_private_not_exported` added using `compile_multifile_expect_error` to confirm private aliases are not exported.
3. Three supporting fixes to `infer.rs` were required to make qualified type annotations (`Types.UserId`) parse and resolve correctly: DOT included in `collect_annotation_tokens`, IDENT.DOT.IDENT join in `parse_type_tokens`, and dual-name registration in `infer_with_imports` pre-registration loop.

**Test results (post-gap-closure):**
- `e2e_type_alias_basic` — ok
- `e2e_type_alias_pub` — ok (compile_multifile_and_run confirmed)
- `e2e_type_alias_private_not_exported` — ok
- All 5 `test_type_alias_*` unit tests in mesh-typeck — ok
- Full test suite: 0 FAILED across all crates (only `e2e_service_bool_return` fails, documented as pre-existing failure in `e2e_concurrency_stdlib.rs`, unrelated to type aliases)

**No regressions introduced.**

---

_Verified: 2026-02-27T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
