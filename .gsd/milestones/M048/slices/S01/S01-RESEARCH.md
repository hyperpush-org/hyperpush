# M048 / S01 — Research

## Summary

- **Primary requirement:** S01 is the first real delivery slice for **R112** — default `main.mpl` plus an optional manifest override for the executable entry file. It does **not** need to solve self-update (`R113`) or editor/skill truth (`R114`) yet.
- The manifest seam is already in the right place: `mesh_pkg::Manifest` is shared by `meshc` and `mesh-lsp`, and `Package` is **not** `deny_unknown_fields`, so an optional package-level entry override is easy to parse without loosening policy elsewhere.
- The hard part is **not TOML parsing**. The hard part is the repeated **root-`main.mpl` sentinel** in build, module discovery, and test discovery.
- `meshc build` currently fails **before** manifest parsing if root `main.mpl` is missing, so adding a manifest field alone will do nothing.
- `meshc test` is currently **dishonest** for override-entry projects:
  - `meshc test <project>` can go green because the runner ignores `mesh.toml` and compiles a synthetic `main.mpl`.
  - `meshc test <tests-dir>` fails because project-root discovery climbs ancestors looking only for `main.mpl`.
  - `meshc test <specific-file>` can fall back to the repo CWD and drag unrelated repo sources into the temp compile.
- The planner should treat this slice as **two real seams plus one proof seam**:
  1. manifest + compiler entry resolution
  2. test-runner root/entry handling
  3. one dedicated proof target that covers both default and override contracts

## Requirement Focus

- **Owns:** `R112` — executable entrypoint contract moves from hardcoded root `main.mpl` to default-plus-override.
- **Out of slice:** `R113` self-update, `R114` syntax/init-skill parity.
- **Downstream note only:** `compiler/mesh-lsp` and Neovim duplicate the same `main.mpl` assumption, but that is explicitly S02 work.

## Skills Discovered

- Existing installed skills were sufficient; no new installs were needed.
- Relevant skills used:
  - `rust-best-practices`
    - keep the resolver as a **small explicit helper** returning `Result`, not a clever new framework
    - prefer a boring shared manifest helper over scattered string/path checks
  - `rust-testing`
    - prove the **behavioral contract** (`build`, `test <project>`, `test <tests-dir>`, `test <file>`) instead of only unit-testing helper functions
    - use descriptive scenario-level integration tests for the red/green contract

## Current Red State (reproduced)

I created a probe project at `.tmp/m048-s01-probe/project/` with:
- `mesh.toml` containing `entrypoint = "lib/start.mpl"`
- `lib/start.mpl` as the only executable entry file
- no root `main.mpl`
- one support module and one test file

### Commands and outcomes

- `cargo run -q -p meshc -- build .tmp/m048-s01-probe/project`
  - **fails** with `No 'main.mpl' found ... Mesh projects must have a main.mpl entry point.`
- `cargo run -q -p meshc -- test .tmp/m048-s01-probe/project`
  - **passes** (`1 passed`) even though `build` on the same project fails
  - this is a **false green** caused by the synthetic test `main.mpl` path ignoring `mesh.toml`
- `cargo run -q -p meshc -- test .tmp/m048-s01-probe/project/tests`
  - **fails** with `module 'Support' not found`
  - root detection latched onto the tests dir instead of the project root because no ancestor had root `main.mpl`
- `cargo run -q -p meshc -- test .tmp/m048-s01-probe/project/tests/basic.test.mpl`
  - **fails noisily** with unrelated parse/module errors
  - source read explains why: specific-file resolution falls back to the repo CWD when no `main.mpl` ancestor is found

These four commands are the slice’s current red-state map.

## Implementation Landscape

