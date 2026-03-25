---
estimated_steps: 10
estimated_files: 6
skills_used: []
---

# T01: Seeded the S03 harness and rewrote the basic read helpers, but the new Mesh probes still need quote cleanup

Start S03 with the lowest-risk raw-tail collapse and the permanent proof harness. This task should create the first real `compiler/meshc/tests/e2e_m033_s03.rs` file instead of deferring all proof work to the end, then use the current S01/S02 `Expr` / `Query` / `Pg` surface to eliminate the simplest projection/count/cast read helpers in `mesher/storage/queries.mpl`. The key constraint is caller stability: preserve every row key the existing API and ingestion callers read today.

## Steps

1. Copy the Docker/Postgres harness pattern from `compiler/meshc/tests/e2e_m033_s02.rs` into a new `compiler/meshc/tests/e2e_m033_s03.rs` target and add the first named `e2e_m033_s03_basic_reads_*` proofs for the easy helper families.
2. Rewrite the plain projection/count/cast helpers in `mesher/storage/queries.mpl` — `count_unresolved_issues`, `get_issue_project_id`, `validate_session`, `list_api_keys`, `list_alert_rules`, `get_all_project_retention`, `get_project_storage`, and `get_project_settings` — to use `Query.select_expr{s}`, `Query.where_expr`, `Expr.label`, `Expr.coalesce`, and explicit `Pg.*` casts where the current surface already expresses the query honestly.
3. Keep the caller-visible map keys stable for `mesher/ingestion/routes.mpl`, `mesher/api/dashboard.mpl`, `mesher/api/settings.mpl`, and `mesher/api/alerts.mpl`; only touch a caller if a field name would otherwise drift.
4. Leave the hard whole-query raw families and the named S03 leftovers for later tasks instead of sneaking in dishonest abstractions during the easy cleanup pass.

## Must-Haves

- [ ] `compiler/meshc/tests/e2e_m033_s03.rs` exists with named `e2e_m033_s03_basic_reads_*` coverage for the T01 helper families
- [ ] The T01 helper families no longer depend on raw projection strings or trivial raw whole-query SQL where the existing builder surface is already honest
- [ ] Caller-visible row keys such as `cnt`, `project_id`, `token`, `revoked_at`, `retention_days`, `sample_rate`, `event_count`, and `estimated_bytes` remain unchanged

## Inputs

- `compiler/meshc/tests/e2e_m033_s02.rs — reusable live-Postgres harness pattern from S02`
- `mesher/storage/queries.mpl — current simple projection/count/cast read helpers`
- `mesher/ingestion/routes.mpl — caller contract for issue-count and issue-project lookups`
- `mesher/api/dashboard.mpl — caller contract for storage and count-oriented dashboard rows`
- `mesher/api/settings.mpl — caller contract for settings row keys`
- `mesher/api/alerts.mpl — caller contract for alert-rule list row keys`

## Expected Output

- `compiler/meshc/tests/e2e_m033_s03.rs — initial S03 live-Postgres harness with named `basic_reads` proofs`
- `mesher/storage/queries.mpl — basic read helpers rewritten off raw projection strings and trivial raw whole-query usage`

## Verification

- `cargo test -p meshc --test e2e_m033_s03 basic_reads -- --nocapture`
- `cargo run -q -p meshc -- build mesher`

## Observability Impact

- Signals added/changed: named `e2e_m033_s03_basic_reads_*` failures and direct row snapshots for the T01 helper families
- How a future agent inspects this: rerun the `basic_reads` filter in `compiler/meshc/tests/e2e_m033_s03.rs` and inspect the rewritten helper block in `mesher/storage/queries.mpl`
- Failure state exposed: field-shape drift, cast/count mismatches, and caller-key regressions become explicit before the API layer
