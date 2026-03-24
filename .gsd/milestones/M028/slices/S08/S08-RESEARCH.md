# S08 Research — Final Proof Surface Reconciliation

## Summary

S08 is a targeted docs-and-closure reconciliation pass, not a new backend slice.

The backend proof itself is already green at the requirement level:
- `.gsd/REQUIREMENTS.md` now marks **R004** and **R009** as validated by **S07**.
- `S07-SUMMARY` and `S07-UAT` define the current authoritative crash/restart/deploy proof set.
- `website/docs/docs/production-backend-proof/index.md` already names the recovery-aware commands.
- `bash reference-backend/scripts/verify-production-proof-surface.sh` currently passes.

The real remaining gap is **truth-surface drift**:
- `M028-VALIDATION.md` still says `needs-remediation`, still claims R004/R009 are open, and still treats S05/S06 as failed.
- `S05-SUMMARY.md` and `S05-UAT.md` are still doctor-created placeholders.
- `S06-SUMMARY.md` and `S06-UAT.md` still describe the pre-S07 red recovery state.
- `reference-backend/README.md` is still missing the recovery/runbook section that S06 planned and that public docs imply exists.
- `reference-backend/scripts/verify-production-proof-surface.sh` only guards link/drift basics; it does **not** yet enforce recovery-aware proof wording.

This slice directly closes **R008** and supports the final promoted truth for already-validated **R004** and **R009**.

## Requirement Targeting

### Directly owned
- **R008** — docs/examples must point at a production-style backend proof path, not toy or stale/partial claims.

### Supported / must stay aligned with
- **R004** — already validated by S07; S08 must not leave any artifact claiming recovery proof is still red.
- **R009** — already validated by S07; S08 must promote the real reference backend as the now-green proof target.

## Recommendation

Treat S08 as a **three-surface reconciliation pass**:

1. **Deep runbook + public proof guard**
   - finish `reference-backend/README.md` so it actually contains the recovery/proof contract the public proof page points to
   - strengthen `reference-backend/scripts/verify-production-proof-surface.sh` so public proof surfaces must mention the green recovery-aware path, not just exist

2. **Internal closure artifact rewrite**
   - replace S05 placeholder summary/UAT with honest current-state artifacts or explicitly superseded-by-S07 artifacts
   - rewrite S06 summary/UAT from partial blocker language to green final-proof language anchored to S07

3. **Milestone seal**
   - rewrite `M028-VALIDATION.md` from `needs-remediation` to the post-S07/S08 end state
   - after verification passes, update requirement tracking for **R008**

Do **not** broaden this into generic doc rewriting. Most generic docs are already correct and already pass the current verifier.

## Implementation Landscape

### 1. Public proof hierarchy already exists
Current hierarchy is sound and should be preserved:
- `README.md` → top-of-funnel routing
- `website/docs/docs/production-backend-proof/index.md` → canonical public proof page
- `reference-backend/README.md` → deepest operator/developer runbook
- `reference-backend/scripts/verify-production-proof-surface.sh` → mechanical public proof guard

### 2. Internal closure hierarchy is stale
Current internal state is inconsistent with S07 and `REQUIREMENTS.md`:
- `.gsd/REQUIREMENTS.md` says recovery proof is validated
- `.gsd/milestones/M028/M028-VALIDATION.md` still says recovery proof is open
- `S05` closure artifacts are placeholders
- `S06` closure artifacts still narrate the pre-S07 blocker state

### 3. Generic docs mostly do not need broad edits
These pages already route correctly back to the proof surface and runbook:
- `website/docs/docs/getting-started/index.md`
- `website/docs/docs/web/index.md`
- `website/docs/docs/databases/index.md`
- `website/docs/docs/concurrency/index.md`
- `website/docs/docs/tooling/index.md`
- `website/docs/docs/testing/index.md`

Current verifier run passed:
```bash
bash reference-backend/scripts/verify-production-proof-surface.sh
```
So only touch generic docs if command wording or link text must change to stay aligned with the revised runbook/proof page.

## Key Findings by File

### `.gsd/REQUIREMENTS.md`
This is the strongest current source of truth for scope:
- **R008** is still active and explicitly says S08 must reconcile public README/docs/UAT promotion surfaces.
- **R004** is already validated by S07.
- **R009** is already validated by S07.

Implication: S08 is not proving recovery; it is reconciling promotion/closure surfaces to the already-green recovery proof.

### `.gsd/milestones/M028/M028-VALIDATION.md`
This is the biggest stale blocker surface.

