---
id: T02
parent: S04
milestone: M033
key_files:
  - mesher/migrations/20260216120000_create_initial_schema.mpl
  - compiler/meshc/src/migrate.rs
  - compiler/meshc/tests/e2e.rs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Keep the initial Mesher migration fully helper-driven by using neutral `Migration.*` helpers wherever possible and reserving `Pg.*` helpers only for the truly PostgreSQL-specific extension, partitioned-table, and GIN/opclass cases.
  - Preserve Mesher's existing catalog/index names by passing explicit `name:` options on every rewritten neutral index instead of relying on derived names.
  - Keep new migration compile coverage under the `e2e_migration` test-name filter so the task's authoritative `cargo test -p meshc --test e2e e2e_migration -- --nocapture` gate actually executes it.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T22:58:05.800Z
blocker_discovered: false
---

# T02: Rewrite Mesher's initial migration onto Migration/Pg helpers and update migration scaffolds

**Rewrite Mesher's initial migration onto Migration/Pg helpers and update migration scaffolds**

## What Happened

Rewrote `mesher/migrations/20260216120000_create_initial_schema.mpl` so the initial schema is now fully helper-driven. The ordinary table DDL that had still been raw (`org_memberships` and `issues`) now uses `Migration.create_table(...)`, every ordinary/partial/ordered index now uses `Migration.create_index(...)` with explicit `name:` options to preserve the existing Mesher catalog names, and the PostgreSQL-only sites now route through the explicit `Pg` helper boundary: `Pg.create_extension(...)` for `pgcrypto`, `Pg.create_range_partitioned_table(...)` for the `events` parent, and `Pg.create_gin_index(...)` for `idx_events_tags` with `jsonb_path_ops`. After the rewrite, the migration no longer contains any `Pool.execute(pool, ...)` calls.

Updated `compiler/meshc/src/migrate.rs` so generated migration scaffolds teach the explicit `Pg.*` path for PostgreSQL-only schema extras instead of showing `Migration.execute(...)` as the default extension example, and tightened the unit assertions to require the new scaffold text and ban the old raw extension snippet.

Updated `compiler/meshc/tests/e2e.rs` so the compile-only migration coverage now exercises the richer named/ordered `Migration.create_index(...)` surface and the PostgreSQL helper family directly. I initially named the new PG helper compile test without the `e2e_migration` prefix, then corrected it after the task gate showed the filter would skip it; I recorded that filter gotcha in `.gsd/KNOWLEDGE.md` for future agents.

`meshc fmt --check mesher` initially failed on the rewritten migration, so I ran `meshc fmt mesher`, confirmed only `mesher/migrations/20260216120000_create_initial_schema.mpl` changed, and reran the verification gates from the final formatted state.

## Verification

Task-level verification passed from the final formatted state: `cargo test -p meshc --test e2e e2e_migration -- --nocapture` ran 6 migration-focused compile tests including the new PG helper coverage, `cargo run -q -p meshc -- build mesher` succeeded, and `! rg -n "Pool\.execute\(pool" mesher/migrations/20260216120000_create_initial_schema.mpl` confirmed the initial migration has no remaining raw pool execution sites. I also confirmed the exact Mesher index names still appear in the migration (`idx_projects_slug`, `idx_issues_project_last_seen`, `idx_events_tags`, `idx_alert_rules_project`, `idx_alerts_triggered`).

Slice-level verification is partially green, as expected for T02: `cargo run -q -p meshc -- fmt --check mesher` and `cargo run -q -p meshc -- build mesher` both pass, while `cargo test -p meshc --test e2e_m033_s04 -- --nocapture` still fails because the `e2e_m033_s04` target has not been added yet, and `bash scripts/verify-m033-s04.sh` still fails because that slice verifier script does not exist yet. Those remaining failures are slice-incomplete T04 work, not regressions from this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test -p meshc --test e2e e2e_migration -- --nocapture` | 0 | ✅ pass | 12855ms |
| 2 | `cargo run -q -p meshc -- build mesher` | 0 | ✅ pass | 15708ms |
| 3 | `! rg -n "Pool\.execute\(pool" mesher/migrations/20260216120000_create_initial_schema.mpl` | 0 | ✅ pass | 60ms |
| 4 | `cargo run -q -p meshc -- fmt --check mesher` | 0 | ✅ pass | 7390ms |
| 5 | `cargo test -p meshc --test e2e_m033_s04 -- --nocapture` | 101 | ❌ fail | 890ms |
| 6 | `bash scripts/verify-m033-s04.sh` | 127 | ❌ fail | 39ms |


## Deviations

None.

## Known Issues

`cargo test -p meshc --test e2e_m033_s04 -- --nocapture` still fails with `no test target named e2e_m033_s04`, and `bash scripts/verify-m033-s04.sh` still fails with `No such file or directory`, because the S04 live-proof test target and verifier script are not present yet. Those are expected until T04 lands.

## Files Created/Modified

- `mesher/migrations/20260216120000_create_initial_schema.mpl`
- `compiler/meshc/src/migrate.rs`
- `compiler/meshc/tests/e2e.rs`
- `.gsd/KNOWLEDGE.md`
