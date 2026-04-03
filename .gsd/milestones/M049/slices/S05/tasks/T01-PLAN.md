---
estimated_steps: 5
estimated_files: 7
skills_used:
  - test
---

# T01: Compose `scripts/verify-m049-s05.sh` as the single assembled scaffold/example replay rail

**Slice:** S05 — Assembled scaffold/example truth replay
**Milestone:** M049

## Description

Implement the single assembled acceptance wrapper `scripts/verify-m049-s05.sh`. It should fail fast on public/docs/static drift, build `target/debug/meshc` before the direct materializer check, handle Postgres `DATABASE_URL` explicitly instead of assuming shell inheritance, replay the retained clustered and M048 wrappers serially, and retain one copied proof bundle under `.tmp/m049-s05/verify/`.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Postgres env resolution for `cargo test -p meshc --test e2e_m049_s01 -- --nocapture` | Fail closed before the S01 replay starts and name the missing env source instead of silently running with no `DATABASE_URL`. | Keep the preflight log and stop before long Cargo phases. | Reject malformed `DATABASE_URL` or unreadable fallback env files rather than leaking them into retained artifacts. |
| `target/debug/meshc` requirement for `node scripts/tests/verify-m049-s03-materialize-examples.mjs --check` | Run a cargo phase that produces the binary before the materializer check; if it is still missing, stop with a named preflight failure. | N/A — local binary presence only. | Reject wrong binary path or missing executable bit before claiming example parity. |
| Retained upstream verifiers (`scripts/verify-m039-s01.sh`, `scripts/verify-m045-s02.sh`, `scripts/verify-m047-s05.sh`, `scripts/verify-m048-s05.sh`) | Stop at the failing phase and point to the upstream log/bundle rather than papering over a historical regression. | Preserve the failing phase log and copied verify directory path. | Treat missing `status.txt`, `phase-report.txt`, manifests, or pointer files as retained-proof drift. |
| Fresh `.tmp/m049-s01`, `.tmp/m049-s02`, `.tmp/m049-s03` artifact capture | Fail closed if the replay produced no new directories or if the copied bundle omits expected scenario families. | Preserve the before/after snapshot and artifact-copy log for diagnosis. | Reject empty or malformed copied bundles instead of treating any non-empty directory as success. |

## Load Profile

- **Shared resources**: Cargo build/test outputs, `target/debug/meshc`, website build temp dirs inside retained wrappers, `.tmp/m049-s01`, `.tmp/m049-s02`, `.tmp/m049-s03`, `.tmp/m039-s01/verify`, `.tmp/m045-s02/verify`, `.tmp/m047-s05/verify`, and `.tmp/m048-s05/verify`.
- **Per-operation cost**: several cargo test targets, one direct Node materializer check, multiple wrapper replays, and copied retained bundles/manifests.
- **10x breakpoint**: compile/docs-build time and retained artifact churn dominate first; the task should keep the replay serial and avoid duplicating the website build or M048 internals.

## Negative Tests

- **Malformed inputs**: missing `DATABASE_URL`, unreadable repo-root `.env` or `.tmp/m049-s01/local-postgres/connection.env`, missing `target/debug/meshc`, or malformed retained bundle pointer paths.
- **Error paths**: named Cargo filters silently running 0 tests, materializer check running before a built binary exists, or historical wrapper output missing required verify files.
- **Boundary conditions**: the retained bundle must include both fixed upstream verify dirs and fresh timestamped M049 artifact buckets; `m039-s01` is the older asymmetric case and should only be checked against the files it truly owns.

## Steps

1. Create `scripts/verify-m049-s05.sh` from the M048 assembled-wrapper pattern rather than inventing a new shell structure.
2. Replay the fast public/static phases first (S04 onboarding contract, mesh-pkg/tooling scaffold filters), then the direct S03 materializer check, then the expensive M049 runtime/parity replays, then the retained `m039`/`m045`/`m047` rails, and `bash scripts/verify-m048-s05.sh` last.
3. Resolve Postgres `DATABASE_URL` explicitly inside the wrapper in this order: existing environment, repo-root `.env`, `.tmp/m049-s01/local-postgres/connection.env`; fail closed if none provide a usable value, and do not echo the secret.
4. Snapshot-copy fresh `.tmp/m049-s01`, `.tmp/m049-s02`, and `.tmp/m049-s03` replay artifacts plus the retained upstream verify dirs into `.tmp/m049-s05/verify/retained-proof-bundle/`.
5. Assert the final `status.txt`, `current-phase.txt`, `phase-report.txt`, `full-contract.log`, and `latest-proof-bundle.txt` contract plus bundle-shape markers before printing `verify-m049-s05: ok`.

## Must-Haves

- [ ] `scripts/verify-m049-s05.sh` is the single assembled rail for R116 and reuses lower-level S01-S04 and M048 proofs rather than reimplementing them.
- [ ] The wrapper handles the Postgres env and materializer ordering truthfully instead of depending on interactive shell state or lucky prior builds.
- [ ] `.tmp/m049-s05/verify/retained-proof-bundle/` contains copied retained verify dirs plus fresh `m049-s01`, `m049-s02`, and `m049-s03` artifact buckets with fail-closed manifests/pointers.

## Verification

- `bash scripts/verify-m049-s05.sh`

## Observability Impact

- Signals added/changed: `.tmp/m049-s05/verify/{status.txt,current-phase.txt,phase-report.txt,full-contract.log,latest-proof-bundle.txt}` plus copied manifests for each retained M049 artifact bucket.
- How a future agent inspects this: rerun `bash scripts/verify-m049-s05.sh` and inspect the named failing phase log or bundle pointer under `.tmp/m049-s05/verify/`.
- Failure state exposed: missing env sources, 0-test filters, stale upstream verify dirs, or malformed bundle pointers fail with an explicit phase name instead of a generic shell exit.

## Inputs

- `scripts/verify-m048-s05.sh` — assembled-wrapper structure and retained-bundle conventions to mirror.
- `scripts/verify-m047-s05.sh` — retained upstream-wrapper pattern for copying another verifier’s `verify/` directory verbatim.
- `scripts/verify-m045-s02.sh` — retained historical clustered rail whose verify-dir contract must be copied intact.
- `scripts/verify-m039-s01.sh` — older asymmetric retained clustered rail whose verify-dir shape needs special-case bundle checks.
- `scripts/tests/verify-m049-s03-materialize-examples.mjs` — direct public parity check that requires a built `target/debug/meshc`.
- `scripts/tests/verify-m049-s04-onboarding-contract.test.mjs` — fast public/docs retirement gate that should run before the expensive runtime replays.
- `compiler/meshc/tests/e2e_m049_s01.rs` — Postgres runtime truth rail that drives the wrapper’s env-resolution and redaction behavior.
- `compiler/meshc/tests/e2e_m049_s02.rs` — SQLite runtime truth rail that the assembled wrapper must replay without clustered overclaim.
- `compiler/meshc/tests/e2e_m049_s03.rs` — retained example-parity and `meshc test` / `meshc build` artifact rail for fresh `.tmp/m049-s03` bundle capture.

## Expected Output

- `scripts/verify-m049-s05.sh` — authoritative assembled verifier that replays the lower-level rails and retains one fail-closed proof bundle.
