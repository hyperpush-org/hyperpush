---
id: T03
parent: S03
milestone: M048
provides: []
requires: []
affects: []
key_files: ["compiler/meshc/tests/e2e_m048_s03.rs", "compiler/meshc/tests/support/m046_route_free.rs"]
key_decisions: ["Keep `compiler/meshc/tests/e2e_m048_s03.rs` as the retained acceptance rail, with a local staged release server serving the public installer plus staged release metadata and assets.", "Prove credential preservation by asserting `~/.mesh/credentials` file presence and size only; never read or print credential contents in logs or assertions."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`cargo test -p meshc --test e2e_m048_s03 -- --nocapture` passed after fixing the staged server socket mode bug, and the green run retained both staged and installed scenario bundles under `.tmp/m048-s03/...` with command logs, server requests, fake-home snapshots, version snapshots, and credential-presence checks."
completed_at: 2026-04-02T16:51:02.084Z
blocker_discovered: false
---

# T03: Added the retained staged-release acceptance rail that proves `meshc update` and `meshpkg update` refresh the whole toolchain pair and preserve credentials through the canonical installer path.

> Added the retained staged-release acceptance rail that proves `meshc update` and `meshpkg update` refresh the whole toolchain pair and preserve credentials through the canonical installer path.

## What Happened
---
id: T03
parent: S03
milestone: M048
key_files:
  - compiler/meshc/tests/e2e_m048_s03.rs
  - compiler/meshc/tests/support/m046_route_free.rs
key_decisions:
  - Keep `compiler/meshc/tests/e2e_m048_s03.rs` as the retained acceptance rail, with a local staged release server serving the public installer plus staged release metadata and assets.
  - Prove credential preservation by asserting `~/.mesh/credentials` file presence and size only; never read or print credential contents in logs or assertions.
duration: ""
verification_result: passed
completed_at: 2026-04-02T16:51:02.119Z
blocker_discovered: false
---

# T03: Added the retained staged-release acceptance rail that proves `meshc update` and `meshpkg update` refresh the whole toolchain pair and preserve credentials through the canonical installer path.

**Added the retained staged-release acceptance rail that proves `meshc update` and `meshpkg update` refresh the whole toolchain pair and preserve credentials through the canonical installer path.**

## What Happened

Added `compiler/meshc/tests/e2e_m048_s03.rs` as the retained S03 acceptance rail. The test now stages the public `install.sh`, release metadata JSON, both tool archives, and `SHA256SUMS` under a local static server, points the updater seam at that staged host with `MESH_UPDATE_INSTALLER_URL` plus the existing `MESH_INSTALL_*` overrides, and retains per-scenario artifacts under `.tmp/m048-s03/...`. One scenario copies `meshc` to a location outside `~/.mesh/bin`, runs `meshc update`, and proves both `meshc` and `meshpkg` land in fake home with a refreshed shared `~/.mesh/version` file. The second seeds fake-home credentials, corrupts the installed sibling `meshc`, writes a stale version file, runs `meshpkg update`, and proves both binaries are healthy again while credentials remain present. The retained artifacts include staged server files, request logs, command metadata, stdout/stderr, before/after fake-home snapshots, version snapshots, and credential-presence snapshots so the first broken phase is inspectable without rerunning manually.

## Verification

`cargo test -p meshc --test e2e_m048_s03 -- --nocapture` passed after fixing the staged server socket mode bug, and the green run retained both staged and installed scenario bundles under `.tmp/m048-s03/...` with command logs, server requests, fake-home snapshots, version snapshots, and credential-presence checks.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p meshc --test e2e_m048_s03 -- --nocapture` | 0 | ✅ pass | 97100ms |


## Deviations

The first end-to-end rerun exposed a harness bug in the local staged server: accepted child sockets inherited nonblocking mode, which truncated installer and tarball downloads. The rail was fixed in the same task by switching accepted sockets back to blocking mode before streaming files, then rerun green.

## Known Issues

None.

## Files Created/Modified

- `compiler/meshc/tests/e2e_m048_s03.rs`
- `compiler/meshc/tests/support/m046_route_free.rs`


## Deviations
The first end-to-end rerun exposed a harness bug in the local staged server: accepted child sockets inherited nonblocking mode, which truncated installer and tarball downloads. The rail was fixed in the same task by switching accepted sockets back to blocking mode before streaming files, then rerun green.

## Known Issues
None.
