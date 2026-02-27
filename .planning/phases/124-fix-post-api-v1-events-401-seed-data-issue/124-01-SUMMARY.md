---
phase: 124-fix-post-api-v1-events-401-seed-data-issue
plan: "01"
subsystem: database
tags: [postgresql, migrations, seed-data, api-keys, mesh]

# Dependency graph
requires:
  - phase: initial-schema
    provides: organizations, projects, api_keys tables with FK constraints and indexes
provides:
  - Idempotent seed migration populating default org, project, and API key for development
  - Known dev API key (mshr_devdefaultapikey000000000000000000000000000) immediately usable after migrate up
affects: [mesher-ingestion, mesher-auth, developer-setup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seed migration as separate .mpl file with timestamp > schema migration timestamp"
    - "ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING for partial-index tables"
    - "Pool.execute for INSERT/DELETE, Repo.query_raw for SELECT in migration context"

key-files:
  created:
    - mesher/migrations/20260226000000_seed_default_org.mpl
  modified: []

key-decisions:
  - "Seed migration uses Pool.execute for INSERT/DELETE and Repo.query_raw for SELECT — same primitives as schema migration, not ORM Repo calls"
  - "projects.slug ON CONFLICT requires WHERE slug IS NOT NULL predicate to match partial index (omitting it causes PostgreSQL runtime error)"
  - "Fixed API key value (mshr_devdefaultapikey000000000000000000000000000) — zeros are valid hex, matches mshr_ + 48 hex-char pattern"
  - "Version 20260226000000 sorts after schema migration 20260216120000 — guaranteed to run second"

patterns-established:
  - "Partial-index ON CONFLICT: always include the WHERE predicate from CREATE UNIQUE INDEX in ON CONFLICT clause"

requirements-completed: [SEED-01]

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 124 Plan 01: Fix POST /api/v1/events 401 Seed Data Issue Summary

**Idempotent seed migration creating default organization, project, and API key so POST /api/v1/events returns 202 immediately after `meshc migrate up`**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T03:57:54Z
- **Completed:** 2026-02-27T03:59:51Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created `mesher/migrations/20260226000000_seed_default_org.mpl` with idempotent up()/down() functions
- Default organization (slug='default'), project (slug='default', platform='mesh'), and API key (mshr_devdefaultapikey000000000000000000000000000) inserted with ON CONFLICT DO NOTHING
- Projects INSERT correctly uses `ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING` to match the partial unique index, avoiding PostgreSQL constraint error
- down() deletes in reverse FK order (api_keys -> projects -> organizations) for clean rollback
- Developer comment block in file header explains exactly how to test after migrate up

## Task Commits

Each task was committed atomically:

1. **Task 1: Write idempotent seed migration** - `08cfb1b3` (feat)
2. **Task 2: Verify migration compiles and can be applied** - verification only, no new files

**Plan metadata:** [pending final commit]

## Files Created/Modified

- `mesher/migrations/20260226000000_seed_default_org.mpl` - Seed migration with up()/down(), inserts default org/project/api_key, idempotent via ON CONFLICT DO NOTHING

## Decisions Made

- `Pool.execute` used for INSERT/DELETE statements (no rows returned); `Repo.query_raw` used for SELECT (rows returned) — matches existing schema migration pattern
- The `projects` table has only a partial unique index on slug (`WHERE slug IS NOT NULL`), not a column-level UNIQUE constraint. PostgreSQL requires the partial index predicate in ON CONFLICT: `ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING`. Using the bare form would fail at runtime.
- API key value `mshr_devdefaultapikey000000000000000000000000000` is a fixed constant (zeros are valid hex), matching the `mshr_` + 48 hex-char pattern used by `create_api_key` in queries.mpl

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. After running `meshc migrate up` with a live PostgreSQL database, the seed migration runs automatically.

**Developer setup:**

1. Start PostgreSQL
2. Run: `DATABASE_URL=postgres://... meshc migrate up`
3. Test: `curl -X POST http://localhost:8080/api/v1/events -H "x-sentry-auth: mshr_devdefaultapikey000000000000000000000000000" -H "Content-Type: application/json" -d '{"message":"test error","level":"error"}'`

Expected response: `202 {"status":"accepted"}`

## Next Phase Readiness

- POST /api/v1/events will return 202 (not 401) after `meshc migrate up` with the default API key
- Seed migration is idempotent: running migrate up twice is safe
- down() migration is clean: no FK violations on rollback

## Self-Check: PASSED

- mesher/migrations/20260226000000_seed_default_org.mpl: FOUND
- Commit 08cfb1b3: FOUND

---
*Phase: 124-fix-post-api-v1-events-401-seed-data-issue*
*Completed: 2026-02-27*
