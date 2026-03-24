---
id: T02
parent: S02
milestone: M032
provides:
  - Verified blocker evidence that S02 cannot dogfood an inferred export in mesher until the compiler-side `m032_inferred_*` path actually passes in this working tree.
key_files:
  - compiler/meshc/tests/e2e.rs
  - scripts/verify-m032-s01.sh
  - mesher/storage/writer.mpl
  - mesher/services/writer.mpl
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Left mesher and the replay script unchanged because moving `flush_batch` or flipping `xmod_identity` to a success proof would knowingly make the repo's public truth false while the compiler regression still reproduces.
patterns_established:
  - Use `cargo test -p meshc --test e2e m032_inferred -- --nocapture` plus `bash scripts/verify-m032-s01.sh` together to distinguish an upstream inferred-export compiler blocker from a mesher-only regression.
observability_surfaces:
  - cargo test -p meshc --test e2e m032_inferred -- --nocapture
  - cargo test -p meshc --test e2e m032_inferred_cross_module_identity -- --nocapture
  - bash scripts/verify-m032-s01.sh
  - cargo run -q -p meshc -- build mesher
duration: blocker investigation and full slice verification replay
verification_result: failed
completed_at: 2026-03-24
# Set blocker_discovered: true only if execution revealed the remaining slice plan
# is fundamentally invalid (wrong API, missing capability, architectural mismatch).
# Do NOT set true for ordinary bugs, minor deviations, or fixable issues.
blocker_discovered: true
---

# T02: Dogfood the repaired inferred export in mesher and replay automation

**Recorded that T02 is blocked by the still-failing inferred-export compiler path and left mesher/script truth unchanged.**

## What Happened

I started from the task's prerequisite assumption: the compiler-side inferred-export repair from T01 had already landed and this unit only needed to dogfood it in mesher.

That assumption does not hold in the current working tree.

Before touching `mesher/storage/writer.mpl`, `mesher/services/writer.mpl`, or `scripts/verify-m032-s01.sh`, I replayed the slice gates and verified that the compiler still fails on the exact capability this task needs:

- `m032_inferred_local_identity` still compiles and then crashes at runtime after printing `0`, with a null-pointer dereference in `mesh-rt/src/string.rs`
- `m032_inferred_cross_module_identity` still fails during LLVM verification with `Call parameter type does not match function signature!`
- the adjacent cross-module controls (`e2e_cross_module_polymorphic`, `e2e_cross_module_service`) still pass
- the retained-failure automation script still passes because it still truthfully expects `xmod_identity` to fail
- mesher fmt/build still pass because `flush_batch` remains local to `Services.Writer`

Given that state, moving `flush_batch` into `Storage.Writer` with an inferred collection parameter, or changing `verify-m032-s01.sh` to expect `xmod_identity` success, would knowingly leave the repo in a false and red state. I did not ship that lie.

Instead, I documented the blocker in `.gsd/KNOWLEDGE.md`, wrote this handoff, and marked the task artifact complete so auto-mode can replan around the actual prerequisite failure.

## Verification

I reran the full slice verification surface plus the T02-local grep check. The results split cleanly:

- compiler prerequisite still broken: `m032_inferred`, `m032_inferred_cross_module_identity`
- adjacent cross-module controls still healthy: `e2e_cross_module_polymorphic`, `e2e_cross_module_service`
- public retained-failure replay still healthy: `bash scripts/verify-m032-s01.sh`
- current mesher baseline still healthy: fmt/build green
- dogfood import not present yet: `rg` still finds `flush_batch` only in `mesher/services/writer.mpl`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p meshc --test e2e m032_inferred -- --nocapture` | 101 | ❌ fail | 8.88s |
| 2 | `cargo test -p meshc --test e2e m032_inferred_cross_module_identity -- --nocapture` | 101 | ❌ fail | 7.59s |
| 3 | `cargo test -p meshc --test e2e e2e_cross_module_polymorphic -- --nocapture` | 0 | ✅ pass | 11.64s |
| 4 | `cargo test -p meshc --test e2e e2e_cross_module_service -- --nocapture` | 0 | ✅ pass | 10.99s |
| 5 | `bash scripts/verify-m032-s01.sh` | 0 | ✅ pass | 92.57s |
| 6 | `rg -n "^pub fn flush_batch|flush_batch\(" mesher/storage/writer.mpl mesher/services/writer.mpl` | 0 | ✅ pass | 0.03s |
| 7 | `cargo run -q -p meshc -- fmt --check mesher` | 0 | ✅ pass | 7.78s |
| 8 | `cargo run -q -p meshc -- build mesher` | 0 | ✅ pass | 16.50s |

## Diagnostics

Use these commands to inspect the blocker later:

- `cargo test -p meshc --test e2e m032_inferred -- --nocapture` — shows both current blocker shapes together
- `cargo test -p meshc --test e2e m032_inferred_cross_module_identity -- --nocapture` — isolates the cross-module LLVM verifier failure this task depends on
- `bash scripts/verify-m032-s01.sh` — confirms the public replay surface still truthfully treats `xmod_identity` as a retained failure
- `cargo run -q -p meshc -- build mesher` — confirms mesher is only green because the inferred helper has not yet crossed the module boundary
- `rg -n "^pub fn flush_batch|flush_batch\(" mesher/storage/writer.mpl mesher/services/writer.mpl` — confirms `flush_batch` is still local to `Services.Writer`

## Deviations

- I did not edit `mesher/storage/writer.mpl`, `mesher/services/writer.mpl`, or `scripts/verify-m032-s01.sh`.
- That is a real deviation from the written task plan, but it is driven by a plan-invalidating prerequisite mismatch: the compiler repair that T02 is supposed to dogfood is not actually present in this working tree.
- I marked `blocker_discovered: true` for that reason.

## Known Issues

- `m032_inferred_local_identity` still fails at runtime after printing `0`, then crashes on a null-pointer dereference in `mesh-rt/src/string.rs`.
- `m032_inferred_cross_module_identity` still fails in LLVM verification with `Call parameter type does not match function signature!`.
- `scripts/verify-m032-s01.sh` still expects `xmod_identity` to fail, and that expectation is still correct today.
- `mesher/storage/writer.mpl` still contains the stale comment block and `mesher/services/writer.mpl` still owns `flush_batch`; those changes remain blocked on the missing compiler repair.

## Files Created/Modified

- `.gsd/KNOWLEDGE.md` — added a blocker note so future agents do not flip the mesher dogfood path or replay script before `m032_inferred` is actually green.
- `.gsd/milestones/M032/slices/S02/S02-PLAN.md` — marked T02 complete so auto-mode can consume the blocker summary and trigger replanning.
- `.gsd/milestones/M032/slices/S02/tasks/T02-SUMMARY.md` — recorded the blocker, the full verification replay, and the exact failure surfaces.
