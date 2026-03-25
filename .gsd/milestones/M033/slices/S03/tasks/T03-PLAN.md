---
estimated_steps: 2
estimated_files: 8
skills_used: []
---

# T03: Replace the failing storage-probe proof surface with a Mesher-backed composed-read harness

Why: T02 showed the copied storage-only probe cannot safely consume the remaining struct-list and aggregate read shapes, so S03 needs a higher-level proof boundary before more read-side work is credible.

Do: Keep the passing `basic_reads` family, then move the partial `composed_reads` coverage off the direct storage-probe staging path and onto a Mesher-backed surface that exercises the same `search` / `dashboard` / `detail` / `alerts` / `team` caller contracts. Prove the already-rewritten joined, list, aggregate, and boolean helper families there (`get_project_by_api_key`, `list_issues_by_status`, `event_volume_hourly`, `error_breakdown_by_level`, `top_issues_by_frequency`, `event_breakdown_by_tag`, `get_event_detail`, `get_members_with_users`, `list_events_for_issue`, `list_alerts`, `check_new_issue`, `should_fire_by_cooldown`). If the new proof surface still trips the same staging bug, limit any compiler/runtime-side changes to the smallest test-enabler needed for honest read assertions rather than widening Mesh product scope.

## Inputs

- `.gsd/milestones/M033/slices/S03/tasks/T02-SUMMARY.md`
- `.gsd/KNOWLEDGE.md`
- `compiler/meshc/tests/e2e_m033_s03.rs`
- `mesher/storage/queries.mpl`
- `mesher/api/search.mpl`
- `mesher/api/dashboard.mpl`
- `mesher/api/detail.mpl`
- `mesher/api/alerts.mpl`
- `mesher/api/team.mpl`

## Expected Output

- `A stable `e2e_m033_s03_composed_reads_*` proof family that runs through a Mesher-backed verification surface instead of the broken storage-only struct-list staging path`
- `Composed-read helper coverage that preserves caller-visible row keys, ordering, booleans, and null/default semantics for the T02-owned families`
- `If needed, only a bounded test-enabler fix for the probe/runtime path rather than a widened product-facing abstraction`

## Verification

cargo test -p meshc --test e2e_m033_s03 composed_reads -- --nocapture
cargo run -q -p meshc -- build mesher

## Observability Impact

- Signals added/changed: named `e2e_m033_s03_hard_reads_*` failures and explicit leftover comments distinguish decomposition bugs from intentionally retained keep-sites
- How a future agent inspects this: rerun the `hard_reads` filter and inspect the hard-family helper blocks plus the leftover comments in `mesher/storage/queries.mpl`
- Failure state exposed: cursor/order bugs, count mismatches, and keep-list drift become explicit at the storage boundary
