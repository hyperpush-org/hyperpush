---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T02: Repair the retained M039 node-loss rail so the assembled wrapper can finish

Use the retained `.tmp/m039-s01` failure artifacts to update the independently red `scripts/verify-m039-s01.sh` / `compiler/meshc/tests/e2e_m039_s01.rs` seam to current route-free startup-work truth.

1. Reproduce the retained `m039-s01` failure and read the archived `cluster-status-primary-after-loss` snapshots instead of guessing.
2. Update the node-loss expectation so the rail keeps asserting one-node membership convergence after standby loss, while post-loss authority `replication_health` may truthfully reflect the runtime-owned startup continuity state (`unavailable` or `degraded`) instead of the older `local_only` assumption.
3. Preserve the retained phase/file contract that `verify-m049-s05` already replays; do not rename phase markers or relax real membership drift.
4. Re-run the standalone M039 verifier until it is green and the retained verify directory is complete again.

## Inputs

- `.tmp/m039-s01/verify/04-e2e-node-loss.log`
- `.tmp/m039-s01/e2e-m039-s01-node-loss-*/cluster-status-primary-after-loss.timeout.txt`
- `compiler/meshc/tests/e2e_m039_s01.rs`
- `scripts/verify-m039-s01.sh`

## Expected Output

- `.tmp/m039-s01/verify/phase-report.txt`
- `.tmp/m039-s01/verify/04-e2e-node-loss.log`

## Verification

bash scripts/verify-m039-s01.sh

## Observability Impact

Keeps the retained M039 node-loss rail truthful by surfacing the accepted post-loss authority states directly in the test/verifier contract instead of timing out on already-correct membership snapshots.
