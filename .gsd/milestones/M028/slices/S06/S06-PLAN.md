# S06: Honest Production Proof and Documentation

**Goal:** Turn Mesh’s backend story into an honest public proof surface by first restoring the `reference-backend/` proof baseline to green, then promoting one canonical backend-proof narrative across the repo landing page, package runbook, and website docs instead of relying on toy-first examples.
**Demo:** A fresh evaluator can land on `README.md`, follow a dedicated website proof page into `reference-backend/README.md`, run named backend proof commands/tests against the real `reference-backend/` path, and see deployment, tooling, and supervision/recovery claims backed by passing commands plus a repeatable doc-truth verification script.

## Decomposition Rationale

S06 has to be sequenced around honesty, not around editorial convenience. The current research showed that public promotion would be misleading while `reference-backend/` is still red, so the first task is a carry-forward dependency repair that restores the real backend proof surface before any broader documentation work ships.

After that truth gate is green, the highest-leverage documentation move is one canonical proof narrative: keep `reference-backend/README.md` as the deepest operator/developer runbook, add a single website page for external evaluators, and point the repo landing page there early. That avoids spraying long command blocks across multiple docs that will drift independently.

The final task is intentionally small but important: generic docs need cross-links and a mechanical truth sweep so the project does not slide back into toy-first messaging. That closes R008 as a maintained proof surface rather than a one-time copy edit.

## Must-Haves

- S06 must directly close **R008** by making the production-style backend proof discoverable from `README.md`, the website docs, and the generic backend/tooling guides instead of letting toy examples carry readiness claims by implication.
- S06 must directly close **R009** by restoring the `reference-backend/` proof baseline to green and anchoring public claims to the real backend harness in `compiler/meshc/tests/e2e_reference_backend.rs`, not to subsystem-only or package-local evidence.
- S06 must preserve one canonical truth hierarchy: `reference-backend/README.md` is the deepest runbook, the website gets one canonical proof page, and a repeatable verifier checks the edited docs for stale links/phrases before the slice is considered done.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `cargo run -p meshc -- build reference-backend`
- `cargo run -p meshc -- fmt --check reference-backend`
- `cargo run -p meshc -- test reference-backend`
- `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_process_restart_recovers_inflight_job -- --ignored --nocapture`
- `npm --prefix website ci`
- `npm --prefix website run build`
- `bash reference-backend/scripts/verify-production-proof-surface.sh`

## Observability / Diagnostics

- Runtime signals: `GET /health` must expose supervised worker status, `restart_count`, `last_exit_reason`, and `recovered_jobs`; the deploy smoke and ignored backend proofs must continue to report named phases instead of silent exits.
- Inspection surfaces: `compiler/meshc/tests/e2e_reference_backend.rs`, `reference-backend/README.md`, `reference-backend/scripts/deploy-smoke.sh`, `reference-backend/scripts/verify-production-proof-surface.sh`, `GET /health`, `GET /jobs/:id`, and direct `jobs` / `_mesh_migrations` reads.
- Failure visibility: a future agent must be able to tell whether failure is in backend assembly, deploy proof, crash recovery, or documentation drift by rerunning one named command/script and inspecting the exact health/doc assertion that failed.
- Redaction constraints: docs, tests, and verifier output must not print `DATABASE_URL` or other secrets; proof stays on safe URLs, ports, job ids, health JSON, and link/content assertions.

## Integration Closure

- Upstream surfaces consumed: `reference-backend/`, `compiler/meshc/tests/e2e_reference_backend.rs`, S03 tooling docs, S04 deployment scripts/docs, and the in-progress S05 supervision/recovery path.
- New wiring introduced in this slice: a canonical website proof page, repo landing-page proof links, the completed `reference-backend/README.md` supervision/runbook surface, and a repeatable doc-truth verifier script that ties generic docs back to those sources.
- What remains before the milestone is truly usable end-to-end: nothing within M028 if every verification item above passes.

## Tasks

