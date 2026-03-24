---
id: T03
parent: S06
milestone: M028
provides:
  - Generic docs now route to one canonical production backend proof page, and a repeatable verifier script catches doc-truth drift mechanically.
key_files:
  - website/docs/docs/production-backend-proof/index.md
  - website/docs/.vitepress/config.mts
  - website/docs/docs/getting-started/index.md
  - website/docs/docs/web/index.md
  - website/docs/docs/databases/index.md
  - website/docs/docs/concurrency/index.md
  - website/docs/docs/tooling/index.md
  - website/docs/docs/testing/index.md
  - reference-backend/scripts/verify-production-proof-surface.sh
  - README.md
  - .gsd/milestones/M028/slices/S06/tasks/T03-PLAN.md
key_decisions:
  - Created the missing `website/docs/docs/production-backend-proof/index.md` locally because the planned T02 artifact did not exist in this worktree and the generic docs needed a real canonical target.
  - Made `reference-backend/scripts/verify-production-proof-surface.sh` the mechanical doc-truth gate for the proof surface, with named `[proof-docs]` phases and exact file/assertion failures.
patterns_established:
  - Keep the generic guides lightweight: point them at `/docs/production-backend-proof/` and `reference-backend/README.md` instead of duplicating backend runbooks.
  - When public-proof docs drift, rerun `bash reference-backend/scripts/verify-production-proof-surface.sh` before editing broader content; it now tells you which proof link or stale phrase regressed.
observability_surfaces:
  - website/docs/docs/production-backend-proof/index.md
  - website/docs/.vitepress/config.mts
  - reference-backend/scripts/verify-production-proof-surface.sh
  - README.md
  - reference-backend/api/health.mpl
  - reference-backend/main.mpl
  - reference-backend/jobs/worker.mpl
  - cargo run -p meshc -- build reference-backend
  - cargo run -p meshc -- test reference-backend
  - cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture
duration: partial
verification_result: failed
completed_at: 2026-03-23T01:25:29-04:00
blocker_discovered: false
---

# T03: Cross-link generic docs and codify doc-truth verification

**Cross-linked the docs to a new production backend proof page and added a verifier script, but the slice-level backend proof gates remain red on the carry-forward `Jobs.Worker` export break.**

## What Happened

I started by fixing the required pre-flight gap in `.gsd/milestones/M028/slices/S06/tasks/T03-PLAN.md` and then read the exact docs, sidebar config, landing page, and backend runbook that T03 was supposed to cross-link.

That immediately exposed a local mismatch with the planner snapshot: `website/docs/docs/production-backend-proof/index.md` did not exist yet, and `README.md` was still using stale placeholder wording instead of routing evaluators to a backend proof surface. I treated that as a local execution correction rather than re-planning the slice.

I created `website/docs/docs/production-backend-proof/index.md` as the canonical public proof page, added it to `website/docs/.vitepress/config.mts`, updated `README.md` to point at the proof page and `reference-backend/README.md`, replaced the stale getting-started installer URL with the current source install path, and added short proof-surface callouts to the generic Web, Databases, Concurrency, Tooling, and Testing guides.

I also added `reference-backend/scripts/verify-production-proof-surface.sh`, which now checks that the proof page exists, the generic guides and landing page link to it, the runbook reference is present, and known stale phrases like the old install URL and README placeholder text are absent. The script emits named `[proof-docs]` phases so future failures are easy to localize.

The doc-specific verification gates all passed: the verifier script succeeded, `npm --prefix website ci` succeeded, and `npm --prefix website run build` succeeded with the new page/sidebar wiring in place.

Because this is the final task in the slice, I also ran the slice-level backend proof gates. Those are still red for reasons outside the T03 doc edits: `cargo run -p meshc -- build reference-backend`, `cargo run -p meshc -- test reference-backend`, and the build-only Rust harness all fail in the same carry-forward area from T02, where `reference-backend/api/health.mpl` and `reference-backend/main.mpl` cannot import the expected `Jobs.Worker` exports. I stopped there when the context-budget warning fired and did not begin a fresh runtime-debugging subtask.

## Verification

