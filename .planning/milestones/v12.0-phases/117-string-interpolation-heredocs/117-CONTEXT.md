# Phase 117: String Interpolation & Heredocs - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `#{expr}` interpolation syntax and `"""..."""` multiline heredoc strings to the Mesh compiler. Both features are purely additive syntax/semantics — no changes to existing string behavior. Env var stdlib (STRG-04, STRG-05) is Phase 118.

</domain>

<decisions>
## Implementation Decisions

### Type coercion in #{}
- Any type is valid inside `#{expr}` — Int, Float, Bool, Option, List, Map, and any type with a Display implementation are all auto-converted to their string representation
- Conversion is checked at **compile time**: if a type has no Display implementation, it's a compile-time type error, not a runtime failure
- Expressions are evaluated at **runtime** — `#{getName()}` calls `getName()` at runtime and embeds the result. No restriction to compile-time constants.

### Heredoc indentation
- `"""..."""` strips common leading indentation (Kotlin-style `trimIndent` / Python-style `dedent`) — the closing `"""` determines the trim level
- Content starts after the opening delimiter's newline; the closing `"""` is on its own indented line
- Trailing newline before the closing `"""` is stripped — `"""\nhello\n"""` evaluates to `"hello"`, not `"hello\n"`
- When lines have inconsistent indentation (less than the closing `"""`): Claude's discretion

### Escaping & nesting
- Literal `#{` in a string is written as `\#{` (backslash escape)
- Nesting interpolation is **not supported** — `#{"inner #{value}"}` is not valid; users must pre-bind nested values to variables
- Whether double quotes work inside `#{}` and how `"""` is escaped inside a heredoc: Claude's discretion

### Expression complexity
- **Full arbitrary expressions** are valid inside `#{}`: operators, function calls, field access, if/else, pipe chains — anything valid as a Mesh expression
- `#{expr}` can span **multiple lines** inside the braces
- Compiler errors inside `#{}` must point to the **exact location within the interpolation expression**, not just the opening `#{`
- Interpolation `#{}` works in **both** regular `"..."` strings and `"""..."""` heredocs

### Claude's Discretion
- How to handle inconsistent indentation in heredocs (some lines shallower than closing `"""`)
- Whether double quotes are allowed inside `#{}` without escaping, and the exact quoting rules inside interpolation braces
- How to escape `"""` inside a heredoc if a user needs triple-quote content

</decisions>

<specifics>
## Specific Ideas

No specific references given — open to standard approaches (Ruby/Elixir `#{}` style for interpolation, Kotlin `trimIndent` style for heredoc indentation).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 117-string-interpolation-heredocs*
*Context gathered: 2026-02-25*
