---
estimated_steps: 10
estimated_files: 7
skills_used: []
---

# T02: Attempted the T02 composed-read proof expansion, fixed the probe-compatible boolean helpers, and recorded a storage-probe blocker for the remaining read families.

Keep pushing the read-side cleanup on the families that already fit the current ORM surface but still lean on raw SELECT, ORDER BY, or GROUP BY fragments. This task is still Mesher-only work: use the current builder and explicit `Pg.*` seam rather than widening the neutral core. The important constraint is that the dashboard/detail/search/team/alerts callers must see the same row keys and ordering semantics they consume today.

## Steps

1. Extend `compiler/meshc/tests/e2e_m033_s03.rs` with named `e2e_m033_s03_composed_reads_*` coverage for the joined, aggregate, and list families this task owns.
2. Rewrite the joined and aggregate read helpers in `mesher/storage/queries.mpl` — `get_project_by_api_key`, `list_issues_by_status`, `event_volume_hourly`, `error_breakdown_by_level`, `top_issues_by_frequency`, `event_breakdown_by_tag`, `get_event_detail`, and `get_members_with_users` — onto `Query.select_expr{s}`, ordinary `group_by` / `order_by`, `Expr.label`, `Expr.coalesce`, and explicit `Pg.*` casts wherever those surfaces already tell the truth.
3. Rewrite the remaining current-surface list helpers that only need conditional query assembly or projection cleanup — `list_events_for_issue`, `list_alerts`, `check_new_issue`, and `should_fire_by_cooldown` — without promoting them back to `Repo.query_raw(...)` whole-query strings.
4. Keep the map keys, sort order, and null/default handling stable for `mesher/api/search.mpl`, `mesher/api/dashboard.mpl`, `mesher/api/detail.mpl`, `mesher/api/alerts.mpl`, and `mesher/api/team.mpl`.

## Must-Haves

- [ ] The T02 joined, aggregate, and list helpers use the current builder surface wherever it is already honest instead of recurring raw SELECT / ORDER / GROUP fragments
- [ ] `compiler/meshc/tests/e2e_m033_s03.rs` contains named `e2e_m033_s03_composed_reads_*` proofs for the T02 families
- [ ] Caller-visible row keys, ordering, and null/default semantics stay unchanged for the dashboard/detail/search/team/alerts surfaces

## Inputs

- ``compiler/meshc/tests/e2e_m033_s03.rs` — S03 harness seeded in T01`
- ``mesher/storage/queries.mpl` — joined, aggregate, and list read helpers still using raw projections or raw ordering/grouping`
- ``mesher/api/search.mpl` — caller contract for issue/event listing rows`
- ``mesher/api/dashboard.mpl` — caller contract for aggregate rows and top-issues ordering`
- ``mesher/api/detail.mpl` — caller contract for event detail row shapes`
- ``mesher/api/alerts.mpl` — caller contract for alert list row shapes`
- ``mesher/api/team.mpl` — caller contract for membership list row shapes`

## Expected Output

- ``compiler/meshc/tests/e2e_m033_s03.rs` — expanded `composed_reads` coverage for joined and aggregate read helpers`
- ``mesher/storage/queries.mpl` — joined, aggregate, and list read helpers rewritten onto the current builder surface without changing caller-visible row shapes`

## Verification

- `cargo test -p meshc --test e2e_m033_s03 composed_reads -- --nocapture`
- `cargo run -q -p meshc -- build mesher`

## Observability Impact

- Signals added/changed: named `e2e_m033_s03_composed_reads_*` failures localize ordering, grouping, and row-key drift for the dashboard/detail/search/alerts/team families
- How a future agent inspects this: rerun the `composed_reads` filter in `compiler/meshc/tests/e2e_m033_s03.rs` and inspect the rewritten helper blocks in `mesher/storage/queries.mpl`
- Failure state exposed: aggregate/count mismatches, ordering drift, and null/default handling regressions become explicit at the storage boundary
