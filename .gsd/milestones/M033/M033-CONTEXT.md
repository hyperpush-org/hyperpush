# M033: ORM Expressiveness & Schema Extras

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Project Description

M033 is the follow-on to M032. Its job is to strengthen Mesh's data layer against the real recurring pressure still visible in `mesher/`, not to reopen solved Mesh-language folklore or redesign the app.

The intended shape is now clearer than the draft:
- a **broader neutral core** for honestly reusable query/update/insert/select expression work
- that broader core should take the form of a **new expression DSL**, not just a few narrow helper methods
- **explicit Postgres extras** for behavior that is genuinely PG-specific
- a clean path for **SQLite extras later**, after this extension shape is proven

The user still does **not** want fake portability, does **not** want a PG-only trap, and does **not** want a purity chase. The target is pragmatic raw SQL / DDL reduction with a short justified keep-list, while keeping `mesher/` behaviorally stable and using it as the proof surface.

## Why This Milestone

M032 already did the cleanup pass that this work depends on: it retired stale workaround folklore, separated real Mesh/tooling blockers from real data-layer pressure, and left a short honest keep-list anchored in live Mesher files.

That means the remaining friction is no longer “Mesh cannot do this at the language level.” The remaining friction is that `Repo`, `Query`, and `Migration` still cannot honestly express several recurring shapes that `mesher/` already uses today: expression-heavy updates, JSONB-heavy read/write paths, parameterized select expressions, recurring subquery patterns, and partition lifecycle DDL.

This milestone needs to happen now because the repo already has a truthful pressure map. Leaving those boundaries as permanent app-local raw SQL / DDL after M032 would amount to knowingly preserving the next wave of dogfood pain instead of turning it into platform capability.

## User-Visible Outcome

### When this milestone is complete, the user can:

- rewrite a meaningful share of `mesher/storage/queries.mpl` and `mesher/storage/writer.mpl` from raw SQL to stronger Mesh data-layer surfaces without changing Mesher behavior
- manage Mesher's partitioned-events schema through honest migration / PG helper surfaces instead of the current `PARTITION BY` and partition-maintenance raw DDL keep-sites

### Entry point / environment

- Entry point: `mesher/` data layer, targeted compiler/runtime tests, and live Mesher flows against the rewritten storage paths
- Environment: local dev with a live Postgres database
- Live dependencies involved: PostgreSQL now; SQLite is a design constraint for later extras, not a live dependency for M033 closeout

## Completion Class

- Contract complete means: targeted compiler/runtime tests and milestone artifacts prove that the new neutral expression DSL covers the recurring honestly reusable cases, the PG extras cover the recurring PG-only families, and the retained raw SQL / DDL keep-list is short and justified
- Integration complete means: live Postgres-backed Mesher query, write, search, alert, and migration paths still work after the rewrites, with a meaningful share of the current `ORM boundary` and `PARTITION BY` keep-sites retired
- Operational complete means: real Postgres migration and partition lifecycle operations (create/list/drop) work against a live database and real catalogs, not just SQL builder snapshots; SQLite implementation is not required in this milestone

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a live Postgres-backed Mesher path can ingest and store events, upsert/query the affected issue and event data, and preserve the same user-visible behavior while the underlying storage code uses the new neutral expression DSL and explicit PG extras instead of today's recurring raw SQL
- a live Postgres-backed Mesher path can exercise the JSONB-heavy, search-heavy, and alert-rule write/read flows that currently sit on `ORM boundary` comments, with targeted runtime/e2e tests covering the new reusable query/update/insert/select surfaces underneath
- partition lifecycle work cannot be treated as done through mocks or SQL-string tests alone; the milestone must run create/list/drop partition behavior against a real Postgres database because catalog behavior and partition DDL are part of the truth surface

## Risks and Unknowns

- The new expression DSL could drift into a giant abstract ORM detached from real `mesher/` pressure — that would violate the dogfood-first bar and likely make the API worse rather than better
- A broader neutral core can easily blur the line between honest reusable behavior and PG-only behavior — if that line is wrong, the milestone recreates the fake-portability problem it was supposed to fix
- PG lifecycle helpers for partitions can easily hardcode the wrong abstraction boundary — if they leak into the neutral core, later SQLite extras may require backing out the design
- Aggressive rewrites in `mesher/` could accidentally change behavior, data shape, or operational signals — M033 is supposed to improve the platform underneath the app, not smuggle in product redesign
- A “retire everything” mentality would turn the milestone into a purity chase — the success bar remains a short justified keep-list, not zero raw SQL or zero raw DDL

## Existing Codebase / Prior Art

