---
id: T05
parent: S01
milestone: M028
provides:
  - compiler-facing reference-backend e2e coverage aligned with package-local docs/env examples, plus a narrowed null-PoolHandle blocker repro for the remaining slice failure
key_files:
  - compiler/meshc/tests/e2e_reference_backend.rs
  - reference-backend/README.md
  - reference-backend/.env.example
  - compiler/mesh-rt/src/db/pool.rs
  - .gsd/milestones/M028/slices/S01/tasks/T05-PLAN.md
key_decisions:
  - Use the real package smoke contract in the compiler-facing ignored test by running `meshc migrate reference-backend status`, `meshc migrate reference-backend up`, and then delegating to `reference-backend/scripts/smoke.sh` instead of keeping a bespoke pending-only HTTP round-trip.
  - Document the actual local CLI contract as `meshc migrate reference-backend <command>` in the package README and env example, because that is the command shape that works in this worktree.
  - Add a direct ignored `mesh_pool_open`/`mesh_pool_execute` Postgres smoke test in `compiler/mesh-rt` to separate pool-runtime behavior from the compiled-Mesh handle-passing failure.
patterns_established:
  - Keep compiler-facing e2e smoke coverage anchored to the package-local smoke script and make the Rust test self-apply migrations before invoking the script.
observability_surfaces:
  - reference-backend/README.md canonical command list
  - compiler/meshc/tests/e2e_reference_backend.rs ignored runtime and smoke proofs
  - compiler/mesh-rt/src/db/pool.rs ignored direct Postgres pool smoke test
  - meshc migrate failure signature: null PoolHandle dereference in mesh_pool_checkout
  - .gsd/KNOWLEDGE.md resume note for the opaque-handle/codegen boundary
duration: 2h30m
verification_result: blocked
completed_at: 2026-03-23T07:55:24Z
blocker_discovered: true
---

# T05: Finish compiler-facing e2e proof and canonical package documentation

**Added smoke-aligned compiler e2e docs/env artifacts, then isolated the remaining slice blocker to compiled Mesh programs passing a null `PoolHandle` into pool-backed DB calls.**

## What Happened

I completed the task-owned deliverables first. `compiler/meshc/tests/e2e_reference_backend.rs` now keeps the build-only proof, the ignored non-empty-`DATABASE_URL` startup regression, and an ignored Postgres smoke proof that applies migrations and then delegates to `reference-backend/scripts/smoke.sh`. I added `reference-backend/README.md` with the exact prerequisite, build, migrate, run, smoke, and compiler-facing verification commands, and I added `reference-backend/.env.example` so the package-local docs and smoke path share the same startup variable names and defaults.

The pre-flight observability gap in `T05-PLAN.md` is also fixed: the task plan now explains the signals this task changes, how a future agent inspects them, and what failure state becomes visible.

When I moved into slice-close verification, the remaining blocker was still real. `cargo build -p mesh-rt`, the missing-env check, and the ignored runtime-start regression all passed. `meshc migrate reference-backend up` still failed, so I reproduced the migration child outside the wrapper and narrowed the failure. A direct Rust-level ignored test in `compiler/mesh-rt/src/db/pool.rs` now proves `mesh_pool_open` plus `mesh_pool_execute` can succeed against Postgres, but the compiled Mesh migration child still hands `mesh_pool_checkout` a null `PoolHandle`. I made one contained runtime experiment in `compiler/mesh-rt/src/db/pool.rs` while testing that boundary, but the slice is still blocked because the actual failure is now clearly in the compiled Mesh opaque-handle/result-unwrapping path rather than in the Rust pool implementation alone.

## Verification

