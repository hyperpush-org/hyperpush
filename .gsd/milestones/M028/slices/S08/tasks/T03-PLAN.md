---
estimated_steps: 4
estimated_files: 7
skills_used:
  - debug-like-expert
  - review
  - test
---

# T03: Seal milestone validation and requirement truth

**Slice:** S08 — Final Proof Surface Reconciliation
**Milestone:** M028

## Description

This is the closure task. It does not get to declare success from edited prose alone. It must rerun the full green proof surface after T01-T02, then update milestone validation and requirement tracking from the evidence. If any command regresses, the task must stop and reconcile the truth surfaces to the actual passing set rather than writing a false green verdict.

## Steps

1. Rerun the public-proof verifier, website build, backend baseline commands, and the full serial ignored recovery/deploy/migration proof set from `compiler/meshc/tests/e2e_reference_backend.rs` using the repo-root `.env`.
2. Rewrite `.gsd/milestones/M028/M028-VALIDATION.md` from `needs-remediation` to the final green verdict, updating success criteria, slice audit, cross-slice integration, requirement coverage, rationale, and remediation text so it reflects the finished S07/S08 state instead of future work.
3. Update `.gsd/REQUIREMENTS.md` so active requirement R008 is marked validated by the reconciled public-proof surface while R004 and R009 remain recorded as validated by S07.
4. Run the final stale-claim sweep plus a targeted status check on `.gsd/REQUIREMENTS.md` and `.gsd/milestones/M028/M028-VALIDATION.md`, then stop only when the full rerun evidence and the sealed documents agree.

## Must-Haves

- [ ] The full S08 verification list reruns green after the doc and closure rewrites.
- [ ] `.gsd/milestones/M028/M028-VALIDATION.md` no longer says `needs-remediation` or treats S05/S06 as failed future work.
- [ ] `.gsd/REQUIREMENTS.md` marks R008 validated with S08 evidence while preserving R004/R009 as S07-validated.
- [ ] The final stale-claim sweep finds no remaining pre-S07 blocker or placeholder language in the reconciled truth surfaces.

## Verification

- `bash reference-backend/scripts/verify-production-proof-surface.sh`
- `npm --prefix website ci`
- `npm --prefix website run build`
- `cargo run -p meshc -- build reference-backend`
- `cargo run -p meshc -- fmt --check reference-backend`
- `cargo run -p meshc -- test reference-backend`
- `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture`
- `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture`
- `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_process_restart_recovers_inflight_job -- --ignored --nocapture`
- `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture`
- `set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture`
- `! rg -n "placeholder|partial / not done|current blocker|needs-remediation|R004.*still open|R009.*still open|replace this placeholder" .gsd/milestones/M028/M028-VALIDATION.md .gsd/milestones/M028/slices/S05/S05-SUMMARY.md .gsd/milestones/M028/slices/S05/S05-UAT.md .gsd/milestones/M028/slices/S06/S06-SUMMARY.md .gsd/milestones/M028/slices/S06/S06-UAT.md`
- `python - <<'PY'
from pathlib import Path
req = Path('.gsd/REQUIREMENTS.md').read_text()
val = Path('.gsd/milestones/M028/M028-VALIDATION.md').read_text()
section = req.split('### R008 —', 1)[1].split('\n### ', 1)[0]
assert 'Status: validated' in section, 'R008 is not marked validated'
assert 'verdict: pass' in val, 'M028 validation verdict is not pass'
PY`

## Inputs

- `.gsd/milestones/M028/M028-VALIDATION.md` — current stale milestone verdict that still says remediation is required
- `.gsd/REQUIREMENTS.md` — requirement contract where R008 is still active
- `reference-backend/scripts/verify-production-proof-surface.sh` — strengthened public-proof verifier from T01
- `.gsd/milestones/M028/slices/S05/S05-SUMMARY.md` — rewritten S05 closure artifact from T02
- `.gsd/milestones/M028/slices/S05/S05-UAT.md` — rewritten S05 UAT from T02
- `.gsd/milestones/M028/slices/S06/S06-SUMMARY.md` — rewritten S06 closure artifact from T02
- `.gsd/milestones/M028/slices/S06/S06-UAT.md` — rewritten S06 UAT from T02

## Expected Output

- `.gsd/milestones/M028/M028-VALIDATION.md` — final green milestone validation with no stale remediation language
- `.gsd/REQUIREMENTS.md` — R008 marked validated by the reconciled proof surface

## Observability Impact

- Signals changed: the authoritative milestone-closure signals become document-level status fields rather than open remediation markers — `verdict: pass` in `.gsd/milestones/M028/M028-VALIDATION.md`, `Status: validated` in the `R008` section of `.gsd/REQUIREMENTS.md`, and the existing recovery-aware command list remaining the named proof source.
- How to inspect later: rerun `bash reference-backend/scripts/verify-production-proof-surface.sh`, the serial S08 verification commands, the stale-claim sweep, and the targeted Python assertion that checks `R008` plus `verdict: pass`.
- Failure visibility added: future agents can distinguish runtime proof regression from document drift by comparing command exits with the sealed artifact text — if commands fail, it is a proof regression; if commands pass but `M028-VALIDATION.md`/`.gsd/REQUIREMENTS.md` disagree, it is closure-surface drift.
