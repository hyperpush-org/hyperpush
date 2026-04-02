---
id: S03
parent: M048
milestone: M048
provides:
  - A shared `mesh_pkg::run_toolchain_update()` seam that both CLIs can call.
  - User-visible `meshc update` / `meshpkg update` commands with truthful help text and completion/error behavior.
  - A retained staged-release acceptance rail under `.tmp/m048-s03/...` that future slices can replay when update behavior or public touchpoints drift.
requires:
  []
affects:
  - S05
key_files:
  - compiler/mesh-pkg/src/toolchain_update.rs
  - compiler/mesh-pkg/tests/toolchain_update.rs
  - compiler/meshc/src/main.rs
  - compiler/meshpkg/src/main.rs
  - compiler/meshc/tests/tooling_e2e.rs
  - compiler/meshpkg/tests/update_cli.rs
  - compiler/meshc/tests/e2e_m048_s03.rs
key_decisions:
  - D320: keep both CLIs on one shared installer-backed updater seam and make `meshpkg --json update` fail closed instead of inventing partial JSON output.
  - D321: run `/bin/sh -s -- --yes` on Unix but use a detached PowerShell bootstrap on Windows so the running `.exe` can exit before replacement.
  - D322: keep `compiler/meshc/tests/e2e_m048_s03.rs` as the retained acceptance rail with a local staged server, fake HOME, whole-toolchain repair assertions, and presence-only credential checks.
patterns_established:
  - Installer-backed CLI features should reuse the public installer scripts through a thin Rust seam instead of duplicating release metadata, archive naming, checksum parsing, or install-location logic.
  - If a CLI already offers `--json`, an installer-backed subcommand must fail closed before launch rather than mixing human installer prose into a fake machine-readable success shape.
  - Retained update acceptance rails can stay deterministic by staging release assets from a local static server, running against a fake HOME, and asserting secrets by presence-only signals rather than reading secret contents.
observability_surfaces:
  - Phase-rich updater errors from `mesh_pkg::toolchain_update` that name the failing phase, platform, installer URL, and launcher.
  - Retained `.tmp/m048-s03/...` scenario bundles containing staged server files, request logs, command metadata, stdout/stderr, fake-home snapshots, version snapshots, and credential-presence snapshots for both update scenarios.
drill_down_paths:
  - .gsd/milestones/M048/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M048/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M048/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T16:53:38.883Z
blocker_discovered: false
---

# S03: Toolchain self-update commands

**Shipped explicit installer-backed `meshc update` / `meshpkg update` commands on one shared updater seam and proved staged + installed self-update end to end.**

## What Happened

S03 turned toolchain refresh from a manual reinstall ritual into an explicit CLI surface without inventing a second update protocol. T01 added `mesh_pkg::toolchain_update` as the single Rust seam that downloads the public installer script, validates it, forwards only the existing `MESH_INSTALL_*` staged-proof overrides, and launches it with platform-specific rules that keep Windows self-replacement honest. T02 exposed `meshc update` and `meshpkg update` on top of that seam, pinned the help text so the surface stays discoverable, and made `meshpkg --json update` fail closed before any installer work starts. T03 added the retained end-to-end acceptance rail in `compiler/meshc/tests/e2e_m048_s03.rs`, which hosts the public `install.sh` plus staged release metadata, archives, and `SHA256SUMS` from a local static server, then proves both a staged `meshc update` path and an installed `meshpkg update` repair path against a fake Mesh home.

The slice now delivers the whole toolchain contract rather than just a helper. A staged `meshc` binary running from outside `~/.mesh/bin` can update the fake home through the canonical installer path, install both `meshc` and `meshpkg`, and refresh the shared `~/.mesh/version` file. An installed `meshpkg` binary can repair a deliberately corrupted sibling `meshc`, rewrite a stale version file, and preserve `~/.mesh/credentials` without exposing credential contents in logs or assertions. The retained `.tmp/m048-s03/...` bundles capture the staged server tree, request logs, command metadata, stdout/stderr, fake-home snapshots, version snapshots, and credential-presence snapshots so future failures localize to installer fetch, release metadata, archive download, or post-install repair instead of collapsing into one opaque end-to-end red rail.

