# Phase 120: Mesher Dogfooding - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Update the Mesher production codebase to use slot pipe (`|N>`) and string interpolation/heredocs wherever they genuinely improve readability. Then verify Mesher compiles with zero errors and all 8 HTTP API endpoints + WebSocket pass E2E. Language bug fixes are in scope if a compiler issue blocks the update.

</domain>

<decisions>
## Implementation Decisions

### Coverage scope
- Comprehensive update: scan all `.mpl` files in Mesher, update every site where the new syntax is clearly more readable
- Bar for updating: readability delta — if the change is neutral or awkward, leave it alone
- Both features updated in a single pass (slot pipe + string interpolation together)
- Add a brief inline comment on the most illustrative examples of each feature to help readers understand the pattern

### Usage selection — slot pipe
- Target argument threading patterns: places where a value is passed as a non-first argument to a function, especially when chaining
- `|N>` directly replaces these; update wherever it flattens the expression and improves clarity

### Usage selection — string features
- Target both: `++` concatenation chains → `#{expr}` interpolation; multi-line string literals → heredocs (`"""..."""`)
- Search everywhere in Mesher; best candidates win regardless of file location

### E2E verification
- Same approach as prior phases (114/115) — no new methodology
- Explicitly verify all 8 HTTP API endpoints: test each by path, method, and 2xx status
- Confirm WebSocket 101 upgrade
- Verification runs against a real running Mesher instance (start locally, hit endpoints with curl or test client)

### Compile error handling
- Fix all compile errors that block Mesher from compiling — including pre-existing ones unrelated to this phase
- If a type or semantic error requires a Mesh language (compiler) fix to resolve, fix the compiler too — language fixes are in scope
- Goal: zero errors, not just "fewer errors than before"

### Claude's Discretion
- Which specific sites in Mesher to update (agent finds these by reading the code)
- Exact content of illustrative comments
- Order in which files are scanned

</decisions>

<specifics>
## Specific Ideas

- The "at least one" in the success criteria is a floor, not a ceiling — comprehensive coverage is the intent
- Compiler fixes are explicitly in scope if needed to make Mesher compile cleanly after updates

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 120-mesher-dogfooding*
*Context gathered: 2026-02-25*
