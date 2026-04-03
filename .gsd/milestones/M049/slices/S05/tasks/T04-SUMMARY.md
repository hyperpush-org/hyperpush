---
id: T04
parent: S05
milestone: M049
provides: []
requires: []
affects: []
key_files: ["README.md", "website/docs/docs/tooling/index.md", "scripts/tests/verify-m049-s05-contract.test.mjs"]
key_decisions: ["Keep discoverability bounded to `README.md` and `website/docs/docs/tooling/index.md` so historical clustered proof rails do not re-emerge as a second public onboarding path.", "Describe the older rail as the retained M048 tooling verifier in tooling docs instead of reusing the exact `bash scripts/verify-m048-s05.sh` literal inside the new S05 paragraph."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed for the new discoverability wording, and `node --test scripts/tests/verify-m048-s05-contract.test.mjs` passed to confirm the bounded S05 wording did not break retained M048 tool-truth markers."
completed_at: 2026-04-03T09:17:10.896Z
blocker_discovered: false
---

# T04: Added bounded README/tooling discoverability for the green assembled verifier and pinned that wording with a fail-closed Node docs contract.

> Added bounded README/tooling discoverability for the green assembled verifier and pinned that wording with a fail-closed Node docs contract.

## What Happened
---
id: T04
parent: S05
milestone: M049
key_files:
  - README.md
  - website/docs/docs/tooling/index.md
  - scripts/tests/verify-m049-s05-contract.test.mjs
key_decisions:
  - Keep discoverability bounded to `README.md` and `website/docs/docs/tooling/index.md` so historical clustered proof rails do not re-emerge as a second public onboarding path.
  - Describe the older rail as the retained M048 tooling verifier in tooling docs instead of reusing the exact `bash scripts/verify-m048-s05.sh` literal inside the new S05 paragraph.
duration: ""
verification_result: passed
completed_at: 2026-04-03T09:17:10.896Z
blocker_discovered: false
---

# T04: Added bounded README/tooling discoverability for the green assembled verifier and pinned that wording with a fail-closed Node docs contract.

**Added bounded README/tooling discoverability for the green assembled verifier and pinned that wording with a fail-closed Node docs contract.**

## What Happened

Added one bounded README mention and one bounded tooling-doc mention for `bash scripts/verify-m049-s05.sh`, keeping the public wording narrow: scaffold/examples-first onboarding stays primary, SQLite remains the honest local starter, Postgres remains the serious shared/deployable starter, and historical clustered rails stay subordinate retained evidence. The existing Node contract was extended so missing S05 verifier text, a collapsed SQLite/Postgres split, or unbounded historical-proof wording now fails closed. I also rechecked the retained M048 docs contract so the new wording does not accidentally erase older tool-truth markers.

## Verification

`node --test scripts/tests/verify-m049-s05-contract.test.mjs` passed for the new discoverability wording, and `node --test scripts/tests/verify-m048-s05-contract.test.mjs` passed to confirm the bounded S05 wording did not break retained M048 tool-truth markers.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/tests/verify-m049-s05-contract.test.mjs` | 0 | ✅ pass | 940ms |
| 2 | `node --test scripts/tests/verify-m048-s05-contract.test.mjs` | 0 | ✅ pass | 819ms |


## Deviations

While adding the new bounded mention, I also reran the retained M048 docs contract because an intermediate wording change had previously collided with its mutation-based verifier marker.

## Known Issues

None.

## Files Created/Modified

- `README.md`
- `website/docs/docs/tooling/index.md`
- `scripts/tests/verify-m049-s05-contract.test.mjs`


## Deviations
While adding the new bounded mention, I also reran the retained M048 docs contract because an intermediate wording change had previously collided with its mutation-based verifier marker.

## Known Issues
None.