| File | What it does now | Why it matters for S01 |
|---|---|---|
| `compiler/mesh-pkg/src/manifest.rs:10-28, 328-359` | Shared `mesh.toml` parsing for `meshc` and `mesh-lsp`. `Manifest` and `Package` are permissive; only legacy `[cluster]` shapes are explicitly rejected. | Best place to add an optional package-level entry override plus lexical validation helper(s). |
| `compiler/meshc/src/main.rs:418-446` | `prepare_project_build(...)` checks for `dir/main.mpl` **before** reading `mesh.toml`, then asks discovery to build the project and finds the `is_entry` module. | This ordering currently blocks any manifest-driven entry contract. |
| `compiler/meshc/src/discovery.rs:40-66, 229-287` | Discovery treats root `main.mpl` as special in two ways: `path_to_module_name()` returns `None`, and `build_project()` marks `relative_path == "main.mpl"` as `is_entry`. | S01 needs entry selection decoupled from module naming. |
| `compiler/meshc/src/test_runner.rs:59-117, 172-177, 1077-1121` | Project-root detection looks for ancestor `main.mpl`; tests compile synthetic `main.mpl`; temp builds copy project `.mpl` sources but **not** `mesh.toml`; only root `main.mpl` is excluded from copied sources. | This is the biggest S01 drift seam. Root detection, temp-manifest handling, and executable-file exclusion all need to change together. |
| `compiler/meshc/tests/tooling_e2e.rs:212-300` | Existing CLI contract tests cover default `meshc test <tests-dir>` and `meshc test <project-dir>` behavior. No override-entry cases; no specific-file coverage. | Good secondary regression surface, but not strong enough alone. |
| `compiler/meshc/tests/e2e.rs:1699-1749` and newer `e2e_m0xx` targets like `compiler/meshc/tests/e2e_m047_s02.rs` | Existing pattern for self-contained temp-project integration targets with retained artifacts and explicit CLI invocation. | Best home for a dedicated S01 proof target (`e2e_m048_s01.rs`). |
| `compiler/mesh-lsp/src/analysis.rs:300-318, 498-521, 582-590` | Duplicates project discovery and still keys project-awareness off ancestor `main.mpl`. | Not S01 scope, but planner should leave a reusable seam for S02. |
| `tools/editors/neovim-mesh/lua/mesh.lua:4, 128-160` and `tools/editors/neovim-mesh/lsp/mesh.lua:1-6` | Neovim root detection and root markers still prefer `main.mpl`. | Downstream duplicate of the same contract; defer to S02. |
| `compiler/mesh-pkg/src/scaffold.rs:60-139` | Generated projects keep `mesh.toml` package-only and write `main.mpl` as the default executable file. | Important constraint: a new key under `[package]` fits the existing “package-only manifest” story better than inventing a new top-level table. |

## Recommendation

### 1. Keep the config shape boring and local

The natural contract is an **optional relative file path under `[package]`**, e.g.:

```toml
[package]
name = "demo"
version = "0.1.0"
entrypoint = "lib/start.mpl"
```

Why this is the cleanest S01 shape:
- it keeps `mesh.toml` **package-only**, matching the current scaffold/readme story
- it fits the already-shared `mesh_pkg::Manifest` surface
- it avoids inventing a new `[executable]` or top-level table that later slices would have to explain everywhere

If the planner wants to defer the final public spelling, isolate the logic behind one helper so the field can still be renamed later without reopening build/test code.

### 2. Resolve entry before discovery, not after

The compiler path should become:
1. validate `dir` exists/is a directory
2. load `mesh.toml` if present
3. resolve `entry_relative_path` = manifest override or default `main.mpl`
4. validate the resolved entry path exists inside the project
5. pass that resolved path into discovery/build

Current `main.rs` does step 3 **after** hard-failing on root `main.mpl`; that order has to flip.

### 3. Decouple module naming from entry selection

`compiler/meshc/src/discovery.rs` currently uses root `main.mpl` as both:
- the signal for `is_entry`
- the reason `path_to_module_name()` returns `None`

That coupling is the wrong seam for override entries.

Recommended shape:
- `entry_relative_path` decides **only** `is_entry`
- module naming stays path-based
- root `main.mpl` can still map to `Main`
- non-root entry files (e.g. `lib/start.mpl`) should keep their path-derived module name (e.g. `Lib.Start`) while also being marked `is_entry`

That preserves sane import/module behavior and avoids a special-case “all entry modules are named Main” trap.

### 4. Treat test runner as a real entry-contract consumer

`meshc test` currently has to be fixed in three places together:

#### Project-root detection
- prefer nearest ancestor containing `mesh.toml`
- fall back to ancestor `main.mpl` only for old manifest-less projects
- do **not** keep the current `specific-file -> cwd` fallback when no `main.mpl` ancestor exists

#### Temp project manifest handling
The temp compile directory currently gets only copied `.mpl` sources plus generated `main.mpl`.
That means it cannot honor or even inspect the original entry config.

Recommended S01 behavior:
- either synthesize a temp `mesh.toml` with the same package/dependency info and **entrypoint rewritten to `main.mpl`**
- or synthesize a minimal manifest with no override so default `main.mpl` is used

Either way, the test harness must explicitly select the synthetic test entry, not accidentally inherit the original executable entry.

#### Source copying / exclusion
`copy_project_sources_to_tmp(...)` should exclude the **resolved project entry file**, not just root `main.mpl`.
That preserves the current contract: the test source replaces the project executable, whatever file that executable came from.

### 5. Use one dedicated proof target for S01

The slice is risky enough that it should get its own target, e.g. `compiler/meshc/tests/e2e_m048_s01.rs`, rather than hiding the proof in generic `tooling_e2e`.

