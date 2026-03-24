---
id: T01
parent: S01
milestone: M029
provides:
  - Dot-aware `PATH` formatting for dotted imports and qualified impl headers
key_files:
  - compiler/mesh-fmt/src/walker.rs
  - reference-backend/api/health.mpl
  - .gsd/milestones/M029/slices/S01/S01-PLAN.md
key_decisions:
  - "D036: Route `SyntaxKind::PATH` through a dedicated dot-preserving walker instead of generic inline spacing."
patterns_established:
  - "For CST nodes whose token spacing is semantically meaningful, use exact-output walker tests instead of relying on idempotency alone."
observability_surfaces:
  - "cargo test -q -p mesh-fmt --lib walk_path_preserves_dotted_import_and_impl_paths -- --nocapture"
  - "cargo run -q -p meshc -- fmt --check reference-backend"
  - "rg -n \"^from .*\\. \" reference-backend -g '*.mpl'"
duration: 1h
verification_result: passed
completed_at: 2026-03-24 11:26:37 EDT
blocker_discovered: false
---

# T01: Route PATH nodes through dot-aware formatter logic

**Added a dedicated `PATH` formatter and exact-output regressions so dotted imports and qualified impl headers stay canonical.**

## What Happened

I fixed the root cause in `compiler/mesh-fmt/src/walker.rs` by routing `SyntaxKind::PATH` through a dedicated `walk_path(...)` function instead of the generic inline spacing walker. That keeps `from Api.Router import ...` and `impl Foo.Bar for Baz.Qux do` from being rewritten as `Foo. Bar` while leaving the generic spacing rules untouched.

I added a walker-level exact-output regression that asserts three cases directly: a single-line dotted `from` import, a parenthesized multiline dotted `from` import, and a qualified impl header with a real body. I also repaired `reference-backend/api/health.mpl` early because `mesh-fmt`’s library suite vendors that file as a canonical fixture; without that one import repair, the localized formatter fix still left the library suite red for an already-known downstream dogfood file.

Per the pre-flight contract, I also added `## Observability / Diagnostics` to the slice plan and `## Observability Impact` to the task plan so future agents know which exact-output tests, diffs, and grep sweeps expose regressions in this area.

## Verification

Task-level verification passed: the new walker regression passed, the full `mesh-fmt` library suite passed, and a direct CLI smoke check on a tiny repro file confirmed `meshc fmt` now emits `Api.Router` and `Foo.Bar` without inserted spaces.

Slice-level verification is partial, as expected on T01. `e2e_multiline_import_paren` stayed green, but `e2e_fmt`, `meshc fmt --check reference-backend`, and the repo-wide stale-import grep still fail because five other `reference-backend/` files still carry pre-fix spaced dotted imports that T03 is planned to repair.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -q -p mesh-fmt --lib walk_path_preserves_dotted_import_and_impl_paths -- --nocapture` | 0 | ✅ pass | 5.37s |
| 2 | `cargo test -q -p mesh-fmt --lib` | 0 | ✅ pass | 3.98s |
| 3 | `cargo test -q -p meshc --test e2e_fmt -- --nocapture` | 101 | ❌ fail | 18.05s |
| 4 | `cargo test -q -p meshc --test e2e e2e_multiline_import_paren -- --nocapture` | 0 | ✅ pass | 10.93s |
| 5 | `cargo run -q -p meshc -- fmt --check reference-backend` | 1 | ❌ fail | 5.99s |
| 6 | `! rg -n "^from .*\. " reference-backend -g '*.mpl'` | 1 | ❌ fail | 0.13s |
| 7 | `cargo run -q -p meshc -- fmt .tmp_fmt_path_repro` | 0 | ✅ pass | 5.98s |

## Diagnostics

Use `cargo test -q -p mesh-fmt --lib walk_path_preserves_dotted_import_and_impl_paths -- --nocapture` for the cheapest exact-output signal; any regression will show the expected canonical text versus the spaced output. Use `cargo run -q -p meshc -- fmt --check reference-backend` to see which backend files still reformat under the fixed walker, and `rg -n "^from .*\. " reference-backend -g '*.mpl'` to enumerate remaining stale spaced imports directly. No new runtime logging or secret-bearing diagnostics were introduced.

## Deviations

- I repaired `reference-backend/api/health.mpl` during T01 instead of waiting for T03 because `cargo test -q -p mesh-fmt --lib` includes that file as a canonical fixture and could not go green otherwise.
- I updated the slice and task plan artifacts first to add the missing observability sections required by the pre-flight checks.

## Known Issues

- `reference-backend/main.mpl`
- `reference-backend/storage/jobs.mpl`
- `reference-backend/jobs/worker.mpl`
- `reference-backend/api/jobs.mpl`
- `reference-backend/api/router.mpl`

These files still contain spaced dotted imports, so `fmt_check_reference_backend_directory_succeeds`, `meshc fmt --check reference-backend`, and the stale-import grep remain red until T02/T03 finish the higher-level regression and backend cleanup work.

## Files Created/Modified

- `compiler/mesh-fmt/src/walker.rs` — routed `SyntaxKind::PATH` through a dedicated dot-preserving walker and added exact-output regressions for dotted imports and qualified impl headers.
- `reference-backend/api/health.mpl` — repaired the canonical multiline import to `from Jobs.Worker import (` so the formatter library suite reflects post-fix output.
- `.gsd/milestones/M029/slices/S01/S01-PLAN.md` — added the required observability/diagnostic section and a focused formatter regression command.
- `.gsd/milestones/M029/slices/S01/tasks/T01-PLAN.md` — added the required observability impact section.
- `.gsd/KNOWLEDGE.md` — recorded the `mesh-fmt` lib-suite coupling to `reference-backend/api/health.mpl`.
- `.gsd/DECISIONS.md` — appended D036 for the dedicated `PATH` walker decision.