Current problems:
- frontmatter still says `verdict: needs-remediation`
- success criteria 2 and 4 are still unchecked
- slice audit still marks S05 and S06 as fail
- requirement coverage still says R004/R008/R009 are open
- rationale still says supervised recovery is not yet proven
- remediation plan still says S07/S08 are future work

This file must be treated as the **last** edit in the slice, after all other truth surfaces are updated and the final command set is rerun.

### `.gsd/milestones/M028/slices/S05/S05-SUMMARY.md`
Doctor-created placeholder. Not acceptable as an enduring closure artifact.

Options the planner should choose between:
- replace with a real current-state summary that explains S05 work plus S07 final closure, or
- rewrite it as an explicit “superseded by S07 recovery proof closure” artifact if preserving strict historical nuance is more honest.

Either way, the placeholder language must disappear.

### `.gsd/milestones/M028/slices/S05/S05-UAT.md`
Also doctor-created placeholder.

Natural replacement strategy:
- either point directly to the S07 recovery-aware acceptance script, or
- rewrite as a real current-state UAT whose recovery checks mirror S07.

Do **not** leave this as a generic “replace this placeholder” file.

### `.gsd/milestones/M028/slices/S06/S06-SUMMARY.md`
Still says:
- `State: partial / not done`
- the authoritative crash/recovery proof is red
- later restart proofs are blocked behind the crash-recovery proof

This file is stale negative evidence from before S07. It should be rewritten to describe what S06 actually leaves behind in the now-green world:
- public proof surfaces exist
- deploy/tooling/docs routing are green
- final recovery gate was closed by S07
- S08 reconciles promotion/closure wording

### `.gsd/milestones/M028/slices/S06/S06-UAT.md`
Useful structure, stale status.

Keep the good parts:
- landing-page routing checks
- proof-page checks
- generic-doc routing checks
- doc verifier
- website build
- reference-backend baseline
- staged deploy proof

Replace the stale parts:
- “current blocker” language
- “after Tests 8-9 are fixed” wording
- acceptance rule that still treats recovery proofs as pending

Best source for the replacement recovery section is `S07-UAT.md`.

### `.gsd/milestones/M028/slices/S07/S07-UAT.md`
This is the best current recovery-aware acceptance source.

It already defines the authoritative green recovery command set:
- `e2e_reference_backend_worker_crash_recovers_job`
- `e2e_reference_backend_worker_restart_is_visible_in_health`
- `e2e_reference_backend_process_restart_recovers_inflight_job`
- `e2e_reference_backend_migration_status_and_apply`
- `e2e_reference_backend_deploy_artifact_smoke`

Planner should reuse this ordering and wording rather than inventing a new acceptance shape.

### `reference-backend/README.md`
This is the most important public-facing file that is still incomplete.

What is already there:
- build/run/test/deploy commands
- staged deploy contract
- tooling proof commands
- deploy-artifact proof command

What is missing:
- no `Supervision and recovery` section
- no recovery proof commands
- no `/health` recovery field explanations (`restart_count`, `last_exit_reason`, `recovered_jobs`, etc.)
- no process-restart proof guidance

This matches the unfinished expectation from `S06-PLAN.md`, which explicitly called for the missing supervision/recovery runbook section.

### `website/docs/docs/production-backend-proof/index.md`
This page is mostly aligned already.

What is good:
- points to the runbook and verifier
- names the recovery-aware proof commands
- frames the page as the public proof entrypoint

Possible S08 work here:
- align wording with the final green state
- ensure command set matches the final authoritative acceptance list (likely include migration-status/apply proof if desired)
- make sure it does not imply the runbook contains recovery detail unless the runbook is updated first

### `reference-backend/scripts/verify-production-proof-surface.sh`
Current scope is too narrow.

What it checks now:
- canonical files exist
- README/sidebar/generic docs route to proof page
- proof page mentions runbook and verifier
- stale README/install phrases are gone

What it does **not** check:
- proof page mentions the recovery-aware commands as expected
- runbook contains the recovery section / recovery fields / process-restart guidance
- public proof surface still references only green paths

This is the best existing place to add mechanical enforcement for S08’s public-facing truth contract.

### `README.md`
Top-level routing already looks good:
- early Production Proof link in header area
- dedicated Production Backend Proof section
- direct pointer to `reference-backend/README.md`

Likely no major change needed unless wording must be aligned with the updated runbook/proof page.

### `website/docs/.vitepress/config.mts`
Already includes the proof page in sidebar navigation. Probably no change needed.

## Natural Seams / Task Split

