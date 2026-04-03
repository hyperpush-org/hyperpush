---
id: T02
parent: S05
milestone: M049
provides: []
requires: []
affects: []
key_files: ["compiler/meshc/tests/e2e_m039_s01.rs", ".tmp/m039-s01/verify/phase-report.txt", ".tmp/m039-s01/verify/04-e2e-node-loss.log"]
key_decisions: ["Keep the one-node membership assertion after standby loss, but allow post-loss authority `replication_health` to be `unavailable` or `degraded` instead of the older `local_only` expectation."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`bash scripts/verify-m039-s01.sh` passed end to end and rewrote a complete retained `.tmp/m039-s01/verify/` directory with green convergence and node-loss phases."
completed_at: 2026-04-03T09:16:45.603Z
blocker_discovered: false
---

# T02: Repaired the retained M039 node-loss rail to current post-loss authority truth and restored a green standalone verifier bundle.

> Repaired the retained M039 node-loss rail to current post-loss authority truth and restored a green standalone verifier bundle.

## What Happened
---
id: T02
parent: S05
milestone: M049
key_files:
  - compiler/meshc/tests/e2e_m039_s01.rs
  - .tmp/m039-s01/verify/phase-report.txt
  - .tmp/m039-s01/verify/04-e2e-node-loss.log
key_decisions:
  - Keep the one-node membership assertion after standby loss, but allow post-loss authority `replication_health` to be `unavailable` or `degraded` instead of the older `local_only` expectation.
duration: ""
verification_result: passed
completed_at: 2026-04-03T09:16:45.605Z
blocker_discovered: false
---

# T02: Repaired the retained M039 node-loss rail to current post-loss authority truth and restored a green standalone verifier bundle.

**Repaired the retained M039 node-loss rail to current post-loss authority truth and restored a green standalone verifier bundle.**

## What Happened

Reproduced the independently red retained M039 node-loss seam, inspected the archived `cluster-status-primary-after-loss` artifacts, and updated the retained expectation in `compiler/meshc/tests/e2e_m039_s01.rs` to match current route-free startup-work truth. The rail still requires one-node membership convergence after the standby is killed, but it now treats post-loss authority `replication_health` of `unavailable` or `degraded` as truthful runtime-owned startup continuity state instead of timing out waiting for the older `local_only` value. After the expectation repair, the standalone retained wrapper completed successfully and restored the full `.tmp/m039-s01/verify/` bundle that S05 replays.

## Verification

`bash scripts/verify-m039-s01.sh` passed end to end and rewrote a complete retained `.tmp/m039-s01/verify/` directory with green convergence and node-loss phases.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-m039-s01.sh` | 0 | ✅ pass | 165400ms |


## Deviations

No deviations from the repair plan. The retained phase/file contract and wrapper-facing markers stayed intact.

## Known Issues

None.

## Files Created/Modified

- `compiler/meshc/tests/e2e_m039_s01.rs`
- `.tmp/m039-s01/verify/phase-report.txt`
- `.tmp/m039-s01/verify/04-e2e-node-loss.log`


## Deviations
No deviations from the repair plan. The retained phase/file contract and wrapper-facing markers stayed intact.

## Known Issues
None.
