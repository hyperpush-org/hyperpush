---
estimated_steps: 4
estimated_files: 5
skills_used:
  - test
  - review
  - lint
---

# T02: Make `meshc test` truthful for `reference-backend` and coverage reporting

**Slice:** S03 — Daily-Driver Tooling Trust
**Milestone:** M028

## Description

Repair the second major trust gap in the daily workflow: the docs teach project-directory test execution, but the CLI currently only accepts a single `*.test.mpl` file and still treats `--coverage` as a successful placeholder. This task should make `meshc test` truthful on the canonical backend path and leave behind at least one real Mesh-native test under `reference-backend/tests/`.

## Steps

1. Update `compiler/meshc/src/main.rs` and `compiler/meshc/src/test_runner.rs` so `meshc test <project-or-directory>` discovers recursive `*.test.mpl` files without regressing the existing specific-file path or project-root resolution logic.
2. Replace the green `--coverage` stub with an explicit honest contract in the CLI/test runner (for example, a clear unsupported error until real coverage exists) instead of returning success with no evidence.
3. Add a real backend-native Mesh test file at `reference-backend/tests/config.test.mpl` that exercises backend package code and proves `meshc test reference-backend` works on the milestone’s canonical package.
4. Extend `compiler/meshc/tests/tooling_e2e.rs` and `reference-backend/README.md` so the repo-level proof and backend operator docs both encode the verified directory-target and coverage behavior.

## Must-Haves

- [ ] `meshc test reference-backend` (or equivalent project-dir invocation) works without requiring a specific `*.test.mpl` file path.
- [ ] `reference-backend/tests/config.test.mpl` is a real passing Mesh test, not an empty placeholder.
- [ ] `--coverage` no longer exits 0 with “coming soon”; the CLI now reports an honest supported/unsupported contract and tests assert it.
- [ ] `compiler/meshc/tests/tooling_e2e.rs` covers directory invocation, backend test execution, and coverage-contract behavior.

## Verification

- `cargo run -p meshc -- test --help`
- `cargo run -p meshc -- test reference-backend`
- `cargo test -p meshc --test tooling_e2e -- --nocapture`

## Observability Impact

- Signals added/changed: the test runner now exposes explicit directory-target and coverage-contract behavior instead of a silent success stub.
- How a future agent inspects this: run `meshc test --help`, `meshc test reference-backend`, and the tooling e2e target to localize whether a regression is in CLI argument handling, test discovery, or coverage messaging.
- Failure state exposed: unsupported coverage and broken backend test discovery become direct CLI/test failures with clear messages.

## Inputs

- `compiler/meshc/src/main.rs` — CLI argument/help contract for `meshc test`
- `compiler/meshc/src/test_runner.rs` — test discovery, project-root resolution, and coverage behavior
- `compiler/meshc/tests/tooling_e2e.rs` — repo-level command-truth regression surface
- `reference-backend/config.mpl` — backend module to exercise from a real Mesh test
- `reference-backend/README.md` — package-local command surface that must stay truthful

## Expected Output

- `compiler/meshc/src/main.rs` — truthful `meshc test` CLI/help contract
- `compiler/meshc/src/test_runner.rs` — directory-aware discovery and honest coverage behavior
- `compiler/meshc/tests/tooling_e2e.rs` — regression coverage for directory invocation and coverage truth
- `reference-backend/tests/config.test.mpl` — real backend-native Mesh test file runnable through `meshc test`
- `reference-backend/README.md` — backend docs updated to the verified test workflow
