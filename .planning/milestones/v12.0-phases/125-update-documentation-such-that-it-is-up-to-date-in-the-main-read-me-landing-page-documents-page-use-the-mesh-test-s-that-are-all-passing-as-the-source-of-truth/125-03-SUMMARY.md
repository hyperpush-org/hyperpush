---
phase: 125-update-docs
plan: 03
subsystem: documentation
tags: [docs, cheatsheet, getting-started, language-basics, v12.0, interpolation, heredoc, slot-pipe]

# Dependency graph
requires:
  - phase: 116-slot-pipe
    provides: slot pipe |N> operator implementation
  - phase: 117-hash-interpolation
    provides: #{} interpolation syntax
  - phase: 118-env-module
    provides: Env.get and Env.get_int builtins
  - phase: 119-regex
    provides: ~r// regex literals and Regex module

provides:
  - Cheatsheet accurate for v12.0 with #{}, heredoc, slot pipe, Env, Regex, and corrected operators
  - Getting-started guide updated to prefer #{} and note both syntaxes are valid
  - Language-basics guide with Heredoc Strings subsection and Slot Pipe Operator subsection

affects: [future-docs, website, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "v12.0 docs: #{} presented as preferred interpolation, ${} noted as also valid"
    - "New features documented in both dedicated subsections (language-basics) and cheatsheet quick-reference"

key-files:
  created: []
  modified:
    - website/docs/docs/cheatsheet/index.md
    - website/docs/docs/getting-started/index.md
    - website/docs/docs/language-basics/index.md

key-decisions:
  - "Cheatsheet String Features section added (not just row updates) to consolidate heredoc, regex, and env examples in one scannable block"
  - "getting-started: #{} shown first in bullet, ${} noted as 'also valid' — matches v12.0 preference without breaking existing user expectations"
  - "language-basics: Heredoc Strings added as standalone subsection after String Interpolation, not merged into it"
  - "Operators table: split 'String concat ++' into two rows (String concat <>, List concat ++) to fix the factual error"

patterns-established:
  - "Use passing e2e tests as authoritative source for syntax examples — no guessing at operator names or behavior"

requirements-completed: [DOC-01]

# Metrics
duration: 1min
completed: 2026-02-27
---

# Phase 125 Plan 03: Cheatsheet and Language Guides v12.0 Update Summary

**Cheatsheet, getting-started, and language-basics updated for v12.0 with #{} interpolation, heredoc strings, slot pipe |N>, Env/Regex APIs, and the string concat operator corrected from ++ to <>**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-27T17:48:57Z
- **Completed:** 2026-02-27T17:50:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Cheatsheet: added String Features section with heredoc, regex literals, and Env.get/get_int examples; fixed Operators table (++ was mislabeled "String concat" — corrected to "List concat", added "String concat <>", added "Slot pipe |N>"); updated Basics table with both interpolation syntaxes and heredoc entry; added slot pipe example to Functions section
- Getting-started: updated interpolation bullet to show #{} as primary and note ${} is also valid
- Language-basics: updated String Interpolation subsection text and examples to use #{} (preferred, v12.0); added Heredoc Strings subsection with triple-quote syntax example; added Slot Pipe Operator subsection under Pipe Operator section

## Task Commits

Each task was committed atomically:

1. **Task 1: Update cheatsheet with #{}, slot pipe, regex, env, and correct operators** - `b3e9c4cd` (feat)
2. **Task 2: Update getting-started and language-basics with #{} interpolation notes** - `9327a126` (feat)

## Files Created/Modified
- `website/docs/docs/cheatsheet/index.md` - Added String Features section, fixed Operators table, added slot pipe to Functions
- `website/docs/docs/getting-started/index.md` - Updated interpolation bullet to prefer #{} and note both syntaxes
- `website/docs/docs/language-basics/index.md` - Updated String Interpolation, added Heredoc Strings and Slot Pipe Operator subsections

## Decisions Made
- Cheatsheet String Features section added as a new heading block (not just row edits) — groups heredoc, regex, and env together for quick scanning
- getting-started bullet changed to "#{name}" as primary with "${} also works" — does not break existing user code, just updates preferred style
- Operators table factual error fixed: `++` was labeled "String concat" but is the list append operator; `<>` is correct string concat operator (verified from e2e tests: gc_bounded_memory.mpl and list_concat.mpl)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three documentation files now reflect v12.0 language features accurately
- Cheatsheet serves as the primary quick reference; language-basics has full subsections for deep dives
- No blockers for subsequent documentation phases

---
*Phase: 125-update-docs*
*Completed: 2026-02-27*

## Self-Check: PASSED

- FOUND: website/docs/docs/cheatsheet/index.md
- FOUND: website/docs/docs/getting-started/index.md
- FOUND: website/docs/docs/language-basics/index.md
- FOUND: 125-03-SUMMARY.md
- FOUND commit: b3e9c4cd (Task 1)
- FOUND commit: 9327a126 (Task 2)
