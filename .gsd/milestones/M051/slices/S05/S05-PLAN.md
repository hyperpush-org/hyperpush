# S05: Delete reference-backend and close the assembled acceptance rail

**Goal:** Remove the repo-root `reference-backend/` compatibility tree and retarget the last docs/verifier surfaces so the post-deletion repo proves Mesher, the retained backend fixture, migrated tooling rails, and the examples-first public story from stable top-level commands.
**Demo:** After this: The repo ships without `reference-backend/`, and the final acceptance bundle proves Mesher live runtime, retained backend proof, migrated tooling rails, and examples-first docs together on the post-deletion tree.

## Must-Haves

- The public proof-page contract lives at `bash scripts/verify-production-proof-surface.sh`, and no public page or positive wrapper caller still depends on `reference-backend/scripts/verify-production-proof-surface.sh`.
- The retained backend fixture and `bash scripts/verify-m051-s02.sh` stop preserving repo-root compatibility files as required artifacts and stay green after the repo-root tree is deleted.
- The repo no longer ships `reference-backend/`, and `.gitignore` no longer hides `reference-backend/reference-backend`.
- A new slice-owned post-deletion contract plus `bash scripts/verify-m051-s05.sh` prove Mesher, retained backend proof, tooling/editor rails, and the examples-first docs story together and publish the standard `.tmp/m051-s05/verify/` markers.

## Threat Surface

- **Abuse**: stale docs or wrappers can silently send maintainers to a deleted path, and an over-broad delete can remove the retained fixture instead of only the repo-root compatibility copy.
- **Data exposure**: none beyond maintainer-local verifier logs and `DATABASE_URL`-gated runtime replays; no new public secret-bearing surface is introduced.
- **Input trust**: docs text, shell verifier paths, filesystem delete targets, and maintainer-provided `DATABASE_URL` are the trust boundaries; every replay must fail closed on missing files, missing env, or missing bundle markers.

## Requirement Impact

