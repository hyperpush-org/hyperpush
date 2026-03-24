---
id: S04
milestone: M031
title: "Mesher Dogfood Cleanup"
status: done
started: 2026-03-24
completed: 2026-03-24
tasks_completed: 2
tasks_total: 2
---

# S04: Mesher Dogfood Cleanup

**Cleaned mesher codebase: 72 `let _ =` removed, 11 `<>` replaced with interpolation, 3 else/if chains flattened. Multiline imports deferred — formatter collapses them.**

## What This Slice Delivered

All mechanical cleanup targets for `mesher/` that can be delivered without a formatter fix are done:

- **Zero `let _ =` side-effect bindings** — removed all 72 across 6 files (`pipeline.mpl`: 35, `routes.mpl`: 14, `queries.mpl`: 14, `retention.mpl`: 6, `writer.mpl`: 2, `ws_handler.mpl`: 1). Bare expression statements used throughout.
- **3 nested else/if blocks → `else if` chains** — `pipeline.mpl` (peer-change detection), `search.mpl` (`cap_limit` and `filter_by_tag_inner`).
- **11 `<>` → `#{}` interpolation** across 6 files (`fingerprint.mpl`: 5, `ws_handler.mpl`: 2, `validation.mpl`: 1, `event_processor.mpl`: 1, `helpers.mpl`: 1, `routes.mpl`: 1). D029-designated `<>` sites (SQL DDL, JSONB, crypto) preserved intentionally.

## What Was Not Delivered

- **Multiline imports** — attempted but abandoned. `meshc fmt` collapses parenthesized multiline imports back to single-line and corrupts module dot-paths (`Storage. Schema`). Parser supports the syntax (proven by e2e tests), but the formatter walker doesn't preserve it. Deferred to a formatter fix (D032). This means `fmt --check mesher` still fails on 35 files (pre-existing).

## Verification Results

| Check | Result |
|---|---|
| `rg 'let _ =' mesher/ -g '*.mpl'` | 0 matches ✅ |
| `cargo run -p meshc -- build mesher` | exit 0 ✅ |
| `cargo run -p meshc -- fmt --check mesher` | 35 files — pre-existing formatter limitation ⚠️ |
| `cargo test -p meshc --test e2e` | 313 pass, 10 pre-existing `try_*` failures ✅ |

## Key Decisions

- **D029 (prior):** Keep `<>` for SQL DDL, raw JSONB embedding, and crypto construction — interpolation applied only to clear-win sites (log messages, fingerprint construction, JSON brackets).
- **D032:** Multiline imports deferred — formatter collapses them and corrupts dot-paths. Parser is fine; formatter walker needs to handle `FROM_IMPORT_DECL` with `IMPORT_LIST` inside parens.

## What the Next Slice Should Know

- **S05 (Language Test Expansion)** can use the cleaned mesher code as a second test oracle alongside reference-backend. Both codebases now exercise bare expressions, `else if` chains, and interpolation.
- **Formatter gap:** `meshc fmt --check mesher` will keep failing on 35 files until the formatter walker handles multiline imports and dot-path spacing. This is documented in KNOWLEDGE.md and D032. S05 should not depend on mesher passing `fmt --check`.
- **R024 partially validated** — the multiline-import criterion cannot be met until the formatter is fixed. All other R024 criteria (zero `let _ =`, interpolation, `else if`) are proven.

## Files Modified

### T01: Remove `let _ =` and flatten `else if`
- `mesher/ingestion/pipeline.mpl` — 35 `let _ =` removed, 1 else/if flattened
- `mesher/ingestion/routes.mpl` — 14 `let _ =` removed
- `mesher/storage/queries.mpl` — 14 `let _ =` removed
- `mesher/services/retention.mpl` — 6 `let _ =` removed
- `mesher/services/writer.mpl` — 2 `let _ =` removed
- `mesher/ingestion/ws_handler.mpl` — 1 `let _ =` removed
- `mesher/api/search.mpl` — 2 else/if flattened

### T02: Replace `<>` with interpolation
- `mesher/ingestion/fingerprint.mpl` — 5 `<>` → interpolation
- `mesher/ingestion/ws_handler.mpl` — 2 `<>` → interpolation
- `mesher/ingestion/validation.mpl` — 1 `<>` → interpolation
- `mesher/services/event_processor.mpl` — 1 `<>` → interpolation
- `mesher/api/helpers.mpl` — 1 `<>` → interpolation
- `mesher/ingestion/routes.mpl` — 1 `<>` → interpolation

## Duration

~23 minutes total (T01: 8m, T02: 15m)
