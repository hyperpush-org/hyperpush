---
estimated_steps: 2
estimated_files: 5
skills_used: []
---

# T05: Close S03 with the live Postgres verifier and named keep-list gate

Why: After the proof-surface pivot and hard-family rewrites, the slice still needs one stable rerunnable acceptance path that proves both behavior and the raw-boundary contract.

Do: Finish the full live-Postgres `e2e_m033_s03.rs` suite on the new harness, then add or update `scripts/verify-m033-s03.sh` so it runs the full S03 test target, Mesher fmt/build checks, and a keep-list sweep naming the only allowed S03 leftovers while excluding the S04-owned partition/catalog raw sites. Make failures point at the drifting proof family or offending function block so future agents do not need to rediscover the boundary by hand.

## Inputs

- `compiler/meshc/tests/e2e_m033_s03.rs`
- `scripts/verify-m033-s03.sh`
- `mesher/storage/queries.mpl`
- `compiler/meshc/tests/e2e_m033_s02.rs`
- `scripts/verify-m033-s02.sh`
- `.gsd/milestones/M033/slices/S03/tasks/T02-SUMMARY.md`

## Expected Output

- `A complete live-Postgres S03 proof bundle covering `basic_reads`, `composed_reads`, and `hard_reads` on the honest verification surface`
- ``scripts/verify-m033-s03.sh` as the stable slice-level acceptance command for tests, Mesher fmt/build, and the explicit S03 raw keep-list gate`
- `Failure messages that name the exact drifting proof family or raw-boundary function instead of requiring manual SQL re-audit`

## Verification

cargo test -p meshc --test e2e_m033_s03 -- --nocapture
cargo run -q -p meshc -- fmt --check mesher
cargo run -q -p meshc -- build mesher
bash scripts/verify-m033-s03.sh
