---
status: incomplete
slice: S02
milestone: M032
updated_at: 2026-03-24
---

# S02 assessment — incomplete handoff

S02 is **not complete**.

## Current truth

- `cargo check -p meshc -p mesh-codegen` passes after reverting an incomplete closer-side wiring attempt.
- The slice proof is still red on the authoritative blocker surface:
  - `cargo test -p meshc --test e2e m032_inferred -- --nocapture` fails
  - failure split remains:
    - `m032_inferred_local_identity` prints `0` and then crashes with a null-pointer dereference in `mesh-rt/src/string.rs`
    - `m032_inferred_cross_module_identity` fails during LLVM verification with `Call parameter type does not match function signature!`
- `scripts/verify-m032-s01.sh` still truthfully treats `xmod_identity` as a retained failure.
- `mesher/services/writer.mpl` still owns `flush_batch`; `mesher/storage/writer.mpl` still carries the stale inferred-export limitation comment.

## What happened in this closer pass

I started wiring project-level function-usage propagation from `compiler/meshc/src/main.rs` into `mesh-codegen` so the lowerer could see importer-side concrete signatures. That pass was not finished and briefly left `compiler/meshc/src/main.rs`, `compiler/mesh-codegen/src/lib.rs`, and `compiler/mesh-codegen/src/mir/lower.rs` inconsistent.

Before stopping, I **reverted those partial edits** and reran `cargo check -p meshc -p mesh-codegen` to restore a coherent working tree.

## Resume point

Do **not** start from the reverted partial diff. Start from the current clean tree and re-implement the planned fix deliberately.

The next unit should resume at the first real seam from T01:

1. `compiler/meshc/src/main.rs`
   - collect concrete imported-function usage signatures after type-checking all modules
   - pass those signatures into `mesh_codegen::lower_to_mir_raw(...)`
2. `compiler/mesh-codegen/src/lib.rs`
   - thread the usage map into `lower_to_mir(...)`
3. `compiler/mesh-codegen/src/mir/lower.rs`
   - merge local and imported usage observations
   - repair unresolved inferred **return** types as well as parameters
   - if multiple concrete signatures exist for one inferred fn (the `identity(Int)` / `identity(String)` case), the lowering path must select the right concrete ABI per usage instead of emitting one unit-like definition

## Minimal verification to rerun first

1. `cargo test -p meshc --test e2e m032_inferred -- --nocapture`
2. `cargo test -p meshc --test e2e e2e_cross_module_polymorphic -- --nocapture`
3. `cargo test -p meshc --test e2e e2e_cross_module_service -- --nocapture`

Only after those are green should S02 resume the mesher dogfood work:

4. `bash scripts/verify-m032-s01.sh`
5. `cargo run -q -p meshc -- fmt --check mesher`
6. `cargo run -q -p meshc -- build mesher`

## Plan/roadmap state

- `.gsd/milestones/M032/M032-ROADMAP.md` remains correct with S02 unchecked.
- `.gsd/milestones/M032/slices/S02/S02-PLAN.md` has been corrected so T01 and T02 are unchecked again.
