# Phase 132: Improve Language JSON Handling with Native Object Literal Syntax - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a native `json { }` object literal syntax to the Mesh language that replaces manual JSON construction via string concatenation (`"{\"error\":\"" <> reason <> "\""`) and heredoc interpolation (`"""{"type":"#{action}"}"""`). Includes compiler implementation, E2E tests, dogfooding via migration of existing mesher .mpl files, and documentation update.

</domain>

<decisions>
## Implementation Decisions

### Syntax design
- Keyword `json` followed by a `{ key: value, ... }` block
- Keys are bare identifiers only (e.g. `status`, `issue_id`) — not quoted strings
- Values are any valid Mesh expression (variables, function calls, arithmetic, conditionals)
- Multi-line syntax supported:
  ```mesh
  json {
    type: "event",
    issue_id: issue_id,
    count: List.length(items)
  }
  ```

### Type representation
- `json { }` evaluates to a `Json` newtype (not raw `String`)
- `Json` auto-coerces to `String` at use sites — `HTTP.response(200, json { status: "ok" })` works without explicit conversion
- Type inference for values:
  - `Int` / `Float` → JSON number (unquoted)
  - `String` → JSON string (quoted)
  - `Bool` → `true` / `false`
  - `nil` → `null`
  - `Option<T>`: `None` → `null`, `Some(v)` → value serialized by its type
  - Struct with `deriving(Json)` → auto-embedded as nested JSON object (calls Json.encode internally)
  - `Json` (another `json {}` literal or `Json.encode` result) → embedded raw, no double-encoding

### Nesting & composition
- `Json` values nested inside `json { }` are embedded raw (not double-encoded)
- `List<T>` values serialize as JSON arrays; each element follows the same type-inference rules
- Structs with `deriving(Json)` nested as values are inlined as JSON objects automatically
- `Option<T>` and `nil` follow the same rules as `deriving(Json)` behavior (None/nil → null)

### Migration scope
- Migrate ALL manual JSON construction in mesher .mpl files:
  - `mesher/ingestion/ws_handler.mpl` — string concatenation patterns
  - `mesher/ingestion/routes.mpl` — both `<>` concatenation and heredoc JSON strings
  - `mesher/api/**` — any similar patterns found
- Replace both: raw string concatenation (`"{\"k\":\"" <> v <> "\""`) AND heredoc JSON (`"""{"k":"#{v}"}"""`)
- Add E2E test files in `tests/e2e/` covering:
  - Basic `json { }` with Int, String, Bool, nil values
  - Nested `json { }` (Json value as field)
  - `List<T>` serialized as array
  - `Option<T>` — None → null, Some(v) → value
  - Struct with `deriving(Json)` embedded as nested object
- Update the language documentation page to cover the `json { }` syntax

### Claude's Discretion
- Exact Rust AST node structure for `JsonExpr`
- Parser grammar details
- Codegen strategy (compile to string building vs runtime Json type)
- Whether `Json` newtype is a stdlib type or a compiler-intrinsic
- Key ordering in output (insertion order is fine)
- Whitespace/pretty-printing of output (compact is fine)

</decisions>

<specifics>
## Specific Ideas

- The migration should make code like this in routes.mpl much cleaner:
  ```mesh
  # Before:
  let msg = "{\"error\":\"" <> reason <> "\"}"
  let notification = """{"type":"event","issue_id":"#{issue_id}","data":#{body}}"""
  HTTP.response(200, """{"status":"ok","affected":#{n}}""")

  # After:
  let msg = json { error: reason }
  let notification = json { type: "event", issue_id: issue_id, data: body }
  HTTP.response(200, json { status: "ok", affected: n })
  ```
- The `Json` newtype auto-coercion to String means existing function signatures (e.g. `fn ws_write(conn, msg :: String)`) don't need to change

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 132-improve-language-json-handling-with-native-object-literal-syntax-instead-of-manual-string-concatenation*
*Context gathered: 2026-02-27*
