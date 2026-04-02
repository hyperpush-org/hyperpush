---
estimated_steps: 4
estimated_files: 3
skills_used:
  - rust-best-practices
  - rust-testing
---

# T01: Resolve manifest entrypoint before build discovery and decouple entry selection from module naming

**Slice:** S01 — Configurable entrypoint in compiler and test discovery
**Milestone:** M048

## Description

Add the optional `[package].entrypoint` manifest field and one small resolver seam, then make `meshc build` and discovery use the resolved entry path without turning non-root entry modules into a special-case `Main` name.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `mesh_pkg::Manifest` parsing in `compiler/mesh-pkg/src/manifest.rs` | Reject invalid or missing `entrypoint` values with a truthful error before build/discovery runs. | N/A for local file parsing. | Reject non-string, absolute, escaping, or wrong-extension paths instead of silently defaulting to `main.mpl`. |
| Project discovery in `compiler/meshc/src/discovery.rs` | Fail the build with the resolved entry path in the error instead of compiling the wrong module. | N/A for local filesystem discovery. | Reject impossible resolved paths before they reach module-graph construction. |

## Load Profile

- **Shared resources**: Project filesystem walk and in-memory module graph state; no external service dependencies.
- **Per-operation cost**: One manifest parse, one normalized entry-path resolution, and one full project discovery pass.
- **10x breakpoint**: Large projects amplify redundant path normalization and discovery scans first, so the resolver should run once and thread one resolved entry path through build/discovery.

## Negative Tests

- **Malformed inputs**: Blank `entrypoint`, absolute path, `../escape.mpl`, and non-`.mpl` path values.
- **Error paths**: Configured entry missing on disk, both `main.mpl` and override present with override selected, and manifest absent with only root `main.mpl`.
- **Boundary conditions**: Explicit root `main.mpl` override, nested `lib/start.mpl` override, and non-root entry modules that still import sibling support modules.

## Steps

1. Extend `compiler/mesh-pkg/src/manifest.rs` so `[package].entrypoint` parses as an optional project-root-relative file path and expose one small helper that resolves and validates the effective executable entry path.
2. Update `prepare_project_build(...)` in `compiler/meshc/src/main.rs` to read `mesh.toml` before entry checks, call the new resolver, and emit truthful missing/invalid-entry diagnostics while keeping manifest-less root `main.mpl` projects valid.
3. Thread the resolved entry-relative path through `compiler/meshc/src/discovery.rs` so `is_entry` follows configuration, but module names still come from the real relative file path (`lib/start.mpl` stays `Lib.Start`).
4. Add focused unit tests in `manifest.rs` and `discovery.rs` for default-vs-override resolution, invalid absolute/escaping paths, override precedence when both entry files exist, and non-root entry module naming.

## Must-Haves

- [ ] `[package].entrypoint` is optional and project-root-relative; manifest-less default projects still compile.
- [ ] `meshc build` resolves the configured entry before discovery instead of hard-failing on missing root `main.mpl`.
- [ ] Discovery marks the resolved file as `is_entry` without renaming non-root entry modules to `Main`.
- [ ] Invalid configured entry paths fail closed with explicit diagnostics.

## Verification

- `cargo test -p mesh-pkg entrypoint -- --nocapture`
- `cargo test -p meshc build_project_ -- --nocapture`

## Observability Impact

- Signals added/changed: Build-time diagnostics now distinguish invalid configured entry paths, missing configured files, and wrong `is_entry`/module-name coupling.
- How a future agent inspects this: Run the targeted unit-test filters above and inspect failing assertions in `compiler/mesh-pkg/src/manifest.rs` and `compiler/meshc/src/discovery.rs`.
- Failure state exposed: The resolver or discovery tests should name the exact relative entry path that failed validation or was marked as the wrong module.

## Inputs

- `compiler/mesh-pkg/src/manifest.rs` — shared manifest parsing surface where the optional package entry override and validation helper belong.
- `compiler/meshc/src/main.rs` — current `prepare_project_build(...)` ordering hard-fails on root `main.mpl` before manifest resolution.
- `compiler/meshc/src/discovery.rs` — current discovery still couples `main.mpl` special-casing to both `is_entry` and module naming.

## Expected Output

- `compiler/mesh-pkg/src/manifest.rs` — optional entrypoint parsing plus resolved-entry validation helpers and unit coverage.
- `compiler/meshc/src/main.rs` — manifest-first build preparation that resolves the effective entry path before existence checks.
- `compiler/meshc/src/discovery.rs` — entry-aware project discovery with regression tests proving non-root entry naming stays path-derived.
