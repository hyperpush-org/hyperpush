# S05: Assembled scaffold/example truth replay — UAT

**Milestone:** M049
**Written:** 2026-04-03T09:20:01.225Z

# S05: Assembled scaffold/example truth replay — UAT

**Milestone:** M049
**Mode:** Artifact-driven assembled verification

## Purpose

Validate the single assembled verifier for Mesh's scaffold/examples-first public onboarding story:

- Postgres Todo scaffold replay remains truthful.
- SQLite Todo scaffold replay remains truthful.
- Checked-in `/examples` still match scaffold output.
- Retired proof-app onboarding surfaces stay retired.
- Retained M048/tooling guardrails remain green underneath the new public story.

## Preconditions

- Run from the repo root.
- Rust, Node, npm, and Docker are available.
- A valid Postgres connection source is available through one of:
  - process `DATABASE_URL`
  - repo `.env`
  - `.tmp/m049-s01/local-postgres/connection.env`
- No overlapping verifier runs are active for `scripts/verify-m049-s05.sh` or its retained wrapper dependencies.

## Smoke Test

1. Run `bash scripts/verify-m049-s05.sh`.
2. **Expected:** the command ends with `verify-m049-s05: ok` and prints the assembled artifact root plus retained proof-bundle path.

## Test Cases

### 1. Contract and docs guards

1. Run `node --test scripts/tests/verify-m049-s05-contract.test.mjs`.
2. Run `cargo test -p meshc --test e2e_m049_s05 -- --nocapture`.
3. Run `node --test scripts/tests/verify-m048-s05-contract.test.mjs`.
4. **Expected:** all pass.
   - The S05 contract still sees the assembled replay order, Postgres fallback seam, retained bundle markers, and bounded README/tooling discoverability.
   - The retained M048 docs/tooling contract still sees update, entrypoint, publish, and grammar truth after the new S05 wording landed.

### 2. Retained M039 node-loss rail

1. Run `bash scripts/verify-m039-s01.sh`.
2. **Expected:** `verify-m039-s01: ok`.
3. Inspect `.tmp/m039-s01/verify/phase-report.txt`.
4. **Expected:** `build-tooling`, `build-cluster-proof`, `mesh-rt-discovery`, `convergence`, and `node-loss` all show `passed`.
5. Inspect the retained `cluster-status-primary-after-loss` artifacts if needed.
6. **Expected:** membership converges to the single primary node, while post-loss authority `replication_health` may truthfully be `unavailable` or `degraded`.

### 3. Final assembled replay

1. Run `bash scripts/verify-m049-s05.sh`.
2. **Expected:** `verify-m049-s05: ok`.
3. Inspect `.tmp/m049-s05/verify/status.txt`, `.tmp/m049-s05/verify/current-phase.txt`, `.tmp/m049-s05/verify/phase-report.txt`, and `.tmp/m049-s05/verify/latest-proof-bundle.txt`.
4. **Expected:**
   - `status.txt` is `ok`
   - `current-phase.txt` is `complete`
   - `latest-proof-bundle.txt` points at `.tmp/m049-s05/verify/retained-proof-bundle`
   - `phase-report.txt` shows passed phases for:
     - `m049-s04-onboarding-contract`
     - `m049-scaffold-mesh-pkg`
     - `m049-scaffold-tooling`
     - `meshc-build-preflight`
     - `m049-s03-materialize-direct`
     - `m049-s01-env-preflight`
     - `m049-s01-e2e`
     - `m049-s02-e2e`
     - `m049-s03-e2e`
     - `m039-s01-replay`
     - `m045-s02-replay`
     - `m047-s05-replay`
     - `m048-s05-replay`
     - retained-copy phases for M039/M045/M047/M048/M049 S01-S03 artifacts
     - `m049-s05-bundle-shape`

### 4. Retained bundle shape

