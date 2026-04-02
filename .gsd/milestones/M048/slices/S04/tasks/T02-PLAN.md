---
estimated_steps: 4
estimated_files: 4
skills_used:
  - neovim
  - test
---

# T02: Extend the Neovim syntax rail and docs for `@cluster` decorator truth

**Slice:** S04 — Syntax and init-skill parity reset
**Milestone:** M048

## Description

Carry the same decorator contract through the repo-owned Neovim pack without regressing S02’s manifest-first editor-host rail. This task reuses T01’s shared fixture, adds classic Vim syntax rules for `@cluster` / `@cluster(3)`, extends the headless smoke, and keeps the Neovim README plus its contract test truthful about the bounded syntax surface.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `tools/editors/neovim-mesh/syntax/mesh.vim` | Fail the syntax smoke with the exact line/column and Neovim synstack output; do not hide drift behind README claims. | N/A for local syntax matching. | Treat decorator hits that map to `meshVariable` or bare identifiers that map to decorator groups as contract failure. |
| `tools/editors/neovim-mesh/tests/smoke.lua` | Stop the headless verifier on the first missing group and print `names_text(...)` output for the failing probe. | Keep the failing phase name and log path visible through `scripts/verify-m036-s02.sh`. | Reject missing fixture probes, wrong filetype, or missing `mesh` syntax as proof failure. |
| `tools/editors/neovim-mesh/README.md` + `scripts/tests/verify-m036-s02-contract.test.mjs` | Fail if the documented bounded syntax surface drifts away from what the smoke actually proves. | N/A for local docs/tests. | Treat stale interpolation-only wording or missing `@cluster` proof references as docs-contract drift. |

## Load Profile

- **Shared resources**: one headless Neovim process, the materialized interpolation corpus, and the dedicated `@cluster` fixture.
- **Per-operation cost**: one `nvim --headless` startup plus synstack probes over a handful of positions.
- **10x breakpoint**: syntax-group ambiguity and README/contract drift fail long before CPU or memory matter, so the task should maximize debuggable probe output instead of caching.

## Negative Tests

- **Malformed inputs**: probe `@cluster`, `@cluster(3)`, and plain `cluster` identifier positions from the shared fixture.
- **Error paths**: fail on wrong `filetype`, missing `b:current_syntax`, missing probe file, or a decorator probe that lacks a `meshCluster`-prefixed group.
- **Boundary conditions**: keep the interpolation corpus loop intact and add the decorator probe after it so S02’s manifest-first syntax rail stays live.

## Steps

1. Use `scripts/fixtures/m048-s04-cluster-decorators.mpl` from T01 as the single decorator oracle for Neovim too.
2. Update `tools/editors/neovim-mesh/syntax/mesh.vim` to add decorator-position highlight groups for `@cluster` / `@cluster(N)` without globally reserving bare `cluster`.
3. Extend `tools/editors/neovim-mesh/tests/smoke.lua` so the syntax phase opens the shared fixture after the interpolation corpus loop and asserts decorator/bare-identifier groups via the existing helper functions and synstack diagnostics.
4. Update `tools/editors/neovim-mesh/README.md` and `scripts/tests/verify-m036-s02-contract.test.mjs` so the documented bounded syntax surface mentions both interpolation and `@cluster` decorator proof.

## Must-Haves

- [ ] `tools/editors/neovim-mesh/syntax/mesh.vim` scopes `@cluster` / `@cluster(3)` specially and leaves bare `cluster` as an identifier.
- [ ] The headless smoke probes the shared fixture after the interpolation corpus loop and prints synstack context on drift.
- [ ] The Neovim README plus `scripts/tests/verify-m036-s02-contract.test.mjs` describe the actual verified syntax surface.
- [ ] `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax` and `node --test scripts/tests/verify-m036-s02-contract.test.mjs` pass.

## Verification

- `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax`
- `node --test scripts/tests/verify-m036-s02-contract.test.mjs`

## Observability Impact

- Signals added/changed: the headless Neovim smoke emits decorator probe line/column plus `names_text(...)` output, and the docs contract test names the missing README/runtime expectation directly.
- How a future agent inspects this: rerun `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax` and inspect `.tmp/m036-s02/syntax/`; rerun `node --test scripts/tests/verify-m036-s02-contract.test.mjs` for README/runtime drift.
- Failure state exposed: syntax-group mismatch, wrong filetype/syntax attach, or stale README contract wording is attributed to the exact file and probe.

## Inputs

- `scripts/fixtures/m048-s04-cluster-decorators.mpl` — shared decorator fixture produced by T01.
- `tools/editors/neovim-mesh/syntax/mesh.vim` — current classic syntax file that lacks decorator-position `@cluster` matching.
- `tools/editors/neovim-mesh/tests/smoke.lua` — retained headless smoke that currently proves interpolation but not decorator syntax.
- `tools/editors/neovim-mesh/README.md` — public Neovim pack contract that must stay truthful about the bounded proof surface.
- `scripts/tests/verify-m036-s02-contract.test.mjs` — contract test that keeps the README/runtime/smoke assertions synchronized.
- `scripts/verify-m036-s02.sh` — the only retained entrypoint for the Neovim syntax/lsp proof chain.

## Expected Output

- `tools/editors/neovim-mesh/syntax/mesh.vim` — classic Vim syntax rules for decorator-position `@cluster` / `@cluster(N)`.
- `tools/editors/neovim-mesh/tests/smoke.lua` — headless syntax smoke extended with decorator and bare-identifier probes.
- `tools/editors/neovim-mesh/README.md` — bounded syntax surface updated to mention interpolation plus `@cluster` proof.
- `scripts/tests/verify-m036-s02-contract.test.mjs` — Neovim docs/runtime contract assertions updated for the new syntax scope.
