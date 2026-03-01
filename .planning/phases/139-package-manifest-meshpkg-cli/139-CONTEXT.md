# Phase 139: Package Manifest & meshpkg CLI - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Mesh packages can be declared in a `mesh.toml` manifest with dependencies, locked reproducibly in `mesh.lock`, and published/installed/searched via the `meshpkg` CLI binary. This covers the client-side tooling only — the registry server and website are Phase 140.

</domain>

<decisions>
## Implementation Decisions

### Manifest dependency syntax
- Both shorthand (`foo = "1.0.0"`) and table form (`foo = { version = "1.0.0" }`) are supported
- Caret semver only for version constraints: `^1.0` means `>=1.0.0 <2.0.0`
- Table form supports all three source types: registry (`version`), local path (`path = "../foo"`), and git (`git = "https://..."`)
- `[package]` section: `name` and `version` are required; `description`, `license`, `authors` are optional
- Required fields are enforced at publish time, not at local development time

### CLI output & UX
- Spinner with status text during `meshpkg install` and `meshpkg publish` (e.g., "Downloading foo@1.0.0...")
- `meshpkg search` outputs an aligned table with columns: name, version, description
- Success/error output uses colored ✓/✗ with message (e.g., `✓ Published foo@1.0.0`)
- `--json` flag available on all commands for machine-readable output

### mesh.lock format
- TOML format (consistent with mesh.toml)
- Each locked entry contains: name, version, sha256, source URL
- mesh.lock should be committed to git for reproducible builds
- `meshpkg install` with existing lock uses exact pins; without a lock, resolves and generates one

### Package install layout
- Packages install to `.mesh/packages/<name>@<version>/` (project-local, not global)
- Published tarball structure: `mesh.toml` at root + `src/` directory at root
- Compiler discovers installed packages by reading `mesh.lock` to find `.mesh/packages/` paths
- `.mesh/packages/` is gitignored by default (mesh.lock provides reproducibility)

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches for tarball format, spinner library choice, and TOML parsing.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 139-package-manifest-meshpkg-cli*
*Context gathered: 2026-02-28*
