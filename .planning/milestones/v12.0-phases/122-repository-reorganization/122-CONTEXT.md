# Phase 122: Repository Reorganization - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Move repo contents into a clean top-level directory structure for open source readability: `compiler/`, `mesher/`, `website/`, `tools/`. All build tooling must continue to work from the root after the move.

</domain>

<decisions>
## Implementation Decisions

### Target directory mapping

| From | To |
|------|----|
| `crates/mesh-*/` | `compiler/mesh-*/` (flat, no crates/ subdirectory) |
| `mesher/` | stays `mesher/` |
| `mesher/` + `frontend/` | `frontend/` moves to `mesher/frontend/` |
| `website/` | stays `website/` |
| Root `package.json`, `node_modules/` | move to `website/` |
| `install/` | `tools/install/` |
| `editors/vscode-mesh/` | `tools/editors/vscode-mesh/` |
| `skill/` | `tools/skill/` |
| `tests/` | stays at root |

### Root after reorganization
Minimal Rust-first root. Root contains only: `Cargo.toml`, `Cargo.lock`, `README.md`, `LICENSE`, `.github/`, `tests/`, and the top-level component dirs (`compiler/`, `mesher/`, `website/`, `tools/`). `TODO.md` and root `package.json`/`node_modules` are removed from root.

### Cargo workspace structure
- Root `Cargo.toml` remains the workspace manifest (no change to where `cargo build` is run from)
- Member paths update from `"crates/mesh-*"` to `"compiler/mesh-*"`
- `compiler/` is flat: each crate is a direct child (`compiler/mesh-lexer/`, `compiler/meshc/`, etc.)
- No `Cargo.toml` inside `compiler/` itself — the root workspace file owns everything

### tools/ internal structure
Subdirectory layout:
- `tools/install/install.sh` and `tools/install/install.ps1`
- `tools/editors/vscode-mesh/`
- `tools/skill/mesh/`

No new Makefile or build scripts — only move existing artifacts.

### Reference updates
**All** references to old paths are updated in one pass: Cargo.toml workspace members, GitHub Actions workflow files, README.md, any docs or scripts that reference `crates/`, `install/`, `editors/`.

### Migration execution
- **One atomic commit** for the entire reorganization
- **Clean move** (not `git mv`) — preserving git history is not required
- CI must pass after the single commit: `cargo build` from root, Mesher E2E verification, website dev server

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for the mechanics of the move.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 122-repository-reorganization*
*Context gathered: 2026-02-26*
