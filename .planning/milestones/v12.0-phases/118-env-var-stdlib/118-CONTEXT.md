# Phase 118: Env Var Stdlib - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `Env.get(key, default) -> String` and `Env.get_int(key, default) -> Int` stdlib functions so Mesh programs can read environment variables with typed defaults without Option unwrapping. Also migrate the existing `env_get` and `env_args` bare functions to the `Env` module, removing the bare-name variants entirely. Update any callsites in the codebase.

</domain>

<decisions>
## Implementation Decisions

### Existing env_get removal
- Remove `env_get(key) -> Option<String>` entirely — no backward compatibility alias
- Find and update any Mesher or test code that calls `env_get`, migrating to `Env.get(key, default)`
- This migration is in scope for this phase

### env_args migration
- Rename `env_args` to `Env.args` (module-qualified only)
- Remove bare `env_args` name — no alias kept
- Consistent with the clean break approach for the whole Env module

### Module access pattern
- All Env functions are module-qualified only: `Env.get(...)`, `Env.get_int(...)`, `Env.args()`
- No bare names exposed in the global namespace
- Auto-available in all Mesh programs — no `import Env` required
- Follows existing pattern (e.g. `String.length` works without import)

### Int parse failure behavior
- Return the default int on any parse failure: non-numeric string, integer overflow, underflow
- Claude's discretion on whether to log a warning to stderr or be fully silent
- Out-of-range values (e.g. "99999999999999999999") treated identically to non-numeric — return default

### E2E test scenarios
- One .mpl fixture per function: `env_get.mpl` and `env_get_int.mpl`
- `Env.get` scenarios:
  - Missing var → default returned
  - Set var → env value returned (not default)
  - Empty string var → empty string returned (not default — it IS set)
  - Set var = same as default → env value returned (no special casing)
- `Env.get_int` scenarios:
  - Missing var → default int returned
  - Set var with valid positive int → parsed value returned
  - Set var with non-numeric → default returned
  - Set var with negative int (e.g. "-1") → parsed as negative int

### Claude's Discretion
- Whether `Env.get_int` parse failures emit a stderr warning or are fully silent
- Exact internal function names at the MIR/runtime layer (e.g. `mesh_env_get_with_default`)
- Rust runtime implementation details (pointer handling, MeshString conversion)

</decisions>

<specifics>
## Specific Ideas

- No specific references — open to standard approaches for the implementation
- The "clean break" theme: remove bare names entirely, don't keep aliases, update callsites in-phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 118-env-var-stdlib*
*Context gathered: 2026-02-25*
