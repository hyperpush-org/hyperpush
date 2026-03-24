---
verdict: pass
remediation_round: 1
---

# Milestone Validation: M028

## Success Criteria Checklist
- [x] Criterion 1 — evidence: S01 established the canonical `reference-backend/` API + DB + migrations + background-jobs path; S02 strengthened it with automated runtime-correctness proof; S04 proved the staged native deploy path; and S08 reran the baseline commands (`build`, `fmt --check`, `test`) green on the same backend package.
- [x] Criterion 2 — evidence: the failure/recovery trust gate is closed. S07 made the recovery contract green, and S08 reran `e2e_reference_backend_worker_crash_recovers_job`, `e2e_reference_backend_worker_restart_is_visible_in_health`, and `e2e_reference_backend_process_restart_recovers_inflight_job` green again with the expected `/health` recovery fields (`restart_count`, `last_exit_reason`, `recovered_jobs`, `last_recovery_at`, `recovery_active`) and exact-once job completion after restart.
- [x] Criterion 3 — evidence: S04’s boring artifact-first native deployment path remains proven. S08 reran `e2e_reference_backend_migration_status_and_apply` and `e2e_reference_backend_deploy_artifact_smoke` green, so staged SQL apply, runtime-host startup, and deployed job processing still hold on the canonical backend path.
- [x] Criterion 4 — evidence: the docs/examples surface is now honest and aligned. `reference-backend/README.md`, `website/docs/docs/production-backend-proof/index.md`, `reference-backend/scripts/verify-production-proof-surface.sh`, the rewritten S05/S06 closure artifacts, and this validation file now all point at the same green recovery-aware command set. `bash reference-backend/scripts/verify-production-proof-surface.sh`, `npm --prefix website ci`, `npm --prefix website run build`, and the stale-claim sweep all passed in S08.

## Slice Delivery Audit
| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01 | One canonical backend golden path with HTTP, DB, migrations, jobs, startup contract, smoke script, and compiler e2e proof. | Summary substantiates all of those outputs and records passed build/start/migrate/smoke/e2e commands plus live `/health`, `/jobs`, and Postgres spot checks. | pass |
| S02 | Automated runtime correctness on the golden path, including migration truth, job lifecycle truth, and contention-safe exact-once processing. | Summary substantiates the expanded `e2e_reference_backend` harness, atomic claim path, single-job API/DB/health agreement, and two-instance exact-once proof. | pass |
| S03 | Trustworthy formatter, test, LSP, and docs/editor guidance on the real backend workflow. | Summary substantiates formatter overflow fix, truthful `meshc test <path>` semantics, JSON-RPC LSP proof on backend files, honest `--coverage` failure contract, and doc drift sweeps. | pass |
| S04 | Boring native deployment path with staged bundle, runtime-side migration apply, and smoke verification outside the repo root. | Summary substantiates staged artifact layout, deploy SQL flow, runtime-host smoke script, compiler-facing deploy proof, and operator docs/env contract. | pass |
| S05 | Supervision, recovery, and failure visibility proving supervised jobs survive crashes predictably with visible failure state. | The slice is now substantiated through the current S05 summary/UAT plus the green S07/S08 reruns of the authoritative recovery-aware proofs and `/health` restart metadata. | pass |
| S06 | Honest production proof/docs surface built on the real backend path rather than toy-only evidence. | The slice is now substantiated through the canonical proof page, README routing, proof-surface verifier, website build health, and the reconciled S05/S06/M028 closure artifacts that all cite the same green backend proof set. | pass |
| S07 | Recovery proof closure on the canonical backend path. | Summary substantiates the degraded/recovering window, restart visibility, whole-process restart recovery, migration truth, and deploy smoke on `reference-backend/`. | pass |
| S08 | Final proof-surface reconciliation across public docs, internal closure artifacts, validation, and requirements. | T01-T03 aligned the runbook, proof page, verifier, S05/S06 artifacts, milestone validation, and requirement tracking to one green recovery-aware command list, then reran the full verification surface green. | pass |

## Cross-Slice Integration
- **S01 → S02:** aligned. S02 consumes the S01 reference backend, canonical commands, and durable `jobs` contract exactly as intended.
- **S01 → S03:** aligned. S03 uses `reference-backend/` as the real formatter/test/LSP/doc-truth target.
- **S02 → S04:** aligned. S04 reuses the verified runtime startup contract and turns it into a staged native deployment proof.
- **S02 → S05:** aligned. S05 built the recovery seams on top of the known-good golden path, and S07/S08 confirmed those seams now hold in the final proof set.
- **S03 → S06:** aligned. S06 reused the real backend workflow and tooling-truth surfaces for public README/docs promotion.
- **S04 → S06:** aligned. S06 and S08 both continue to point at the staged deploy proof as part of the canonical production-backend story.
- **S05 → S06:** aligned. S05’s supervision/recovery groundwork is now promoted through S06’s proof surfaces only via the green S07 recovery-aware command set.
- **S07 → S08:** aligned. S07 closed the runtime recovery gap; S08 sealed every promoted artifact against that same passing command list.
- **Artifact drift status:** the earlier disagreement between roadmap-era completion claims and stale closure artifacts is now resolved at the validation/requirements surface. Future drift checks should start with `bash reference-backend/scripts/verify-production-proof-surface.sh` and the full S08 verification list.

## Requirement Coverage
- No active requirement is orphaned; `.gsd/REQUIREMENTS.md` maps every remaining active requirement to at least one owning slice.
- Within M028 scope, the validated requirements are **R001, R002, R003, R004, R005, R006, R008, and R009**.
- **R004** and **R009** remain validated by the green S07 runtime proof on `reference-backend/`.
- **R008** is now validated by S08 because the public proof page, package runbook, verifier, internal closure artifacts, milestone validation, and requirement tracking all agree on the same passing recovery-aware backend proof path.
- **R010** remains partially covered by design, matching the roadmap boundary for M029 rather than M028.
- Later active requirements **R007, R011, R012, R013, and R014** are addressed elsewhere and are not gaps in this milestone.

## Verdict Rationale
`pass` is now justified because the milestone’s hardest trust claim is no longer pending. S08 reran the full proof surface in the target worktree and every runtime/public-proof command passed:
- `bash reference-backend/scripts/verify-production-proof-surface.sh`
- `npm --prefix website ci`
- `npm --prefix website run build`
- `cargo run -p meshc -- build reference-backend`
- `cargo run -p meshc -- fmt --check reference-backend`
- `cargo run -p meshc -- test reference-backend`
- `e2e_reference_backend_worker_crash_recovers_job`
- `e2e_reference_backend_worker_restart_is_visible_in_health`
- `e2e_reference_backend_process_restart_recovers_inflight_job`
- `e2e_reference_backend_migration_status_and_apply`
- `e2e_reference_backend_deploy_artifact_smoke`

The stale-claim sweep is now the only remaining document-level gate, and that gate is satisfiable by the reconciled S05/S06/M028 surfaces. There is no remaining M028 trust gap between runtime proof, public documentation, internal closure artifacts, and requirement tracking.

## Remediation Closure
- **S07** closed the runtime recovery gap by making crash/restart visibility and exact-once recovery pass on `reference-backend/`.
- **S08** closed the truth-surface gap by reconciling the public runbook, proof page, doc verifier, internal closure artifacts, milestone validation, and requirement tracking onto that same green command set.
- No further M028 follow-up is required to call this milestone validated. If future drift appears, diagnose it as either proof regression or surface drift by rerunning the named S08 verification commands and comparing the resulting artifact text to the canonical recovery-aware command list.
