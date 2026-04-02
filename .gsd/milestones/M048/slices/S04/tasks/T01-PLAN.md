---
estimated_steps: 4
estimated_files: 3
skills_used:
  - vscode-extension-expert
  - test
---

# T01: Add shared `@cluster` syntax fixture and VS Code/TextMate parity assertions

**Slice:** S04 — Syntax and init-skill parity reset
**Milestone:** M048

## Description

Lock the shared grammar semantics before editor-specific work branches. This task adds one dedicated decorator fixture and extends the retained TextMate/Shiki parity rail so the repo proves the right behavior in the actual VS Code/docs grammar seam: `@cluster` and `@cluster(3)` are decorator syntax, but bare `cluster` remains an ordinary identifier.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` | Fail the parity test with the decorator case id and actual scopes; do not weaken the match into a global keyword rule. | N/A for local tokenization. | Treat missing decorator scopes or a reserved bare `cluster` token as contract drift. |
| `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` | Stop on the first TextMate/Shiki mismatch and print the engine, file, range, and scopes. | Treat loader stalls as verifier failure instead of falling back to partial checks. | Reject divergent token signatures or missing fixture content as proof failure. |
| `scripts/fixtures/m048-s04-cluster-decorators.mpl` | Fail closed if the fixture is missing or empty; do not silently substitute corpus data. | N/A for local file reads. | Treat missing `@cluster`, missing `@cluster(3)`, or missing bare-identifier negative coverage as fixture drift. |

## Load Profile

- **Shared resources**: the shared grammar JSON plus TextMate/Shiki tokenization across one focused decorator fixture and the existing interpolation corpus.
- **Per-operation cost**: one fixture read plus one tokenization pass per engine; trivial compared with normal docs build/test work.
- **10x breakpoint**: regex ordering or scope collisions fail before performance matters, so the task must optimize for precise decorator anchoring rather than throughput.

## Negative Tests

- **Malformed inputs**: probe `@cluster`, `@cluster(3)`, and a plain `let cluster = 1` identifier in the same dedicated fixture.
- **Error paths**: fail if TextMate and Shiki diverge on token signatures or if either engine loses the numeric count scope.
- **Boundary conditions**: keep the existing interpolation corpus unchanged and prove that only decorator-position `cluster` is special.

## Steps

1. Add `scripts/fixtures/m048-s04-cluster-decorators.mpl` containing one plain `@cluster` declaration, one counted `@cluster(3)` declaration, and one bare `cluster` identifier case that should stay unreserved.
2. Extend `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` with a dedicated fixture loader/probe that asserts decorator-position scopes, numeric count scopes, and the bare-identifier negative case without widening the existing interpolation corpus contract.
3. Update `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` with decorator-position matching anchored on `@` so `cluster` is highlighted only in `@cluster` / `@cluster(N)` and not as a global keyword.
4. Re-run `bash scripts/verify-m036-s01.sh` and keep the negative bare-identifier case green in both TextMate and Shiki token signatures.

## Must-Haves

- [ ] The dedicated fixture lives at `scripts/fixtures/m048-s04-cluster-decorators.mpl` and covers `@cluster`, `@cluster(3)`, and a bare `cluster` identifier.
- [ ] TextMate and Shiki both scope decorator-position `cluster` specially and keep the explicit count numeric.
- [ ] Bare `cluster` remains identifier-scoped in the shared grammar.
- [ ] `bash scripts/verify-m036-s01.sh` stays the retained shared-surface verifier.

## Verification

- `bash scripts/verify-m036-s01.sh`
- Inspect failing output, if any, for case id / engine / token signature drift before widening regexes.

## Observability Impact

- Signals added/changed: the parity rail gains a dedicated decorator case with engine-specific scope diffs.
- How a future agent inspects this: rerun `bash scripts/verify-m036-s01.sh` and read the failing case id plus actual scopes from `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs`.
- Failure state exposed: missing decorator scope, lost numeric scope, or reserved bare identifier is reported with the exact fixture range.

## Inputs

- `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` — current shared grammar that misses decorator-position `@cluster`.
- `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` — retained TextMate/Shiki parity harness to extend instead of replace.
- `scripts/verify-m036-s01.sh` — canonical shared-surface verifier this task must keep as the entrypoint.

## Expected Output

- `scripts/fixtures/m048-s04-cluster-decorators.mpl` — dedicated decorator fixture with positive and negative coverage.
- `website/scripts/tests/verify-m036-s01-syntax-parity.test.mjs` — parity test extended with decorator assertions.
- `tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json` — decorator-position grammar rule anchored on `@`.
