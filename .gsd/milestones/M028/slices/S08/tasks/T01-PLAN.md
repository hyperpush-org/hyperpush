---
estimated_steps: 3
estimated_files: 3
skills_used:
  - debug-like-expert
  - review
  - test
---

# T01: Reconcile the public runbook and proof guard

**Slice:** S08 — Final Proof Surface Reconciliation
**Milestone:** M028

## Description

The public proof hierarchy is already the right shape, but the deepest runbook still omits the recovery contract that the proof page now implies exists. This task closes that gap first. It must make `reference-backend/README.md`, the production proof page, and the verifier script describe and enforce the same recovery-aware command set so public promotion cannot drift back to partial or implied claims.

## Steps

1. Expand `reference-backend/README.md` with a real supervision-and-recovery runbook section that names the authoritative S07 proofs, explains the `/health` recovery fields (`restart_count`, `last_exit_reason`, `recovered_jobs`, `last_recovery_*`, `recovery_active`), and tells operators how to interpret worker-crash versus whole-process restart proof results.
2. Align `website/docs/docs/production-backend-proof/index.md` to the same command set and wording, adding any missing migration/deploy/recovery commands that belong in the canonical public proof page without duplicating the full runbook.
3. Strengthen `reference-backend/scripts/verify-production-proof-surface.sh` so it fails when the proof page or runbook stop mentioning the green recovery-aware contract, then rerun the script and targeted `rg` checks until the public proof surface is mechanically guarded.

## Must-Haves

- [ ] `reference-backend/README.md` contains an explicit supervision/recovery section instead of only deployment and tooling commands.
- [ ] The runbook explains the recovery-relevant `/health` fields and how they map to the S07 proofs.
- [ ] The proof page and verifier script enforce the same authoritative recovery-aware command list.
- [ ] Public proof drift fails mechanically through `reference-backend/scripts/verify-production-proof-surface.sh` rather than relying on manual reading.

## Verification

- `bash reference-backend/scripts/verify-production-proof-surface.sh`
- `rg -n "Supervision and recovery|restart_count|last_exit_reason|recovered_jobs|process restart" reference-backend/README.md`
- `rg -n "e2e_reference_backend_worker_crash_recovers_job|e2e_reference_backend_worker_restart_is_visible_in_health|e2e_reference_backend_process_restart_recovers_inflight_job|e2e_reference_backend_migration_status_and_apply|e2e_reference_backend_deploy_artifact_smoke" website/docs/docs/production-backend-proof/index.md reference-backend/scripts/verify-production-proof-surface.sh`

## Observability Impact

- Signals added/changed: the public runbook now explicitly documents the `/health` recovery fields and the named S07 proof commands that diagnose restart failures.
- How a future agent inspects this: rerun `bash reference-backend/scripts/verify-production-proof-surface.sh`, then check the recovery section in `reference-backend/README.md` and the command list in `website/docs/docs/production-backend-proof/index.md`.
- Failure state exposed: doc drift becomes a named verifier failure such as missing recovery section, missing proof command, or missing runbook linkage instead of a vague stale-doc symptom.

## Inputs

- `reference-backend/README.md` — current public runbook that still lacks the promised recovery section
- `website/docs/docs/production-backend-proof/index.md` — canonical public proof page that must stay aligned with the runbook
- `reference-backend/scripts/verify-production-proof-surface.sh` — current verifier that only guards basic routing and stale phrases

## Expected Output

- `reference-backend/README.md` — recovery-aware runbook with supervision/restart guidance and `/health` field explanations
- `website/docs/docs/production-backend-proof/index.md` — public proof page aligned to the final green command set
- `reference-backend/scripts/verify-production-proof-surface.sh` — stronger proof-surface verifier that enforces recovery-aware wording
