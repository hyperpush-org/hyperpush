---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - test
  - review
---

# T01: Harden formatter and format-on-save on the reference backend

**Slice:** S03 — Daily-Driver Tooling Trust
**Milestone:** M028

## Description

Fix the highest-confidence tooling failure first: formatting the canonical backend currently panics in the shared `mesh_fmt::format_source(...)` path. This task should turn the live `reference-backend/api/health.mpl` reproducer into a permanent regression so both CLI formatting and later LSP formatting proof rest on a safe backend-shaped path.

## Steps

1. Reproduce the formatter overflow against `reference-backend/api/health.mpl` and isolate which `Group`/flat-width behavior in `compiler/mesh-fmt/src/printer.rs` turns `Hardline` or `usize::MAX` into an unsafe `col + flat_width` decision.
2. Fix the printer/group-fit logic in `compiler/mesh-fmt/src/printer.rs` and add a focused regression in `compiler/mesh-fmt/src/lib.rs` so backend-shaped multiline constructs choose broken rendering instead of panicking.
3. Extend `compiler/meshc/tests/e2e_fmt.rs` with a reference-backend formatter regression and, if needed, add a CLI-level smoke assertion in `compiler/meshc/tests/tooling_e2e.rs` so the `meshc fmt --check reference-backend` path is mechanically covered.
4. Re-run formatter verification on the real backend tree to confirm the command exits cleanly and remains idempotent.

## Must-Haves

- [ ] `compiler/mesh-fmt/src/printer.rs` no longer allows the backend reproducer to panic on flat-width overflow or hardline groups.
- [ ] `compiler/mesh-fmt/src/lib.rs` contains a focused regression that fails before the fix and passes after it.
- [ ] `compiler/meshc/tests/e2e_fmt.rs` proves the CLI formatter can check or format the backend reproducer without crashing.
- [ ] The task preserves canonical formatter output; it must not “fix” the panic by silently skipping backend files.

## Verification

- `cargo test -p mesh-fmt -- --nocapture`
- `cargo test -p meshc --test e2e_fmt -- --nocapture`
- `cargo run -p meshc -- fmt --check reference-backend`

## Observability Impact

- Signals added/changed: formatter regressions now fail with a named backend file/test instead of an opaque arithmetic overflow panic.
- How a future agent inspects this: run `cargo run -p meshc -- fmt --check reference-backend` and the formatter test targets to see whether the bug is in printer logic or CLI wiring.
- Failure state exposed: backend-shaped formatting regressions become direct test failures with file-path context.

## Inputs

- `compiler/mesh-fmt/src/printer.rs` — current group-fit and flat-width decision logic
- `compiler/mesh-fmt/src/lib.rs` — formatter-level regression surface
- `compiler/meshc/tests/e2e_fmt.rs` — CLI formatter integration coverage
- `compiler/meshc/tests/tooling_e2e.rs` — broader tooling smoke coverage if a CLI regression check is needed
- `reference-backend/api/health.mpl` — canonical backend reproducer for the panic

## Expected Output

- `compiler/mesh-fmt/src/printer.rs` — hardened printer logic that chooses broken rendering instead of panicking
- `compiler/mesh-fmt/src/lib.rs` — regression coverage for the backend-shaped formatting case
- `compiler/meshc/tests/e2e_fmt.rs` — CLI regression proving the formatter stays safe on the backend path
- `compiler/meshc/tests/tooling_e2e.rs` — optional tooling-level smoke assertion for the backend formatter path
