---
estimated_steps: 4
estimated_files: 4
skills_used:
  - rust-testing
  - rust-best-practices
---

# T03: Add a dedicated S01 end-to-end proof rail for default and override entrypoints

**Slice:** S01 — Configurable entrypoint in compiler and test discovery
**Milestone:** M048

## Description

Create one named acceptance target that proves build and test discovery stay aligned for default projects and manifest-override projects, including the no-root-main cases that currently fail or false-green.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `meshc build` / `meshc test` subprocesses invoked from `compiler/meshc/tests/e2e_m048_s01.rs` | Fail the named scenario and archive stdout/stderr; never treat a wrong-project or zero-proof run as success. | Time out with preserved scenario artifacts instead of hanging the test target. | Treat unexpected stdout/stderr shapes as contract failures and record them verbatim. |
| Temp project fixture writer and retained artifacts under `.tmp/m048-s01/` | Abort the scenario if fixtures cannot be written or archived; do not reuse stale artifacts. | N/A for local tempdir work. | Reject incomplete fixture trees that would accidentally reintroduce repo-CWD sources or missing entry files. |

## Load Profile

- **Shared resources**: Temp project directories, repeated `meshc` subprocess builds/tests, and retained artifact files under `.tmp/m048-s01/`.
- **Per-operation cost**: A small number of isolated project writes plus one `meshc build` or `meshc test` invocation per scenario.
- **10x breakpoint**: Compile time and retained artifact volume grow first, so the harness should share small fixture helpers and archive only what is needed to diagnose the first failing seam.

## Negative Tests

- **Malformed inputs**: Unexpected command output, missing fixture files, and invalid retained artifact state.
- **Error paths**: Override project with no root `main.mpl`, both root and override entries present with override expected to win, tests-dir target that used to miss the real project root, and specific-file target that used to fall back to repo CWD.
- **Boundary conditions**: Default root-`main.mpl` control fixture, nested `lib/start.mpl` entry override, and shared support modules imported by tests after the executable file is replaced.

## Steps

1. Create `compiler/meshc/tests/e2e_m048_s01.rs` with small temp-project helpers that can write manifest/no-manifest fixtures, optional dual entry files, support modules, and tests in isolated directories.
2. Add build/run scenarios for the default control, override wins when both entry files exist, and override-only build without root `main.mpl`, asserting binary output and truthful failure text where relevant.
3. Add `meshc test` scenarios for project-dir, tests-dir, and specific-file targets on override-entry fixtures, asserting the runner honors the same root/entry contract and does not drag repo sources into the compile.
4. Retain enough stdout/stderr or copied fixture artifacts under `.tmp/m048-s01/` so the first broken contract can be diagnosed without re-instrumenting the harness.

## Must-Haves

- [ ] The repo contains a named `compiler/meshc/tests/e2e_m048_s01.rs` target for S01 acceptance proof.
- [ ] The target proves default root-main behavior still works while override-entry projects build and run without root `main.mpl`.
- [ ] The same target proves tests-dir and specific-file discovery both work for override-entry projects.
- [ ] Failing scenarios preserve enough artifacts under `.tmp/m048-s01/` to show whether build or test discovery drifted.

## Verification

- `cargo test -p meshc --test e2e_m048_s01 -- --nocapture`
- The target should contain named assertions for default control, override precedence, override-only build, tests-dir execution, and specific-file execution.

## Observability Impact

- Signals added/changed: The acceptance rail becomes the first high-signal failure surface for default-vs-override build/test contract drift.
- How a future agent inspects this: Re-run the named test target and inspect the retained `.tmp/m048-s01/` artifacts plus the scenario-specific assertion text.
- Failure state exposed: The harness should make it obvious whether the regression is in build resolution, project-root detection, or temp-project entry replacement.

## Inputs

- `compiler/meshc/src/main.rs` — build path that must honor the configured entry before discovery.
- `compiler/meshc/src/discovery.rs` — entry/module-naming seam that the end-to-end proof must exercise.
- `compiler/meshc/src/test_runner.rs` — project-root detection and synthetic-entry replacement that the test scenarios must verify.
- `compiler/meshc/tests/tooling_e2e.rs` — targeted CLI regressions from T02 that this acceptance rail complements rather than duplicates.

## Expected Output

- `compiler/meshc/tests/e2e_m048_s01.rs` — dedicated end-to-end proof target for default and override entrypoint build/test behavior.
