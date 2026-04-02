# S03: Toolchain self-update commands — UAT

**Milestone:** M048
**Written:** 2026-04-02T16:53:38.883Z

# S03 UAT — Toolchain self-update commands

## Preconditions
- Run from the repo root with a working Rust toolchain.
- Allow the test targets to build `meshc` and `meshpkg` locally.
- No external Mesh release server is required; the retained acceptance rail stages installer and release assets locally under `.tmp/m048-s03/...`.

## Test Case 1 — Shared updater seam stays truthful to the public installer contract
1. Run `cargo test -p mesh-pkg --test toolchain_update -- --nocapture`.
2. Confirm the target passes all focused updater tests.

**Expected outcome**
- The suite passes.
- Coverage includes default installer URL selection, `MESH_UPDATE_INSTALLER_URL` override handling, passthrough of `MESH_INSTALL_RELEASE_API_URL`, `MESH_INSTALL_RELEASE_BASE_URL`, `MESH_INSTALL_DOWNLOAD_TIMEOUT_SEC`, and `MESH_INSTALL_STRICT_PROOF`, Unix launcher construction, Windows bootstrap construction, and malformed download/write/spawn failure rails.

## Test Case 2 — CLI discovery exposes explicit update commands
1. Run `cargo test -p meshc --test tooling_e2e test_update -- --nocapture`.
2. Run `cargo test -p meshpkg --test update_cli -- --nocapture`.

**Expected outcome**
- Both test targets pass.
- `meshc --help` and `meshc update --help` mention the `update` subcommand and describe it as refreshing the toolchain through the canonical installer path.
- `meshpkg --help` and `meshpkg update --help` do the same.

## Test Case 3 — `meshpkg --json update` fails closed before installer launch
1. Run `cargo test -p meshpkg --test update_cli json_mode_rejects_update_before_installer_launch -- --nocapture`.

**Expected outcome**
- The test passes.
- The command exits non-zero with one JSON error object on stderr.
- The error explains that installer-backed self-update does not support `--json`.
- The error does **not** mention a download failure or the staged installer URL, proving the guard fired before any installer fetch/launch.

## Test Case 4 — Staged `meshc update` installs both binaries into fake Mesh home
1. Run `cargo test -p meshc --test e2e_m048_s03 m048_s03_staged_meshc_update_installs_both_binaries_into_fake_mesh_home -- --nocapture`.
2. Open the latest `.tmp/m048-s03/staged-meshc-update-*/` directory.

**Expected outcome**
- The test passes.
- The artifact directory contains `release-layout.json`, `server.requests.log`, `meshc-update.{json,stdout.log,stderr.log}`, `installed-meshc-version.*`, `installed-meshpkg-version.*`, `version-before.json`, `version-after.json`, `fake-home-before.json`, and `fake-home-after.json`.
- `server.requests.log` shows the canonical flow: `GET /install.sh`, `GET /api/releases/latest.json`, both archives, and `SHA256SUMS`.
- `version-after.json` records the repo version, and both installed binaries report that same version via `--version`.

## Test Case 5 — Installed `meshpkg update` repairs a broken sibling binary and preserves credentials
1. Run `cargo test -p meshc --test e2e_m048_s03 m048_s03_installed_meshpkg_update_repairs_meshc_and_preserves_credentials -- --nocapture`.
2. Open the latest `.tmp/m048-s03/installed-meshpkg-update-*/` directory.

**Expected outcome**
- The test passes.
- `pre-update-broken-meshc-version.*` shows the seeded broken `meshc` failed before update.
- `meshpkg-update.*` shows the installer refreshed both binaries through the staged release server.
- `post-update-meshc-version.*` and `post-update-meshpkg-version.*` both succeed and report the staged version.
- `version-after.json` matches the staged version.
- `credential-before.json` and `credential-after.json` both report the credentials file present with the same size.
- No artifact prints credential contents; the rail records presence and size only.

## Edge checks
- Re-running either acceptance case should create a fresh `.tmp/m048-s03/...` directory instead of mutating previous evidence.
- If a future regression appears in the retained rail, start with `server.requests.log`, the `*-update.stderr.log` file for the failing scenario, and the before/after version snapshots before changing installer semantics.

