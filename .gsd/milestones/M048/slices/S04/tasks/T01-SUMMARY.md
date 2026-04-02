---
id: T01
parent: S04
milestone: M048
provides: []
requires: []
affects: []
key_files: ["scripts/fixtures/m048-s04-cluster-decorators.mpl", "website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs", "tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json", "scripts/tests/verify-m048-s04-skill-contract.test.mjs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Scoped `cluster` highlighting to `@cluster`-anchored decorator captures instead of promoting `cluster` to a global keyword.", "Added dedicated fixture-specific range assertions in the retained TextMate/Shiki rail so decorator drift reports the exact file, case, and range."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`node --test website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` passed, `bash scripts/verify-m036-s01.sh` passed, and `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax` passed. `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs` fails intentionally because T03 has not yet implemented the Mesh skill contract rail."
completed_at: 2026-04-02T17:27:40.131Z
blocker_discovered: false
---

# T01: Added a shared `@cluster` fixture and decorator-only TextMate/Shiki parity checks without reserving bare `cluster`.

> Added a shared `@cluster` fixture and decorator-only TextMate/Shiki parity checks without reserving bare `cluster`.

## What Happened
---
id: T01
parent: S04
milestone: M048
key_files:
  - scripts/fixtures/m048-s04-cluster-decorators.mpl
  - website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs
  - tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json
  - scripts/tests/verify-m048-s04-skill-contract.test.mjs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Scoped `cluster` highlighting to `@cluster`-anchored decorator captures instead of promoting `cluster` to a global keyword.
  - Added dedicated fixture-specific range assertions in the retained TextMate/Shiki rail so decorator drift reports the exact file, case, and range.
duration: ""
verification_result: mixed
completed_at: 2026-04-02T17:27:40.133Z
blocker_discovered: false
---

# T01: Added a shared `@cluster` fixture and decorator-only TextMate/Shiki parity checks without reserving bare `cluster`.

**Added a shared `@cluster` fixture and decorator-only TextMate/Shiki parity checks without reserving bare `cluster`.**

## What Happened

Added a dedicated shared fixture for `@cluster`, `@cluster(3)`, and bare `cluster`, extended the retained TextMate/Shiki parity harness with range-specific decorator assertions and token-signature parity, and updated the VS Code/TextMate grammar with `@`-anchored decorator captures so only decorator-position `cluster` is highlighted specially. I also established the slice-level skill-contract test file early as an intentional failing placeholder because the slice verifier already references it before T03 lands the real Mesh skill-bundle contract.

## Verification

`node --test website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` passed, `bash scripts/verify-m036-s01.sh` passed, and `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax` passed. `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs` fails intentionally because T03 has not yet implemented the Mesh skill contract rail.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` | 0 | ✅ pass | 1878ms |
| 2 | `bash scripts/verify-m036-s01.sh` | 0 | ✅ pass | 4016ms |
| 3 | `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax` | 0 | ✅ pass | 2167ms |
| 4 | `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs` | 1 | ❌ fail | 1349ms |


## Deviations

Created `scripts/tests/verify-m048-s04-skill-contract.test.mjs` during T01 as an intentional failing placeholder because the slice verification contract already references that retained test on the first task. Also recorded the Neovim corpus-materialization gotcha in `.gsd/KNOWLEDGE.md` for T02.

## Known Issues

`scripts/tests/verify-m048-s04-skill-contract.test.mjs` intentionally fails until T03 refreshes `tools/skill/mesh/**`. The Neovim syntax rail also does not yet inspect `scripts/fixtures/m048-s04-cluster-decorators.mpl`; T02 must add that coverage.

## Files Created/Modified

- `scripts/fixtures/m048-s04-cluster-decorators.mpl`
- `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs`
- `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json`
- `scripts/tests/verify-m048-s04-skill-contract.test.mjs`
- `.gsd/KNOWLEDGE.md`


## Deviations
Created `scripts/tests/verify-m048-s04-skill-contract.test.mjs` during T01 as an intentional failing placeholder because the slice verification contract already references that retained test on the first task. Also recorded the Neovim corpus-materialization gotcha in `.gsd/KNOWLEDGE.md` for T02.

## Known Issues
`scripts/tests/verify-m048-s04-skill-contract.test.mjs` intentionally fails until T03 refreshes `tools/skill/mesh/**`. The Neovim syntax rail also does not yet inspect `scripts/fixtures/m048-s04-cluster-decorators.mpl`; T02 must add that coverage.
