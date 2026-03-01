---
phase: 142-update-docs-page-with-changes-additions-from-v14
plan: "02"
subsystem: documentation
tags: [docs, tooling, http-client, testing, stdlib, cheatsheet]
dependencies:
  requires: []
  provides:
    - tooling/index.md with meshc test and meshpkg sections
    - web/index.md with v14 HTTP Client fluent builder documentation
    - cheatsheet/index.md with Testing and Standard Library sections
  affects:
    - website/docs/docs/tooling/index.md
    - website/docs/docs/web/index.md
    - website/docs/docs/cheatsheet/index.md
tech-stack:
  added: []
  patterns:
    - Markdown documentation with fenced code blocks
    - VitePress-compatible link references
key-files:
  modified:
    - website/docs/docs/tooling/index.md
    - website/docs/docs/web/index.md
    - website/docs/docs/cheatsheet/index.md
decisions:
  - "HTTP Client docs use lowercase Http.* for v14 fluent builder and uppercase HTTP.* for legacy single-call API — critical naming distinction documented explicitly"
  - "meshpkg section placed as its own H2 alongside Test Runner rather than under Package Manager — separate binary warrants top-level section"
  - "Cheatsheet appends after Operators table rather than inserting mid-file — preserves existing section ordering"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-01"
  tasks_completed: 3
  files_modified: 3
---

# Phase 142 Plan 02: Documentation Updates for v14 Additions Summary

Three existing documentation pages updated to reflect v14.0 additions: meshc test runner and meshpkg CLI added to tooling page, HTTP Client section of web page expanded to cover the v14 fluent builder API (Http.build/send/stream/client), and Testing plus Standard Library quick-reference sections appended to the cheatsheet.

## Tasks Completed

| # | Task | Commit | Files Modified |
|---|------|--------|----------------|
| 1 | Add meshc test and meshpkg sections to tooling page | 7b7a4b11 | website/docs/docs/tooling/index.md |
| 2 | Expand HTTP Client section in web page to v14 fluent builder | a73ca620 | website/docs/docs/web/index.md |
| 3 | Add Testing and Standard Library sections to cheatsheet | 2f7f51d1 | website/docs/docs/cheatsheet/index.md |

## What Was Built

### tooling/index.md

Three targeted changes to bring the tooling page current with v14.0:

1. **## Test Runner section** inserted after Package Manager, before Language Server:
   - `meshc test .` and `meshc test path/to/dir/` usage examples
   - Sample pass/fail output showing test name format and failure messages
   - Note that non-zero exit code makes it suitable for CI
   - Link to Testing guide for full assertion API

2. **## meshpkg — Package Registry CLI section** inserted after Test Runner:
   - Authentication: `meshpkg login` + `~/.mesh/credentials`
   - Publishing: `meshpkg publish` with explanation of tarball + SHA-256 + HTTP 409 on duplicate
   - Installing: `meshpkg install some_pkg` with checksum verification + lockfile update
   - Searching: `meshpkg search json`
   - mesh.toml registry dependency format (name = "1.0.0", path, git all shown)
   - Link to packages.meshlang.dev

3. **Tool Summary table** updated with two new rows: Test Runner (`meshc test [dir]`) and Package CLI (`meshpkg <command>`)

4. **Next Steps** updated to include Testing and Standard Library links

### web/index.md

HTTP Client section expanded from a single `HTTP.get` example to comprehensive v14 fluent builder documentation:

- **Fluent Builder subsection**: `Http.build` → `Http.header` → `Http.timeout` → `Http.send` chain with API table
- **POST Requests subsection**: `Http.build(:post, ...)` with `Http.body` for JSON payloads
- **Streaming subsection**: `Http.stream` callback pattern, "ok"/"stop" return convention
- **Keep-Alive Client subsection**: `Http.client()` + `Http.send_with` + `Http.client_close` with API table
- **Legacy Single-Call API subsection**: preserves `HTTP.get` (uppercase) as the old form with recommendation to prefer `Http.build`
- Critical naming distinction called out at section opening: lowercase `Http` (client) vs uppercase `HTTP` (server)

### cheatsheet/index.md

Two new sections appended after the Operators table (no existing content modified):

- **## Testing section**: `test/describe/setup/teardown` blocks, all five assertion functions (`assert`, `assert_eq`, `assert_ne`, `assert_raises`, `assert_receive`), actor messaging with `assert_receive`, `Test.mock_actor` usage; assertion quick-reference table; link to Testing guide
- **## Standard Library section**: Crypto (sha256, sha512, hmac_sha256, secure_compare, uuid4), Base64 (encode/decode/encode_url), Hex (encode/decode), DateTime (utc_now, to_iso8601, to_unix_ms, from_iso8601, add, diff, is_before, is_after); link to stdlib guide

## Verification Results

All 9 plan verification checks passed:

1. `meshc test` — 6 occurrences in tooling/index.md (section heading, bash examples, tool summary)
2. `meshpkg` — present in tooling/index.md
3. `Http.build` — present in web/index.md
4. `Http.stream` — present in web/index.md
5. `## HTTP Client` — section present in web/index.md
6. `What's Next` — final section preserved in web/index.md
7. `assert_eq` — present in cheatsheet/index.md
8. `Crypto.sha256` — present in cheatsheet/index.md
9. `DateTime.utc_now` — present in cheatsheet/index.md

## Deviations from Plan

None — plan executed exactly as written. All three files were updated with the exact content specified in the plan, no structural changes required.

## Self-Check: PASSED

- FOUND: website/docs/docs/tooling/index.md
- FOUND: website/docs/docs/web/index.md
- FOUND: website/docs/docs/cheatsheet/index.md
- FOUND commit: 7b7a4b11 (Task 1)
- FOUND commit: a73ca620 (Task 2)
- FOUND commit: 2f7f51d1 (Task 3)
