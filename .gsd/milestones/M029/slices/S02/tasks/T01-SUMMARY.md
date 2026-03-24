---
id: T01
parent: S02
milestone: M029
provides:
  - Alerts, detail, and search API serializers no longer use `<>` while preserving raw JSON fragment embedding and nullable token behavior
key_files:
  - mesher/api/alerts.mpl
  - mesher/api/detail.mpl
  - mesher/api/search.mpl
  - .gsd/milestones/M029/slices/S02/S02-PLAN.md
key_decisions:
  - Preserve query-provided JSONB/scalar text fields with interpolation and keep existing scalar-only `json {}` helpers in place instead of converting everything to raw string assembly
patterns_established:
  - Mixed JSON payloads should interpolate preformatted raw fragments such as nullable timestamps, neighbor IDs, pagination cursor fragments, and JSONB text while leaving scalar-only row serializers on `json {}`
observability_surfaces:
  - "cargo run -q -p meshc -- build mesher"
  - "! rg -n '<>' mesher/api/alerts.mpl mesher/api/detail.mpl mesher/api/search.mpl"
  - "diff -u <(rg -n '<>' mesher -g '*.mpl' | cut -d: -f1-2 | sort) <(printf '%s\\n' mesher/storage/queries.mpl:486 mesher/storage/queries.mpl:787 mesher/storage/schema.mpl:11 mesher/storage/schema.mpl:12 mesher/storage/schema.mpl:13)"
  - "! rg -n 'List\\.map\\(rows,|Ok\\(List\\.map\\(' mesher -g '*.mpl'"
duration: 26m
verification_result: passed
completed_at: 2026-03-24T02:13:00-04:00
blocker_discovered: false
---

# T01: Rewrite API serializers with type-preserving JSON and interpolation

**Rewrote Mesher alert/detail/search serializers to interpolation style while preserving raw JSON fragments and nullable token behavior.**

## What Happened

I first patched the pre-flight gap in `S02-PLAN.md` by adding the targeted API `<>` grep to the slice verification list so the failure surface is explicit. Then I read the three API modules plus the backing query shapes in `mesher/storage/queries.mpl` and rewrote only the mixed JSON serializers that still depended on `<>`.

`mesher/api/alerts.mpl` now uses interpolation for `format_nullable_ts`, `rule_row_to_json`, and `alert_row_to_json`, with `condition_json`, `action_json`, `enabled`, `cooldown_minutes`, and `condition_snapshot` still embedded as raw JSON/scalar tokens. `mesher/api/detail.mpl` now interpolates the full event-detail payload, neighbor IDs, and the combined event/navigation wrapper without re-quoting JSONB fields. `mesher/api/search.mpl` now interpolates the tag-filter row JSON, pagination cursor fragments/wrappers, and the dynamic tag JSON builder while leaving the existing scalar-only `json {}` helpers intact.

No dedicated test file was added for this task. The slice contract here is compiler truth plus exact-location grep proofs, and the change surface is serializer assembly rather than new runtime behavior.

## Verification

Task-level verification passed:
- The targeted negative grep confirmed there are no remaining `<>` sites in `mesher/api/alerts.mpl`, `mesher/api/detail.mpl`, or `mesher/api/search.mpl`.
- `cargo run -q -p meshc -- build mesher` succeeded and produced `Compiled: mesher/mesher`.

Slice-level closeout verification is intentionally still partial because T02 owns `mesher/storage/queries.mpl`:
- The repo-wide `<>` diff still reports extra non-keep sites at `mesher/storage/queries.mpl:100` and `mesher/storage/queries.mpl:191`.
- The wrapping-map grep still reports survivors at `mesher/storage/queries.mpl:55`, `:88`, `:235`, and `:368`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `! rg -n '<>' mesher/api/alerts.mpl mesher/api/detail.mpl mesher/api/search.mpl` | 0 | ✅ pass | 0.06s |
| 2 | `cargo run -q -p meshc -- build mesher` | 0 | ✅ pass | 11.65s |
| 3 | `diff -u <(rg -n '<>' mesher -g '*.mpl' \| cut -d: -f1-2 \| sort) <(printf '%s\n' mesher/storage/queries.mpl:486 mesher/storage/queries.mpl:787 mesher/storage/schema.mpl:11 mesher/storage/schema.mpl:12 mesher/storage/schema.mpl:13)` | 1 | ❌ fail | 0.05s |
| 4 | `! rg -n 'List\.map\(rows,|Ok\(List\.map\(' mesher -g '*.mpl'` | 1 | ❌ fail | 0.06s |

## Diagnostics

There are no new runtime signals in this task. The inspection surfaces remain the compiler and grep proofs:
- `cargo run -q -p meshc -- build mesher`
- `! rg -n '<>' mesher/api/alerts.mpl mesher/api/detail.mpl mesher/api/search.mpl`
- repo-wide `<>` diff against the designated keep sites
- repo-wide wrapping-map grep

If the serializer behavior regresses later, compare the API helpers against the authoritative query row shapes in `mesher/storage/queries.mpl`, especially the fields already returned as JSON text (`condition_json`, `action_json`, `condition_snapshot`, `exception`, `stacktrace`, `breadcrumbs`, `tags`, `extra`, `user_context`).

## Deviations

- Updated `.gsd/milestones/M029/slices/S02/S02-PLAN.md` to add the targeted API `<>` grep to the slice verification section, satisfying the pre-flight requirement for an explicit inspectable failure-state check.

## Known Issues

- Slice closeout is not complete yet. `mesher/storage/queries.mpl` still contains the two remaining non-SQL `<>` sites (`:100`, `:191`) and the four `Ok(List.map(rows, ...))` survivors (`:55`, `:88`, `:235`, `:368`) that T02 is supposed to remove.

## Files Created/Modified

- `.gsd/milestones/M029/slices/S02/S02-PLAN.md` — added the targeted API grep to the slice verification section for explicit failure inspection.
- `mesher/api/alerts.mpl` — replaced alert serializer `<>` chains with interpolation while preserving raw JSON/scalar embedding.
- `mesher/api/detail.mpl` — replaced event detail and navigation JSON assembly with interpolation and a shared empty-navigation helper.
- `mesher/api/search.mpl` — replaced remaining raw-fragment pagination/tag serializers with interpolation while keeping scalar-only `json {}` helpers.
