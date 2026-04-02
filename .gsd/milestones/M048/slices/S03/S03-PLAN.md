# S03: Toolchain self-update commands

**Goal:** Turn binary self-update into an explicit Mesh toolchain command instead of a manual reinstall ritual while keeping the existing installer/release path as the single source of truth.
**Demo:** After this: After this: installed or staged `meshc` and `meshpkg` expose explicit self-update commands that refresh the toolchain through the same release/install path users already trust.

## Tasks
- [x] **T01: Added a shared mesh-pkg toolchain updater that downloads the public installer, forwards staged-proof env overrides, and uses a PowerShell bootstrap on Windows.** — There is no shared self-update seam today, and the biggest risk in S03 is accidentally re-implementing release metadata, archive naming, checksum parsing, or install-location logic a second time inside Rust. This task creates the one reusable updater boundary both CLIs will call.

The helper should preserve D311 and D320 by downloading the existing public installer script, forwarding the staged-proof env overrides the installer already understands, and making the sharp Windows self-overwrite edge explicit in code and tests instead of assuming a running `.exe` can replace itself in place.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Installer script fetch via `ureq` and `MESH_UPDATE_INSTALLER_URL` / default public URL | Return a structured error that names the installer URL and stop before executing anything local. | Surface timeout context from the download phase instead of retrying invisibly or hanging. | Reject empty or obviously broken installer bytes before writing/executing a temp script. |
| Platform launcher selection (`/bin/sh` vs PowerShell bootstrap) | Fail closed with the attempted launcher path and platform in the error. | Surface the launcher/bootstrap phase instead of leaving the caller hung without context. | Reject impossible launcher plans (missing temp file, unsupported platform, bad script path) before spawn. |
| Existing `MESH_INSTALL_*` installer overrides | Pass them through unchanged and let the canonical installer own release/checksum/install failures. | N/A for local env reads. | Do not reinterpret release metadata, archive names, or checksum content inside Rust. |

## Load Profile

- **Shared resources**: one installer download, temp-script files, and one child installer/bootstrap process.
- **Per-operation cost**: one network fetch plus one shell/PowerShell launch; this is a rare operator command, not a hot path.
- **10x breakpoint**: repeated download/process-spawn overhead fails before CPU does, so the helper must stay stateless and avoid caching partial installer state under `~/.mesh`.

## Negative Tests

- **Malformed inputs**: invalid or unreachable `MESH_UPDATE_INSTALLER_URL`, empty installer body, and unsupported launcher/platform resolution.
- **Error paths**: download failure, temp-script write failure, and launcher/bootstrap spawn failure.
- **Boundary conditions**: default URL selection on Unix vs Windows, passthrough of staged-proof env vars, and staged binaries running from outside `~/.mesh/bin`.

## Steps

1. Add `compiler/mesh-pkg/src/toolchain_update.rs` and expose it from `compiler/mesh-pkg/src/lib.rs` as the one updater seam both CLIs will call.
2. Implement platform-aware installer download + launch planning: Unix should feed installer bytes to `/bin/sh` with `--yes`, while Windows should use an explicit PowerShell/bootstrap path that allows the invoking `.exe` to exit before replacement.
3. Forward `MESH_INSTALL_RELEASE_API_URL`, `MESH_INSTALL_RELEASE_BASE_URL`, `MESH_INSTALL_DOWNLOAD_TIMEOUT_SEC`, and `MESH_INSTALL_STRICT_PROOF` unchanged to the installer child, and keep error returns high-signal but secret-safe.
4. Add focused integration or unit coverage in `compiler/mesh-pkg/tests/toolchain_update.rs` for default URL selection, installer override handling, env passthrough, Unix launcher construction, and Windows bootstrap/PowerShell command construction.

## Must-Haves

