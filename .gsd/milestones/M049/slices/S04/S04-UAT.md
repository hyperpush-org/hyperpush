# S04: Retire top-level proof-app onboarding surfaces — UAT

**Milestone:** M049
**Written:** 2026-04-03T04:46:57.672Z

# S04: Retire top-level proof-app onboarding surfaces — UAT

**Milestone:** M049
**Written:** 2026-04-03

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: this slice changes repo structure, docs, fixture paths, and verifier contracts rather than a new end-user runtime surface; the truthful acceptance signals are the fixture-backed commands, contract tests, and retained verify bundles.

## Preconditions

- Run from the repo root with Rust, Node, npm, and Docker available.
- The relocated fixtures exist at `scripts/fixtures/clustered/tiny-cluster/` and `scripts/fixtures/clustered/cluster-proof/`.
- There are no repo-root `tiny-cluster/` or `cluster-proof/` directories.

## Smoke Test

1. Run `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`.
2. **Expected:** all six tests pass, including the guard that fails if repo-root proof-package directories reappear.

## Test Cases

### 1. Internal fixtures replace the deleted repo-root proof apps

1. Run `cargo run -q -p meshc -- test scripts/fixtures/clustered/tiny-cluster/tests`.
2. Run `cargo run -q -p meshc -- build scripts/fixtures/clustered/tiny-cluster`.
3. Run `cargo run -q -p meshc -- test scripts/fixtures/clustered/cluster-proof/tests`.
4. Run `cargo run -q -p meshc -- build scripts/fixtures/clustered/cluster-proof`.
5. **Expected:** all four commands pass; package identities and runtime/log names remain `tiny-cluster` / `cluster-proof`; no command needs the deleted repo-root package paths.

### 2. Public onboarding is scaffold/examples-first

1. Run `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`.
2. Run `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check`.
3. Run `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs`.
4. Run `node --test scripts/tests/verify-m048-s05-contract.test.mjs`.
5. **Expected:** all commands pass; README/docs/skill surfaces point at scaffold plus `examples/todo-sqlite` / `examples/todo-postgres` instead of repo-root proof-app README paths.

### 3. Retained Rust rails resolve the relocated clustered fixtures

1. Run `cargo test -p meshc --test e2e_m046_s03 -- --nocapture`.
2. Run `cargo test -p meshc --test e2e_m046_s04 -- --nocapture`.
3. Run `cargo test -p meshc --test e2e_m045_s01 -- --nocapture`.
4. Run `cargo test -p meshc --test e2e_m045_s02 -- --nocapture`.
5. Run `cargo test -p meshc --test e2e_m046_s05 -- --nocapture`.
6. **Expected:** all targets pass and retain fresh `.tmp/...` bundles without any stale repo-root `tiny-cluster` / `cluster-proof` reads.

### 4. Historical shell and closeout wrappers stay green after root deletion

1. Run `bash scripts/verify-m039-s01.sh`.
2. Run `bash scripts/verify-m045-s02.sh`.
3. Run `bash scripts/verify-m047-s04.sh`.
4. Run `bash scripts/verify-m047-s05.sh`.
5. **Expected:** all wrappers pass; each writes `status.txt=ok` plus a complete `phase-report.txt` under its `.tmp/.../verify` directory; `verify-m045-s02.sh` passes the `m045-s02-bundle-shape` phase with the current retained artifact set.

### 5. Website/docs still build after the onboarding reset

1. Run `npm --prefix website run build`.
2. **Expected:** the docs build succeeds with no broken references to moved or deleted proof-app paths.

## Edge Cases

### Repo-root proof packages are reintroduced

1. Create an empty `tiny-cluster/` or `cluster-proof/` directory at repo root.
2. Re-run `node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs`.
3. **Expected:** the contract test fails closed instead of silently ignoring the reintroduced directories.

### Historical bundle-shape drift

1. Run `bash scripts/verify-m045-s02.sh`.
2. Inspect `.tmp/m045-s02/verify/latest-proof-bundle.txt` and the copied tree under `.tmp/m045-s02/verify/retained-m045-s02-artifacts/`.
3. **Expected:** `declared-work-remote-spawn-*` contains `generated-project/`, `package/`, `references/cluster-proof.*`, and `init.log`; `scaffold-runtime-completion-local-*` contains `cluster-status`, `cluster-continuity-list`, `cluster-continuity-completed`, `cluster-diagnostics`, and scaffold logs.

## Failure Signals

- Any repo-root `tiny-cluster/` or `cluster-proof/` directory exists again.
- The onboarding contract or retained M048 contract tests fail on stale README/docs/skill wording.
- Wrapper rails stop at `m045-s02-bundle-shape`, `m047-s05-tooling`, or a missing `status.txt` / `phase-report.txt` inside `.tmp/.../verify`.

## Requirements Proved By This UAT

- R116 — the public teaching surface is example-first and the old proof apps survive only as internal fixtures plus retained verifier rails.

## Not Proven By This UAT

- M050's broader evaluator-facing docs rewrite.
- M051's `reference-backend` retirement in favor of `mesher`.
- Any new runtime capability beyond the retained fixture/path/docs contract already shipped before S04.

## Notes for Tester

- `bash scripts/verify-m047-s04.sh` and `bash scripts/verify-m047-s05.sh` are the authoritative assembled rails; if they fail, inspect `.tmp/m047-s04/verify` or `.tmp/m047-s05/verify` first.
- `bash scripts/verify-m045-s02.sh` is a historical wrapper; debug the retained bundle tree before changing runtime code because bundle-shape drift can look like a product regression.
