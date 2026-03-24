---
id: T01
parent: S03
milestone: M029
provides:
  - Mesher entrypoint and ingestion route imports now use the canonical parenthesized multiline shape for this task's five targeted long imports
key_files:
  - mesher/main.mpl
  - mesher/ingestion/routes.mpl
  - .gsd/milestones/M029/slices/S03/S03-PLAN.md
  - .gsd/milestones/M029/slices/S03/tasks/T01-PLAN.md
key_decisions:
  - Used `reference-backend/api/health.mpl` as the exact manual-rewrite template and left formatter-wave canonicalization to later S03 tasks instead of mixing mechanical fmt churn into T01
patterns_established:
  - For pre-formatter Mesher cleanup, convert only the over-120-char `from` imports to parenthesized multiline form, preserve import order exactly, and let later formatter tasks own broader file normalization
observability_surfaces:
  - "! rg -n '^from .{121,}' mesher/main.mpl mesher/ingestion/routes.mpl"
  - "! rg -n '^from .*\\. ' mesher/main.mpl mesher/ingestion/routes.mpl"
  - "! rg -n '^from .{121,}' mesher -g '*.mpl'"
  - "cargo run -q -p meshc -- fmt --check mesher"
  - "cargo run -q -p meshc -- fmt --check reference-backend"
  - "cargo run -q -p meshc -- build mesher"
  - "cargo run -q -p meshc -- build reference-backend"
  - "! rg -n '^from .*\\. ' mesher reference-backend -g '*.mpl'"
  - "(cargo run -q -p meshc -- fmt --check mesher > /tmp/m029-s03-fmt-mesher.log 2>&1 && test ! -s /tmp/m029-s03-fmt-mesher.log) || (rg -n 'error|panic|from .*\\. ' /tmp/m029-s03-fmt-mesher.log && false)"
  - "test -f .gsd/milestones/M029/slices/S03/S03-UAT.md"
duration: 24m
verification_result: passed
completed_at: 2026-03-24T12:45:15-04:00
blocker_discovered: false
---

# T01: Rewrite entrypoint and ingestion imports to canonical multiline form

**Rewrote Mesher entrypoint and ingestion imports to the canonical multiline form without widening into the formatter wave.**

## What Happened

I fixed the pre-flight artifact gaps first. `.gsd/milestones/M029/slices/S03/S03-PLAN.md` now has an `## Observability / Diagnostics` section plus a captured `fmt --check mesher` log gate, and `.gsd/milestones/M029/slices/S03/tasks/T01-PLAN.md` now documents the task's observability surface.

The source change stayed narrow. I used `reference-backend/api/health.mpl` as the shape anchor and rewrote the four over-120-character imports in `mesher/main.mpl` (`Ingestion.Routes`, `Api.Dashboard`, `Api.Team`, and `Api.Alerts`) plus the long `Storage.Queries` import in `mesher/ingestion/routes.mpl` into the same parenthesized multiline form with one name per line and the closing `)` on its own line. Imported names and ordering were left unchanged.

I did not touch compiler code or `reference-backend/` source. The task-local greps are green, both dogfood builds still pass, and the remaining slice failures are the expected ones for an early task: five more Mesher files still have overlong imports, the broader Mesher formatter wave has not run yet, and `S03-UAT.md` does not exist until T06.

No new test file was added. This task is source-only import normalization, so the truthful verification surface is the targeted grep pair plus the slice-level formatter/build gates.

## Verification

Task-level verification passed:
- `! rg -n '^from .{121,}' mesher/main.mpl mesher/ingestion/routes.mpl`
- `! rg -n '^from .*\. ' mesher/main.mpl mesher/ingestion/routes.mpl`

