---
phase: 132-improve-language-json-handling-with-native-object-literal-syntax-instead-of-manual-string-concatenation
verified: 2026-02-27T22:45:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 132: Native JSON Object Literal Syntax Verification Report

**Phase Goal:** Add native `json { }` object literal syntax to the Mesh language, replacing manual string concatenation and heredoc JSON patterns with readable, type-safe object literals.
**Verified:** 2026-02-27T22:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `json { status: "ok" }` passes type-check and can be passed directly to `HTTP.response(200, ...)` without explicit conversion | VERIFIED | `json_string_compatible()` in `unify.rs` line 216 makes Json↔String bidirectionally compatible. `e2e_json_literal_basic` passes. |
| 2 | Using an undefined variable inside `json { }` produces a compile-time type error | VERIFIED | `infer_json_expr` calls `infer_expr` on each field value; undefined names surface as type errors via the normal `NameRef` inference path. |
| 3 | Multi-line `json { }` blocks are accepted (newlines insignificant inside braces) | VERIFIED | `parse_json_literal` in `expressions.rs` relies on parser brace-depth tracking (newlines are insignificant when `brace_depth > 0`). `e2e_json_literal_basic` uses multi-value literals. |
| 4 | Empty `json {}` is accepted without error | VERIFIED | `parse_json_literal` has early-return path on `R_BRACE` immediately after `L_BRACE` (line 504+). |
| 5 | The compiler rejects `json { 123: value }` (non-identifier key) with a parse error | VERIFIED | `parse_json_literal` checks `p.at(SyntaxKind::IDENT)` and calls `p.error("expected identifier key in json literal")` otherwise. |
| 6 | `json { count: 42, active: true }` produces correct JSON with unquoted Int and Bool | VERIFIED | `e2e_json_literal_basic` passes — asserts `line1["count"] == 42` and `line1["active"] == true`. |
| 7 | Nested `json { result: inner }` where `inner :: Json` produces `{"result":{"code":200}}` without double-quoting | VERIFIED | `e2e_json_literal_nested` passes — asserts `parsed["result"].is_object()`. `lower_json_expr_inner` calls `mesh_json_parse_raw` for Json-typed variables. |
| 8 | `List<String>` value in `json { tags: tags }` serializes as a JSON array | VERIFIED | `e2e_json_literal_list` passes — asserts `parsed["tags"].is_array()`. |
| 9 | `Option` field with None becomes null, Some(v) becomes the serialized value | VERIFIED | `e2e_json_literal_option` passes — asserts `r2["data"].is_null()` and `r1["data"] == "value"`. |
| 10 | Struct with `deriving(Json)` nested as a field serializes as a nested object | VERIFIED | `e2e_json_literal_struct` passes — asserts `parsed["point"].is_object()`. |
| 11 | All mesher .mpl files use `json { }` where safe (manual JSON replaced) | VERIFIED | 70 occurrences across mesher source. Patterns with reserved keyword keys (`type`) and pre-encoded JSONB values correctly left as heredocs. |
| 12 | Documentation explains `json { }` syntax with type table and nesting example | VERIFIED | `website/docs/docs/language-basics/index.md` line 678: `## JSON Literals` section with type table, nesting example, and reserved-keyword caveat. Cheatsheet lines 51-54 have usage examples. |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `compiler/mesh-common/src/token.rs` | JsonKw token kind | VERIFIED | `JsonKw` variant at line 50; `"json" => Some(TokenKind::JsonKw)` at line 224; test updated at line 284. |
| `compiler/mesh-parser/src/syntax_kind.rs` | JSON_KW, JSON_EXPR, JSON_FIELD kinds | VERIFIED | `JSON_KW` at line 43, `JSON_EXPR` at line 205, `JSON_FIELD` at line 207. `TokenKind::JsonKw => SyntaxKind::JSON_KW` at line 404. |
| `compiler/mesh-parser/src/ast/expr.rs` | JsonExpr AST node and JsonField child | VERIFIED | `JsonExpr(JsonExpr)` variant at line 57, cast at line 109, syntax at line 149. `JsonExpr` struct at line 925 with `fields()` iterator. `JsonField` struct at line 936 with `key_text()` and `value()`. |
| `compiler/mesh-parser/src/parser/expressions.rs` | parse_json_literal function | VERIFIED | Dispatch at line 261: `SyntaxKind::JSON_KW => Some(parse_json_literal(p))`. Full function at line 504 with empty-object fast path, loop, error recovery. |
| `compiler/mesh-typeck/src/ty.rs` | Ty::json() constructor | VERIFIED | `pub fn json() -> Ty` at line 112 returning `Ty::Con(TyCon::new("Json"))`. |
| `compiler/mesh-typeck/src/unify.rs` | Json->String coercion rule | VERIFIED | `json_string_compatible()` at line 216 — matches `("Json", "String") \| ("String", "Json")`. Applied in unify path at line 288. |
| `compiler/mesh-typeck/src/infer.rs` | JsonExpr type inference returning Ty::json() | VERIFIED | `Expr::JsonExpr` dispatch at line 4355; `infer_json_expr` function at line 8681 returns `Ok(Ty::json())`. NOT `Ty::string()`. |
| `compiler/mesh-codegen/src/mir/lower.rs` | lower_json_expr and lower_json_expr_inner | VERIFIED | `lower_json_expr` at line 4200 wraps inner with `mesh_json_encode`. `lower_json_expr_inner` at line 4213 builds chained `mesh_json_object_put` calls. `Expr::JsonExpr` dispatch at line 5816. |
| `compiler/mesh-rt/src/json.rs` | mesh_json_parse_raw runtime function | VERIFIED | `pub extern "C" fn mesh_json_parse_raw` at line 208. |
| `tests/e2e/json_literal_basic.mpl` | Basic scalar types fixture | VERIFIED | File exists; tests String/Int/Bool/nil. |
| `tests/e2e/json_literal_nested.mpl` | Nested Json variable fixture | VERIFIED | File exists; `let inner = json { code: 200 }` then `json { result: inner, ok: true }`. |
| `tests/e2e/json_literal_list.mpl` | List<String> as JSON array fixture | VERIFIED | File exists. |
| `tests/e2e/json_literal_option.mpl` | Option None->null, Some->value fixture | VERIFIED | File exists. |
| `tests/e2e/json_literal_struct.mpl` | Struct with deriving(Json) fixture | VERIFIED | File exists. |
| `compiler/meshc/tests/e2e_stdlib.rs` | 5 registered e2e_json_literal_* tests | VERIFIED | All 5 test functions at lines 1326, 1341, 1352, 1365, 1377. |
| `website/docs/docs/language-basics/index.md` | JSON Literals documentation section | VERIFIED | `## JSON Literals` at line 678 with type table, nesting example, HTTP.response examples, and reserved-keyword caveat. |
| `website/docs/docs/cheatsheet/index.md` | json { } cheatsheet entry | VERIFIED | Lines 51-54 have four `json { }` examples in the String Features section. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `compiler/mesh-common/src/token.rs` | `compiler/mesh-parser/src/syntax_kind.rs` | `TokenKind::JsonKw => SyntaxKind::JSON_KW` | WIRED | Pattern found at `syntax_kind.rs` line 404 inside `From<TokenKind>` impl. |
| `compiler/mesh-parser/src/parser/expressions.rs` | `compiler/mesh-parser/src/ast/expr.rs` | `SyntaxKind::JSON_KW` dispatches to `parse_json_literal`, closes with `JSON_EXPR` | WIRED | Dispatch at `expressions.rs` line 261; parser closes with `SyntaxKind::JSON_EXPR` at line 504+. `expr.rs` casts `JSON_EXPR` to `Expr::JsonExpr`. |
| `compiler/mesh-typeck/src/infer.rs` | `Ty::json()` | `Expr::JsonExpr` branch returns `Ty::json()` (not `Ty::string()`) | WIRED | `infer_json_expr` at line 8700 returns `Ok(Ty::json())`. Confirmed NOT returning `Ty::string()`. |
| `compiler/mesh-codegen/src/mir/lower.rs` | `mesh_json_object_new / mesh_json_object_put / mesh_json_encode` | `lower_json_expr_inner` builds chained calls, wrapped with `mesh_json_encode` | WIRED | Explicit `MirExpr::Call` with `"mesh_json_object_new"` at line 4215, `"mesh_json_object_put"` in loop, `"mesh_json_encode"` at line 4204. |
| `compiler/mesh-codegen/src/mir/lower.rs` | `emit_to_json_for_type` (existing helper) | Called for non-Json, non-nested field values | WIRED | `self.emit_to_json_for_type(val_lowered, &mir_ty, "json_literal")` in the else-branch at line 4262+. |
| `compiler/meshc/tests/e2e_stdlib.rs` | `tests/e2e/json_literal_*.mpl` | `read_fixture` and `compile_and_run` with assertions | WIRED | All 5 test functions call `read_fixture("json_literal_*.mpl")` and assert on parsed JSON output. |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| JSON-01 | 132-01, 132-02, 132-03 | Native `json { }` object literal syntax | SATISFIED | All three plans completed; compiler frontend, MIR lowering, E2E tests, mesher migration, and docs all implemented and verified. |
| **ORPHANED** | — | JSON-01 does not appear in `.planning/REQUIREMENTS.md` | NOTE | REQUIREMENTS.md covers v13.0 requirements (PIPE, ALIAS, TRYFROM, MAPCOL, QUAL, DOGFOOD, DOCS). JSON-01 is referenced in the ROADMAP.md phase entry and in plan frontmatter but was never added to REQUIREMENTS.md. This is a documentation gap — the requirement ID is real (the plans track it) but the requirements document was not updated. This does not block goal achievement; the implementation exists and is correct. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `compiler/mesh-codegen/src/mir/lower.rs` | 8879 | `TODO: Add proper mesh_string_compare in a future phase.` | Info | Pre-existing comment about string comparison ordering — unrelated to Phase 132 work. No impact on json { } functionality. |

