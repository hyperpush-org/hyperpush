---
estimated_steps: 4
estimated_files: 3
skills_used:
  - debug-like-expert
  - lint
---

# T01: Rewrite entrypoint and ingestion imports to canonical multiline form

**Slice:** S03 — Multiline imports and final formatter compliance
**Milestone:** M029

## Description

Rewrite the smallest remaining manual import surface in Mesher before any bulk formatter sweep happens. This task uses `reference-backend/api/health.mpl` as the canonical shape and converts the four overlong imports in `mesher/main.mpl` plus the long `Storage.Queries` import in `mesher/ingestion/routes.mpl` without changing imported names, order, or surrounding logic.

## Steps

1. Read `reference-backend/api/health.mpl` and copy its parenthesized multiline import shape exactly: opening `(` on the import line, one imported name per line, and the closing `)` alone on its own line.
2. Rewrite the four long imports in `mesher/main.mpl` to that exact shape, keeping imported names and ordering unchanged.
3. Rewrite the long `from Storage.Queries import ...` line in `mesher/ingestion/routes.mpl` to the same shape, again preserving imported names and ordering.
4. Verify that both files no longer contain over-120-char `from` imports or spaced dotted paths, and stop if the work starts pulling in compiler or `reference-backend/` source changes.

## Must-Haves

- [ ] `mesher/main.mpl` uses canonical parenthesized multiline imports for its four overlong import lines.
- [ ] `mesher/ingestion/routes.mpl` uses the same canonical multiline style for its long `Storage.Queries` import.
- [ ] No compiler files or `reference-backend/` source files are modified by this task.

## Verification

- `! rg -n '^from .{121,}' mesher/main.mpl mesher/ingestion/routes.mpl`
- `! rg -n '^from .*\. ' mesher/main.mpl mesher/ingestion/routes.mpl`

## Observability Impact

- Signals added/changed: none; this task only normalizes import layout in two Mesher source files.
- How a future agent inspects this: compare the rewritten imports against `reference-backend/api/health.mpl`, then rerun the two targeted `rg` checks on `mesher/main.mpl` and `mesher/ingestion/routes.mpl`.
- Failure state exposed: the overlong-import grep catches any missed single-line imports, while the spaced-dotted-path grep catches formatter-shape corruption such as `Storage. Queries` introduced during manual edits.

## Inputs

- `reference-backend/api/health.mpl` — canonical multiline import style anchor proven safe in S01
- `mesher/main.mpl` — four remaining overlong import lines to convert
- `mesher/ingestion/routes.mpl` — remaining long `Storage.Queries` import to convert

## Expected Output

- `mesher/main.mpl` — entrypoint imports rewritten to canonical multiline form
- `mesher/ingestion/routes.mpl` — ingestion import rewritten to canonical multiline form
