---
estimated_steps: 2
estimated_files: 8
skills_used: []
---

# T04: Retire the hard whole-query raw read families on the new proof surface

Why: Once the proof surface is honest again, S03 still has to retire the slice-owned whole-query raw families rather than leaving the main raw tail untouched.

Do: Rewrite `list_issues_filtered`, `project_health_summary`, `get_event_neighbors`, and `evaluate_threshold_rule` to use conditional builder-backed reads plus small Mesh-side composition, then add named `hard_reads` proofs on the Mesher-backed harness. Re-evaluate `extract_event_fields`, `check_volume_spikes`, and `check_sample_rate` after the rewrite pass; retire any that become honest, and keep only the genuinely dishonest leftovers in an explicit named keep-list with justification instead of hiding them behind a fake universal query abstraction.

## Inputs

- `compiler/meshc/tests/e2e_m033_s03.rs`
- `mesher/storage/queries.mpl`
- `mesher/api/search.mpl`
- `mesher/api/dashboard.mpl`
- `mesher/api/detail.mpl`
- `mesher/api/alerts.mpl`
- `mesher/ingestion/pipeline.mpl`
- `mesher/ingestion/routes.mpl`
- `.gsd/KNOWLEDGE.md`

## Expected Output

- ``list_issues_filtered`, `project_health_summary`, `get_event_neighbors`, and `evaluate_threshold_rule` no longer depend on whole-query `Repo.query_raw(...)` strings`
- `Passing `e2e_m033_s03_hard_reads_*` proofs that preserve exact output keys, ordering/cursor behavior, and threshold-evaluation semantics on the real Mesher path`
- `A short explicit raw keep-list containing only the still-dishonest leftovers, with each remaining site named and justified`

## Verification

cargo test -p meshc --test e2e_m033_s03 hard_reads -- --nocapture
cargo run -q -p meshc -- build mesher

## Observability Impact

- Signals added/changed: full `e2e_m033_s03_*` failures and verifier keep-list errors become the canonical S03 diagnostic surfaces
- How a future agent inspects this: rerun `cargo test -p meshc --test e2e_m033_s03 -- --nocapture` or `bash scripts/verify-m033-s03.sh` and inspect the first named failure
- Failure state exposed: the exact drifting proof family or function block is named without requiring a fresh repo-wide raw SQL audit