No TODOs, FIXMEs, stubs, or placeholder implementations found in any Phase 132 artifacts. The `todo!()` stub from Plan 132-01's codegen stub arm was replaced with the full `lower_json_expr` implementation in Plan 132-02 (confirmed by code inspection at line 5816).

---

### Human Verification Required

None required. All core functionality verified programmatically:
- `cargo check --workspace` exits 0 (zero errors)
- `cargo test -p meshc e2e_json_literal` — all 5 pass
- `cargo test -p meshc` — only pre-existing `e2e_service_bool_return` failure (confirmed pre-existing via `git stash` regression test; this test was failing before Phase 132 began)

---

### Regression Note

One test failure exists in the suite: `e2e_service_bool_return` in `e2e_concurrency_stdlib.rs`. This test was verified to fail identically on the last pre-Phase-132 commit (`8545a8dd`). It is a pre-existing flaky concurrency test unrelated to this phase. Phase 132 introduces zero new test failures.

The three test failures mentioned in the SUMMARY (e2e_cross_module_from_json, e2e_cross_module_from_json_selective_import, e2e_heredoc_basic) were addressed in commit `06962fbd` by renaming `json` variable usages that conflicted with the new keyword. These tests now pass.

---

### Gaps Summary

No gaps. All phase 132 must-haves are implemented, substantive, and wired:

- **Lexer/Parser/AST:** `TokenKind::JsonKw`, `SyntaxKind::JSON_KW/JSON_EXPR/JSON_FIELD`, `JsonExpr` and `JsonField` AST nodes, `parse_json_literal` parser function — all present and fully implemented.
- **Type system:** `Ty::json()` constructor, `json_string_compatible()` coercion rule, `infer_json_expr` returning `Ty::json()` (not `Ty::string()`) — all correct.
- **Code generation:** `lower_json_expr` / `lower_json_expr_inner` two-level lowering strategy, `mesh_json_parse_raw` runtime function for Json-variable nesting — all present and working.
- **E2E tests:** All 5 fixtures exist and all 5 registered tests pass.
- **Migration:** 70 `json { }` usages across mesher source; documented limitation on reserved-keyword keys (`type`).
- **Documentation:** Full `## JSON Literals` section in language-basics with type table and nesting example; cheatsheet examples present.

The only administrative gap is that `JSON-01` was never added to `.planning/REQUIREMENTS.md` — the implementation is complete but the requirements traceability document was not updated. This is cosmetic and does not affect the codebase.

---

_Verified: 2026-02-27T22:45:00Z_
_Verifier: Claude (gsd-verifier)_
