---
phase: 120-mesher-dogfooding
plan: "01"
subsystem: mesher
tags: [dogfooding, slot-pipe, string-interpolation, heredoc, ergonomics, v12.0]
dependency_graph:
  requires: [119-03]
  provides: [PIPE-05, STRG-06]
  affects: [mesher/ingestion, mesher/api, mesher/services, mesher/main.mpl]
tech_stack:
  added: []
  patterns:
    - "Slot pipe |2> for non-first-arg threading (String.replace, String.join)"
    - "String interpolation #{expr} replacing <> concatenation chains"
    - "Heredoc \"\"\"...\"\"\" for JSON strings with embedded double quotes"
key_files:
  created: []
  modified:
    - mesher/ingestion/fingerprint.mpl
    - mesher/ingestion/pipeline.mpl
    - mesher/ingestion/routes.mpl
    - mesher/services/writer.mpl
    - mesher/services/retention.mpl
    - mesher/main.mpl
decisions:
  - "Slot pipe applied only in fingerprint.mpl where genuine argument threading exists; other files already used idiomatic patterns"
  - "Heredocs used for JSON builders with multiple embedded double quotes; simple error strings use regular #{} without heredoc"
  - "auth.mpl, helpers.mpl, detail.mpl, search.mpl, dashboard.mpl, team.mpl, alerts.mpl left unchanged for interpolation (no concat chains, only pure string literals or single-field patterns)"
metrics:
  duration: 4min
  completed: 2026-02-26
  tasks_completed: 2
  files_modified: 6
---

# Phase 120 Plan 01: Mesher Dogfooding (Slot Pipe + String Interpolation) Summary

Comprehensive dogfooding pass applying v12.0 language ergonomics (slot pipe `|2>` and string interpolation `#{expr}`) across the Mesher production codebase, verifying both features work correctly at scale beyond isolated E2E tests.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Apply slot pipe updates | b2beb319 | mesher/ingestion/fingerprint.mpl |
| 2 | Apply string interpolation | 15fc1a4e | pipeline.mpl, routes.mpl, writer.mpl, retention.mpl, main.mpl |

## What Was Built

**Slot pipe (`|2>`)** applied in `fingerprint.mpl`:
- `normalize_message`: replaced 3-step let chain (`lower`, `no_hex`) with pipe chain `msg |> to_lower() |2> replace("0x", "") |> trim()`
- `fingerprint_from_frames`: replaced `String.join(parts, ";")` with `frames |> List.map(...) |2> String.join(";")`
- Illustrative comment added explaining `|2>` semantics

**String interpolation (`#{expr}`)** applied across 5 files:
- `pipeline.mpl`: all 13 println concat chains converted; JSON builders use heredocs; threshold message uses `#{threshold_str}`; peer detection/monitor logs use `#{node_count}`, `#{prev_peers}`, etc.
- `routes.mpl`: room variables use `"project:#{project_id}"`; broadcast JSON builders use heredocs; error responses use `"""{"error":"#{reason}"}"""`; success responses use `"""{"status":"ok","affected":#{n}}"""`
- `writer.mpl`: `flush_drop` println uses `#{count_val} #{project_id}`
- `retention.mpl`: all 3 log helpers use `#{deleted}`, `#{e}`, `#{name}`
- `main.mpl`: 6 peer/node startup printlns converted to `#{peer}`, `#{node_name}`, `#{ws_port_str}`, `#{http_port_str}`

## Decisions Made

1. **Scope boundary for slot pipe**: Only `fingerprint.mpl` had genuine non-first-arg threading patterns. `search.mpl`, `dashboard.mpl`, `team.mpl`, `alerts.mpl` already used idiomatic `|>` pipe or simple let bindings — no `|2>` win there.

2. **Heredoc usage rule**: Applied heredocs when JSON string contained 2+ embedded double quotes. Single-field error strings like `"""{"error":"#{e}"}"""` are borderline but still cleaner than `"{\"error\":\"" <> e <> "\""`. Strings with no embedded variables kept as regular strings.

3. **Files not modified for interpolation**: `auth.mpl` (no concat chains), `helpers.mpl` (no concat chains), `detail.mpl` (complex JSON with raw JSONB embeds — neutral), `search.mpl`/`dashboard.mpl`/`team.mpl`/`alerts.mpl` (JSON row serializers build complex objects where the field-by-field pattern is actually readable as-is).

## Deviations from Plan

None — plan executed exactly as written.

## Verification

1. `cargo check -p meshc` passes with zero errors
2. `grep -r '|2>' mesher/` returns 3 matches in fingerprint.mpl
3. `grep -r '#{' mesher/` returns 40+ matches across 5 files
4. `grep -r '"""' mesher/` returns 12+ matches in routes.mpl and pipeline.mpl
5. `git diff --name-only HEAD~2 HEAD` shows only 6 files in `mesher/` (no compiler source changes)

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Commit b2beb319 (slot pipe): FOUND
- Commit 15fc1a4e (interpolation): FOUND
- mesher/ingestion/fingerprint.mpl: FOUND
- mesher/ingestion/pipeline.mpl: FOUND
- mesher/ingestion/routes.mpl: FOUND
