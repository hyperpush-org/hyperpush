# S05 Replan

**Milestone:** M049
**Slice:** S05
**Blocker Task:** T01
**Created:** 2026-04-03T05:36:27.382Z

## Blocker Description

`bash scripts/verify-m049-s05.sh` now reaches the retained replay stack but stops at the independently red `bash scripts/verify-m039-s01.sh` rail before any retained-copy phases run. The retained M039 node-loss proof is still expecting the older post-loss authority shape; on the current route-free startup path the surviving primary can already show correct one-node membership while `replication_health` is `unavailable` or `degraded`, and some runs also log startup-work owner-loss / `automatic_promotion_rejected:not_standby` noise. Until that historical M039 contract is made truthful again, the assembled M049 wrapper cannot emit `latest-proof-bundle.txt` or the copied retained bundle.

## What Changed

Replaced the old docs-first T02 with a blocker-first sequence. T02 now repairs the retained M039 S01 node-loss rail to current route-free/runtime truth, T03 reruns `verify-m049-s05` to completion and proves the retained bundle shape, and T04 adds the bounded README/tooling discoverability once the assembled verifier is green. Threat surface unchanged; requirement impact unchanged (still the R116 assembled-verifier contract).
