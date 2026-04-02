# M048: Entrypoint Flexibility & Tooling Truth Reset

**Gathered:** 2026-04-01
**Status:** Ready for planning

## Project Description

This milestone resets the core toolchain and teaching surfaces so Mesh no longer treats `main.mpl` beside `mesh.toml` as the only valid executable layout, exposes explicit binary self-update commands, and aligns editor grammar plus init-time Mesh skills with the current clustered/runtime model.

It is the first milestone in a broader public-surface reset aimed at new evaluators. The point is not to make the repo look cleaner in the abstract. The point is to stop making Mesh feel more rigid, more stale, and more proof-maze-shaped than the language/runtime actually are.

## Why This Milestone

Right now the repo has a real mismatch:
- compiler, discovery, tests, LSP, editor root detection, and package surfaces still hardcode `main.mpl`
- `meshc` / `meshpkg` do not expose explicit binary self-update commands
- editor grammar and init-time Mesh skills lag the current `@cluster` and interpolation story

That means a user can hit unnecessary friction before they ever get to the stronger parts of the language. This milestone fixes the first-contact contract: project layout, toolchain lifecycle, editor feedback, and bundled AI guidance.

## User-Visible Outcome

### When this milestone is complete, the user can:

- keep `main.mpl` as the simple default or override the executable entry file from `mesh.toml` to something like `lib/start.mpl`
- run explicit `meshc update` and `meshpkg update` commands instead of rediscovering installer steps manually
- open Mesh code in the official VS Code extension or repo-owned Vim/Neovim surfaces and get truthful highlighting for `@cluster` plus both interpolation forms
- initialize or ask about Mesh through the bundled skill surfaces without getting stale pre-clustered or pre-reset guidance

### Entry point / environment

- Entry point: `meshc build`, `meshc test`, `meshc update`, `meshpkg update`, `meshc lsp`, VS Code extension, Neovim/Vim syntax, and the Mesh init-time skill bundle under `tools/skill/mesh/`
- Environment: local development, installed toolchain, editor host
- Live dependencies involved: existing release/install path for binary self-update; otherwise local repo/tooling surfaces only

## Completion Class

- Contract complete means: compiler, discovery, test, LSP, editor, and skill surfaces all honor the same default-plus-override executable-entry contract and current syntax/runtime teaching contract
- Integration complete means: one real non-`main.mpl` fixture project builds, tests, and analyzes cleanly while default `main.mpl` projects still work unchanged
- Operational complete means: installed `meshc` / `meshpkg` binaries can self-update through the existing release/install path without requiring manual reinstall instructions

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a Mesh project with an overridden entry file such as `lib/start.mpl` builds, tests, and resolves correctly while root-`main.mpl` projects still work unchanged
- editor/LSP and package/discovery surfaces agree on that entrypoint instead of treating root `main.mpl` as the only valid executable contract
- staged or installed `meshc` and `meshpkg` self-update through the existing release/install path with no parallel ad hoc updater story
- VS Code/Vim highlighting and the Mesh init-time skill bundle match the current `@cluster` and interpolation syntax truth instead of stale pre-reset guidance

## Risks and Unknowns

- `main.mpl` assumptions are duplicated across compiler build, project discovery, test runner, LSP analysis, editor root detection, scaffolding, and package publish/archive code — changing one seam but not the others would create a fake green contract
- binary self-update could drift from the installer/release proof path or platform-specific install assumptions if it invents a second distribution story
- syntax and skill fixes can drift again unless the milestone closes with one assembled verifier rather than disconnected sub-fixes

## Existing Codebase / Prior Art

- `compiler/meshc/src/main.rs` — current build path still hardcodes `main.mpl` as the executable entry point
- `compiler/meshc/src/discovery.rs` — project discovery and module naming still treat root `main.mpl` as the entry contract
- `compiler/meshc/src/test_runner.rs` — test execution still special-cases root `main.mpl`
- `compiler/mesh-lsp/src/analysis.rs` — project-root detection and entry recognition still look for `main.mpl`
- `compiler/mesh-pkg/src/scaffold.rs` — generated projects still assume root `main.mpl`
- `compiler/meshpkg/src/publish.rs` — package publish still special-cases root-level `.mpl` files such as `main.mpl`
- `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` — official TextMate grammar for VS Code and docs-side syntax parity
- `tools/editors/neovim-mesh/syntax/mesh.vim` and `tools/editors/neovim-mesh/lua/mesh.lua` — Vim/Neovim syntax plus root detection still tied to `main.mpl`
- `tools/skill/mesh/SKILL.md` and sub-skills — init-time Mesh skill bundle currently lacks a clustering-aware sub-skill and lags current language/runtime teaching

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R112 — advances the executable entrypoint contract from hardcoded root `main.mpl` to default-plus-override
- R113 — adds explicit binary self-update to the public toolchain contract
- R114 — aligns official editor grammar and init-time Mesh skills with current syntax/runtime truth

## Scope

### In Scope

- default-plus-override executable entrypoint support across compiler/discovery/test/LSP/editor/package surfaces
- explicit `meshc update` / `meshpkg update` binary self-update commands through the existing release/install path
- VS Code and Vim syntax parity for `@cluster` and both interpolation forms
- Mesh init-time skill updates so clustering and current syntax/runtime truth are taught accurately
- one assembled proof rail that closes the whole milestone instead of leaving separate partially trusted fixes

### Out of Scope / Non-Goals

- public docs, landing-page, and packages-site content reset beyond the minimum touchpoints needed to keep M048 truthful
- replacing `tiny-cluster/`, `cluster-proof/`, or `reference-backend/` as public teaching surfaces — that belongs to later milestones
- dual-database scaffold work, Mesher modernization, or Fly deployment proof for scaffolded apps
- pretending the exact future TOML key shape for entrypoint override is already product-final before slice planning validates it

## Technical Constraints

- keep `main.mpl` as the simple default; the new contract is default-plus-override, not mandatory configuration
- binary self-update must reuse the existing release/install contract rather than inventing a second distribution path
- M048 should improve evaluator-facing first-contact surfaces without turning into the full docs/website/example reset too early
- any package-surface change must preserve the current ability to publish/install library-style packages that do not need an executable entrypoint story

## Integration Points

- compiler build/discovery/test runner — executable entrypoint resolution
- LSP and editor roots — project detection plus entry recognition
- package publish/install surfaces — root-level source archive behavior and manifest parsing
- VS Code/TextMate and Vim/Neovim grammar tests — `@cluster` plus both interpolation forms
- installer/release surfaces — self-update must ride the same channel users already install from
- Mesh init-time skill bundle — clustering-aware language guidance and syntax/runtime truth

## Open Questions

- Exact manifest key for the entrypoint override — current thinking: preserve a simple optional override and decide the precise TOML spelling during slice planning rather than hardcoding it in milestone context
- How much executable-entry awareness package publishing should gain for non-executable packages — current thinking: keep library package behavior simple and scope the new contract to the surfaces that actually need an executable entrypoint