I verified the new compiler-facing build proof, the missing-env failure, and the ignored runtime-start proof successfully. I also added and ran an ignored direct Postgres pool smoke test in `mesh-rt` to separate runtime pool behavior from the compiled Mesh child failure. The slice still does not close because `meshc migrate reference-backend up` aborts after the migration child starts, and I stopped there per the context-budget wrap-up instruction instead of starting a fresh codegen investigation.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo build -p mesh-rt && cargo test -p meshc e2e_reference_backend_builds --test e2e_reference_backend -- --nocapture` | 0 | ✅ pass | 9.98s |
| 2 | `env -u DATABASE_URL PORT=18080 JOB_POLL_MS=500 ./reference-backend/reference-backend 2>&1 | rg "DATABASE_URL"` | 0 | ✅ pass | 0.77s |
| 3 | `set -a && source .env && set +a && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc e2e_reference_backend_runtime_starts --test e2e_reference_backend -- --ignored --nocapture` | 0 | ✅ pass | 6.83s |
| 4 | `set -a && source .env && set +a && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p mesh-rt test_pool_execute_postgres_round_trip -- --ignored --nocapture` | 0 | ✅ pass | 23.05s |
| 5 | `set -a && source .env && set +a && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo run -p meshc -- migrate reference-backend up` | 1 | ❌ fail | 15.99s |

## Diagnostics

- Package contract: `reference-backend/README.md` now lists the canonical build, migrate, run, smoke, and compiler-facing verification commands.
- Package env contract: `reference-backend/.env.example` is the authoritative variable-name/default example for `DATABASE_URL`, `PORT`, and `JOB_POLL_MS`.
- Compiler-facing proofs: `compiler/meshc/tests/e2e_reference_backend.rs` is the single Rust test surface for build-only, runtime-start, and ignored Postgres smoke coverage.
- Runtime isolation probe: `compiler/mesh-rt/src/db/pool.rs` now has `test_pool_execute_postgres_round_trip` to prove the Rust pool API can still execute a Postgres round-trip directly.
- Resume clue: if `meshc migrate reference-backend up` fails again, the narrowed current symptom is `null pointer dereference occurred` at `compiler/mesh-rt/src/db/pool.rs:174` when a compiled Mesh program reaches `Pool.execute`/`Pool.query` with a null `PoolHandle`.

## Deviations

- I touched `compiler/mesh-rt/src/db/pool.rs` during verification even though the written task plan was docs/tests-focused, because the final-task slice gate still failed and the direct runtime proof was necessary to isolate whether the remaining blocker lived in the pool runtime or in the compiled Mesh handle-passing path.

## Known Issues

- `meshc migrate reference-backend up` still fails, so the slice-level migration and smoke checks are not closed.
- The current blocker is narrower than the earlier T04 note: a direct Rust-level pool smoke test passes, but a compiled Mesh program still reaches `mesh_pool_checkout` with a null `PoolHandle`.
- Because migrations still fail, I did not truthfully rerun `reference-backend/scripts/smoke.sh` or `cargo test -p meshc e2e_reference_backend_postgres_smoke --test e2e_reference_backend -- --ignored --nocapture` after the final blocker isolation step.
- `compiler/mesh-rt/src/db/pool.rs` contains an intermediate runtime change from this investigation; it did not resolve the slice blocker by itself.

## Files Created/Modified

- `compiler/meshc/tests/e2e_reference_backend.rs` — aligned the compiler-facing build/runtime/smoke proofs with the package smoke script and local migration command order.
- `reference-backend/README.md` — added the canonical package command reference for prerequisites, build, migrate, run, smoke, and compiler-facing verification.
- `reference-backend/.env.example` — added the package-local startup contract example for `DATABASE_URL`, `PORT`, and `JOB_POLL_MS`.
- `compiler/mesh-rt/src/db/pool.rs` — added a direct ignored Postgres pool smoke test and a partial runtime experiment while isolating the remaining blocker.
- `.gsd/milestones/M028/slices/S01/tasks/T05-PLAN.md` — added the missing `## Observability Impact` section.
- `.gsd/KNOWLEDGE.md` — recorded the compiled-Mesh null-`PoolHandle` gotcha so the next unit can resume without repeating this isolation work.
