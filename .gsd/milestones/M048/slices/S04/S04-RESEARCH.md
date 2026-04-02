# S04 Research — Syntax and init-skill parity reset

**Researched:** 2026-04-02  
**Status:** Ready for planning

## Summary

- **Primary requirement:** `R114` — official editor grammar and init-time Mesh skills must reflect current syntax/runtime truth.
- **Guardrail:** `R112` is not owned by S04, but the existing Neovim syntax verifier piggybacks on S02’s manifest-first LSP/root proof. Syntax work should extend that shared rail without regressing it.
- Existing interpolation proof is already healthy and passing. I ran both retained syntax rails unchanged on this checkout:
  - `bash scripts/verify-m036-s01.sh` ✅
  - `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax` ✅
  S04 does **not** need a new interpolation verifier; it needs to add `@cluster` coverage to the existing ones.
- The shared VS Code/docs grammar does **not** recognize `@cluster` today. A local TextMate probe against `@cluster pub fn add() -> Int do` and `@cluster(3) pub fn retry() -> Int do` produced:
  - `@` → plain `source.mesh`
  - `cluster` → `variable.other.mesh`
  - `3` → `constant.numeric.integer.mesh`
  So VS Code/docs currently treat the decorator keyword as an identifier.
- Neovim classic syntax has the same gap. `tools/editors/neovim-mesh/syntax/mesh.vim` has interpolation regions and generic declaration keywords, but no decorator-position rule for `@cluster` / `@cluster(N)`.
- The Mesh skill bundle is missing the current clustered/runtime story entirely. `rg -n -e '@cluster' -e 'HTTP\\.clustered' -e 'Node\\.start_from_env' -e 'meshc init --clustered' -e 'meshc cluster status' tools/skill/mesh` returned no matches. The auto-loaded top-level Mesh skill, `skills/syntax`, and `skills/http` all omit the source-first clustered contract.
- The current HTTP skill is stale-by-emphasis for first-contact guidance: it documents `HTTP.route(...)` only, but never mentions `HTTP.on_get` / `HTTP.on_post` / `HTTP.on_put` / `HTTP.on_delete` or `HTTP.clustered(...)`, even though the shipped scaffold/docs use those forms.

## Requirement Focus

### Primary
- **R114** — align official editor grammar and init-time Mesh skills with current syntax/runtime truth.

### Guardrail / supporting
- **R112** — existing Neovim verification reuses the S02 manifest-first LSP/root contract, so syntax changes should preserve that shared proof path.

## Skill Notes

Relevant loaded-skill guidance that should shape implementation:

- From **`vscode-extension-expert`**:
  - Syntax highlighting truth should be asserted against the contributed grammar file itself when possible; VS Code extension-host tests are better reserved for runtime/editor integration behavior.
  - For this slice, `tools/editors/vscode-mesh/package.json` already just contributes `./syntaxes/mesh.tmLanguage.json`, so grammar proof does not require extension-runtime changes.
- From **`neovim`**:
  - Keep the repo-owned pack minimal and truthful; syntax work should stay inside `syntax/mesh.vim` plus the headless smoke path, not invent a second editor abstraction.
- From **`create-skill`**:
  - `SKILL.md` is always loaded, so clustered/runtime truth cannot live only in a deep HTTP note.
  - The top-level Mesh skill needs at least a routed overview, and the deeper clustered story belongs in a dedicated sub-skill or clearly linked sections.

## Skills Discovered

Existing installed skills already cover the core tech for this slice; no extra install is needed.

- `vscode-extension-expert`
- `neovim`
- `create-skill`

I also ran `npx skills find "TextMate grammar"`; it did not surface a directly relevant high-signal skill worth installing for this slice.

## Implementation Landscape

### 1. Shared VS Code/docs grammar is the VS Code syntax seam; extension TS is not

Relevant files:
- `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json`
- `tools/editors/vscode-mesh/package.json`
- `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs`
- `scripts/verify-m036-s01.sh`

Current state:
- `package.json` simply contributes the grammar JSON under `contributes.grammars`; there is no extension-side TypeScript logic for syntax highlighting.
- `mesh.tmLanguage.json` contains no `cluster`-specific syntax rule at all.
- The existing shared grammar proof is interpolation-only. `verify-m036-s01-syntax-parity.test.mjs` scans the audited interpolation corpus and compares TextMate vs Shiki scopes; it never probes decorators.