Slice-level verification is partial, as expected on T01:
- The repo-wide long-import grep is still red because `mesher/api/alerts.mpl`, `mesher/api/dashboard.mpl`, `mesher/api/team.mpl`, `mesher/services/project.mpl`, and `mesher/services/user.mpl` are T02 scope.
- `cargo run -q -p meshc -- fmt --check mesher` is still red and reports 35 files that will be normalized in T03-T06.
- `cargo run -q -p meshc -- fmt --check reference-backend`, both build commands, and the repo-wide spaced-dotted-path grep all pass.
- The captured formatter-log diagnostic check stays red for now because Mesher still needs the formatter wave, and `test -f .gsd/milestones/M029/slices/S03/S03-UAT.md` correctly fails until T06 writes the UAT artifact.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `! rg -n '^from .{121,}' mesher/main.mpl mesher/ingestion/routes.mpl` | 0 | ✅ pass | 0.07s |
| 2 | `! rg -n '^from .*\. ' mesher/main.mpl mesher/ingestion/routes.mpl` | 0 | ✅ pass | 0.05s |
| 3 | `! rg -n '^from .{121,}' mesher -g '*.mpl'` | 1 | ❌ fail | 0.14s |
| 4 | `cargo run -q -p meshc -- fmt --check mesher` | 1 | ❌ fail | 6.47s |
| 5 | `cargo run -q -p meshc -- fmt --check reference-backend` | 0 | ✅ pass | 5.53s |
| 6 | `cargo run -q -p meshc -- build mesher` | 0 | ✅ pass | 10.17s |
| 7 | `cargo run -q -p meshc -- build reference-backend` | 0 | ✅ pass | 7.64s |
| 8 | `! rg -n '^from .*\. ' mesher reference-backend -g '*.mpl'` | 0 | ✅ pass | 0.06s |
| 9 | `(cargo run -q -p meshc -- fmt --check mesher > /tmp/m029-s03-fmt-mesher.log 2>&1 && test ! -s /tmp/m029-s03-fmt-mesher.log) \|\| (rg -n 'error\|panic\|from .*\. ' /tmp/m029-s03-fmt-mesher.log && false)` | 1 | ❌ fail | 5.93s |
| 10 | `test -f .gsd/milestones/M029/slices/S03/S03-UAT.md` | 1 | ❌ fail | 0.02s |

## Diagnostics

No runtime signals changed. The durable inspection surfaces for this task are the two targeted negative greps on `mesher/main.mpl` and `mesher/ingestion/routes.mpl`, the repo-wide long-import grep, `cargo run -q -p meshc -- fmt --check mesher`, `cargo run -q -p meshc -- fmt --check reference-backend`, both dogfood build commands, the repo-wide spaced-dotted-path grep, and `/tmp/m029-s03-fmt-mesher.log` for captured Mesher formatter diagnostics.

If later work regresses this task, start with the two task-local greps to confirm whether a long single-line import or a `Storage. Queries`-style corruption reappeared. If those stay green but slice verification fails, the red is downstream formatter/UAT work rather than a T01 import rewrite regression.

## Deviations

- Updated `.gsd/milestones/M029/slices/S03/S03-PLAN.md` before implementation to add the missing `## Observability / Diagnostics` section and a captured formatter-log verification step required by the pre-flight check.
- Updated `.gsd/milestones/M029/slices/S03/tasks/T01-PLAN.md` before implementation to add the missing `## Observability Impact` section.

## Known Issues

- `mesher/api/alerts.mpl`, `mesher/api/dashboard.mpl`, `mesher/api/team.mpl`, `mesher/services/project.mpl`, and `mesher/services/user.mpl` still contain over-120-character imports, so the repo-wide long-import grep is intentionally still red until T02.
- `cargo run -q -p meshc -- fmt --check mesher` still reports 35 files that would be reformatted, including the two files touched here; that broader canonicalization is owned by T03-T06.
- `.gsd/milestones/M029/slices/S03/S03-UAT.md` does not exist yet; T06 owns the final UAT artifact.
- Bash invocations in this environment still emit a pre-existing `/Users/sn0w/.profile` warning about missing `/Users/sn0w/.cargo/env`. It did not affect the grep, formatter, or build results here.

## Files Created/Modified

- `mesher/main.mpl` — rewrote the four overlong entrypoint imports into the canonical parenthesized multiline form.
- `mesher/ingestion/routes.mpl` — rewrote the long `Storage.Queries` import into the same canonical multiline form.
- `.gsd/milestones/M029/slices/S03/S03-PLAN.md` — added the required observability/diagnostic section and a captured formatter-log verification step.
- `.gsd/milestones/M029/slices/S03/tasks/T01-PLAN.md` — added the required observability-impact section.
