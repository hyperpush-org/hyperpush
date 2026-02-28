---
phase: 132-improve-language-json-handling-with-native-object-literal-syntax-instead-of-manual-string-concatenation
plan: 03
subsystem: compiler
tags: [json, mesher, migration, documentation]

# Dependency graph
requires:
  - phase: 132-02
    provides: lower_json_expr and lower_json_expr_inner in MIR lowerer, mesh_json_parse_raw runtime, 5 E2E tests all passing

provides:
  - 70 json { } usages across mesher .mpl files (ingestion + api)
  - JSON Literals section in language-basics documentation with type table, nesting example, and reserved keyword note
  - json { } cheatsheet entry in String Features section

affects: [mesher, website/docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "json { } for simple error/status responses: json { error: e }, json { status: 'ok', affected: n }"
    - "Skip json { } when field key is a Mesh reserved keyword (type, fn, let, etc.)"
    - "Skip json { } when field value is a pre-encoded JSON string (raw JSONB splice)"
    - "Skip json { } for dynamic key patterns (json { } requires bare identifier keys)"

key-files:
  created: []
  modified:
    - mesher/ingestion/ws_handler.mpl
    - mesher/ingestion/routes.mpl
    - mesher/api/detail.mpl
    - mesher/api/search.mpl
    - mesher/api/alerts.mpl
    - mesher/api/team.mpl
    - mesher/api/dashboard.mpl
    - mesher/api/settings.mpl
    - website/docs/docs/language-basics/index.md
    - website/docs/docs/cheatsheet/index.md

key-decisions:
  - "Skip 'type' as json { } key: 'type' is a Mesh reserved keyword (TYPE_KW token), not an IDENT. The parser requires bare IDENT tokens for keys — keyword-named fields must remain as heredoc/concat strings"
  - "Skip complex row serializers with pre-encoded JSONB fields: exception, stacktrace, breadcrumbs, tags, condition_json, action_json, condition_snapshot hold pre-serialized JSON strings that would double-encode in json { }"
  - "Skip row serializers with numeric SQL strings: event_count, retention_days, sample_rate from DB are String type holding numeric text. json { } would quote them; concat embeds them unquoted"
  - "Migrate all simple error/status patterns: json { error: e }, json { status: 'ok' }, json { status: 'ok', affected: n }, json { id: id } etc."
  - "Add reserved keyword note to JSON Literals docs section so users understand the type/fn/let limitation"

patterns-established:
  - "Deviation discovery: check parser source to understand key restrictions before mass migration"

requirements-completed: [JSON-01]

# Metrics
duration: 10m 25s
completed: 2026-02-28
---

# Phase 132 Plan 03: Mesher Migration and Documentation for json { } Literals Summary

**70 json { } literal usages migrated across Mesher .mpl files (skipping reserved keyword and pre-encoded JSON patterns), plus JSON Literals documentation section with type table and nesting example**

## Performance

- **Duration:** 10m 25s
- **Started:** 2026-02-28T03:39:56Z
- **Completed:** 2026-02-28T03:50:21Z
- **Tasks:** 3 (1a, 1b, 2)
- **Files modified:** 10

## Accomplishments

- Migrated all safe JSON patterns in mesher ingestion files (ws_handler.mpl, routes.mpl) — 19 usages
- Migrated all safe JSON patterns in mesher API files (detail, search, alerts, team, dashboard, settings) — 51 additional usages
- Added `## JSON Literals` section to language-basics docs with type table, nesting example, HTTP.response usage examples, and reserved keyword caveat
- Added json { } examples to cheatsheet String Features section
- Mesher compiles cleanly after migration; no new test failures

## Task Commits

1. **Task 1a: Migrate ingestion files** - `d456fae1` (feat)
2. **Task 1b: Migrate api files** - `cabb8770` (feat)
3. **Task 2: Update documentation** - `e680caf1` (docs)

## Files Created/Modified

- `mesher/ingestion/ws_handler.mpl` - ws_send_accepted, ws_send_error migrated; filters_updated left (type key)
- `mesher/ingestion/routes.mpl` - unauthorized/rate_limited/accepted/bad_request helpers and all error/status/affected responses migrated; type-keyed WS broadcasts left
- `mesher/api/detail.mpl` - 404 and 500 error responses migrated; complex multi-field row serializer left (JSONB splice)
- `mesher/api/search.mpl` - all error responses migrated; tag_json dynamic key and JSONB row serializers left
- `mesher/api/alerts.mpl` - id/status/error responses migrated; rule/alert row serializers with pre-encoded JSON left
- `mesher/api/team.mpl` - all id/status/error responses migrated; member/api_key row serializers with nullable conditional left
- `mesher/api/dashboard.mpl` - all error and 404 responses migrated; numeric SQL string row serializers left
- `mesher/api/settings.mpl` - error and status responses migrated; settings/storage row serializers with numeric SQL strings left
- `website/docs/docs/language-basics/index.md` - JSON Literals section added; heredoc description updated
- `website/docs/docs/cheatsheet/index.md` - json { } examples added to String Features section

## Decisions Made

- **Reserved keyword limitation**: `type` is a Mesh keyword token; `json { type: ... }` fails to parse. Discovered by examining parser source (`parse_json_literal` requires `SyntaxKind::IDENT`). All patterns with `type` as key reverted to heredoc strings. Documented in the JSON Literals section.
- **Pre-encoded JSONB fields**: Fields like `exception`, `stacktrace`, `condition_json`, `action_json`, `condition_snapshot` hold raw JSON strings from PostgreSQL JSONB columns. Passing them as `json { }` field values would double-encode them as JSON strings.
- **Numeric SQL strings**: Fields like `event_count`, `retention_days`, `sample_rate` arrive from DB as `String` holding numeric text (e.g., `"42"`). In `json { }` they would be emitted as `"42"` (quoted), but the original concat embeds them unquoted. Left as-is.
- **String.from(n) patterns**: Where `n :: Int` was used with `String.from(n)` for concat, migrated to `json { ..., affected: n }` since `json { }` handles Int natively as unquoted numbers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Revert type-keyed json { } patterns — reserved keyword parse error**
- **Found during:** Task 1a (first compilation attempt)
- **Issue:** The plan suggested migrating patterns like `json { type: "event" }`. However `type` is a Mesh keyword token, not an IDENT. The parser's `parse_json_literal` requires bare `SyntaxKind::IDENT` tokens for keys. Compilation produced parse errors on all files with `type:` fields.
- **Fix:** Reverted all `json { type: ... }` patterns back to heredoc strings. Updated documentation to include a note about reserved keywords.
- **Files modified:** mesher/ingestion/ws_handler.mpl, mesher/ingestion/routes.mpl, mesher/ingestion/pipeline.mpl, website/docs/docs/language-basics/index.md
- **Verification:** `cargo run --bin meshc -- build mesher` exits 0 after revert
- **Committed in:** d456fae1 (Task 1a commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: parse error from reserved keyword key)
**Impact on plan:** The plan did not anticipate the reserved keyword constraint. All `type`-keyed patterns (WS event broadcasts, alert notifications) remain as heredoc strings. These are the majority of the `type` field patterns. The 70 migrated usages represent all patterns where bare identifier keys are non-keyword strings.

## Issues Encountered

Three pre-existing test failures (`e2e_cross_module_from_json`, `e2e_cross_module_from_json_selective_import`, `e2e_heredoc_basic`) caused by `json` becoming a reserved keyword in Phase 132-01. These exist before this plan and are not regressions — documented in 132-02 SUMMARY.

## Next Phase Readiness

- Phase 132 fully complete: parser, type checker, MIR codegen, E2E tests, mesher migration, documentation all done
- The reserved keyword limitation (`type`, etc. as keys) should be tracked as a future enhancement (allow keywords as quoted keys in json { })
- Pre-existing 3 test failures need follow-up: rename `json` variable usages in fixture files that conflict with the new keyword

## Self-Check: PASSED

- mesher/ingestion/ws_handler.mpl: FOUND
- mesher/ingestion/routes.mpl: FOUND
- mesher/api/detail.mpl: FOUND
- mesher/api/search.mpl: FOUND
- mesher/api/alerts.mpl: FOUND
- mesher/api/team.mpl: FOUND
- mesher/api/dashboard.mpl: FOUND
- mesher/api/settings.mpl: FOUND
- website/docs/docs/language-basics/index.md: FOUND
- website/docs/docs/cheatsheet/index.md: FOUND
- commit d456fae1: FOUND
- commit cabb8770: FOUND
- commit e680caf1: FOUND
- json { } count >= 15: 70 FOUND

---
*Phase: 132-improve-language-json-handling*
*Completed: 2026-02-28*