- `mesher/storage/queries.mpl` — the concentrated `ORM boundary` map for computed `ON CONFLICT` updates, function-valued insert/update expressions, parameterized select expressions, multi-subquery reads, full-text search, JSONB-heavy read/write paths, and partition cleanup helpers
- `mesher/storage/writer.mpl` — the insert-side JSONB extraction boundary and the storage-local dogfood surface that should benefit from stronger insert expressions
- `mesher/migrations/20260216120000_create_initial_schema.mpl` — the current migration-time `PARTITION BY` keep-site plus existing PG-specific extension/index prior art
- `compiler/mesh-rt/src/db/query.rs` — the current query surface already supports joins, raw where/select, and a limited subquery path; this is the starting point for the broader neutral expression DSL
- `compiler/mesh-rt/src/db/repo.rs` — the current insert/update/delete/upsert surfaces show the literal-field-map bias and the raw escape hatches M033 is meant to reduce
- `compiler/mesh-rt/src/db/migration.rs` — the current neutral migration baseline plus raw execute escape hatch; the obvious home for honest PG lifecycle helpers
- `.gsd/milestones/M032/M032-SUMMARY.md` — the authoritative handoff separating supported-now Mesh behavior from the real M033 data-layer boundary families

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R036 — advances the neutral-core-plus-explicit-extras contract by deciding that M033 should build a broader neutral core through a new expression DSL while keeping PG-only behavior explicit
- R037 — advances the PG-specific query/migration requirement by explicitly targeting JSONB-heavy paths, expression-heavy updates, full-text search, pgcrypto-adjacent helpers, and partition lifecycle work
- R038 — advances the pragmatic cleanup bar by aiming to retire a meaningful share of the current raw SQL / DDL sites while keeping a short justified keep-list
- R039 — advances migration and schema capability by requiring real partition lifecycle coverage instead of stopping at the current `PARTITION BY` raw DDL note
- R040 — advances the SQLite-path constraint by requiring M033's design to leave a clean extension path instead of baking PG assumptions into the wrong layer

## Scope

### In Scope

- build a broader neutral core for honestly reusable expression-heavy query/update/insert/select work, even if that requires a new expression DSL rather than only small helper additions
- cover the must-win neutral-core families now: expression-heavy updates/inserts, parameterized select expressions, and honest reusable subquery forms that retire recurring Mesher raw SQL
- cover JSONB-heavy data paths used in `mesher/` where the reusable part belongs in the broader neutral core and the PG-only part belongs in explicit extras
- add explicit PG extras for the real recurring PG-only families: full-text search, pgcrypto-adjacent helpers, partition lifecycle helpers, and other genuinely PG-specific behavior
- add PG lifecycle helpers for partition work all the way through the real create/list/drop path, while keeping truly dynamic escape hatches explicit when necessary
- clean up the small sharp gaps that are cheap and honest to solve during this wave, such as `now()`-driven updates and other narrow recurring storage edges
- rewrite a meaningful share of the current `mesher/storage/queries.mpl` and `mesher/storage/writer.mpl` raw SQL sites onto the stronger surfaces while keeping Mesher behavior stable
- keep docs dogfood-first: public docs/examples should stay truthful and not drift, but M033 is not primarily a docs milestone

### Out of Scope / Non-Goals

- fake portability that hides PG-only behavior inside a misleading neutral API
- a PG-only trap that makes future SQLite extras awkward or forces a later redesign
- raw-SQL purity or near-zero raw DDL as the goal
- product redesign in `mesher/`
- a giant abstract ORM disconnected from the actual recurring Mesher pressure map
- full SQLite-specific extras in this milestone
- a broad public-docs push beyond light truth-sync needed to keep the new surfaces legible

## Technical Constraints

- The broader neutral core is allowed to be ambitious, but it still has to be justified by recurring real Mesher pressure rather than abstraction for its own sake
- Vendor-specific behavior must stay explicit where the capability is not honestly portable, especially around JSONB, full-text search, pgcrypto, partition lifecycle, and catalog behavior
- `mesher/` should remain behaviorally stable from the product point of view while the platform underneath it improves
- M033 must leave a clean SQLite extension path even though SQLite extras themselves are deferred
- Acceptance has to include live Postgres proof, not compile-only proof, SQL-string snapshots alone, or comment-level cleanup alone
- Truly dynamic or rare catalog behavior may remain an explicit escape hatch if a first-class surface would be dishonest or too specific

## Integration Points

- `mesher/` — primary proof surface and the main consumer of the stronger data-layer surfaces
- `compiler/mesh-rt/src/db/query.rs` — neutral query/expression surface to expand
- `compiler/mesh-rt/src/db/repo.rs` — neutral insert/update/delete/upsert surface to expand or reshape around the new expression DSL
- `compiler/mesh-rt/src/db/migration.rs` — migration baseline plus explicit PG lifecycle helper surface
- PostgreSQL — required live integration target for JSONB, `ON CONFLICT`, `now()`, full-text search, pgcrypto, partitioned tables, and catalog-backed partition lifecycle behavior
- Mesh compiler/runtime tests — required lower-level proof surface for the new neutral DSL and explicit PG helpers
- SQLite — not a live M033 target, but the boundary decisions here must preserve a credible later explicit-extras path

## Open Questions

- How far the first neutral expression DSL pass should go on the hardest multi-derived-table / multi-scalar-subquery read shapes in `mesher/storage/queries.mpl` — current thinking: cover the recurring shapes that retire multiple real Mesher sites, but stop before inventing a fake universal SQL AST
- Whether any truly dynamic partition/catalog maintenance beyond the common create/list/drop path should stay as explicit raw SQL after PG lifecycle helpers land — current thinking: the helpers should own the common Mesher path, and rare catalog-specific operations can remain raw if the abstraction starts lying