- [x] **T01: Re-green the `reference-backend` proof baseline and recovery gates** `est:3h`
  - Why: S06 cannot honestly promote the backend proof surface while the real `reference-backend` build/test/recovery path is still broken from the S05 carry-forward gap.
  - Files: `reference-backend/jobs/worker.mpl`, `reference-backend/storage/jobs.mpl`, `reference-backend/api/health.mpl`, `reference-backend/main.mpl`, `reference-backend/runtime/registry.mpl`, `compiler/meshc/tests/e2e_reference_backend.rs`
  - Do: Finish the cooperative supervised worker exit/restart path, keep abandoned-job recovery visible in `/health`, and rerun the named build/fmt/test plus ignored recovery proofs until the reference backend is green again at the same surfaces S06 will document publicly.
  - Verify: `cargo run -p meshc -- build reference-backend && cargo run -p meshc -- fmt --check reference-backend && cargo run -p meshc -- test reference-backend && cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture && DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_process_restart_recovers_inflight_job -- --ignored --nocapture`
  - Done when: the real backend proof path is green again and the same `reference-backend` harness can prove build, runtime recovery, and restart visibility without relying on stale S05 placeholders.
- [x] **T02: Publish the canonical production backend proof narrative** `est:2h`
  - Why: Once the backend proof is truthful again, Mesh still needs one public entrypoint that tells evaluators what `reference-backend/` proves and where the authoritative commands/tests live.
  - Files: `README.md`, `reference-backend/README.md`, `website/docs/.vitepress/config.mts`, `website/docs/docs/production-backend-proof/index.md`
  - Do: Add the missing supervision/recovery runbook section to `reference-backend/README.md`, create a dedicated website page that summarizes runtime/tooling/deploy/recovery proof with direct links to the real commands/tests, and move `README.md` away from placeholder/toy-first framing by adding an early production-backend-proof section that points at the new public surfaces.
  - Verify: `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture && rg -n "Production backend proof|reference-backend|production-backend-proof|Supervision and recovery|worker_crash_recovers_job|process restart" README.md reference-backend/README.md website/docs/docs/production-backend-proof/index.md website/docs/.vitepress/config.mts && ! rg -n "placeholder link" README.md`
  - Done when: a reader can reach the real backend proof path from the repo landing page and website sidebar without depending on toy examples or package-local discovery.
- [x] **T03: Cross-link generic docs and codify doc-truth verification** `est:2h`
  - Why: The generic guides still frame Mesh mostly through feature tutorials; they need lightweight links to the canonical proof surface plus a mechanical guard against future doc drift.
  - Files: `website/docs/docs/getting-started/index.md`, `website/docs/docs/web/index.md`, `website/docs/docs/databases/index.md`, `website/docs/docs/concurrency/index.md`, `website/docs/docs/tooling/index.md`, `website/docs/docs/testing/index.md`, `reference-backend/scripts/verify-production-proof-surface.sh`
  - Do: Add short proof-path callouts in the generic guides, fix obvious stale wording such as the old install URL, keep duplicated command text minimal, and add a verifier script that checks for the expected proof links plus the absence of known stale phrases.
  - Verify: `npm --prefix website ci && npm --prefix website run build && bash reference-backend/scripts/verify-production-proof-surface.sh`
  - Done when: the website builds locally, the verifier script passes, and the generic docs consistently route evaluators to the canonical production-proof page and `reference-backend/README.md` instead of implying readiness through tutorials alone.

## Files Likely Touched

- `reference-backend/jobs/worker.mpl`
- `reference-backend/storage/jobs.mpl`
- `reference-backend/api/health.mpl`
- `reference-backend/main.mpl`
- `reference-backend/runtime/registry.mpl`
- `compiler/meshc/tests/e2e_reference_backend.rs`
- `README.md`
- `reference-backend/README.md`
- `website/docs/.vitepress/config.mts`
- `website/docs/docs/production-backend-proof/index.md`
- `website/docs/docs/getting-started/index.md`
- `website/docs/docs/web/index.md`
- `website/docs/docs/databases/index.md`
- `website/docs/docs/concurrency/index.md`
- `website/docs/docs/tooling/index.md`
- `website/docs/docs/testing/index.md`
- `reference-backend/scripts/verify-production-proof-surface.sh`