Recommended scenarios:

1. **Default control** — manifest absent or no override; root `main.mpl` still builds/runs unchanged.
2. **Override wins when both exist** — project has both root `main.mpl` and `lib/start.mpl`; manifest points at `lib/start.mpl`; built binary proves the override output, not the default one.
3. **Override without root main** — project with only `lib/start.mpl` builds/runs successfully.
4. **Tests-dir target works without root main** — `meshc test <project/tests>` passes for an override-entry project.
5. **Specific-file target works without root main** — `meshc test <project/tests/file.test.mpl>` passes for the same kind of project.

Optional but useful behavior proof:
6. **Runner excludes configured entry file** — a test-only fixture where the configured entry file would break compilation if copied, proving the runner still replaces the executable entry instead of compiling through it.

This follows the `rust-testing` rule that the real contract is behavior-level, not just helper-level.

## Natural Task Seams

### T1 — Manifest + compiler entry resolution
**Files:**
- `compiler/mesh-pkg/src/manifest.rs`
- `compiler/meshc/src/main.rs`
- `compiler/meshc/src/discovery.rs`

**Goal:** resolve an optional manifest entry path and thread it through build/discovery without changing default projects.

**Notes:**
- this is the riskiest build seam
- do not drag LSP/editor adoption into this task

### T2 — Test discovery and temp-project contract
**Files:**
- `compiler/meshc/src/test_runner.rs`
- possibly small helper extraction if needed for manifest-aware project-root detection

**Goal:** make `meshc test` honor the same project-root and executable contract as build, while preserving the current “synthetic test main replaces project executable” behavior.

**Notes:**
- this is where the current false-green and wrong-cwd bugs live
- tests-dir and specific-file targets must both be covered

### T3 — Proof rail
**Files:**
- `compiler/meshc/tests/e2e_m048_s01.rs` (new)
- optionally `compiler/meshc/tests/tooling_e2e.rs` for secondary CLI regressions

**Goal:** add one named acceptance target that proves default + override build behavior and the non-root-main test discovery contract.

**Notes:**
- do not rely on `meshc test <project>` alone; it is already misleading today

## Risks / Watchouts

- **False-green trap:** `meshc test <project>` on an override-entry project can already pass today while `meshc build <project>` fails on the same tree.
- **Coupling trap:** if `path_to_module_name()` keeps encoding entry selection, override-entry projects will either get the wrong module name or need more special cases later.
- **Fallback trap:** keeping `specific-file -> cwd` as the no-root fallback will keep contaminating test runs with unrelated repo sources.
- **Manifest-required trap:** do not accidentally make `meshc build` require `mesh.toml`; S01 needs to keep root-`main.mpl` no-manifest projects working as the simple default.
- **Scope trap:** `mesh-lsp` and Neovim are obvious duplicates, but fixing them here would overrun S01. Leave them as explicit downstream adoption work for S02.

## Verification

### Current red-state reference

Use these exact commands if the planner/executor needs to confirm the current failure shapes:

- `cargo run -q -p meshc -- build .tmp/m048-s01-probe/project`
- `cargo run -q -p meshc -- test .tmp/m048-s01-probe/project`
- `cargo run -q -p meshc -- test .tmp/m048-s01-probe/project/tests`
- `cargo run -q -p meshc -- test .tmp/m048-s01-probe/project/tests/basic.test.mpl`

### Recommended green acceptance rail

Make the authoritative S01 closeout command:

- `cargo test -p meshc --test e2e_m048_s01 -- --nocapture`

Secondary regression rail only if useful:

- `cargo test -p meshc --test tooling_e2e test_test_ -- --nocapture`

But the dedicated `e2e_m048_s01` target should be the real acceptance surface, because it can express the override-entry red/green behavior directly.

## Forward Intelligence

- `compiler/mesh-lsp/src/analysis.rs` duplicates the same discovery logic (`find_project_root`, `path_to_module_name`, `discover_mesh_files`, `is_entry = relative_path == "main.mpl"`). If S01 extracts only a **small manifest entry resolver**, S02 can adopt it cheaply. If S01 extracts a bigger shared project/discovery helper cleanly, S02 gets even easier — but that should be opportunistic, not a reason to widen S01.
- Neovim still advertises `main.mpl` as the workspace root marker in both `tools/editors/neovim-mesh/lua/mesh.lua` and `tools/editors/neovim-mesh/lsp/mesh.lua`. Do not mistake S01 green compiler/test behavior for end-to-end entrypoint support; that editor/LSP adoption is still pending.
- `compiler/mesh-pkg/src/scaffold.rs` and existing docs repeatedly describe `mesh.toml` as package-only. That is a strong argument for keeping the override under `[package]` instead of inventing a second config surface.