Verified successfully for this task:
- the new doc-truth verifier passes
- the website dependency install succeeds
- the website build succeeds with the new proof page and sidebar route
- the formatter gate for `reference-backend/` still passes

Verified failing at the slice level:
- `meshc build reference-backend` still fails because `Jobs.Worker` is only exporting `JobWorkerState`
- `meshc test reference-backend` fails for the same reason via `reference-backend/api/health.mpl`
- the build-only `e2e_reference_backend_builds` Rust harness fails on the same backend compile break

Not rerun in this unit:
- the remaining `DATABASE_URL`-backed ignored slice proofs, because the upstream backend build/test gates were already red and the context warning required wrap-up

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash reference-backend/scripts/verify-production-proof-surface.sh` | 0 | ✅ pass | n/a |
| 2 | `npm --prefix website ci` | 0 | ✅ pass | 20.3s |
| 3 | `npm --prefix website run build` | 0 | ✅ pass | 45.1s |
| 4 | `cargo run -p meshc -- build reference-backend` | 1 | ❌ fail | n/a |
| 5 | `cargo run -p meshc -- fmt --check reference-backend` | 0 | ✅ pass | n/a |
| 6 | `cargo run -p meshc -- test reference-backend` | 1 | ❌ fail | n/a |
| 7 | `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture` | 101 | ❌ fail | n/a |

The remaining slice-level `DATABASE_URL`-backed ignored proofs were not rerun after the build gate failed.

## Diagnostics

- Doc-truth drift surface: `bash reference-backend/scripts/verify-production-proof-surface.sh`
- Public proof entrypoint: `website/docs/docs/production-backend-proof/index.md`
- Sidebar wiring: `website/docs/.vitepress/config.mts`
- Landing-page proof links: `README.md`
- Current carry-forward backend failure surface: `reference-backend/api/health.mpl`, `reference-backend/main.mpl`, and `reference-backend/jobs/worker.mpl`
- Current error shape: `Jobs.Worker` only exports `JobWorkerState`, so imports like `start_worker`, `get_worker_restart_count`, and related health helpers are unresolved during package build/test
- Resume by rerunning, in order: `cargo run -p meshc -- build reference-backend`, `cargo run -p meshc -- test reference-backend`, and `cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_builds -- --nocapture`

## Deviations

- I created `website/docs/docs/production-backend-proof/index.md` and repaired `README.md` and the docs sidebar even though T03 nominally expected those canonical surfaces to already exist from T02, because they were absent/stale in the local worktree and the generic cross-links needed a real target.

## Known Issues

- The slice-level backend proof surface is still not green in this worktree: `reference-backend/api/health.mpl` and `reference-backend/main.mpl` cannot import the expected `Jobs.Worker` functions, so `meshc build`, `meshc test`, and `e2e_reference_backend_builds` are still failing.
- The ignored `DATABASE_URL`-backed slice proofs were not rerun in this unit because the package build/test gates were already red and the context warning required wrap-up.

## Files Created/Modified

- `website/docs/docs/production-backend-proof/index.md` — created the missing canonical public proof page and listed the named backend proof commands/surfaces.
- `website/docs/.vitepress/config.mts` — added the production backend proof page to the docs sidebar.
- `website/docs/docs/getting-started/index.md` — replaced the stale install URL and added proof-surface routing.
- `website/docs/docs/web/index.md` — added a proof-surface callout.
- `website/docs/docs/databases/index.md` — added a proof-surface callout.
- `website/docs/docs/concurrency/index.md` — added a proof-surface callout.
- `website/docs/docs/tooling/index.md` — added a proof-surface callout.
- `website/docs/docs/testing/index.md` — added a proof-surface callout.
- `reference-backend/scripts/verify-production-proof-surface.sh` — added the repeatable doc-truth verifier with named `[proof-docs]` phases.
- `README.md` — removed stale placeholder wording and pointed the landing page at the canonical proof surfaces.
- `.gsd/milestones/M028/slices/S06/tasks/T03-PLAN.md` — added the missing `## Observability Impact` section required by the pre-flight check.
- `.gsd/milestones/M028/slices/S06/tasks/T03-SUMMARY.md` — recorded the implementation and the remaining carry-forward backend verification failures.
