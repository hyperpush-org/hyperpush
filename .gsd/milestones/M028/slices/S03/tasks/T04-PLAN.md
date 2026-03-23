---
estimated_steps: 4
estimated_files: 6
skills_used:
  - review
  - lint
---

# T04: Sync docs and editor instructions to the verified tooling contract

**Slice:** S03 — Daily-Driver Tooling Trust
**Milestone:** M028

## Description

Once formatter, test-runner, and LSP behavior are mechanically proven, update the public/backend/editor docs so they describe the real command surface instead of stale commands, stale VSIX versions, and optimistic coverage wording. This task is where S03’s R006 execution turns into visible R008-supporting truth.

## Steps

1. Update `README.md`, `website/docs/docs/tooling/index.md`, `website/docs/docs/testing/index.md`, and `website/docs/docs/cheatsheet/index.md` to the verified command surface: `meshc init`, `meshc fmt`, the real `meshc test` project-dir invocation, and honest coverage wording.
2. Update `tools/editors/vscode-mesh/README.md` to the current VSIX/install command and the LSP feature set that now has transport-level proof.
3. Expand `reference-backend/README.md` so the canonical backend package documents the verified fmt/test/LSP workflow alongside build/run/migrate commands.
4. Run targeted stale-string checks and rerun the documented backend/tooling commands that changed so docs only encode behavior already proven elsewhere in the slice.

## Must-Haves

- [ ] Public docs no longer advertise `mesh fmt` or `meshc new` when the real commands are `meshc fmt` and `meshc init`.
- [ ] Testing docs describe the real project-dir invocation and honest coverage contract.
- [ ] VS Code docs/install commands match the current extension version and proven LSP feature set.
- [ ] `reference-backend/README.md` includes the backend-specific fmt/test/LSP commands that now define the canonical daily-driver workflow.

## Verification

- `cargo run -p meshc -- fmt --check reference-backend`
- `cargo run -p meshc -- test reference-backend`
- `cargo test -p meshc --test e2e_lsp -- --nocapture`
- `! rg -n "meshc new|mesh fmt|meshc test \\.|mesh-lang-0\.1\.0\.vsix|Coverage reporting is available as a stub" README.md website/docs/docs/tooling/index.md website/docs/docs/testing/index.md website/docs/docs/cheatsheet/index.md tools/editors/vscode-mesh/README.md reference-backend/README.md`

## Inputs

- `README.md` — top-level public tooling claims
- `website/docs/docs/tooling/index.md` — primary tooling guide with stale command/install drift
- `website/docs/docs/testing/index.md` — testing guide with false directory/coverage wording
- `website/docs/docs/cheatsheet/index.md` — command cheatsheet that must match the verified workflow
- `tools/editors/vscode-mesh/README.md` — editor feature/install truth
- `reference-backend/README.md` — canonical backend operator workflow docs

## Expected Output

- `README.md` — corrected public tooling claims
- `website/docs/docs/tooling/index.md` — verified tooling command and LSP/editor documentation
- `website/docs/docs/testing/index.md` — truthful test-runner and coverage documentation
- `website/docs/docs/cheatsheet/index.md` — corrected command cheatsheet entries
- `tools/editors/vscode-mesh/README.md` — current extension install/features guidance
- `reference-backend/README.md` — canonical backend daily-driver tooling workflow
