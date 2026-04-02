---
id: T01
parent: S01
milestone: M048
provides: []
requires: []
affects: []
key_files: ["compiler/mesh-pkg/src/manifest.rs", "compiler/meshc/src/main.rs", "compiler/meshc/src/discovery.rs", "compiler/meshc/tests/e2e_m044_s02.rs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Centralized executable entry selection in `mesh_pkg::manifest::resolve_entrypoint` so build and later tooling can share one validated relative-path contract.", "Decoupled discovery entry-ness from module naming so only root `main.mpl` keeps the `Main` name while non-root entries stay path-derived."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed `cargo test -p mesh-pkg entrypoint -- --nocapture` and `cargo test -p meshc --bin meshc build_project_ -- --nocapture`, which cover manifest-side entry resolution and discovery override behavior. Ran the slice-level verification rails as well: `cargo test -p mesh-pkg entrypoint -- --nocapture && cargo test -p meshc build_project_ -- --nocapture` still fails for a pre-existing package-wide baseline issue because `compiler/meshc/tests/e2e.rs` references missing `.tmp/m032-s01` fixture files during compilation; `cargo test -p meshc --test tooling_e2e test_test_ -- --nocapture` passes; `cargo test -p meshc --test e2e_m048_s01 -- --nocapture` fails because the T03 acceptance target does not exist yet."
completed_at: 2026-04-02T06:42:29.053Z
blocker_discovered: false
---

# T01: Added manifest-driven entrypoint resolution and entry-aware discovery so non-root executables keep path-derived module names.

> Added manifest-driven entrypoint resolution and entry-aware discovery so non-root executables keep path-derived module names.

## What Happened
---
id: T01
parent: S01
milestone: M048
key_files:
  - compiler/mesh-pkg/src/manifest.rs
  - compiler/meshc/src/main.rs
  - compiler/meshc/src/discovery.rs
  - compiler/meshc/tests/e2e_m044_s02.rs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Centralized executable entry selection in `mesh_pkg::manifest::resolve_entrypoint` so build and later tooling can share one validated relative-path contract.
  - Decoupled discovery entry-ness from module naming so only root `main.mpl` keeps the `Main` name while non-root entries stay path-derived.
duration: ""
verification_result: mixed
completed_at: 2026-04-02T06:42:29.054Z
blocker_discovered: false
---

# T01: Added manifest-driven entrypoint resolution and entry-aware discovery so non-root executables keep path-derived module names.

**Added manifest-driven entrypoint resolution and entry-aware discovery so non-root executables keep path-derived module names.**

## What Happened

Implemented optional `[package].entrypoint` support in `compiler/mesh-pkg/src/manifest.rs`, including path normalization and fail-closed validation for blank, absolute, escaping, and non-`.mpl` values, plus a shared `resolve_entrypoint(project_root, manifest)` helper that names the resolved relative path on failure. Updated `compiler/meshc/src/main.rs::prepare_project_build(...)` to read `mesh.toml` before any entry assumptions, resolve the effective entry path once, and pass that explicit path into discovery. Updated `compiler/meshc/src/discovery.rs` to accept an explicit entry-relative path, validate that the resolved file exists in the project, mark only that file as `is_entry`, and preserve path-derived module naming for non-root entries. Added focused manifest/discovery regressions for default-vs-override resolution, invalid path forms, override precedence, missing resolved entry diagnostics, and non-root entry naming. Applied one narrow compatibility repair in `compiler/meshc/tests/e2e_m044_s02.rs` so meshc test compilation could progress far enough to exercise the relevant unit rail. Recorded the package-wide filtered-test fixture gotcha in `.gsd/KNOWLEDGE.md`.

## Verification

Passed `cargo test -p mesh-pkg entrypoint -- --nocapture` and `cargo test -p meshc --bin meshc build_project_ -- --nocapture`, which cover manifest-side entry resolution and discovery override behavior. Ran the slice-level verification rails as well: `cargo test -p mesh-pkg entrypoint -- --nocapture && cargo test -p meshc build_project_ -- --nocapture` still fails for a pre-existing package-wide baseline issue because `compiler/meshc/tests/e2e.rs` references missing `.tmp/m032-s01` fixture files during compilation; `cargo test -p meshc --test tooling_e2e test_test_ -- --nocapture` passes; `cargo test -p meshc --test e2e_m048_s01 -- --nocapture` fails because the T03 acceptance target does not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p mesh-pkg entrypoint -- --nocapture` | 0 | ✅ pass | 760ms |
| 2 | `cargo test -p meshc build_project_ -- --nocapture` | 101 | ❌ fail | 6508ms |
| 3 | `cargo test -p meshc --bin meshc build_project_ -- --nocapture` | 0 | ✅ pass | 2501ms |
| 4 | `cargo test -p meshc --test tooling_e2e test_test_ -- --nocapture` | 0 | ✅ pass | 9650ms |
| 5 | `cargo test -p meshc --test e2e_m048_s01 -- --nocapture` | 101 | ❌ fail | 120ms |


## Deviations

Added a narrow compatibility update in `compiler/meshc/tests/e2e_m044_s02.rs` outside the planned file list so package test compilation could advance far enough to verify the new unit seam. Otherwise followed the task plan.

## Known Issues

Package-wide filtered `meshc` test runs are still blocked by pre-existing missing `include_str!("../../../.tmp/m032-s01/..." )` fixtures in `compiler/meshc/tests/e2e.rs`. The named slice acceptance target `compiler/meshc/tests/e2e_m048_s01.rs` has not been created yet, so the final slice rail still reports `no test target named e2e_m048_s01`.

## Files Created/Modified

- `compiler/mesh-pkg/src/manifest.rs`
- `compiler/meshc/src/main.rs`
- `compiler/meshc/src/discovery.rs`
- `compiler/meshc/tests/e2e_m044_s02.rs`
- `.gsd/KNOWLEDGE.md`


## Deviations
Added a narrow compatibility update in `compiler/meshc/tests/e2e_m044_s02.rs` outside the planned file list so package test compilation could advance far enough to verify the new unit seam. Otherwise followed the task plan.

## Known Issues
Package-wide filtered `meshc` test runs are still blocked by pre-existing missing `include_str!("../../../.tmp/m032-s01/..." )` fixtures in `compiler/meshc/tests/e2e.rs`. The named slice acceptance target `compiler/meshc/tests/e2e_m048_s01.rs` has not been created yet, so the final slice rail still reports `no test target named e2e_m048_s01`.
