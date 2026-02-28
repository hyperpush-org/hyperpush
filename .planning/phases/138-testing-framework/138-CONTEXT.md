# Phase 138: Testing Framework - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Mesh developers can write `*.test.mpl` files with assertion helpers, grouping (describe/setup/teardown), mock actors, and message assertions, then run all tests via `meshc test` and see a pass/fail summary. Creating posts/interactions, coverage reporting depth, watch mode, and benchmarking are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Test output style
- Default mode is verbose: each test printed by name as it runs (`✓ User.greet returns hello` / `✗ User.greet handles nil`)
- `--quiet` flag switches to compact dots mode (`.` for pass, `F` for fail)
- Colors always enabled (green ✓, red ✗, red-highlighted values in failure messages) — no TTY detection
- Failures print inline as they happen (expression + expected/actual values), then a summary of all failures is reprinted at the bottom after the run
- Final summary line format: `3 passed, 1 failed in 0.42s`

### meshc test CLI options
- File path filter: `meshc test path/to/file.test.mpl` runs only that file; no name-based filtering
- Test file discovery: recursive from project root, finds all `*.test.mpl` files
- `--coverage` flag: accepted, prints "Coverage reporting coming soon" and exits cleanly
- No `--watch` mode in this phase

### Test file conventions
- Every test must be inside a named `test "description" do ... end` block — no bare top-level assertions
- `test` blocks can appear at the top level of a file OR inside a `describe` block; both are valid
- `describe "..." do ... end` groups tests: group name prefixes test name in output
- No header or import needed — `.test.mpl` extension signals the compiler to enable the test DSL
- `setup do ... end` and `teardown do ... end` inside a `describe` run before/after **each** test in that group (per-test scope, not once-per-describe)

### Mock actors and assert_receive
- `Test.mock_actor(fn msg -> ... end)` creates an isolated actor; unhandled messages are silently ignored
- Test isolation: before each test, named actors registered during the previous test are killed/unregistered — clean actor registry per test
- `assert_receive pattern, timeout_ms` uses Mesh pattern syntax (wildcards, tuples, etc.), consistent with the rest of the language
- Default timeout when omitted: 100ms; override with explicit second argument
- Timeout failure reports the pattern and elapsed time

### Claude's Discretion
- Exact ANSI color codes and formatting details
- Internal mechanism for per-test actor registry cleanup
- How `assert_raises fn` reports the raised value vs expected
- Exact progress output during compilation phase before tests run

</decisions>

<specifics>
## Specific Ideas

- No specific references provided — open to standard ExUnit/pytest-style approaches for formatting and output structure

</specifics>

<deferred>
## Deferred Ideas

- `--watch` mode (re-run tests on file change) — future phase
- Coverage reporting beyond stub — future phase
- `setup_all` / `teardown_all` (once per describe block) — could be added later if needed
- Name-based test filtering (`--name "greet"`) — future enhancement

</deferred>

---

*Phase: 138-testing-framework*
*Context gathered: 2026-02-28*
