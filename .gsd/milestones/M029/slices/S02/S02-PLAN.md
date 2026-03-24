# S02: Mesher JSON serialization and pipe cleanup

**Goal:** Replace Mesher's remaining non-SQL JSON/string `<>` chains and wrapping `List.map(rows, ...)` survivors with idiomatic `json {}`, `#{}` interpolation, and pipe style without changing JSON payload types.
**Demo:** `mesher/api/alerts.mpl`, `mesher/api/detail.mpl`, `mesher/api/search.mpl`, and `mesher/storage/queries.mpl` use interpolation or `json {}` where appropriate, only the designated SQL/DDL `<>` sites remain, the wrapping `List.map(rows, ...)` pattern is gone, and `meshc build mesher` still passes.

## Must-Haves

- Remaining non-SQL `<>` sites in `mesher/api/alerts.mpl`, `mesher/api/detail.mpl`, `mesher/api/search.mpl`, and the two non-SQL token builders in `mesher/storage/queries.mpl` are rewritten to `json {}` or `#{}` interpolation with JSON types preserved.
- The four wrapping `Ok(List.map(rows, ...))` returns in `mesher/storage/queries.mpl` are converted to idiomatic pipe style, and the authoritative grep `rg -n 'List\.map\(rows,|Ok\(List\.map\(' mesher -g '*.mpl'` returns 0.
- The slice stays dogfood-driven: it touches only the real Mesher friction sites from S02 research, and it leaves the designated SQL/DDL `<>` keep sites in `mesher/storage/schema.mpl` and `mesher/storage/queries.mpl` unchanged.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `cargo run -q -p meshc -- build mesher`
- `! rg -n '<>' mesher/api/alerts.mpl mesher/api/detail.mpl mesher/api/search.mpl`
- `diff -u <(rg -n '<>' mesher -g '*.mpl' | cut -d: -f1-2 | sort) <(printf '%s\n' mesher/storage/queries.mpl:486 mesher/storage/queries.mpl:787 mesher/storage/schema.mpl:11 mesher/storage/schema.mpl:12 mesher/storage/schema.mpl:13)`
- `! rg -n 'List\.map\(rows,|Ok\(List\.map\(' mesher -g '*.mpl'`

## Observability / Diagnostics

- Runtime signals: none added; the truth surface is compiler success plus exact-location grep proofs.
- Inspection surfaces: `cargo run -q -p meshc -- build mesher`, the targeted API `<>` grep for `mesher/api/alerts.mpl`, `mesher/api/detail.mpl`, and `mesher/api/search.mpl`, the repo-wide `<>` diff against the five designated keep sites, and the zero-match wrapping-map grep.
- Failure visibility: build errors expose syntax/type drift; the targeted API grep exposes accidental serializer concatenation survivors in T01 scope; the `<>` diff exposes accidental new concatenation sites slice-wide; the wrapping-map grep exposes non-idiomatic `List.map(rows, ...)` survivors.
- Redaction constraints: none beyond normal repo hygiene; this slice should not introduce secret-bearing output.

## Integration Closure

- Upstream surfaces consumed: `mesher/storage/queries.mpl` row shapes, `mesher/api/helpers.mpl`, and existing Mesher interpolation patterns in API and ingestion code.
- New wiring introduced in this slice: none; this is local serializer/query cleanup within existing Mesher HTTP and storage modules.
- What remains before the milestone is truly usable end-to-end: S03 multiline import adoption and final formatter compliance across `mesher/` and `reference-backend/`.

## Tasks

- [x] **T01: Rewrite API serializers with type-preserving JSON and interpolation** `est:1h`
  - Why: The highest-risk cleanup is in the alert/detail/search helpers, where raw JSONB fields and scalar text fields are mixed and a naive `json {}` rewrite would silently quote the wrong values.
  - Files: `mesher/api/alerts.mpl`, `mesher/api/detail.mpl`, `mesher/api/search.mpl`
  - Do: Replace the remaining `<>` JSON assembly in the three API files using `json {}` only where values are true scalar/option payloads and `#{}` interpolation where query rows already carry raw JSON text, preserving nullable timestamp/id handling, pagination cursor fields, nested prebuilt JSON, and the dynamic tag JSON key path.
  - Verify: `! rg -n '<>' mesher/api/alerts.mpl mesher/api/detail.mpl mesher/api/search.mpl && cargo run -q -p meshc -- build mesher`
  - Done when: The three API files have zero `<>` sites, raw JSON fragments stay unquoted where intended, and `meshc build mesher` still passes.
- [ ] **T02: Convert storage helpers to pipe style and close the slice proofs** `est:45m`
  - Why: The remaining wrapping `List.map(rows, ...)` survivors and non-SQL token concatenations all live in `mesher/storage/queries.mpl`, so finishing that file provides the final repo-wide proof for R024 without widening scope.
  - Files: `mesher/storage/queries.mpl`, `mesher/storage/schema.mpl`
  - Do: Rewrite the four wrapping `Ok(List.map(rows, ...))` returns to match Mesher's existing pipe style, replace the two non-SQL token concatenations with interpolation, leave the SQL/DDL `<>` keep sites untouched, and rerun the exact-location `<>` diff plus the authoritative wrapping-map grep as the slice closeout gate.
  - Verify: `cargo run -q -p meshc -- build mesher && diff -u <(rg -n '<>' mesher -g '*.mpl' | cut -d: -f1-2 | sort) <(printf '%s\n' mesher/storage/queries.mpl:486 mesher/storage/queries.mpl:787 mesher/storage/schema.mpl:11 mesher/storage/schema.mpl:12 mesher/storage/schema.mpl:13) && ! rg -n 'List\.map\(rows,|Ok\(List\.map\(' mesher -g '*.mpl'`
  - Done when: Only the five designated `<>` keep sites remain repo-wide, the wrapping-map grep returns 0, and `meshc build mesher` still passes.

## Files Likely Touched

- `mesher/api/alerts.mpl`
- `mesher/api/detail.mpl`
- `mesher/api/search.mpl`
- `mesher/storage/queries.mpl`
