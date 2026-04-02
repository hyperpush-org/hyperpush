---
id: T02
parent: S03
milestone: M048
provides: []
requires: []
affects: []
key_files: ["compiler/meshc/src/main.rs", "compiler/meshpkg/src/main.rs", "compiler/meshc/tests/tooling_e2e.rs", "compiler/meshpkg/tests/update_cli.rs"]
key_decisions: ["Expose `update` as an explicit subcommand on both `meshc` and `meshpkg`, and route both binaries through the shared `mesh_pkg::run_toolchain_update()` seam.", "Make `meshpkg --json update` fail closed with one machine-readable error before any installer download or launch instead of attempting to wrap installer prose as JSON."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`cargo test -p meshc --test tooling_e2e test_update -- --nocapture` passed with help/discovery coverage for `meshc update`, and `cargo test -p meshpkg --test update_cli -- --nocapture` passed with help/discovery coverage plus the `--json update` fail-closed guard."
completed_at: 2026-04-02T16:50:50.391Z
blocker_discovered: false
---

# T02: Added explicit `meshc update` and `meshpkg update` commands, wired both through the shared updater seam, and closed the `meshpkg --json update` ambiguity with a fail-closed guard.

> Added explicit `meshc update` and `meshpkg update` commands, wired both through the shared updater seam, and closed the `meshpkg --json update` ambiguity with a fail-closed guard.

## What Happened
---
id: T02
parent: S03
milestone: M048
key_files:
  - compiler/meshc/src/main.rs
  - compiler/meshpkg/src/main.rs
  - compiler/meshc/tests/tooling_e2e.rs
  - compiler/meshpkg/tests/update_cli.rs
key_decisions:
  - Expose `update` as an explicit subcommand on both `meshc` and `meshpkg`, and route both binaries through the shared `mesh_pkg::run_toolchain_update()` seam.
  - Make `meshpkg --json update` fail closed with one machine-readable error before any installer download or launch instead of attempting to wrap installer prose as JSON.
duration: ""
verification_result: passed
completed_at: 2026-04-02T16:50:50.392Z
blocker_discovered: false
---

# T02: Added explicit `meshc update` and `meshpkg update` commands, wired both through the shared updater seam, and closed the `meshpkg --json update` ambiguity with a fail-closed guard.

**Added explicit `meshc update` and `meshpkg update` commands, wired both through the shared updater seam, and closed the `meshpkg --json update` ambiguity with a fail-closed guard.**

## What Happened

Wired `meshc update` and `meshpkg update` into the shared updater helper and made the new surface discoverable in help output. `compiler/meshc/src/main.rs` now exposes an `Update` subcommand that calls `mesh_pkg::run_toolchain_update()` and prints a truthful completion message based on whether the installer finished inline or detached through the Windows bootstrap path. `compiler/meshpkg/src/main.rs` now exposes the same `Update` subcommand, routes through the shared helper, and rejects `--json update` before any installer work starts with one explicit machine-readable error. Added CLI smoke coverage in `compiler/meshc/tests/tooling_e2e.rs` and `compiler/meshpkg/tests/update_cli.rs` to pin help/discovery plus the JSON-mode guard so future refactors cannot silently remove or lie about the surface.

## Verification

`cargo test -p meshc --test tooling_e2e test_update -- --nocapture` passed with help/discovery coverage for `meshc update`, and `cargo test -p meshpkg --test update_cli -- --nocapture` passed with help/discovery coverage plus the `--json update` fail-closed guard.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p meshc --test tooling_e2e test_update -- --nocapture` | 0 | ✅ pass | 31400ms |
| 2 | `cargo test -p meshpkg --test update_cli -- --nocapture` | 0 | ✅ pass | 65200ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `compiler/meshc/src/main.rs`
- `compiler/meshpkg/src/main.rs`
- `compiler/meshc/tests/tooling_e2e.rs`
- `compiler/meshpkg/tests/update_cli.rs`


## Deviations
None.

## Known Issues
None.
