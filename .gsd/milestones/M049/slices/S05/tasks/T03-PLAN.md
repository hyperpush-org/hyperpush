---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T03: Replay `verify-m049-s05` to completion and retain the assembled proof bundle

After the retained M039 rail is green again, rerun the assembled M049 wrapper end-to-end.

1. Replay `scripts/verify-m049-s05.sh` with the current Postgres env-resolution contract and the repaired retained M039 dependency.
2. Update `scripts/verify-m049-s05.sh` plus its pinned wrapper tests only if the repaired M039 truth changes a copied marker or phase assumption.
3. Confirm the wrapper reaches the retained-copy phases and emits `status.txt`, `current-phase.txt`, `phase-report.txt`, and `latest-proof-bundle.txt`.
4. Validate that the copied bundle contains retained M039/M045/M047/M048 verifier dirs plus fresh M049 S01-S03 artifact buckets.

## Inputs

- `scripts/verify-m049-s05.sh`
- `scripts/tests/verify-m049-s05-contract.test.mjs`
- `compiler/meshc/tests/e2e_m049_s05.rs`
- `.tmp/m039-s01/verify/phase-report.txt`

## Expected Output

- `.tmp/m049-s05/verify/status.txt`
- `.tmp/m049-s05/verify/current-phase.txt`
- `.tmp/m049-s05/verify/phase-report.txt`
- `.tmp/m049-s05/verify/latest-proof-bundle.txt`
- `.tmp/m049-s05/verify/retained-proof-bundle/`

## Verification

node --test scripts/tests/verify-m049-s05-contract.test.mjs
cargo test -p meshc --test e2e_m049_s05 -- --nocapture
bash scripts/verify-m049-s05.sh

## Observability Impact

Restores the assembled verifier’s top-level proof surfaces so future agents can debug from one phase report, one status/current-phase pair, and one retained bundle pointer instead of chasing partial M049 state.
