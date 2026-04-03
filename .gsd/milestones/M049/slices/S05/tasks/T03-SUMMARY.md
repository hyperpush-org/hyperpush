---
id: T03
parent: S05
milestone: M049
provides: []
requires: []
affects: []
key_files: ["scripts/verify-m049-s05.sh", "scripts/tests/verify-m049-s05-contract.test.mjs", "compiler/meshc/tests/e2e_m049_s05.rs", "scripts/verify-m047-s05.sh", ".tmp/m049-s05/verify/status.txt", ".tmp/m049-s05/verify/phase-report.txt", ".tmp/m049-s05/verify/latest-proof-bundle.txt"]
key_decisions: ["Use the actual Postgres unmigrated-database artifact names (`todos-unmigrated.http` and `todos-unmigrated.json`) in the assembled retained-bundle check.", "Run the retained `e2e_m047_s05` replay under `RUST_TEST_THREADS=1` inside `scripts/verify-m047-s05.sh` to avoid host-level `os error 35` concurrency flakes without weakening the retained proof."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed, `cargo test -p meshc --test e2e_m049_s05 -- --nocapture` passed, and the full `bash scripts/verify-m049-s05.sh` replay finished with `verify-m049-s05: ok` and a complete retained bundle under `.tmp/m049-s05/verify/retained-proof-bundle/`."
completed_at: 2026-04-03T09:17:01.271Z
blocker_discovered: false
---

# T03: Replayed the assembled M049 verifier to a green retained bundle and fixed the remaining retained-proof drift that blocked completion.

> Replayed the assembled M049 verifier to a green retained bundle and fixed the remaining retained-proof drift that blocked completion.

## What Happened
---
id: T03
parent: S05
milestone: M049
key_files:
  - scripts/verify-m049-s05.sh
  - scripts/tests/verify-m049-s05-contract.test.mjs
  - compiler/meshc/tests/e2e_m049_s05.rs
  - scripts/verify-m047-s05.sh
  - .tmp/m049-s05/verify/status.txt
  - .tmp/m049-s05/verify/phase-report.txt
  - .tmp/m049-s05/verify/latest-proof-bundle.txt
key_decisions:
  - Use the actual Postgres unmigrated-database artifact names (`todos-unmigrated.http` and `todos-unmigrated.json`) in the assembled retained-bundle check.
  - Run the retained `e2e_m047_s05` replay under `RUST_TEST_THREADS=1` inside `scripts/verify-m047-s05.sh` to avoid host-level `os error 35` concurrency flakes without weakening the retained proof.
duration: ""
verification_result: passed
completed_at: 2026-04-03T09:17:01.272Z
blocker_discovered: false
---

# T03: Replayed the assembled M049 verifier to a green retained bundle and fixed the remaining retained-proof drift that blocked completion.

**Replayed the assembled M049 verifier to a green retained bundle and fixed the remaining retained-proof drift that blocked completion.**

## What Happened

After the retained M039 rail was repaired, reran the assembled `scripts/verify-m049-s05.sh` closeout and brought the remaining retained assumptions into line with the current tree. The wrapper and its pinned Rust/Node contract tests were updated to assert the real Postgres unmigrated-database artifact names (`todos-unmigrated.http` and `todos-unmigrated.json`) rather than the stale `todos-unmigrated.response.json` marker. During the replay, the retained `scripts/verify-m047-s05.sh` rail also proved host-flaky when it ran the full `e2e_m047_s05` suite with default test concurrency, so the wrapper was updated to force `RUST_TEST_THREADS=1` around that full suite instead of weakening the proof. With those retained-proof fixes in place, `bash scripts/verify-m049-s05.sh` completed, emitted `status.txt=ok`, `current-phase.txt=complete`, `latest-proof-bundle.txt`, and a retained bundle that contains delegated M039/M045/M047/M048 verify trees plus fresh M049 S01-S03 artifact buckets.

## Verification

`node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed, `cargo test -p meshc --test e2e_m049_s05 -- --nocapture` passed, and the full `bash scripts/verify-m049-s05.sh` replay finished with `verify-m049-s05: ok` and a complete retained bundle under `.tmp/m049-s05/verify/retained-proof-bundle/`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/tests/verify-m049-s05-contract.test.mjs` | 0 | ✅ pass | 940ms |
| 2 | `cargo test -p meshc --test e2e_m049_s05 -- --nocapture` | 0 | ✅ pass | 3200ms |
| 3 | `bash scripts/verify-m049-s05.sh` | 0 | ✅ pass | 1009200ms |


## Deviations

While rerunning the assembled closeout, I also had to align the retained bundle-shape expectation with the actual Postgres unmigrated-database filenames and serialize the retained M047 replay with `RUST_TEST_THREADS=1` so the wrapper could finish truthfully on this host.

## Known Issues

None.

## Files Created/Modified

- `scripts/verify-m049-s05.sh`
- `scripts/tests/verify-m049-s05-contract.test.mjs`
- `compiler/meshc/tests/e2e_m049_s05.rs`
- `scripts/verify-m047-s05.sh`
- `.tmp/m049-s05/verify/status.txt`
- `.tmp/m049-s05/verify/phase-report.txt`
- `.tmp/m049-s05/verify/latest-proof-bundle.txt`


## Deviations
While rerunning the assembled closeout, I also had to align the retained bundle-shape expectation with the actual Postgres unmigrated-database filenames and serialize the retained M047 replay with `RUST_TEST_THREADS=1` so the wrapper could finish truthfully on this host.

## Known Issues
None.
