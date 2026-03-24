---
id: M028
milestone: M028
title: Language Baseline Audit & Hardening
status: needs-followup
verification_result: failed
definition_of_done_met: false
code_changes_verified: true
non_gsd_diff_stat: 182 files changed, 8193 insertions(+), 23392 deletions(-)
completed_at: 2026-03-24
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: validated
    proof: "S01 shipped `reference-backend/` with the canonical startup contract and closeout reruns confirmed `cargo run -p meshc -- build reference-backend`, `cargo run -p meshc -- migrate reference-backend up`, and `bash reference-backend/scripts/smoke.sh` on the real package."
  - id: R002
    from_status: active
    to_status: validated
    proof: "The reference backend still builds, starts, migrates, serves `/health`, creates jobs, and processes them end to end; closeout reruns of build/migrate/smoke plus the passed slice evidence support the transition."
  - id: R003
    from_status: active
    to_status: validated
    proof: "Closeout reruns reconfirmed `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture` and `... e2e_reference_backend_multi_instance_claims_once ...`; S02’s harness remains the authoritative runtime-correctness surface."
  - id: R004
    from_status: active
    to_status: validated
    proof: "S07 produced recovery proof and isolated reruns of `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture` now pass after worker-recovery timing fixes in `reference-backend/jobs/worker.mpl`, but the full serial closeout gate still failed on that same recovery path because `/health` went stale before processed-state accounting aligned."
  - id: R005
    from_status: active
    to_status: validated
    proof: "S04’s deployment proof remains in place and closeout reruns reconfirmed native build plus live staged smoke behavior through `reference-backend/scripts/smoke.sh`; deploy docs/proof-surface verification also passed."
  - id: R006
    from_status: active
    to_status: validated
    proof: "Closeout reruns reconfirmed `cargo run -p meshc -- fmt --check reference-backend` and `cargo run -p meshc -- test reference-backend`; S03’s formatter/LSP/test surfaces remain the backend-facing tooling proof."
  - id: R008
    from_status: active
    to_status: validated
    proof: "`bash reference-backend/scripts/verify-production-proof-surface.sh`, `npm --prefix website ci`, and `npm --prefix website run build` all passed during closeout, confirming that the public docs now route to the production proof path rather than toy examples."
  - id: R009
    from_status: active
    to_status: validated
    proof: "The repo still contains a real `reference-backend/` package plus the compiler-facing end-to-end harness, but M028 closeout does not mark the milestone sealed because the recovery proof is not yet stable in the full serial acceptance run."
---

# M028: Language Baseline Audit & Hardening

## Closure result

M028 delivered real non-`.gsd` implementation work and a substantial backend proof surface, but the milestone does **not** pass closeout verification yet.

The assembled work now clearly contains the intended reference backend path:
- `reference-backend/` exists with API, DB, migrations, jobs, deploy assets, scripts, and runbook files
- the diff against `main` contains real implementation changes across compiler/runtime/tooling/docs (`182 files changed, 8193 insertions(+), 23392 deletions(-)` outside `.gsd/`)
- build/fmt/test/migrate/smoke and docs proof-surface checks all reran successfully during closeout

However, the final integrated recovery proof is still not stable enough to seal the milestone. The serial closeout rerun failed on `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture` after the worker-crash path had already passed in isolation. The failure mode is specifically that the job reaches `processed`, but `/health` can go stale and fail the harness’s health-alignment expectation after recovery. That means the strongest concurrency/recovery trust claim is still not closure-grade.

## Code change verification

Verified with:

```bash
git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'
```

Result: real code/docs/runtime changes exist outside `.gsd/`, including `reference-backend/`, `compiler/meshc/tests/e2e_reference_backend.rs`, runtime/compiler/tooling crates, README/docs, and editor docs. This milestone did not produce planning artifacts only.

## Closeout verification run

### Passed during closeout

```bash
bash reference-backend/scripts/verify-production-proof-surface.sh
npm --prefix website ci
npm --prefix website run build
cargo run -p meshc -- build reference-backend
cargo run -p meshc -- fmt --check reference-backend
cargo run -p meshc -- test reference-backend
cargo run -p meshc -- migrate reference-backend up
PORT=18080 JOB_POLL_MS=500 bash reference-backend/scripts/smoke.sh
cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture
cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_multi_instance_claims_once -- --ignored --nocapture
cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture
```

Notes:
- the worker-crash recovery test now passes in isolation after timing/recovery adjustments in `reference-backend/jobs/worker.mpl`
- docs proof-surface verification and website build are green
- the reference backend still builds, migrates, and passes the live smoke workflow

### Failed during closeout

Serial full-gate rerun failed here:

```bash
cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture
```

Observed failure in the full serial sequence:
- the recovered job reached `processed`
- but `/health` became stale and failed the harness’s processed-state health alignment check
- so the recovery surface is not yet trustworthy enough for milestone closure