## Operational Readiness
- **Health signal:** `meshc update` / `meshpkg update` complete with installer success output, both `~/.mesh/bin/meshc` and `~/.mesh/bin/meshpkg` run `--version`, and `~/.mesh/version` matches the staged release tag.
- **Failure signal:** the shared updater returns phase-rich errors (`download`, `plan-launcher`, `spawn-launcher`, `wait-launcher`, `bootstrap`) naming the installer URL and launcher; the retained rail also leaves `server.requests.log`, `*-update.stderr.log`, and before/after version snapshots for diagnosis.
- **Recovery procedure:** rerun the staged rail or the individual update command with the same `MESH_UPDATE_INSTALLER_URL` / `MESH_INSTALL_*` overrides, inspect `server.requests.log`, command stderr, and version snapshots, fix the broken staged asset or launcher issue, then rerun the command.
- **Monitoring gaps:** normal CLI mode still relies on installer/log output rather than a structured progress API, and `meshpkg --json update` intentionally refuses to fake one.

## Verification

All slice-level verification commands now pass: `cargo test -p mesh-pkg --test toolchain_update -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_update -- --nocapture`, `cargo test -p meshpkg --test update_cli -- --nocapture`, and `cargo test -p meshc --test e2e_m048_s03 -- --nocapture`. The retained acceptance rail also leaves green staged and installed scenario bundles under `.tmp/m048-s03/...`, and the latest `server.requests.log` files show the expected canonical install flow (`/install.sh`, release metadata, both archives, and `SHA256SUMS`).

## Requirements Advanced

- R113 — S03 shipped explicit installer-backed `meshc update` / `meshpkg update` commands and the retained staged/installed acceptance rail that exercises whole-toolchain refresh through the canonical release/install path.

## Requirements Validated

- R113 — `cargo test -p mesh-pkg --test toolchain_update -- --nocapture`, `cargo test -p meshc --test tooling_e2e test_update -- --nocapture`, `cargo test -p meshpkg --test update_cli -- --nocapture`, and `cargo test -p meshc --test e2e_m048_s03 -- --nocapture` all passed.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

The first end-to-end rerun exposed a harness bug in the local staged release server: accepted child sockets inherited nonblocking mode and truncated large responses. The rail was fixed within the slice by switching accepted sockets back to blocking mode before rerunning the retained proof. No slice replan was needed.

## Known Limitations

`meshpkg --json update` is intentionally unsupported because installer-backed self-update streams human installer output and should not pretend to have a structured progress/success protocol. Operational diagnostics for self-update are still log/artifact driven rather than exposed through a dedicated machine-readable telemetry surface.

## Follow-ups

- S05 should keep the assembled closeout rail replaying the S03 update surfaces and add the minimal public touchpoints that teach `meshc update` / `meshpkg update` honestly.
- If milestone bookkeeping needs R113 to render as validated before closeout, reconcile the GSD requirement DB entry for `R113`; the rendered requirements file includes it and decision D323 records the validation evidence, but `gsd_requirement_update` still rejected the ID in this environment.

## Files Created/Modified

- `compiler/mesh-pkg/src/lib.rs` — Exported the shared toolchain updater seam for both CLIs.
- `compiler/mesh-pkg/src/toolchain_update.rs` — Added the installer-backed update helper, platform launcher planning, env passthrough, and phase-rich error reporting.
- `compiler/mesh-pkg/tests/toolchain_update.rs` — Pinned updater behavior for default URLs, override handling, env passthrough, launcher construction, and failure rails.
- `compiler/meshc/src/main.rs` — Exposed `meshc update`, routed it through the shared updater seam, and added truthful completion messaging.
- `compiler/meshpkg/src/main.rs` — Exposed `meshpkg update`, routed it through the shared updater seam, and made `--json update` fail closed before installer launch.
- `compiler/meshc/tests/tooling_e2e.rs` — Added help/discovery coverage for the new `meshc update` surface.
- `compiler/meshpkg/tests/update_cli.rs` — Added CLI smoke coverage for `meshpkg update` help and the JSON-mode guard.
- `compiler/meshc/tests/e2e_m048_s03.rs` — Added the retained staged-release acceptance rail for staged `meshc update` and installed `meshpkg update`, including fake-home and artifact retention support.
- `.gsd/PROJECT.md` — Refreshed project state after S03 landed.
- `.gsd/KNOWLEDGE.md` — Recorded the socket-mode gotcha from the retained update rail for future agents.
