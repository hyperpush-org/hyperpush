---
id: T02
parent: S01
milestone: M034
provides: []
requires: []
affects: []
key_files: ["scripts/verify-m034-s01.sh", "scripts/fixtures/m034-s01-proof-package/mesh.toml.template", "scripts/fixtures/m034-s01-proof-package/registry_proof.mpl", "scripts/fixtures/m034-s01-consumer/mesh.toml.template", "scripts/fixtures/m034-s01-consumer/main.mpl", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Use one canonical verifier script that builds local meshpkg/meshc binaries once, then checks publish metadata, exact download URLs, lockfile truth, duplicate publish rejection, and package/search page visibility from a single run directory under .tmp/m034-s01/verify/<version>.", "Render reproducible proof-package and consumer workspaces from checked-in fixture templates so the live verifier proves quoted scoped dependency keys and compiler resolution against deterministic inputs rather than inline shell heredocs."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed bash syntax verification and the fast negative-path gates that do not require live credentials: bash -n scripts/verify-m034-s01.sh, env -u MESH_PUBLISH_OWNER -u MESH_PUBLISH_TOKEN bash scripts/verify-m034-s01.sh, and MESH_PUBLISH_OWNER=acme MESH_PUBLISH_TOKEN=dummy MESH_PROOF_VERSION='bad/version' bash scripts/verify-m034-s01.sh. Also confirmed from packages-website/src/routes/token/+page.svelte and registry/src/routes/auth.rs that the missing owner/token pair must come from the packages website token flow. The authoritative happy-path command bash scripts/verify-m034-s01.sh remains pending a real dashboard-issued owner/token pair."
completed_at: 2026-03-26T20:54:45.608Z
blocker_discovered: false
---

# T02: Added the M034 real-registry verifier script and scoped proof fixtures, but the live publish/install proof still needs a real dashboard-issued owner/token pair to run end to end.

> Added the M034 real-registry verifier script and scoped proof fixtures, but the live publish/install proof still needs a real dashboard-issued owner/token pair to run end to end.

## What Happened
---
id: T02
parent: S01
milestone: M034
key_files:
  - scripts/verify-m034-s01.sh
  - scripts/fixtures/m034-s01-proof-package/mesh.toml.template
  - scripts/fixtures/m034-s01-proof-package/registry_proof.mpl
  - scripts/fixtures/m034-s01-consumer/mesh.toml.template
  - scripts/fixtures/m034-s01-consumer/main.mpl
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Use one canonical verifier script that builds local meshpkg/meshc binaries once, then checks publish metadata, exact download URLs, lockfile truth, duplicate publish rejection, and package/search page visibility from a single run directory under .tmp/m034-s01/verify/<version>.
  - Render reproducible proof-package and consumer workspaces from checked-in fixture templates so the live verifier proves quoted scoped dependency keys and compiler resolution against deterministic inputs rather than inline shell heredocs.
duration: ""
verification_result: passed
completed_at: 2026-03-26T20:54:45.609Z
blocker_discovered: false
---

# T02: Added the M034 real-registry verifier script and scoped proof fixtures, but the live publish/install proof still needs a real dashboard-issued owner/token pair to run end to end.

**Added the M034 real-registry verifier script and scoped proof fixtures, but the live publish/install proof still needs a real dashboard-issued owner/token pair to run end to end.**

## What Happened

Added checked-in proof-package and consumer fixtures under scripts/fixtures and implemented scripts/verify-m034-s01.sh as the canonical repo-local verifier for the real registry path. The script isolates HOME under .tmp/m034-s01/home, validates the env contract, generates a unique proof version, renders deterministic workspaces from templates, builds local meshpkg/meshc binaries once, then drives meshpkg --json login/publish/install plus direct registry HTTP checks, tarball SHA validation, lockfile assertions, consumer build/run proof, duplicate publish rejection, and exact package/search page visibility checks while persisting phase artifacts under .tmp/m034-s01/verify/<version>/. I also recorded the non-obvious credential flow in .gsd/KNOWLEDGE.md after confirming from the repo that publish credentials come from the packages site /publish -> GitHub auth -> /token flow. The only unfinished piece is environment-side: secure_env_collect was attempted, but both MESH_PUBLISH_OWNER and MESH_PUBLISH_TOKEN were skipped, so the real bash scripts/verify-m034-s01.sh run could not be exercised in this session.

## Verification

Passed bash syntax verification and the fast negative-path gates that do not require live credentials: bash -n scripts/verify-m034-s01.sh, env -u MESH_PUBLISH_OWNER -u MESH_PUBLISH_TOKEN bash scripts/verify-m034-s01.sh, and MESH_PUBLISH_OWNER=acme MESH_PUBLISH_TOKEN=dummy MESH_PROOF_VERSION='bad/version' bash scripts/verify-m034-s01.sh. Also confirmed from packages-website/src/routes/token/+page.svelte and registry/src/routes/auth.rs that the missing owner/token pair must come from the packages website token flow. The authoritative happy-path command bash scripts/verify-m034-s01.sh remains pending a real dashboard-issued owner/token pair.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/verify-m034-s01.sh` | 0 | ✅ pass | 11ms |
| 2 | `env -u MESH_PUBLISH_OWNER -u MESH_PUBLISH_TOKEN bash scripts/verify-m034-s01.sh` | 1 | ✅ pass | 14ms |
| 3 | `MESH_PUBLISH_OWNER=acme MESH_PUBLISH_TOKEN=dummy MESH_PROOF_VERSION='bad/version' bash scripts/verify-m034-s01.sh` | 1 | ✅ pass | 40ms |


## Deviations

None in implementation. Verification was partial only because the required live publish credentials were unavailable and secure collection was skipped.

## Known Issues

The task-plan happy-path verifier run against the real registry is still pending a real MESH_PUBLISH_OWNER and MESH_PUBLISH_TOKEN from the packages website token flow at https://packages.meshlang.dev/publish.

## Files Created/Modified

- `scripts/verify-m034-s01.sh`
- `scripts/fixtures/m034-s01-proof-package/mesh.toml.template`
- `scripts/fixtures/m034-s01-proof-package/registry_proof.mpl`
- `scripts/fixtures/m034-s01-consumer/mesh.toml.template`
- `scripts/fixtures/m034-s01-consumer/main.mpl`
- `.gsd/KNOWLEDGE.md`


## Deviations
None in implementation. Verification was partial only because the required live publish credentials were unavailable and secure collection was skipped.

## Known Issues
The task-plan happy-path verifier run against the real registry is still pending a real MESH_PUBLISH_OWNER and MESH_PUBLISH_TOKEN from the packages website token flow at https://packages.meshlang.dev/publish.