Important constraint:
- Do **not** solve this by adding bare `cluster` to the generic declaration-keyword regex. The parser only treats `cluster` specially after `@`; a bare identifier named `cluster` should stay an identifier.
- The grammar needs decorator-position matching anchored on `@`, plus a negative test that `let cluster = 1` is still unreserved.

Natural seam:
- Extend the existing `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` with a **dedicated cluster-decorator fixture/probe**.
- Keep the audited interpolation corpus unchanged. That avoids rippling:
  - `scripts/fixtures/m036-s01-syntax-corpus.json`
  - `scripts/tests/verify-m036-s02-materialize-corpus.mjs`
  - `scripts/tests/verify-m036-s02-materialize-corpus.test.mjs`
  - exact corpus-count assertions (`15` cases today)

Recommended fixture shape:
- one new `.mpl` file under `scripts/fixtures/` with:
  - `@cluster pub fn add() -> Int do`
  - `@cluster(3) pub fn retry() -> Int do`
  - one bare `let cluster = ...` negative case
- The TextMate/Shiki test should assert:
  - decorator-position `cluster` is keyword/decorator-scoped
  - explicit count stays numeric
  - bare `cluster` stays identifier-scoped

### 2. Neovim already has the right verification wrapper; only the syntax file + smoke need extension

Relevant files:
- `tools/editors/neovim-mesh/syntax/mesh.vim`
- `tools/editors/neovim-mesh/tests/smoke.lua`
- `tools/editors/neovim-mesh/tests/syntax_smoke.lua`
- `scripts/verify-m036-s02.sh`

Current state:
- `syntax/mesh.vim` defines interpolation regions and generic declaration keywords, but no rule for `@cluster` / `@cluster(N)`.
- `smoke.lua` syntax phase is interpolation-specific:
  - it loads the materialized interpolation corpus from `MESH_NVIM_CASES_JSON`
  - it searches only for `#{` / `${`
  - it never probes decorator syntax
- `scripts/verify-m036-s02.sh syntax` already passed on this checkout, so the existing interpolation path is healthy.

Important constraint:
- Like the shared TextMate grammar, Neovim should not globally reserve bare `cluster`. Add decorator-position matches, not a blanket keyword-list change.

Natural seam:
- Reuse the existing syntax-phase helpers in `smoke.lua` (`syntax_info`, `has_group_prefix`, `names_text`) and add a second, direct `@cluster` probe step after the interpolation corpus loop.
- Use the same new repo fixture suggested above instead of widening the materialized JSON corpus contract. That keeps `verify-m036-s02-materialize-corpus.*` and the exact-count/materializer tests untouched.

Blast radius note:
- `tools/editors/neovim-mesh/README.md` and `scripts/tests/verify-m036-s02-contract.test.mjs` currently describe the syntax proof in interpolation-only terms.
- If S04 wants the README to advertise `@cluster` explicitly, update both together.
- If S04 stays tight and leaves README wording as a bounded under-claim, those files can remain untouched.

### 3. The skill bundle is missing the clustered/runtime contract entirely

Relevant files:
- `tools/skill/mesh/SKILL.md`
- `tools/skill/mesh/skills/syntax/SKILL.md`
- `tools/skill/mesh/skills/http/SKILL.md`
- likely new `tools/skill/mesh/skills/clustering/SKILL.md`

Current state:
- `tools/skill/mesh/SKILL.md` auto-loads for any Mesh question but does not mention:
  - `@cluster` / `@cluster(N)`
  - `Node.start_from_env()`
  - `meshc init --clustered`
  - `meshc init --template todo-api`
  - `meshc cluster status|continuity|diagnostics`
  - `HTTP.clustered(...)`
- `tools/skill/mesh/skills/syntax/SKILL.md` covers functions, closures, pipes, control flow, operators, and let bindings, but no decorator syntax.
- `tools/skill/mesh/skills/http/SKILL.md` is missing current first-contact HTTP cluster guidance:
  - no `HTTP.on_get` / `HTTP.on_post` / `HTTP.on_put` / `HTTP.on_delete`
  - no `HTTP.clustered(handler)` or `HTTP.clustered(<int>, handler)`
  - no route-free-vs-wrapper clustered contract
  - only generic `HTTP.route(...)` examples

