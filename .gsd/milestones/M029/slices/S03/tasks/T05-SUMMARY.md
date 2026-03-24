---
id: T05
parent: S03
milestone: M029
provides:
  - Mesher service modules are now on canonical formatter output, and the multiline imports in `project.mpl` and `user.mpl` survive the formatter unchanged
key_files:
  - mesher/services/event_processor.mpl
  - mesher/services/org.mpl
  - mesher/services/project.mpl
  - mesher/services/rate_limiter.mpl
  - mesher/services/retention.mpl
  - mesher/services/stream_manager.mpl
  - mesher/services/user.mpl
  - mesher/services/writer.mpl
  - .gsd/milestones/M029/slices/S03/tasks/T05-PLAN.md
  - .gsd/milestones/M029/slices/S03/S03-PLAN.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Accepted the service-wave formatter output once `mesher/services` round-tripped cleanly, the two multiline imports stayed parenthesized, the dotted-path greps stayed green, and the output matched already-accepted Mesher spacing from earlier waves instead of revealing a new service-specific regression
patterns_established:
  - After T05, a red `cargo run -q -p meshc -- fmt --check mesher` should list only Mesher migrations/tests/types files; if any `mesher/services/*.mpl` file reappears there, treat that as a real regression in the service wave
  - The current formatter still emits spaces around generic/result-type syntax and `do|state|` handler separators; judge new formatter waves by build plus targeted greps, not by aesthetics alone
observability_surfaces:
  - "cargo run -q -p meshc -- fmt mesher/services && cargo run -q -p meshc -- fmt --check mesher/services"
  - "! rg -n '^from .{121,}' mesher/services/project.mpl mesher/services/user.mpl && ! rg -n '^from .*\\. ' mesher/services -g '*.mpl'"
  - "cargo run -q -p meshc -- fmt --check mesher"
  - "cargo run -q -p meshc -- fmt --check reference-backend"
  - "cargo run -q -p meshc -- build mesher"
  - "cargo run -q -p meshc -- build reference-backend"
  - "! rg -n '^from .*\\. ' mesher reference-backend -g '*.mpl'"
  - "/tmp/m029-s03-fmt-mesher.log"
duration: 29m
verification_result: passed
completed_at: 2026-03-24T13:28:31-04:00
blocker_discovered: false
---

# T05: Canonicalize Mesher service modules with the fixed formatter

**Moved Mesher’s service modules onto the current formatter output while preserving the multiline imports in `project.mpl` and `user.mpl`.**

## What Happened

I fixed the pre-flight artifact gap first. `.gsd/milestones/M029/slices/S03/tasks/T05-PLAN.md` now includes the required `## Observability Impact` section before the source work.

Then I read all eight `mesher/services/*.mpl` files and snapshotted their pre-format contents to `/tmp/m029-t05-services/` so the formatter churn could be inspected against the real service-layer source instead of treated as anonymous output. I ran the scoped formatter wave exactly as planned with `cargo run -q -p meshc -- fmt mesher/services`, then confirmed the directory round-tripped cleanly with `cargo run -q -p meshc -- fmt --check mesher/services`.

I inspected the full per-file diffs, with special attention to `mesher/services/project.mpl` and `mesher/services/user.mpl`. Both files kept the parenthesized multiline `from Storage.Queries import (...)` form intact, and no spaced dotted module paths were introduced anywhere in `mesher/services/`.

The formatter did produce ugly spacing churn in several service files (`Map < String, Int >`, `String ! String`, `do|state|`, and broader parameter wrapping), but that turned out not to be a new T05 regression. Earlier accepted Mesher files such as `mesher/api/alerts.mpl` and `mesher/storage/queries.mpl` already use the same post-T04 canonical output, and `cargo run -q -p meshc -- build mesher` stayed green after the service wave. Because the suspicious shapes matched existing accepted output instead of a service-only breakage, I kept T05 inside Mesher source canonicalization and did not reopen compiler work.

No new test file was added. This task is formatter/build compliance work, so the truthful verification surface is the scoped formatter round-trip, the import-shape greps, the slice-level formatter/build gates, and the captured Mesher formatter log.

## Verification

Task-level verification passed:
- `cargo run -q -p meshc -- fmt mesher/services && cargo run -q -p meshc -- fmt --check mesher/services`
- `! rg -n '^from .{121,}' mesher/services/project.mpl mesher/services/user.mpl && ! rg -n '^from .*\. ' mesher/services -g '*.mpl'`

