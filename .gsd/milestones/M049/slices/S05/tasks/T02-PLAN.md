---
estimated_steps: 4
estimated_files: 6
skills_used:
  - test
---

# T02: Document and pin the `verify-m049-s05` contract so the assembled rail cannot drift

**Slice:** S05 — Assembled scaffold/example truth replay
**Milestone:** M049

## Description

Make the new wrapper durable and discoverable. Add minimal README/tooling mentions for `bash scripts/verify-m049-s05.sh`, add a Node contract test that fails closed on missing verifier or split wording, and add a Rust integration test that pins the wrapper command list, phase markers, and retained bundle names.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/verify-m049-s05.sh` static contract | Fail the Rust integration test before wrapper drift lands. | N/A — local file read only. | Reject missing phase names, replay command strings, or retained bundle markers. |
| `README.md` and `website/docs/docs/tooling/index.md` public wording | Fail the Node contract test before the new verifier disappears or the SQLite/Postgres split collapses. | N/A — local content checks only. | Reject stale proof-app wording, generic `meshc init --template todo-api` guidance, or missing verifier mention. |
| Existing M048 docs-contract pattern | Reuse its bounded slots rather than broad grep sweeps; if the pattern diverges, fail in the new contract test with explicit missing/excluded markers. | N/A — local content checks only. | Reject a contract that overclaims new docs surfaces or under-specifies the split wording. |

## Negative Tests

- **Malformed inputs**: README/tooling text drops `bash scripts/verify-m049-s05.sh`, reintroduces proof-app-shaped onboarding text, or collapses the SQLite/Postgres split back into unsplit `todo-api` guidance.
- **Error paths**: the Node contract still passes after docs drift, or the Rust integration test misses a removed replay command or retained bundle marker.
- **Boundary conditions**: only README and tooling docs should advertise the new assembled rail; deeper distributed-proof/history pages remain unchanged and should not be rewritten into a second public entrypoint.

## Steps

1. Add minimal `bash scripts/verify-m049-s05.sh` discoverability to `README.md` and `website/docs/docs/tooling/index.md` in the same bounded places that already describe other assembled verifiers.
2. Add `scripts/tests/verify-m049-s05-contract.test.mjs`, modeled on the M048 docs contract, so missing verifier text, stale proof-app wording, or a broken SQLite/Postgres split fail closed.
3. Add `compiler/meshc/tests/e2e_m049_s05.rs`, modeled on the M047 assembled-verifier tests, so the wrapper’s required replay commands, phase names, and retained bundle markers are pinned in repo-owned Rust tests.
4. Keep the public wording narrow: the new verifier proves scaffold/examples-first onboarding truth, while historical clustered proof rails remain subordinate retained surfaces.

## Must-Haves

- [ ] `README.md` and `website/docs/docs/tooling/index.md` mention the new named verifier without reopening proof-app-shaped onboarding.
- [ ] `scripts/tests/verify-m049-s05-contract.test.mjs` fails closed on missing verifier text or a collapsed SQLite/Postgres split.
- [ ] `compiler/meshc/tests/e2e_m049_s05.rs` fails closed when `scripts/verify-m049-s05.sh` stops replaying the required proof families or retained bundle markers.

## Verification

- `node --test scripts/tests/verify-m049-s05-contract.test.mjs`
- `cargo test -p meshc --test e2e_m049_s05 -- --nocapture`

## Observability Impact

- Signals added/changed: new fail-closed Node and Rust contract tests for docs/discoverability drift and wrapper-command drift.
- How a future agent inspects this: run the verification commands above and read the missing marker named in the failing assertion.
- Failure state exposed: the exact docs phrase, replay command, phase name, or retained bundle entry that drifted.

## Inputs

- `scripts/verify-m049-s05.sh` — new assembled wrapper whose command list, phase names, and bundle markers must be pinned.
- `README.md` — public repo entrypoint where the new named verifier should be discoverable.
- `website/docs/docs/tooling/index.md` — tooling doc slot that already names other assembled verifiers and should advertise the new one.
- `scripts/tests/verify-m048-s05-contract.test.mjs` — reference pattern for bounded docs discoverability and fail-closed mutation checks.
- `compiler/meshc/tests/e2e_m047_s05.rs` — reference pattern for asserting an assembled wrapper’s command list and retained bundle markers.
- `compiler/meshc/tests/e2e_m047_s06.rs` — reference pattern for keeping public wording narrow while historical retained rails remain subordinate.

## Expected Output

- `README.md` — minimal discoverability for `bash scripts/verify-m049-s05.sh` with the SQLite-local vs Postgres-clustered split preserved.
- `website/docs/docs/tooling/index.md` — tooling docs updated to point at the new assembled scaffold/example verifier.
- `scripts/tests/verify-m049-s05-contract.test.mjs` — fail-closed docs contract for the new verifier mention and split wording.
- `compiler/meshc/tests/e2e_m049_s05.rs` — Rust integration test that pins the wrapper command list, phase names, and retained bundle markers.