Current truthful sources for the skill content:
- `README.md` clustered quick-start / distributed proof sections
- `compiler/mesh-pkg/src/scaffold.rs` generated README text for both `--clustered` and `--template todo-api`
- `tiny-cluster/README.md`
- `cluster-proof/README.md`
- `compiler/mesh-typeck/tests/http_clustered_routes.rs` for valid `HTTP.clustered(...)` shapes and constraints

Natural seam:
- Add a dedicated clustering/runtime sub-skill rather than burying everything in `skills/http`.
- Update the top-level `tools/skill/mesh/SKILL.md` to:
  - mention the source-first clustered contract in the overview
  - list the new sub-skill
  - route `@cluster`, `meshc init --clustered`, `Node.start_from_env`, `meshc cluster ...`, and `HTTP.clustered(...)` questions to it
- Add a short `@cluster` syntax note or cross-link in `skills/syntax/SKILL.md` so generic “Mesh syntax” questions do not miss the decorator form.
- Augment `skills/http/SKILL.md` rather than replacing it:
  - keep `HTTP.route(...)` documented as the generic route API
  - add method-specific routing (`HTTP.on_get`, `HTTP.on_post`, `HTTP.on_put`, `HTTP.on_delete`)
  - add clustered route wrapper guidance and a cross-link to the new clustering skill

Scope reduction:
- `tools/skill/mesh/skills/strings/SKILL.md` already teaches both `#{}` and `${}` correctly. S04 skill work does not need to rewrite string guidance unless a cross-link is helpful.

### 4. There is no existing test harness for the skill bundle; add a contract test

Relevant files:
- none today for `tools/skill/mesh/**`

Current state:
- I found no repo-local verifier that exercises or contract-tests the Mesh skill bundle.
- That means S04 can change skill content without any regression tripwire unless it adds one.

Recommended direction:
- add a focused `node --test` contract file under `scripts/tests/` that asserts presence of must-keep clustered/runtime guidance and cross-links.
- Good required-presence assertions:
  - top-level skill lists/routes a clustering sub-skill
  - cluster skill mentions `@cluster`, `Node.start_from_env()`, `meshc init --clustered`, `meshc init --template todo-api`, `meshc cluster status`
  - HTTP skill mentions `HTTP.on_get` / `on_post` / `on_put` / `on_delete` and `HTTP.clustered(...)`
- Keep the oracle grounded in existing scaffold/README wording; do not invent a second clustered narrative in the test.

## Key Findings

### Existing interpolation proof is already healthy — extend it, do not replace it
Both of these passed unchanged on this checkout:
- `bash scripts/verify-m036-s01.sh`
- `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax`

That means the slice’s syntax work is not “fix interpolation again.” It is “add `@cluster` to the already-retained proof without destabilizing the interpolation rails.”

### The cleanest syntax path is a dedicated decorator fixture, not a wider corpus contract
The current corpus/materializer chain is tightly pinned:
- corpus contract version is exact
- materialized case count is exact
- multiple tests and docs mention the interpolation corpus specifically

A new dedicated cluster fixture plus direct probes gives S04 the needed coverage with far less blast radius than changing the shared JSON corpus format or case count.

### Bare `cluster` should stay unreserved
The parser only treats `cluster` specially after `@`. That makes a blanket keyword-list fix semantically wrong. This negative case should be pinned in both TextMate/Shiki and Neovim syntax tests so the easy-but-wrong implementation cannot slip through.

### The skill bundle gap is bigger than one missing example
This is not just “add one `@cluster` snippet.” The init-time Mesh skill surface is currently missing:
- the route-free clustered package contract
- the runtime bootstrap entry (`Node.start_from_env()`)
- the scaffold commands users actually start with
- the runtime-owned operator commands
- the shipped `HTTP.clustered(...)` wrapper surface

Because `tools/skill/mesh/SKILL.md` auto-loads for any Mesh question, this omission directly affects first-contact guidance.