- [ ] One shared `mesh_pkg` updater seam exists and both CLIs can call it instead of duplicating update logic.
- [ ] The helper downloads the platform installer script from the public default URL, with `MESH_UPDATE_INSTALLER_URL` as the only new staging override.
- [ ] Existing `MESH_INSTALL_*` overrides flow through unchanged to the installer child.
- [ ] Windows launcher planning is explicit and testable instead of assuming a running `.exe` can overwrite itself in place.
  - Estimate: 2h
  - Files: compiler/mesh-pkg/src/lib.rs, compiler/mesh-pkg/src/toolchain_update.rs, compiler/mesh-pkg/tests/toolchain_update.rs
  - Verify: - `cargo test -p mesh-pkg --test toolchain_update -- --nocapture`
- The helper tests cover default URL selection, installer URL override handling, env passthrough, and host/Windows launcher construction without re-implementing installer semantics.
- [x] **T02: Added explicit `meshc update` and `meshpkg update` commands, wired both through the shared updater seam, and closed the `meshpkg --json update` ambiguity with a fail-closed guard.** — Once the shared helper exists, the public CLI surface still needs to expose it explicitly and truthfully. This task makes the new command discoverable, keeps both binaries on the same updater seam, and closes the `meshpkg --json` ambiguity instead of letting installer prose masquerade as structured output.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Shared updater helper in `compiler/mesh-pkg/src/toolchain_update.rs` | Preserve the helper's phase-rich error text at the CLI boundary instead of wrapping it into a vague generic failure. | Bubble the helper timeout/launcher context unchanged. | Do not post-process installer output into a fake success shape. |
| Clap subcommand/help wiring in `compiler/meshc/src/main.rs` and `compiler/meshpkg/src/main.rs` | Fail tests if `update` is missing from help or dispatches to the wrong code path. | N/A for local CLI parsing. | Reject unsupported flag combinations before trying to launch the installer. |
| Global `--json` mode in `meshpkg` | Fail closed with one explicit machine-readable error before the installer launches. | N/A for local formatting. | Do not emit mixed human installer prose inside JSON mode. |

## Load Profile

- **Shared resources**: none beyond one updater call per invocation.
- **Per-operation cost**: clap parse + one helper dispatch; trivial relative to the installer work itself.
- **10x breakpoint**: operator confusion, not resource saturation, is the first failure mode here, so help text and guard rails must stay explicit.

## Negative Tests

- **Malformed inputs**: `meshpkg --json update`, unknown flags with `update`, and missing helper wiring.
- **Error paths**: helper returns a launcher/download error and the CLI must still print one clear failure.
- **Boundary conditions**: `meshc update --help`, `meshpkg update --help`, and `meshpkg --json update` all stay truthful.

## Steps

1. Add `Update` subcommands and dispatch in `compiler/meshc/src/main.rs` and `compiler/meshpkg/src/main.rs`, keeping top-of-file help text and command docs aligned with the new surface.
2. Route both commands through the shared `mesh_pkg` updater seam so the pair is refreshed through one code path instead of two bespoke implementations.
3. Make `meshpkg --json update` fail closed before the installer launches, with one clear machine-readable error that explains why JSON mode is unsupported for installer-backed self-update.
4. Add light CLI smoke coverage in `compiler/meshc/tests/tooling_e2e.rs` and `compiler/meshpkg/tests/update_cli.rs` for help/discovery plus the JSON-mode guard.

## Must-Haves

- [ ] `meshc --help` and `meshpkg --help` both expose an explicit `update` command.
- [ ] Both CLIs dispatch through the same shared updater helper.
- [ ] `meshpkg --json update` fails closed with a clear machine-readable error before any installer process starts.
- [ ] Light CLI tests pin help text, dispatch presence, and the JSON-mode guard so future refactors cannot silently remove the surface.
  - Estimate: 90m
  - Files: compiler/meshc/src/main.rs, compiler/meshpkg/src/main.rs, compiler/meshc/tests/tooling_e2e.rs, compiler/meshpkg/tests/update_cli.rs
  - Verify: - `cargo test -p meshc --test tooling_e2e test_update -- --nocapture`
- `cargo test -p meshpkg --test update_cli -- --nocapture`
- [x] **T03: Added the retained staged-release acceptance rail that proves `meshc update` and `meshpkg update` refresh the whole toolchain pair and preserve credentials through the canonical installer path.** — The slice is not done when help text exists; it is done when the real update commands can refresh a staged or installed Mesh toolchain through the same installer path users already trust. This task adds the proof rail that exercises both commands against a staged local release server and fake Mesh home.

