---
id: T05
parent: S08
milestone: M034
provides: []
requires: []
affects: []
key_files: [".tmp/m034-s08/tag-rollout/tag-refs.txt", ".tmp/m034-s08/tag-rollout/rollout-context.json", ".tmp/m034-s08/tag-rollout/command-log.txt", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Do not ask for candidate-tag retarget approval when the repaired target SHA is not a GitHub object; the real blocker is the missing rollout push, not stale tag refs."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Refreshed .tmp/m034-s08/tag-rollout/tag-refs.txt to the current local/remote state, confirmed the task-plan tag-ref presence gate still passes, confirmed the workflow-status gate still fails because release.yml and deploy-services.yml remain failed on the old reroll SHA, and proved the root cause with `gh api repos/snowdamiz/mesh-lang/commits/5e457f3cce9b58d34be6516164b093f253047510 --jq .sha`, which returned HTTP 422 (commit not present remotely)."
completed_at: 2026-03-27T16:59:37.630Z
blocker_discovered: true
---

# T05: Captured the remote-SHA blocker preventing a truthful candidate-tag reroll.

> Captured the remote-SHA blocker preventing a truthful candidate-tag reroll.

## What Happened
---
id: T05
parent: S08
milestone: M034
key_files:
  - .tmp/m034-s08/tag-rollout/tag-refs.txt
  - .tmp/m034-s08/tag-rollout/rollout-context.json
  - .tmp/m034-s08/tag-rollout/command-log.txt
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Do not ask for candidate-tag retarget approval when the repaired target SHA is not a GitHub object; the real blocker is the missing rollout push, not stale tag refs.
duration: ""
verification_result: mixed
completed_at: 2026-03-27T16:59:37.632Z
blocker_discovered: true
---

# T05: Captured the remote-SHA blocker preventing a truthful candidate-tag reroll.

**Captured the remote-SHA blocker preventing a truthful candidate-tag reroll.**

## What Happened

Verified the version-derived candidate tags and refreshed the tag-rollout evidence files, then confirmed the critical mismatch: local HEAD is ahead of origin/main, and the repaired local SHA does not exist on GitHub yet. Because GitHub cannot point refs/tags/v0.1.0 or refs/tags/ext-v0.3.0 at a commit object it does not have, the task-plan retarget/recreate step is currently invalid. No outward mutation was attempted. The durable outcome of this task is blocker evidence plus a knowledge entry telling the next pass to publish the repaired rollout commit to GitHub before retrying tag rerolls.

## Verification

Refreshed .tmp/m034-s08/tag-rollout/tag-refs.txt to the current local/remote state, confirmed the task-plan tag-ref presence gate still passes, confirmed the workflow-status gate still fails because release.yml and deploy-services.yml remain failed on the old reroll SHA, and proved the root cause with `gh api repos/snowdamiz/mesh-lang/commits/5e457f3cce9b58d34be6516164b093f253047510 --jq .sha`, which returned HTTP 422 (commit not present remotely).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -c 'set -euo pipefail; test -s .tmp/m034-s08/tag-rollout/tag-refs.txt; grep -F "refs/tags/v0.1.0" .tmp/m034-s08/tag-rollout/tag-refs.txt; grep -F "refs/tags/ext-v0.3.0" .tmp/m034-s08/tag-rollout/tag-refs.txt'` | 0 | ✅ pass | 29ms |
| 2 | `python3 -c 'import json; from pathlib import Path; summary=json.loads(Path(".tmp/m034-s08/tag-rollout/workflow-status.json").read_text()); expected={"release.yml":"v0.1.0","deploy-services.yml":"v0.1.0","publish-extension.yml":"ext-v0.3.0"}; ...'` | 1 | ❌ fail | 117ms |
| 3 | `gh api repos/snowdamiz/mesh-lang/commits/5e457f3cce9b58d34be6516164b093f253047510 --jq .sha` | 1 | ❌ fail | 484ms |


## Deviations

Did not request approval for remote tag retargeting or mutate any remote refs, because the repaired target SHA is not present on GitHub and the planned outward action would be invalid.

## Known Issues

origin/main and both remote candidate tags still point at 6979a4a17221af8e39200b574aa2209ad54bc983, while local HEAD is 5e457f3cce9b58d34be6516164b093f253047510 and GitHub returns HTTP 422 for that SHA. release.yml and deploy-services.yml therefore remain red on the stale hosted reroll.

## Files Created/Modified

- `.tmp/m034-s08/tag-rollout/tag-refs.txt`
- `.tmp/m034-s08/tag-rollout/rollout-context.json`
- `.tmp/m034-s08/tag-rollout/command-log.txt`
- `.gsd/KNOWLEDGE.md`


## Deviations
Did not request approval for remote tag retargeting or mutate any remote refs, because the repaired target SHA is not present on GitHub and the planned outward action would be invalid.

## Known Issues
origin/main and both remote candidate tags still point at 6979a4a17221af8e39200b574aa2209ad54bc983, while local HEAD is 5e457f3cce9b58d34be6516164b093f253047510 and GitHub returns HTTP 422 for that SHA. release.yml and deploy-services.yml therefore remain red on the stale hosted reroll.