### Seam 1 — Public runbook and proof verifier
Files:
- `reference-backend/README.md`
- `website/docs/docs/production-backend-proof/index.md`
- `reference-backend/scripts/verify-production-proof-surface.sh`
- maybe `README.md` if wording must be tightened

Why first:
- this is the public truth hierarchy
- `reference-backend/README.md` is the one obvious missing piece
- verifier changes give the slice a durable guard instead of a one-time doc edit

### Seam 2 — Internal slice closure artifacts
Files:
- `.gsd/milestones/M028/slices/S05/S05-SUMMARY.md`
- `.gsd/milestones/M028/slices/S05/S05-UAT.md`
- `.gsd/milestones/M028/slices/S06/S06-SUMMARY.md`
- `.gsd/milestones/M028/slices/S06/S06-UAT.md`

Why separate:
- these are historical/closure artifacts, not public docs
- they should be rewritten from the already-green S07 truth, not from repo feature discovery

### Seam 3 — Final milestone seal
Files:
- `.gsd/milestones/M028/M028-VALIDATION.md`
- likely requirement status update for `R008`

Why last:
- this file should summarize the finished reconciled state
- it depends on the other surfaces already being updated and the final command set being rerun

## Verification Plan

### Public proof surface
```bash
bash reference-backend/scripts/verify-production-proof-surface.sh
npm --prefix website ci
npm --prefix website run build
```

### Canonical backend baseline
```bash
cargo run -p meshc -- build reference-backend
cargo run -p meshc -- fmt --check reference-backend
cargo run -p meshc -- test reference-backend
```

### Recovery-aware green proof set
Run serially with one `DATABASE_URL`:
```bash
set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture
set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture
set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_process_restart_recovers_inflight_job -- --ignored --nocapture
set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture
set -a && source .env && set +a && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture
```

### Drift / stale-claim sweep
Use a targeted negative sweep after edits:
```bash
rg -n "placeholder|partial / not done|current blocker|needs-remediation|R004.*still open|R009.*still open|replace this placeholder" \
  .gsd/milestones/M028/M028-VALIDATION.md \
  .gsd/milestones/M028/slices/S05/S05-SUMMARY.md \
  .gsd/milestones/M028/slices/S05/S05-UAT.md \
  .gsd/milestones/M028/slices/S06/S06-SUMMARY.md \
  .gsd/milestones/M028/slices/S06/S06-UAT.md
```
Expected outcome after S08: no matches that describe the now-closed recovery blocker.

## Risks / Gotchas

- **Do not roll public docs backward.** The public proof page is mostly ahead correctly; the stale surfaces are primarily internal closure docs plus the incomplete deep runbook.
- **Do not over-edit generic docs.** They already route correctly and the current verifier passes.
- **Keep one canonical recovery command set.** Reuse S07’s command list/order instead of creating a second acceptance variant.
- **Ignored DB-backed proofs must stay serial.** S06/S07 both establish that shared `DATABASE_URL` proofs are not safe in parallel.
- **`reference-backend/README.md` is the main public gap.** It still fails the spirit of the S06-plan grep for `Supervision and recovery|restart_count|last_exit_reason|recovered_jobs|process restart`.
- **`M028-VALIDATION.md` currently contradicts `.gsd/REQUIREMENTS.md`.** Update the milestone validation only after all dependent surfaces and reruns are done.
- **S08 slice directory is empty today.** There are no existing S08 artifacts to preserve; planners can scope work without worrying about overwriting prior slice docs.

## Skill Notes That Matter Here

- From **`debug-like-expert`**: **verify, don’t assume**. S08 should be driven by the live green command set and current on-disk artifact state, not by stale milestone memory.
- From **`review`**: **find real issues, not style nits**. The work is stale truth surfaces, placeholder artifacts, and missing recovery runbook content — not prose polishing.
- From **`test`**: **match existing patterns**. Replacement UAT content should mirror the project’s existing acceptance style, especially `S07-UAT`, instead of inventing a new verification format.

## Skill Discovery Notes

No directly relevant installed skill exists for the two main supporting technologies here:

- **Rust** (relevant if the slice needs to touch the harness wording or proof commands)
  - promising external skill: `apollographql/skills@rust-best-practices`
  - install: `npx skills add apollographql/skills@rust-best-practices`

- **VitePress** (the website docs system in `website/package.json`)
  - promising external skill: `antfu/skills@vitepress`
  - install: `npx skills add antfu/skills@vitepress`

Neither seems necessary for S08 unless the executor ends up making deeper Rust-harness or VitePress-structure changes instead of the expected markdown/script reconciliation.