## Recommendation

Plan S04 as two mostly independent workstreams after one shared fixture choice.

### Workstream A — editor syntax / proof
1. Add one small cluster-decorator fixture (`@cluster`, `@cluster(3)`, bare `cluster` negative case).
2. Extend `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` to assert shared TextMate/Shiki decorator scopes.
3. Update `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` with decorator-position rules anchored on `@`.
4. Update `tools/editors/neovim-mesh/syntax/mesh.vim` with matching decorator-position rules.
5. Extend `tools/editors/neovim-mesh/tests/smoke.lua` syntax phase to probe that same fixture.
6. Reuse existing verifier entrypoints (`scripts/verify-m036-s01.sh`, `scripts/verify-m036-s02.sh syntax`) rather than introducing new S04-specific grammar wrappers.

### Workstream B — init-time skill bundle
1. Create a dedicated clustering/runtime sub-skill.
2. Update top-level `tools/skill/mesh/SKILL.md` to mention and route cluster/runtime questions there.
3. Add a minimal `@cluster` syntax hook/cross-link in `skills/syntax/SKILL.md`.
4. Add method-specific routing + `HTTP.clustered(...)` guidance/cross-link in `skills/http/SKILL.md`.
5. Add a new contract test under `scripts/tests/` so this guidance can’t drift silently again.

Suggested execution order:
- start with the shared syntax fixture/test because it locks the correct scope behavior and the important bare-`cluster` negative case
- then Neovim syntax
- then skill bundle (can run in parallel once canonical wording is selected from scaffold/README sources)

## Risks / Watchouts

- Changing `scripts/fixtures/m036-s01-syntax-corpus.json` or `verify-m036-s02-materialize-corpus.mjs` creates unnecessary blast radius into exact-count/version tests and README/verifier descriptions. Avoid it unless absolutely necessary.
- Do not make bare `cluster` a global keyword. That would be a false parser contract.
- `tools/editors/vscode-mesh/src/extension.ts` and `src/test/suite/extension.test.ts` are not the syntax seam; avoid spending time there unless the slice intentionally broadens public README/package touchpoints.
- `tools/editors/neovim-mesh/README.md` and `scripts/tests/verify-m036-s02-contract.test.mjs` are coupled. If README wording changes, update both in the same task.
- The skill bundle should reuse existing clustered wording from scaffold/README/test surfaces. S04 does not own inventing new runtime semantics or claiming broader clustered-route proof than the repo already has.
- `HTTP.route(...)` is still a real API. The HTTP skill should be augmented with current method-specific/clustered guidance, not rewritten as if generic routing no longer exists.

## Verification

Baseline already verified in research:
- `bash scripts/verify-m036-s01.sh`
- `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax`

Recommended slice proof after implementation:
- `bash scripts/verify-m036-s01.sh`
- `NEOVIM_BIN="${NEOVIM_BIN:-nvim}" bash scripts/verify-m036-s02.sh syntax`
- `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs` *(or equivalent new contract-test path)*

Only if Neovim README/contract wording changes:
- `node --test scripts/tests/verify-m036-s02-contract.test.mjs`

## Sources
- `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json`
- `tools/editors/vscode-mesh/package.json`
- `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs`
- `scripts/verify-m036-s01.sh`
- `tools/editors/neovim-mesh/syntax/mesh.vim`
- `tools/editors/neovim-mesh/tests/smoke.lua`
- `tools/editors/neovim-mesh/tests/syntax_smoke.lua`
- `scripts/verify-m036-s02.sh`
- `scripts/tests/verify-m036-s02-materialize-corpus.test.mjs`
- `scripts/tests/verify-m036-s02-contract.test.mjs`
- `tools/skill/mesh/SKILL.md`
- `tools/skill/mesh/skills/syntax/SKILL.md`
- `tools/skill/mesh/skills/http/SKILL.md`
- `README.md`
- `compiler/mesh-pkg/src/scaffold.rs`
- `tiny-cluster/README.md`
- `cluster-proof/README.md`
- `compiler/mesh-parser/src/parser/items.rs`
- `compiler/mesh-parser/tests/parser_tests.rs`
- `compiler/mesh-typeck/tests/http_clustered_routes.rs`
