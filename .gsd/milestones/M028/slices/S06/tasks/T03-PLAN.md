---
estimated_steps: 4
estimated_files: 7
skills_used:
  - review
  - test
  - lint
---

# T03: Cross-link generic docs and codify doc-truth verification

**Slice:** S06 — Honest Production Proof and Documentation
**Milestone:** M028

## Description

The final step is to make the broader docs ecosystem route to the canonical proof surface instead of implying production readiness through tutorials alone. This task keeps generic guides lightweight, fixes obvious stale wording, and adds a repeatable verifier script so future doc edits can fail mechanically when the production-proof links or truth checks drift.

## Steps

1. Update the generic docs in `website/docs/docs/getting-started/index.md`, `website/docs/docs/web/index.md`, `website/docs/docs/databases/index.md`, `website/docs/docs/concurrency/index.md`, `website/docs/docs/tooling/index.md`, and `website/docs/docs/testing/index.md` with short callouts that point to the new production-backend-proof page and `reference-backend/README.md` rather than copying the full runbook into every guide.
2. Fix the obvious stale-doc drift while touching those pages, especially the old install URL in getting started and any remaining wording that frames the production proof path as implicit or secondary.
3. Add `reference-backend/scripts/verify-production-proof-surface.sh` to assert the expected proof links exist, known stale phrases are absent, and the edited docs still point at the canonical public/backend runbooks.
4. Run `npm --prefix website ci`, `npm --prefix website run build`, and the new verifier script so the website navigation and the doc-truth sweep are both proven before the slice closes.

## Must-Haves

- [ ] Generic docs point readers at `website/docs/docs/production-backend-proof/index.md` and/or `reference-backend/README.md` instead of treating toy examples as the main backend readiness signal.
- [ ] `website/docs/docs/getting-started/index.md` no longer references the stale `mesh-lang.org/install.sh` installer path.
- [ ] `reference-backend/scripts/verify-production-proof-surface.sh` fails on known stale phrases or missing canonical proof links.
- [ ] The website build passes after the cross-link sweep, proving the new page wiring and edited markdown are valid together.

## Verification

- `npm --prefix website ci`
- `npm --prefix website run build`
- `bash reference-backend/scripts/verify-production-proof-surface.sh`

## Inputs

- `website/docs/docs/production-backend-proof/index.md` — canonical public proof page created in T02 that generic guides must link to
- `README.md` — updated landing-page proof entrypoint from T02 for wording alignment
- `website/docs/docs/getting-started/index.md` — generic getting-started guide with the stale installer URL
- `website/docs/docs/web/index.md` — generic HTTP guide that needs a proof-surface pointer
- `website/docs/docs/databases/index.md` — generic database guide that needs a proof-surface pointer
- `website/docs/docs/concurrency/index.md` — generic supervision/concurrency guide that needs a proof-surface pointer
- `website/docs/docs/tooling/index.md` — tooling guide that should route readers to the canonical backend proof story
- `website/docs/docs/testing/index.md` — testing guide that should route readers to the canonical backend proof story

## Expected Output

- `website/docs/docs/getting-started/index.md` — updated install guidance plus production-proof link
- `website/docs/docs/web/index.md` — generic web guide cross-linking to the backend proof surface
- `website/docs/docs/databases/index.md` — generic database guide cross-linking to the backend proof surface
- `website/docs/docs/concurrency/index.md` — generic concurrency guide cross-linking to the backend proof surface
- `website/docs/docs/tooling/index.md` — tooling guide cross-linking to the backend proof surface
- `website/docs/docs/testing/index.md` — testing guide cross-linking to the backend proof surface
- `reference-backend/scripts/verify-production-proof-surface.sh` — repeatable doc-truth verifier for the canonical backend proof links and stale-string sweep

## Observability Impact

- The new verifier script must emit named `[proof-docs]` phases so a future agent can tell whether failure was caused by a missing proof page, a missing cross-link in one of the generic docs, or a stale phrase that resurfaced.
- The inspection surfaces for this task are the edited docs plus `reference-backend/scripts/verify-production-proof-surface.sh`; rerunning the script should identify the exact file and assertion that drifted.
- The website build remains the integration signal for sidebar/frontmatter/link validity, while the verifier script becomes the narrower doc-truth signal for canonical proof routing and stale-string absence.