1. Inspect `.tmp/m049-s05/verify/retained-proof-bundle/`.
2. **Expected:** it contains:
   - `retained-m039-s01-verify/`
   - `retained-m045-s02-verify/`
   - `retained-m047-s05-verify/`
   - `retained-m048-s05-verify/`
   - `retained-m049-s01-artifacts/`
   - `retained-m049-s01-artifacts.manifest.txt`
   - `retained-m049-s02-artifacts/`
   - `retained-m049-s02-artifacts.manifest.txt`
   - `retained-m049-s03-artifacts/`
   - `retained-m049-s03-artifacts.manifest.txt`
3. Inspect `retained-m049-s01-artifacts.manifest.txt`.
4. **Expected:** the Postgres unmigrated-database family includes `todos-unmigrated.http` and `todos-unmigrated.json`.
5. Inspect `retained-m049-s03-artifacts.manifest.txt`.
6. **Expected:** it includes parity plus generated-example build/test buckets such as `todo-examples-parity-*`, `todo-sqlite-test-build-*`, and `todo-postgres-test-build-*`.

### 5. Bounded public discoverability

1. Inspect `README.md` and `website/docs/docs/tooling/index.md` or rely on the passing Node contract tests.
2. **Expected:** `bash scripts/verify-m049-s05.sh` is mentioned as the assembled scaffold/examples-first verifier.
3. **Expected:** the wording keeps SQLite explicitly local and Postgres explicitly shared/deployable.
4. **Expected:** historical clustered proof rails remain described as retained/subordinate evidence rather than as a second public onboarding path.

## Edge Cases

### Missing Postgres source

1. Temporarily remove `DATABASE_URL` from the environment and hide repo `.env` plus `.tmp/m049-s01/local-postgres/connection.env`.
2. Run `bash scripts/verify-m049-s05.sh`.
3. **Expected:** it fails closed during `m049-s01-env-preflight` and names the missing Postgres connection source instead of silently continuing.

### Overlapping wrapper runs

1. Start one `bash scripts/verify-m049-s05.sh` run.
2. Before it finishes, start a second one.
3. **Expected:** this is not a supported operating mode; if phase reports duplicate, stall, or clobber each other, kill both and rerun once cleanly.
4. **Why this matters:** the shell verifier family still shares `.tmp/.../verify` roots and does not implement a cross-process lock.

### Retained bundle drift

1. After a green assembled replay, inspect `.tmp/m049-s05/verify/retained-proof-bundle/retained-m049-s01-artifacts.manifest.txt`.
2. **Expected:** it lists `todos-unmigrated.http` and `todos-unmigrated.json` for the unmigrated-database family.
3. **Expected failure mode:** if the bundle-shape checker expects the stale `todos-unmigrated.response.json` name instead, `m049-s05-bundle-shape` must fail closed rather than pretending the retained bundle is valid.

## Failure Signals

- `status.txt` is not `ok` or `current-phase.txt` is not `complete` after a supposed green replay.
- `phase-report.txt` stops before `m049-s05-bundle-shape`.
- `latest-proof-bundle.txt` is missing or points somewhere other than `.tmp/m049-s05/verify/retained-proof-bundle`.
- The retained bundle is missing any delegated verify tree or any `retained-m049-s01|s02|s03` artifact bucket/manifest.

## Requirements Proved By This UAT

- R115 — the dual-db scaffold story still holds under one named assembled replay.
- R116 — checked-in generated `/examples` plus retired proof-app onboarding surfaces are now enforced together by one named repo verifier.
- R122 — the public SQLite-local vs Postgres-shared/deployable split stays mechanically guarded inside the assembled replay and docs contract.

## Notes for Tester

- Debug from `.tmp/m049-s05/verify/phase-report.txt` and `latest-proof-bundle.txt` first; only then open delegated retained wrapper logs.
- If the retained M047 replay fails with a socket race on this host, confirm `scripts/verify-m047-s05.sh` is still forcing `RUST_TEST_THREADS=1` before changing the Todo scaffold or the assembled wrapper.

