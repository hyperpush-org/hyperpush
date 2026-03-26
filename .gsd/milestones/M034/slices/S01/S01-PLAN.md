# S01: Real registry publish/install proof

**Goal:** Prove the real Mesh registry path end-to-end by making scoped published packages installable/buildable, adding one canonical live verifier for publish→metadata→download→install→lockfile→consumer-build truth, and tightening the remaining registry/package-manager contract edges that would otherwise allow false-green release confidence.
**Demo:** After this: A release-scoped package can be published to the real registry path and installed with `meshpkg`, with checksum, metadata, download, and lockfile truth rechecked.

## Tasks
- [x] **T01: Taught meshc and mesh-lsp to discover scoped installed package roots from mesh.toml leaves and added scoped package regressions that prove the natural cache layout builds and analyzes cleanly.** — Close the hard blocker from research: real registry installs already extract scoped packages to `.mesh/packages/<owner>/<package>@<version>`, but both `meshc` and `mesh-lsp` currently stop one directory too early and therefore treat the owner directory as the package root. Preserve the scoped on-disk layout, teach both analyzers to recurse to leaf package roots containing `mesh.toml`, and pin the contract with named regressions that prove a consumer can import a module from a scoped installed package without manual flattening.

## Load Profile

- **Shared resources**: repeated filesystem walks under `.mesh/packages` during builds and editor analysis.
- **Per-operation cost**: recursive directory traversal plus parse/typecheck of each discovered package root.
- **10x breakpoint**: deeply nested or version-heavy package caches would hurt build/LSP latency first, so discovery must stay deterministic and skip non-package directories cheaply.

## Negative Tests

- **Malformed inputs**: owner directories with no `mesh.toml`, hidden directories/files, and package trees that contain only `main.mpl`.
- **Error paths**: nested non-package directories should be skipped instead of panicking or compiling package-root `main.mpl` as a normal module.
- **Boundary conditions**: both `.mesh/packages/<owner>/<package>@<version>` and flat `.mesh/packages/<package>@<version>` layouts resolve the same import/module naming rules.

## Steps

1. Extract or add a shared package-root discovery rule in `compiler/meshc/src/discovery.rs` that finds leaf package directories containing `mesh.toml` anywhere under `.mesh/packages`, while still ignoring hidden paths and package-root `main.mpl`.
2. Mirror the same scoped-package discovery semantics in `compiler/mesh-lsp/src/analysis.rs` so editor diagnostics/hover/go-to-definition stay aligned with `meshc build`.
3. Add `compiler/meshc/tests/e2e_m034_s01.rs` coverage that lays out a temp consumer plus scoped installed package tree and proves the consumer builds without manual filesystem moves.
4. Add or extend `compiler/mesh-lsp/src/analysis.rs` unit tests so nested scoped package roots analyze cleanly and do not regress back to the owner-directory bug.

## Must-Haves

- [ ] Scoped installed packages build from their natural nested owner/package cache path.
- [ ] `meshc` and `mesh-lsp` share the same package-root expectation for scoped installs.
- [ ] Named regressions fail specifically on discovery drift instead of surfacing later as a vague `module not found` release failure.
  - Estimate: 2h
  - Files: compiler/meshc/src/discovery.rs, compiler/mesh-lsp/src/analysis.rs, compiler/meshc/tests/e2e_m034_s01.rs
  - Verify: `cargo test -p meshc --test e2e_m034_s01 scoped_installed_package_builds -- --nocapture`
`cargo test -p mesh-lsp scoped_installed_package -- --nocapture`
- [x] **T02: Added the M034 real-registry verifier script and scoped proof fixtures, but the live publish/install proof still needs a real dashboard-issued owner/token pair to run end to end.** — Once scoped installs compile locally, create the single repo-local proof surface that later CI work can call unchanged. The verifier must use one owner-scoped proof package name plus a unique version per run, isolate credentials under `.tmp/m034-s01/home`, publish to the real registry with `meshpkg --json`, and then recheck API, download, lockfile, consumer build, duplicate publish rejection, and public discoverability instead of trusting artifact builds or homepage counts.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Real registry API / R2 | Fail the active phase, persist status/body/logs under `.tmp/m034-s01/verify/`, and stop without retrying the same version. | Fail fast with the package/version coordinate recorded for operator review. | Treat any non-JSON or missing field as proof failure; do not infer success from partial output. |
| Packages website SSR | Only check it after publish/install truth passes; persist the exact URL/body snapshot on failure. | Allow one bounded wait/retry, then fail the visibility phase. | Treat missing package/version text as a visibility failure, not as a soft warning. |
| Local `meshpkg` / `meshc` binaries | Stop immediately and keep stdout/stderr in the phase log. | N/A | Reject non-JSON `meshpkg --json` output and stop the proof. |

## Load Profile

- **Shared resources**: immutable registry versions, download counters, real network calls, and the temporary credential/home directories under `.tmp/m034-s01/`.
- **Per-operation cost**: one real publish, multiple metadata/search/detail fetches, one tarball download/hash, one install, one consumer build, and one duplicate-publish check.
- **10x breakpoint**: version collisions and flaky network calls fail first, so the verifier must generate unique versions and keep phase logs for reruns instead of retrying blindly.

## Negative Tests

- **Malformed inputs**: missing `MESH_PUBLISH_OWNER`, missing `MESH_PUBLISH_TOKEN`, missing/invalid version override, or templates that fail to render a quoted scoped dependency key.
- **Error paths**: duplicate publish must return 409, missing metadata/search/detail fields must fail the proof, and any SHA mismatch between publish metadata, downloaded tarball, and `mesh.lock` must stop the script.
- **Boundary conditions**: exact package detail URL, search endpoint visibility, and a consumer that installs from `mesh.toml` using a quoted scoped dependency key.