- **Requirements touched**: `R119`, `R008`
- **Re-verify**: `bash scripts/verify-production-proof-surface.sh`, `bash scripts/verify-m051-s02.sh`, `bash scripts/verify-m051-s03.sh`, `bash scripts/verify-m051-s04.sh`, and the final `bash scripts/verify-m051-s05.sh` assembled replay.
- **Decisions revisited**: `D381`, `D385`, `D386`

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `bash scripts/verify-production-proof-surface.sh`
- `cargo test -p meshc --test e2e_m051_s02 -- --nocapture`
- `cargo test -p meshc --test e2e_m051_s04 -- --nocapture`
- `cargo test -p meshc --test e2e_m051_s05 -- --nocapture`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} bash scripts/verify-m051-s02.sh`
- `bash scripts/verify-m051-s03.sh`
- `bash scripts/verify-m051-s04.sh`
- `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} bash scripts/verify-m051-s05.sh`

## Observability / Diagnostics

- Runtime signals: `.tmp/m051-s02/verify/`, `.tmp/m051-s03/verify/`, `.tmp/m051-s04/verify/`, and `.tmp/m051-s05/verify/` phase markers plus retained proof bundles remain the authoritative state surfaces.
- Inspection surfaces: `bash scripts/verify-production-proof-surface.sh`, `bash scripts/verify-m051-s01.sh`, `bash scripts/verify-m051-s02.sh`, `bash scripts/verify-m051-s03.sh`, `bash scripts/verify-m051-s04.sh`, and `bash scripts/verify-m051-s05.sh`.
- Failure visibility: `status.txt`, `current-phase.txt`, `phase-report.txt`, `full-contract.log`, `latest-proof-bundle.txt`, and copied built-html summaries must pinpoint the failing phase without a blind full rerun.
- Redaction constraints: never print `DATABASE_URL` or bundle secrets; keep only command names, repo-relative paths, and retained verifier logs.

## Integration Closure

- Upstream surfaces consumed: `scripts/verify-m051-s01.sh`, `scripts/verify-m051-s02.sh`, `scripts/verify-m051-s03.sh`, `scripts/verify-m051-s04.sh`, `scripts/tests/verify-m036-s03-contract.test.mjs`, `scripts/tests/verify-m050-s02-first-contact-contract.test.mjs`, `scripts/tests/verify-m050-s03-secondary-surfaces.test.mjs`, `compiler/meshc/tests/e2e_m051_s02.rs`, `compiler/meshc/tests/e2e_m051_s04.rs`
- New wiring introduced in this slice: top-level `scripts/verify-production-proof-surface.sh`, post-deletion `compiler/meshc/tests/e2e_m051_s05.rs`, `bash scripts/verify-m051-s05.sh`, and the removal of the repo-root `reference-backend/` compatibility tree.
- What remains before the milestone is truly usable end-to-end: nothing

## Tasks

- [ ] **T01: Move the proof-page verifier to a stable top-level path before deletion** `est:90m`
  - Why: Deletion is only safe once the public proof-page verifier and its positive callers stop depending on the retiring repo-root app tree.
  - Files: `scripts/verify-production-proof-surface.sh`, `website/docs/docs/production-backend-proof/index.md`, `scripts/verify-m050-s01.sh`, `scripts/verify-m050-s03.sh`, `compiler/meshc/tests/e2e_m050_s01.rs`, `compiler/meshc/tests/e2e_m050_s03.rs`
  - Do: Move the proof-page verifier to `scripts/`, fix its root calculation and self-referenced command strings, update the proof page to name the new command, and retarget the direct wrapper/test callers that still require the old nested path.
  - Verify: `bash scripts/verify-production-proof-surface.sh`; `cargo test -p meshc --test e2e_m050_s01 -- --nocapture`; `cargo test -p meshc --test e2e_m050_s03 -- --nocapture`
  - Done when: the top-level proof-page verifier exists, the public proof page names it, and the historical callers/tests no longer point at `reference-backend/scripts/verify-production-proof-surface.sh`.
- [ ] **T02: Remove the last public `reference-backend` wording and tighten the docs contracts** `est:2h`
  - Why: The remaining public leaks are wording and contract gaps, not runtime behavior; they need explicit cleanup before deletion or the post-deletion docs rails will fail for the wrong reason.
  - Files: `website/docs/docs/tooling/index.md`, `website/docs/docs/distributed-proof/index.md`, `scripts/tests/verify-m036-s03-contract.test.mjs`, `scripts/tests/verify-m050-s02-first-contact-contract.test.mjs`, `scripts/tests/verify-m050-s03-secondary-surfaces.test.mjs`, `compiler/meshc/tests/e2e_m051_s04.rs`, `scripts/verify-m051-s04.sh`
  - Do: Rewrite the stale public tooling and distributed-proof wording, strengthen the M036/M050 docs contracts to ban those exact leaks, and keep the existing S04 source/built-html acceptance surface aligned with the new wording and top-level proof-page verifier command.
  - Verify: `node --test scripts/tests/verify-m036-s03-contract.test.mjs`; `node --test scripts/tests/verify-m050-s02-first-contact-contract.test.mjs`; `node --test scripts/tests/verify-m050-s03-secondary-surfaces.test.mjs`; `cargo test -p meshc --test e2e_m051_s04 -- --nocapture`
  - Done when: no public docs page still names repo-root `reference-backend` as the deeper backend surface, and the existing docs/source contracts catch any reintroduction.
- [ ] **T03: Flip the retained S02 contract to post-deletion truth and remove the repo-root tree** `est:2h`
  - Why: R119 only closes once the retained backend replay stops preserving the repo-root compatibility copy and the repo actually ships without `reference-backend/`.
  - Files: `scripts/fixtures/backend/reference-backend/README.md`, `scripts/fixtures/backend/reference-backend/tests/fixture.test.mpl`, `scripts/fixtures/backend/reference-backend/deploy/reference-backend.up.sql`, `compiler/meshc/tests/e2e_m051_s02.rs`, `scripts/verify-m051-s02.sh`, `.gitignore`
  - Do: Rewrite the retained fixture runbook/tests/verifier to post-deletion truth, remove copied deleted-path artifacts from S02 bundle checks, delete `reference-backend/`, and drop the repo-root binary ignore rule without touching the retained fixture.
  - Verify: `test ! -e reference-backend`; `cargo test -p meshc --test e2e_m051_s02 -- --nocapture`; `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} bash scripts/verify-m051-s02.sh`
  - Done when: the repo-root tree is gone, `.gitignore` is clean, and the retained backend-only acceptance rail is still green on the post-deletion tree.
- [ ] **T04: Add the final S05 contract and assembled post-deletion acceptance rail** `est:90m`
  - Why: The milestone needs one stable, post-deletion acceptance surface that composes Mesher, retained backend proof, tooling/editor rails, and docs together instead of forcing later agents to replay slices one by one.
  - Files: `compiler/meshc/tests/e2e_m051_s05.rs`, `scripts/verify-m051-s05.sh`
  - Do: Add a slice-owned post-deletion Rust contract, add an assembled S05 verifier that preflights `DATABASE_URL` once and replays S01-S04 in order, then copy the delegated verify trees into one retained `.tmp/m051-s05/verify/` bundle.
  - Verify: `cargo test -p meshc --test e2e_m051_s05 -- --nocapture`; `DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} bash scripts/verify-m051-s05.sh`
  - Done when: running the S05 replay is enough to prove the final post-deletion milestone state, and the retained bundle points at copied S01-S04 verifier outputs.

## Files Likely Touched

- `scripts/verify-production-proof-surface.sh`
- `website/docs/docs/production-backend-proof/index.md`
- `website/docs/docs/tooling/index.md`
- `website/docs/docs/distributed-proof/index.md`
- `scripts/tests/verify-m036-s03-contract.test.mjs`
- `scripts/tests/verify-m050-s02-first-contact-contract.test.mjs`
- `scripts/tests/verify-m050-s03-secondary-surfaces.test.mjs`
- `compiler/meshc/tests/e2e_m051_s02.rs`
- `compiler/meshc/tests/e2e_m051_s04.rs`
- `compiler/meshc/tests/e2e_m051_s05.rs`
- `scripts/verify-m051-s02.sh`
- `scripts/verify-m051-s04.sh`
- `scripts/verify-m051-s05.sh`
- `.gitignore`
