---
phase: 125-update-docs
plan: 01
subsystem: docs
tags: [readme, documentation, benchmarks, v12.0]

# Dependency graph
requires:
  - phase: 123-benchmarks
    provides: Isolated benchmark numbers (29,108/28,955 req/s) used in performance table
  - phase: 122-repo-reorg
    provides: Correct install path (compiler/meshc) and repo structure
  - phase: 116-slot-pipe
    provides: Slot pipe operator syntax documented in Key Features
  - phase: 117-string-interpolation
    provides: #{} interpolation syntax documented and used in Hello World example
provides:
  - Accurate top-level README.md for v12.0 with correct version, benchmarks, and code examples
affects: [contributors, open-source-readiness, landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - README.md

key-decisions:
  - "README.md version badge updated from v6.0 to v12.0 — reflects current stable release"
  - "Performance table replaced with isolated benchmark numbers from quick task 7 (each server ran alone on its own VM)"
  - "Web server example replaced with correct HTTP module syntax (HTTP.router/HTTP.route/HTTP.serve, no imports needed)"
  - "PROJECT.md link removed from Project Status — internal planning file not appropriate for public README"
  - "Hello World receive block updated to #{} interpolation to showcase v12.0 feature"

patterns-established:
  - "Performance tables include p99 latency alongside req/s for fuller picture"

requirements-completed: [DOC-01]

# Metrics
duration: 1min
completed: 2026-02-27
---

# Phase 125 Plan 01: Update README.md Summary

**README.md updated to v12.0 with isolated benchmark numbers (Mesh: 29,108/28,955 req/s), correct HTTP module syntax, and #{} string interpolation examples**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-27T17:28:55Z
- **Completed:** 2026-02-27T17:29:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Version badge updated from v6.0 to v12.0
- Performance table replaced with isolated benchmark results showing Mesh at 29,108 /text and 28,955 /json req/s with p99 latency columns added
- Web server example corrected from stale Http.* module casing to working HTTP.* syntax (HTTP.router, HTTP.route, HTTP.serve) matching passing e2e tests
- Hello World example updated to use #{} string interpolation (v12.0 preferred syntax)
- Project Status section updated to reflect v12.0 as current stable with list of recent additions
- Key Features section updated with slot pipe operator and string ergonomics bullets
- Removed stale cold-start footnote and PROJECT.md link

## Task Commits

Each task was committed atomically:

1. **Task 1: Update README.md version, performance table, status, and code examples** - `74382ba1` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `README.md` - Updated version badge, performance table, web server example, hello world example, project status, key features

## Decisions Made
- Used isolated benchmark numbers (runs 2-5 averaged, single server per VM) rather than co-located numbers — these are more representative of real-world single-server deployment
- Added p99 latency columns to performance table for fuller picture (not just req/s)
- Removed PROJECT.md reference from public README — it is an internal planning file
- Used HTTP.router() / HTTP.route() / HTTP.serve() pattern matching stdlib_http_server_runtime.mpl e2e test

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- README.md is now accurate for v12.0 and ready for public open-source use
- Landing page and documentation page updates (if any) would be subsequent tasks

---
*Phase: 125-update-docs*
*Completed: 2026-02-27*