## Steps

1. Add durable proof-package and consumer fixture templates under `scripts/fixtures/` so the verifier creates reproducible temp workspaces instead of hand-writing files inline.
2. Implement `scripts/verify-m034-s01.sh` with phase helpers patterned after the existing M033 verifier style: isolated HOME/credentials, unique per-run version generation, JSON publish/install parsing, direct registry HTTP checks, tarball SHA validation, lockfile assertions, consumer build, and duplicate publish rejection.
3. Verify public visibility using the exact package detail/search surfaces rather than homepage package counts, and store every phase log/artifact under `.tmp/m034-s01/verify/` for later debugging.
4. Keep the verifier small and CI-ready: explicit env contract, deterministic temp paths, no secret echo, and no dependency on unreleased installer artifacts or workflow YAML.

## Must-Haves

- [ ] `scripts/verify-m034-s01.sh` is the authoritative publish→metadata→download→install→lockfile→build proof surface for this slice.
- [ ] The verifier uses quoted scoped dependency keys in the consumer manifest and proves the installed dependency actually compiles.
- [ ] Duplicate publish rejection, exact package detail/search visibility, and SHA/lockfile truth are all checked in the same run.
- [ ] Every failure leaves phase-specific logs under `.tmp/m034-s01/verify/` without printing secrets.
  - Estimate: 2.5h
  - Files: scripts/verify-m034-s01.sh, scripts/fixtures/m034-s01-proof-package/mesh.toml.template, scripts/fixtures/m034-s01-proof-package/registry_proof.mpl, scripts/fixtures/m034-s01-consumer/mesh.toml.template, scripts/fixtures/m034-s01-consumer/main.mpl, compiler/meshpkg/src/install.rs
  - Verify: `bash -n scripts/verify-m034-s01.sh`
`bash scripts/verify-m034-s01.sh`
- [ ] **T03: Harden registry truth edges and align the named-install/scoped-key contract** — The live verifier should not be able to report green while registry state is half-committed or the public docs lie about dependency declaration. Tighten publish/download ordering so blob truth exists before metadata/counters advance, correct `meshpkg install <name>` messaging to match its real fetch+lockfile behavior, and update the public tooling docs so scoped dependency examples use quoted TOML keys and the operator contract matches what the CLI actually does.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Registry DB insert / R2 upload | Abort publish without leaving a metadata-only success path; surface 409 vs internal errors distinctly. | Fail the publish phase and record whether blob upload or DB persistence stalled. | Return an explicit failure instead of claiming success or leaving counters/metadata advanced. |
| Registry object fetch / counter update | Return 404/explicit failure without incrementing counters when the blob is unavailable. | Fail the download phase without mutating counters. | Treat missing blob/metadata state as a release-blocking proof failure. |
| CLI/docs consumers | Fail contract checks when output/docs still imply manifest mutation or omit quoted scoped dependency examples. | N/A | Treat stale contract text as drift to fix, not as a non-blocking note. |

## Load Profile

- **Shared resources**: versions table uniqueness, R2 object existence/lookups, registry download counters, and the live proof package namespace.
- **Per-operation cost**: one blob existence/upload decision plus one DB insert per publish, and one object fetch plus counter update per successful download.
- **10x breakpoint**: duplicate publish races and repeated object lookups would surface first, so the hardened path should stay idempotent and keep the verifier serialized to one version per run.

## Negative Tests

- **Malformed inputs**: duplicate name/version publishes, missing object state, and scoped dependency snippets written without quoted keys.
- **Error paths**: duplicate publish must stay a 409, missing blob fetch must fail without counter inflation, and named install must leave `mesh.toml` unchanged while still updating `mesh.lock`.
- **Boundary conditions**: existing blob reuse by SHA, exact latest-version metadata, and docs/CLI wording that distinguishes declared dependencies from one-off fetches.

## Steps

1. Reorder `registry/src/routes/publish.rs` so object truth is established before the version row becomes the source of public metadata truth, while keeping README extraction and immutable-version handling intact.
2. Reorder `registry/src/routes/download.rs` so counters move only after object fetch succeeds, and make the failure path visible instead of silently inflating download counts.
3. Fix `compiler/meshpkg/src/install.rs` messaging/comments so named install is explicitly a fetch+lockfile operation, not a hidden `mesh.toml` mutation.
4. Update `website/docs/docs/tooling/index.md` and extend `scripts/verify-m034-s01.sh` so the public/operator contract now covers quoted scoped dependency keys, named-install manifest stability, duplicate publish rejection, and the hardened failure expectations.

## Must-Haves

- [ ] Publish no longer leaves a version row as the public truth source before the blob exists.
- [ ] Download counters advance only after object fetch succeeds.
- [ ] CLI/docs explicitly state that named install fetches and locks a package but does not edit `mesh.toml`.
- [ ] The verifier reruns the duplicate-publish and named-install contract checks against the hardened flow.
  - Estimate: 2h
  - Files: registry/src/routes/publish.rs, registry/src/routes/download.rs, compiler/meshpkg/src/install.rs, website/docs/docs/tooling/index.md, scripts/verify-m034-s01.sh
  - Verify: `bash scripts/verify-m034-s01.sh`
`rg -n '"your-login/your-package" = "1.0.0"' website/docs/docs/tooling/index.md`
`rg -n 'does not edit mesh.toml|updates mesh.lock' website/docs/docs/tooling/index.md compiler/meshpkg/src/install.rs`
