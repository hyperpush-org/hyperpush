---
estimated_steps: 4
estimated_files: 9
skills_used:
  - test
  - rust-best-practices
---

# T01: Ship the neutral expression contract through compiler and runtime

**Slice:** S01 — Neutral expression core on real write paths
**Milestone:** M033

## Description

Land the neutral expression core end-to-end before touching Mesher storage code. This task adds the dedicated expression builder, the Query/Repo entrypoints needed for expression-valued `SELECT` / `SET` / `ON CONFLICT` work, the compiler/runtime wiring that makes those calls legal from Mesh code, and the first permanent `meshc` e2e proofs in `compiler/meshc/tests/e2e_m033_s01.rs`. The contract must stay portable: no JSONB, pgcrypto, search, or catalog-specific helpers belong in this layer.

## Steps

1. Add a dedicated expression-builder surface under the runtime DB layer and expose only the portable nodes S01 needs: column refs, literal/parameter values, `NULL`, function calls, arithmetic/comparison, `CASE`, and `COALESCE`, plus the neutral conflict-update reference the upsert path will need later.
2. Extend `Query` / `Repo` so Mesh code can use those expression nodes for expression-valued `SELECT`, `SET`, and `ON CONFLICT` work without routing through `RAW:` strings.
3. Wire the new surface through `compiler/mesh-typeck/src/infer.rs`, `compiler/mesh-codegen/src/mir/lower.rs`, `compiler/mesh-codegen/src/codegen/intrinsics.rs`, and the runtime exports so the Mesh-side API is fully callable.
4. Add named `e2e_m033_expr_*` coverage in `compiler/meshc/tests/e2e_m033_s01.rs` that proves the contract compiles, executes, and keeps placeholder ordering / serializer output stable enough for later Mesher rewrites.

## Must-Haves

- [ ] Mesh code can build neutral expression trees and pass them through Query/Repo without `RAW:` or `Repo.query_raw`
- [ ] `compiler/meshc/tests/e2e_m033_s01.rs` contains passing `e2e_m033_expr_*` proofs for expression-valued `SELECT`, `SET`, and conflict-update work
- [ ] The new core excludes PG-only JSONB/search/crypto helpers so the later vendor-specific slices still have an explicit seam

## Verification

- `cargo test -p meshc --test e2e_m033_s01 expr_ -- --nocapture`
- `cargo run -q -p meshc -- build mesher`

## Observability Impact

- Signals added/changed: named `e2e_m033_expr_*` failures that distinguish serializer drift, placeholder-order drift, and unsupported expression-node bugs
- How a future agent inspects this: rerun the `expr_` filter in `compiler/meshc/tests/e2e_m033_s01.rs` and inspect the failing assertion/output tied to the exact expression family
- Failure state exposed: the first contract drift surfaces as a specific expression-proof name instead of a later Mesher route failure

## Inputs

- `compiler/mesh-rt/src/db/query.rs` — existing opaque Query builder and raw extension behavior
- `compiler/mesh-rt/src/db/repo.rs` — current Map<String,String>-only write path and upsert/update plumbing
- `compiler/mesh-rt/src/db/orm.rs` — SQL builder helpers and current upsert rendering model
- `compiler/mesh-rt/src/db/mod.rs` — DB module export layout for any new runtime file
- `compiler/mesh-rt/src/lib.rs` — runtime symbol exports consumed by compiled Mesh binaries
- `compiler/mesh-typeck/src/infer.rs` — Mesh-side Query/Repo module signatures
- `compiler/mesh-codegen/src/mir/lower.rs` — intrinsic name mapping and known function table
- `compiler/mesh-codegen/src/codegen/intrinsics.rs` — external function declarations for runtime linkage
- `compiler/meshc/tests/e2e.rs` — existing CLI e2e helper style to mirror in a dedicated S01 test file

## Expected Output

- `compiler/mesh-rt/src/db/expr.rs` — dedicated neutral expression builder/runtime representation
- `compiler/mesh-rt/src/db/query.rs` — expression-aware Query entrypoints for select/filter composition
- `compiler/mesh-rt/src/db/repo.rs` — expression-aware write/update/upsert execution paths
- `compiler/mesh-rt/src/db/mod.rs` — runtime DB module exports for the new expression layer
- `compiler/mesh-rt/src/lib.rs` — top-level runtime symbol exports for compiled Mesh linkage
- `compiler/mesh-typeck/src/infer.rs` — Mesh module signatures for the new expression surface
- `compiler/mesh-codegen/src/mir/lower.rs` — intrinsic lookup entries for the new expression calls
- `compiler/mesh-codegen/src/codegen/intrinsics.rs` — LLVM-visible declarations for the new runtime functions
- `compiler/meshc/tests/e2e_m033_s01.rs` — permanent contract tests for the neutral expression core