Because the serial run stopped there, the later closeout-stage reruns for:
- `e2e_reference_backend_worker_restart_is_visible_in_health`
- `e2e_reference_backend_process_restart_recovers_inflight_job`
- `e2e_reference_backend_deploy_artifact_smoke`

were **not** re-accepted after the final worker changes.

## Success criteria check

### 1. A reference Mesh backend with API + DB + migrations + background jobs can be built, run, and verified end-to-end from this repo.
**Status:** met

Evidence:
- `cargo run -p meshc -- build reference-backend` passed
- `cargo run -p meshc -- migrate reference-backend up` passed
- `bash reference-backend/scripts/smoke.sh` passed against live Postgres and live HTTP endpoints
- docs/runbook/proof surfaces for the same backend also passed validation

### 2. The reference backend’s failure and recovery behavior is exercised strongly enough that concurrency does not merely exist — it is trustworthy.
**Status:** not met at closeout

Evidence:
- `e2e_reference_backend_multi_instance_claims_once` passed during closeout
- `e2e_reference_backend_worker_crash_recovers_job` passes in isolation after the latest worker fix
- but the same worker-crash recovery proof still fails in the full serial closeout rerun because `/health` becomes stale before the processed-state health alignment settles

Conclusion: recovery proof is materially better than before, but not closure-stable yet.

### 3. The reference backend can be built into a native binary and deployed through a boring documented workflow closer to a Go app than to a fragile language stack.
**Status:** provisionally met, not fully re-sealed after the final worker changes

Evidence:
- native build still passes
- deployment/proof docs verification passed
- S04 established deploy artifact and staged-bundle proof

Caveat:
- the final post-fix closeout rerun stopped before `e2e_reference_backend_deploy_artifact_smoke` could be re-accepted in the same serial pass

### 4. Docs/examples point to the real backend proof path and stop relying mainly on toy examples to imply readiness.
**Status:** met

Evidence:
- `bash reference-backend/scripts/verify-production-proof-surface.sh` passed
- `npm --prefix website ci` passed
- `npm --prefix website run build` passed
- the proof surface, sidebar, landing docs, and runbook all point at `reference-backend/` and the production proof path

## Definition of done check

- all slices are `[x]` — **yes**
- all slice summaries exist — **yes** (`S01` through `S08`)
- cross-slice integration exists across compiler/runtime/HTTP/DB/migrations/jobs/docs/deploy — **yes**
- success criteria were rechecked against live behavior — **yes**
- final integrated acceptance scenarios pass — **no**

Result: **definition of done not met**.

## Requirement transition validation

Supported by current evidence:
- `R001`, `R002`, `R003`, `R005`, `R006`, `R008` — supported by shipped artifacts plus closeout reruns
- `R009` — supported in the narrow sense that Mesh is now proving itself against a real backend rather than only isolated subsystems

Not closure-stable enough to accept as milestone-sealing proof:
- `R004` — slice evidence exists and isolated reruns pass, but the serial closeout recovery gate still fails, so the strongest supervision/recovery trust claim is not sealed at milestone closeout

## Cross-slice lessons carried forward

- The full serial closeout gate is stricter than isolated reruns; passing `e2e_reference_backend_worker_crash_recovers_job` alone is not enough if `/health` can still go stale or miss processed-state accounting after recovery.
- Recovery-window timing has two competing needs: keep the degraded/recovering window visible long enough for the harness to observe it, but also keep post-recovery ticks alive long enough for processed-state health alignment to settle.
- For this milestone, the authoritative closure signal is not slice-local green alone; it is the serial acceptance sequence that mixes smoke, migration truth, multi-instance truth, and recovery proof on the same assembled backend.

## Resume notes

If work resumes on M028 closure, start here:

1. Reproduce the serial failure, not the isolated pass:
   ```bash
   set -a && source .env && set +a
   cargo run -p meshc -- build reference-backend
   cargo run -p meshc -- fmt --check reference-backend
   cargo run -p meshc -- test reference-backend
   cargo run -p meshc -- migrate reference-backend up
   PORT=18080 JOB_POLL_MS=500 bash reference-backend/scripts/smoke.sh
   cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture
   cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_multi_instance_claims_once -- --ignored --nocapture
   cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture
   ```
2. Focus on `reference-backend/jobs/worker.mpl`, specifically the interaction between:
   - crash restart delay
   - recovery reclaim timing
   - `pause_after_recovery(...)`
   - post-recovery tick updates vs. processed-state reporting
3. Only after the worker-crash recovery path is green in the serial sequence, rerun:
   - `e2e_reference_backend_worker_restart_is_visible_in_health`
   - `e2e_reference_backend_process_restart_recovers_inflight_job`
   - `e2e_reference_backend_deploy_artifact_smoke`
4. Do not reseal M028 until the whole serial acceptance run is green.

## Final judgment

M028 produced real implementation value and most of the promised backend proof surface, but the milestone is **not closed** because the final recovery-aware acceptance path is still unstable under serial closeout verification.
