---
estimated_steps: 4
estimated_files: 3
skills_used:
  - rust-best-practices
  - rust-testing
---

# T02: Make test root discovery and temp project synthesis honor the resolved entry contract

**Slice:** S01 — Configurable entrypoint in compiler and test discovery
**Milestone:** M048

## Description

Fix `meshc test` so project-dir, tests-dir, and specific-file targets all resolve the same project root and configured entrypoint, then replace that resolved executable with the synthetic test `main.mpl` instead of assuming root `main.mpl` is the only executable file.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Project-root / target resolution in `compiler/meshc/src/test_runner.rs` | Abort the run with the target path that could not be mapped to a project root instead of silently falling back to repo CWD. | N/A for local path resolution. | Reject malformed or unsupported targets before preprocessing begins. |
| Temp project copy + manifest rewrite in `compiler/meshc/src/test_runner.rs` | Stop before compile if the synthetic project cannot preserve package/dependency info or exclude the resolved entry file. | N/A for local tempdir work. | Reject impossible entry rewrite state instead of compiling a false-green synthetic `main.mpl`. |

## Load Profile

- **Shared resources**: Temp directories, per-test source copies, filesystem traversal, and compile invocations for each discovered test file.
- **Per-operation cost**: One project-root lookup plus one temp-project copy/synthesis per test file.
- **10x breakpoint**: Large test suites with deep project trees will spend time copying sources and resolving roots, so the task must keep root detection single-pass and exclude only the resolved executable file.

## Negative Tests

- **Malformed inputs**: Target paths that are not directories or `*.test.mpl` files, and manifests with invalid configured entrypoint shapes.
- **Error paths**: Override-entry project with no root `main.mpl`, tests-dir target with imported support module, specific-file target that previously fell back to repo CWD, and configured entry file that would break compile if copied into the temp project.
- **Boundary conditions**: Manifest-less legacy project still discovered by ancestor `main.mpl`, override-entry project discovered by nearest `mesh.toml`, and one-file target inside `tests/` that must still resolve the project root.

## Steps

1. Replace the ancestor-`main.mpl`-only project-root logic in `compiler/meshc/src/test_runner.rs` with a nearest-`mesh.toml` preference and a root-`main.mpl` fallback for manifest-less projects.
2. Remove the specific-file -> repo CWD fallback so file-target runs either map to the real project root or fail closed with a truthful error.
3. Reuse the resolved entry helper from T01 when copying temp-project sources and synthesize or rewrite `mesh.toml` so generated test `main.mpl` is the executable entry while the original package/dependency context remains intact.
4. Extend `compiler/meshc/tests/tooling_e2e.rs` with project-dir, tests-dir, and specific-file regressions for override-entry fixtures that have no root `main.mpl`.

## Must-Haves

- [ ] `meshc test <project>`, `<project/tests>`, and `<project/tests/file.test.mpl>` all resolve the same project root for override-entry projects.
- [ ] The runner excludes the resolved project entry file from copied sources instead of special-casing only root `main.mpl`.
- [ ] Temp-project synthesis keeps the test DSL contract explicit: generated `main.mpl` is the executable entry for the compile.
- [ ] Specific-file targets fail closed or pass against the real project root; they do not fall back to repo CWD.

## Verification

- `cargo test -p meshc --test tooling_e2e test_test_ -- --nocapture`
- The new override-entry `tooling_e2e` cases assert project-dir, tests-dir, and specific-file targets all pass without a root `main.mpl`.

## Observability Impact

- Signals added/changed: Test-runner errors should distinguish wrong-root discovery, copied-entry contamination, and invalid temp-manifest state.
- How a future agent inspects this: Re-run the `tooling_e2e` filter and inspect the failing scenario name plus captured stdout/stderr from the CLI subprocess.
- Failure state exposed: The first failing assertion should reveal whether root detection, temp-copy exclusion, or manifest carry-forward drifted.

## Inputs

- `compiler/meshc/src/test_runner.rs` — current root detection, target resolution, temp source copy, and synthetic main handling all still assume root `main.mpl`.
- `compiler/mesh-pkg/src/manifest.rs` — resolved-entry helper from T01 should be reused here instead of re-implementing path validation.
- `compiler/meshc/tests/tooling_e2e.rs` — existing CLI regression surface for `meshc test` target handling.

## Expected Output

- `compiler/meshc/src/test_runner.rs` — manifest-aware root detection and temp-project synthesis that honor the resolved executable contract.
- `compiler/meshc/tests/tooling_e2e.rs` — regression scenarios for project-dir, tests-dir, and specific-file override-entry test runs.