The rail should stay diagnosable like S01: retain the staged server tree, fake-home snapshots, command lines, stdout/stderr, exit statuses, version-file state, and credential-presence checks under `.tmp/m048-s03/...` so the first broken seam is inspectable without rerunning under manual instrumentation.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Local staged release server and hosted installer bytes | Fail the test with the staged URL and retained server tree instead of silently falling back to production URLs. | Surface the server/startup phase and stop before invoking update commands against a missing host. | Treat broken release metadata, missing archives, or wrong hosted installer content as contract failures. |
| Staged or installed CLI binaries under fake home state | Preserve command lines, stdout/stderr, and exit status so update failures are attributable to `meshc`, `meshpkg`, or installer bootstrap behavior. | Poll or wait with explicit phase names instead of hanging on bootstrap/self-overwrite paths. | Reject malformed fake-home state before assertions so false positives do not slip through. |
| Shared version/credentials contract under `~/.mesh` | Fail if the version file is not refreshed, the sibling binary stays broken, or credential presence disappears after update. | Surface the exact post-update check that timed out (version, sibling repair, credentials). | Never read or print credential contents; only assert preserved file presence and expected non-destructive behavior. |

## Load Profile

- **Shared resources**: local HTTP port, temp staged-release tree, fake home directory, copied binaries, and retained artifact directories.
- **Per-operation cost**: one staged metadata/installer host, two end-to-end update scenarios, and post-update binary/credential checks.
- **10x breakpoint**: port collisions, slow process startup, and artifact churn fail before CPU does, so the rail must keep bounded waits and per-phase logs.

## Negative Tests

- **Malformed inputs**: broken release metadata, missing sibling archive, stale version file, and corrupted installed sibling binary.
- **Error paths**: updater cannot reach the staged installer, installer exits non-zero, or the post-update sibling binary still fails to run.
- **Boundary conditions**: staged binary outside `~/.mesh/bin`, installed binary inside fake Mesh home, and host-specific bootstrap behavior that must still end in a repaired toolchain pair.

## Steps

1. Add `compiler/meshc/tests/e2e_m048_s03.rs` and any minimal support extensions in `compiler/meshc/tests/support/m046_route_free.rs` needed to find/build `meshpkg`, create retained artifact roots, and stage local release assets.
2. Build a local staged release server that serves hosted installer copies plus meshc/meshpkg archives, metadata JSON, and `SHA256SUMS`, all wired through `MESH_UPDATE_INSTALLER_URL` and the existing `MESH_INSTALL_*` overrides.
3. Add one staged `meshc update` scenario that starts from a copied binary outside `~/.mesh/bin` and proves both binaries land in the fake home with a refreshed shared version file.
4. Add one installed `meshpkg update` scenario that seeds fake-home credentials, corrupts the sibling binary and/or version file, runs update, then proves both binaries are healthy again and credentials were preserved without printing their contents.

## Must-Haves

- [ ] `compiler/meshc/tests/e2e_m048_s03.rs` proves staged `meshc update` and installed `meshpkg update` against a local staged release server.
- [ ] The rail asserts whole-toolchain repair: both binaries exist/run and the shared `~/.mesh/version` file is refreshed.
- [ ] The installed `meshpkg update` case proves `~/.mesh/credentials` survives self-update.
- [ ] Per-scenario artifacts under `.tmp/m048-s03/...` make the first failing phase inspectable without rerunning manually.
  - Estimate: 2h
  - Files: compiler/meshc/tests/e2e_m048_s03.rs, compiler/meshc/tests/support/m046_route_free.rs, compiler/mesh-pkg/src/toolchain_update.rs
  - Verify: - `cargo test -p meshc --test e2e_m048_s03 -- --nocapture`
- The retained rail leaves `.tmp/m048-s03/...` artifacts for both scenarios, including staged server files, command logs, version snapshots, and credential-presence checks.
