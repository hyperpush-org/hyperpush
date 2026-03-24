---
verdict: needs-remediation
remediation_round: 0
---

# Milestone Validation: M028

## Success Criteria Checklist
- [x] Criterion 1 — evidence: S01 established the canonical `reference-backend/` API + DB + migrations + background-jobs path; S02 strengthened it with automated runtime-correctness proof; S04 proved the staged native deploy path; S06 reran the baseline (`build`, `fmt --check`, `test`, `e2e_reference_backend_builds`) and reported those baseline commands green again.
- [ ] Criterion 2 — gap: the failure/recovery trust gate is still open. S05 has a doctor-created placeholder summary and placeholder UAT, all S05 task summaries are still `verification_result: partial`, and S06/UAT explicitly records `e2e_reference_backend_worker_crash_recovers_job` as failing because `/health` never exposes the expected degraded/recovering window before recovery completes.
- [x] Criterion 3 — evidence: S04 delivered a boring artifact-first native deployment bundle (`reference-backend`, staged SQL, apply script, deploy smoke script), proved startup outside the repo root, and verified runtime-side migration apply without requiring `meshc` on the runtime host.
- [ ] Criterion 4 — gap: S06 improved the public proof surface (`README.md`, `website/docs/docs/production-backend-proof/index.md`, `reference-backend/scripts/verify-production-proof-surface.sh` all exist), but S06’s own summary says the slice is partial/not done and its acceptance rule remains blocked on red recovery proofs. Because the promoted proof surface is not yet honest about recovery trust, the docs/examples criterion is not fully met.

## Slice Delivery Audit
| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01 | One canonical backend golden path with HTTP, DB, migrations, jobs, startup contract, smoke script, and compiler e2e proof. | Summary substantiates all of those outputs and records passed build/start/migrate/smoke/e2e commands plus live `/health`, `/jobs`, and Postgres spot checks. | pass |
| S02 | Automated runtime correctness on the golden path, including migration truth, job lifecycle truth, and contention-safe exact-once processing. | Summary substantiates the expanded `e2e_reference_backend` harness, atomic claim path, single-job API/DB/health agreement, and two-instance exact-once proof. | pass |
| S03 | Trustworthy formatter, test, LSP, and docs/editor guidance on the real backend workflow. | Summary substantiates formatter overflow fix, truthful `meshc test <path>` semantics, JSON-RPC LSP proof on backend files, honest `--coverage` failure contract, and doc drift sweeps. | pass |
| S04 | Boring native deployment path with staged bundle, runtime-side migration apply, and smoke verification outside the repo root. | Summary substantiates staged artifact layout, deploy SQL flow, runtime-host smoke script, compiler-facing deploy proof, and operator docs/env contract. | pass |
| S05 | Supervision, recovery, and failure visibility proving supervised jobs survive crashes predictably with visible failure state. | Not substantiated. Slice summary is a doctor-created placeholder, UAT is a placeholder, and task summaries T01-T04 all remain partial with repeated focused crash/recovery proof failures or unfinished handoffs. | fail |
| S06 | Honest production proof/docs surface built on the real backend path rather than toy-only evidence. | Partially substantiated only. Public proof page, README routing, doc verifier, and deploy proof improvements landed, but S06 summary explicitly marks the slice partial/not done and keeps acceptance blocked behind the still-failing recovery proofs. | fail |

## Cross-Slice Integration
- **S01 → S02:** aligned. S02 clearly consumes the S01 reference backend, canonical commands, and durable `jobs` contract.
- **S01 → S03:** aligned. S03 uses `reference-backend/` as the real formatter/test/LSP/doc-truth target exactly as the roadmap expected.
- **S02 → S04:** aligned. S04 reuses the verified runtime startup contract and turns it into a staged native deployment proof.
- **S02 → S05:** not closed. The roadmap expected S05 to build on known-good failure scenarios and verified golden-path runtime behavior, but the actual S05 artifacts never reached a completed recovery proof.
- **S03 → S06:** partially aligned. S06 successfully reused the real backend workflow and tooling-truth surfaces for README/docs promotion.
- **S04 → S06:** aligned. S06 explicitly reports the staged deploy proof green again.
- **S05 → S06:** mismatch. The roadmap says S05 should produce documented supervision/recovery proof and final concurrency-trust evidence for S06 to promote. Instead, S05 is still placeholder/partial, and S06 is blocked specifically because the recovery proof and visibility contract are still red.
- **Roadmap state drift:** `M028-ROADMAP.md` marked S05 and S06 as complete, but their own summary/UAT artifacts show they are not actually closed. This validation pass adds remediation slices rather than sealing the milestone on stale checkbox state.

## Requirement Coverage
- No active requirement is orphaned; `REQUIREMENTS.md` maps each active requirement to at least one owning slice.
- Within M028 scope, the validated requirements are **R001, R002, R003, R005, and R006**.
- The blocking still-active M028 requirements are:
  - **R004** — still open because crash/restart/failure-reporting proof is not yet trustworthy enough to validate.
  - **R008** — still open because the promoted production proof/docs surface cannot be called complete while recovery proof remains red.
  - **R009** — still open because the real reference backend is not yet fully proven through the recovery/supervision path that S06 depends on.
- **R010** remains only partially covered by design, matching the roadmap.
- Later active requirements **R007, R011, R012, R013, R014** are addressed elsewhere and are not new gaps introduced by this validation pass.

## Verdict Rationale
`needs-remediation` is required because the milestone’s hardest trust claim — supervised recovery and visible failure handling on the reference backend — is still not proven. The evidence is not a minor doc drift issue; it is a material closure gap:
- S05 does not have a real summary or real UAT.
- S05 task summaries repeatedly record partial verification and unfinished recovery work.
- S06 explicitly says the slice is partial/not done.
- The authoritative recovery proof `e2e_reference_backend_worker_crash_recovers_job` is still failing, and two follow-on recovery proofs remain blocked behind it.

That means the milestone cannot satisfy its success criteria, definition of done, or remaining active requirement coverage yet.

## Remediation Plan
- **S07: Recovery Proof Closure** — finish the supervised worker recovery contract on `reference-backend` so `/health` exposes a real degraded/recovering window, `e2e_reference_backend_worker_crash_recovers_job` passes, `e2e_reference_backend_worker_restart_is_visible_in_health` passes, and the missing whole-process restart proof is added and passes.
- **S08: Final Proof Surface Reconciliation** — once S07 is green, update the README/docs/UAT/summary/validation surfaces so the public production-proof story references only passing recovery-aware evidence and no longer depends on placeholder or partial closure artifacts.