Slice-level verification is partial, as expected on T05:
- The repo-wide Mesher long-import grep stays green.
- `cargo run -q -p meshc -- build mesher` and `cargo run -q -p meshc -- build reference-backend` both pass.
- `cargo run -q -p meshc -- fmt --check mesher` is still red only for the remaining T06 backlog: the two migration files, two test files, and six type files.
- `cargo run -q -p meshc -- fmt --check reference-backend` is still red for the seven stale backend files already identified in T04.
- The repo-wide spaced-dotted-path grep stays green.
- `/tmp/m029-s03-fmt-mesher.log` contains only the same ten-file Mesher formatter backlog and no `error`, `panic`, or spaced dotted import signal.
- `test -f .gsd/milestones/M029/slices/S03/S03-UAT.md` still fails because T06 owns the final UAT artifact.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo run -q -p meshc -- fmt mesher/services && cargo run -q -p meshc -- fmt --check mesher/services` | 0 | ✅ pass | 13.05s |
| 2 | `! rg -n '^from .{121,}' mesher/services/project.mpl mesher/services/user.mpl && ! rg -n '^from .*\. ' mesher/services -g '*.mpl'` | 0 | ✅ pass | 0.16s |
| 3 | `! rg -n '^from .{121,}' mesher -g '*.mpl'` | 0 | ✅ pass | 0.05s |
| 4 | `cargo run -q -p meshc -- fmt --check mesher` | 1 | ❌ fail | 6.53s |
| 5 | `cargo run -q -p meshc -- fmt --check reference-backend` | 1 | ❌ fail | 6.60s |
| 6 | `cargo run -q -p meshc -- build mesher` | 0 | ✅ pass | 13.75s |
| 7 | `cargo run -q -p meshc -- build reference-backend` | 0 | ✅ pass | 8.94s |
| 8 | `! rg -n '^from .*\. ' mesher reference-backend -g '*.mpl'` | 0 | ✅ pass | 0.09s |
| 9 | `(cargo run -q -p meshc -- fmt --check mesher > /tmp/m029-s03-fmt-mesher.log 2>&1 && test ! -s /tmp/m029-s03-fmt-mesher.log) \|\| (rg -n 'error\|panic\|from .*\. ' /tmp/m029-s03-fmt-mesher.log && false)` | 1 | ❌ fail | 7.30s |
| 10 | `test -f .gsd/milestones/M029/slices/S03/S03-UAT.md` | 1 | ❌ fail | 0.01s |

## Diagnostics

The durable inspection surfaces for this task are the scoped formatter round-trip on `mesher/services`, the targeted multiline-import and dotted-path greps, the repo-wide formatter/build gates, and `/tmp/m029-s03-fmt-mesher.log`.

If this task appears to regress later, start with `cargo run -q -p meshc -- fmt mesher/services && cargo run -q -p meshc -- fmt --check mesher/services`, then inspect `mesher/services/project.mpl` and `mesher/services/user.mpl` for import-shape drift. If the service wave still round-trips cleanly, use `! rg -n '^from .*\. ' mesher/services -g '*.mpl'` and `cargo run -q -p meshc -- build mesher` to distinguish a real formatter break from the currently accepted spacing churn. If slice verification is still red after that, inspect `/tmp/m029-s03-fmt-mesher.log`: after T05 it should mention only the ten remaining Mesher migration/test/type files.

## Deviations

- Updated `.gsd/milestones/M029/slices/S03/tasks/T05-PLAN.md` before implementation to add the missing `## Observability Impact` section required by the pre-flight check.
- Added a `.gsd/KNOWLEDGE.md` note recording that the current formatter’s generic/result-type spacing and `do|state|` handler output are existing canonical churn, not a T05-specific regression surface.

## Known Issues

- `cargo run -q -p meshc -- fmt --check mesher` is still red for 10 untouched files in `mesher/migrations`, `mesher/tests`, and `mesher/types`; T06 owns that final Mesher cleanup wave.
- `cargo run -q -p meshc -- fmt --check reference-backend` is still red for 7 stale backend files that need reformatting under the corrected formatter output.
- `.gsd/milestones/M029/slices/S03/S03-UAT.md` does not exist yet; T06 still owns the final UAT artifact.

## Files Created/Modified

- `mesher/services/event_processor.mpl` — moved the event processor service onto the current canonical formatter output.
- `mesher/services/org.mpl` — moved the organization service onto the current canonical formatter output.
- `mesher/services/project.mpl` — moved the project service onto the current canonical formatter output while preserving the multiline import.
- `mesher/services/rate_limiter.mpl` — moved the rate limiter service onto the current canonical formatter output.
- `mesher/services/retention.mpl` — moved the retention cleaner module onto the current canonical formatter output.
- `mesher/services/stream_manager.mpl` — moved the stream manager service onto the current canonical formatter output.
- `mesher/services/user.mpl` — moved the user service onto the current canonical formatter output while preserving the multiline import.
- `mesher/services/writer.mpl` — moved the storage writer service onto the current canonical formatter output.
- `.gsd/milestones/M029/slices/S03/tasks/T05-PLAN.md` — added the required task-level observability section.
- `.gsd/KNOWLEDGE.md` — recorded that the current formatter’s spacing churn is existing canonical output, not a new T05-specific regression.
