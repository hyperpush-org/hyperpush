---
phase: 122-repository-reorganization
plan: 01
subsystem: infra
tags: [cargo, workspace, ci, directory-structure, open-source]

# Dependency graph
requires: []
provides:
  - "compiler/ directory with all 11 crates as direct children (flat, no crates/ wrapper)"
  - "mesher/frontend/ with former root frontend/ app"
  - "tools/ with install/, editors/vscode-mesh/, skill/ subdirectories"
  - "Updated root Cargo.toml workspace members pointing to compiler/mesh-*"
  - "Updated CI workflow publish-extension.yml with tools/editors/vscode-mesh paths"
  - "Updated README.md with compiler/meshc install path"
  - "Clean root: only Cargo.toml, Cargo.lock, README.md, LICENSE, .github/, tests/, compiler/, mesher/, website/, tools/"
affects: [phase-123-benchmarks, future-contributors, ci-cd]

# Tech tracking
tech-stack:
  added: []
  patterns: [flat-compiler-layout, tools-directory-convention, mesher-self-contained]

key-files:
  created:
    - "compiler/mesh-common/Cargo.toml"
    - "compiler/meshc/Cargo.toml"
    - "tools/install/install.sh"
    - "tools/install/install.ps1"
    - "tools/editors/vscode-mesh/package.json"
    - "tools/skill/mesh/SKILL.md"
    - "mesher/frontend/package.json"
  modified:
    - "Cargo.toml"
    - ".github/workflows/publish-extension.yml"
    - "README.md"

key-decisions:
  - "Root package.json deleted (not moved to website/) because website/ already has its own real package.json; root was dev-only concurrently wrapper with no production value"
  - "crates/ flattened directly to compiler/ with no intermediate directory — all 11 crates are direct children of compiler/"
  - "mesher_bin binary artifact at root deleted (stale build artifact, never tracked)"
  - "TODO.md and SERVICE_CALL_SEGFAULT.md removed from root as part of cleanup"

patterns-established:
  - "compiler/ is the canonical home for all Mesh compiler crates"
  - "tools/ is the canonical home for install scripts, editor extensions, and agent skills"
  - "mesher/ is self-contained with frontend/ inside it"

requirements-completed: [REPO-01, REPO-02, REPO-03, REPO-04, REPO-05]

# Metrics
duration: 3min
completed: 2026-02-26
---

# Phase 122 Plan 01: Repository Reorganization Summary

**Flat compiler/ layout with tools/ and mesher/frontend/ — all 11 crates moved from crates/ to compiler/, editors/install/skill moved to tools/, frontend moved into mesher/**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-26T05:30:42Z
- **Completed:** 2026-02-26T05:33:13Z
- **Tasks:** 2
- **Files modified:** 14,995+ (renames counted)

## Accomplishments
- Moved all 11 compiler crates from crates/ to compiler/ (flat, git-detected as renames)
- Created tools/ with install/, editors/vscode-mesh/, skill/ subdirectories
- Moved frontend/ into mesher/frontend/ for self-contained mesher directory
- Updated root Cargo.toml workspace members from crates/mesh-* to compiler/mesh-*
- Updated 5 path references in publish-extension.yml from editors/vscode-mesh to tools/editors/vscode-mesh
- Updated README.md cargo install path from crates/meshc to compiler/meshc
- Cleaned root of package.json, package-lock.json, node_modules, mesher_bin, TODO.md, SERVICE_CALL_SEGFAULT.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Move compiler crates and update root Cargo.toml** - `942c722e` (chore)
2. **Task 2: Move remaining dirs, update CI/README, clean root** - `e429615d` (chore)

**Plan metadata:** (docs commit pending)

## Files Created/Modified
- `Cargo.toml` - workspace members updated from crates/mesh-* to compiler/mesh-*
- `compiler/` - new directory containing all 11 compiler crates as direct children
- `mesher/frontend/` - frontend app moved here from root frontend/
- `tools/install/` - install.sh and install.ps1 moved here from root install/
- `tools/editors/vscode-mesh/` - VS Code extension moved here from root editors/vscode-mesh/
- `tools/skill/` - skill/ moved here from root skill/
- `.github/workflows/publish-extension.yml` - all 5 path references updated to tools/editors/vscode-mesh
- `README.md` - cargo install path updated to compiler/meshc

## Decisions Made
- Root package.json deleted rather than moved to website/ — website/ has its own real package.json; root was a dev-only `concurrently` wrapper with no production value
- DS_Store files found in crates/ and editors/ prevented rmdir; cleaned with rm -f before rmdir
- crates/ flattened directly to compiler/ with no intermediate directory per plan specification

## Deviations from Plan

None - plan executed exactly as written. The only minor issue was DS_Store files preventing rmdir of crates/ and editors/ directories, handled inline as expected macOS behavior.

## Issues Encountered
- macOS DS_Store files in crates/ and editors/ prevented `rmdir` — removed with `rm -f` before rmdir (expected macOS behavior, not a real issue)
- install.sh and install.ps1 had no crates/ references, so no updates needed there (confirmed via grep)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Repository structure is now clean and navigable for open source
- Phase 123 (Benchmarks) can proceed — repo is stable with new layout
- All CI workflows reference correct new paths
- Cargo workspace is valid with all 11 crates under compiler/

---
*Phase: 122-repository-reorganization*
*Completed: 2026-02-26*
