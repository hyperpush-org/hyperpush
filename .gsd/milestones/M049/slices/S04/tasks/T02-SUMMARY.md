---
id: T02
parent: S04
milestone: M049
provides: []
requires: []
affects: []
key_files: ["scripts/fixtures/clustered/cluster-proof/README.md", "scripts/fixtures/clustered/cluster-proof/Dockerfile", "scripts/fixtures/clustered/cluster-proof/fly.toml", "scripts/fixtures/clustered/cluster-proof/tests/work.test.mpl", "compiler/meshc/tests/support/m046_route_free.rs", "compiler/meshc/tests/e2e_m046_s04.rs", "compiler/meshc/tests/e2e_m045_s02.rs", "compiler/meshc/tests/support/m047_todo_scaffold.rs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Use `compiler/meshc/tests/support/m046_route_free.rs` as the shared owner of cluster-proof fixture discovery and Dockerfile path constants instead of open-coded repo-root literals.", "Keep relocated clustered proof fixtures source-only by deleting the in-place binary that `meshc build <fixture>` writes after verification replays."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Task-owned verification passed against the relocated fixture after the repo-root `cluster-proof/` directory was deleted: direct `meshc test` and `meshc build` worked on `scripts/fixtures/clustered/cluster-proof`, `cargo test -p meshc --test e2e_m046_s04 -- --nocapture` and `cargo test -p meshc --test e2e_m045_s02 -- --nocapture` both stayed green on the moved helper/path contract, the narrowed structural check confirmed the root directory is gone and the Todo builder resolves the shared fixture Dockerfile constant, and the targeted M047 Docker rail proved the helper image still builds through the moved `cluster-proof` Dockerfile. Slice-level verification is still partially red, as expected for an intermediate task: `bash scripts/verify-m039-s01.sh` still shells `meshc build cluster-proof`, and `bash scripts/verify-m045-s02.sh` still bootstraps through `e2e_m045_s01`, which has its own stale repo-root `cluster-proof` assumptions plus an older scaffold handler expectation."
completed_at: 2026-04-03T02:40:20.064Z
blocker_discovered: false
---

# T02: Relocated `cluster-proof` into `scripts/fixtures/clustered/cluster-proof` and retargeted the route-free package, scaffold, and Todo Docker consumers.

> Relocated `cluster-proof` into `scripts/fixtures/clustered/cluster-proof` and retargeted the route-free package, scaffold, and Todo Docker consumers.

## What Happened
---
id: T02
parent: S04
milestone: M049
key_files:
  - scripts/fixtures/clustered/cluster-proof/README.md
  - scripts/fixtures/clustered/cluster-proof/Dockerfile
  - scripts/fixtures/clustered/cluster-proof/fly.toml
  - scripts/fixtures/clustered/cluster-proof/tests/work.test.mpl
  - compiler/meshc/tests/support/m046_route_free.rs
  - compiler/meshc/tests/e2e_m046_s04.rs
  - compiler/meshc/tests/e2e_m045_s02.rs
  - compiler/meshc/tests/support/m047_todo_scaffold.rs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Use `compiler/meshc/tests/support/m046_route_free.rs` as the shared owner of cluster-proof fixture discovery and Dockerfile path constants instead of open-coded repo-root literals.
  - Keep relocated clustered proof fixtures source-only by deleting the in-place binary that `meshc build <fixture>` writes after verification replays.
duration: ""
verification_result: mixed
completed_at: 2026-04-03T02:40:20.067Z
blocker_discovered: false
---

# T02: Relocated `cluster-proof` into `scripts/fixtures/clustered/cluster-proof` and retargeted the route-free package, scaffold, and Todo Docker consumers.

**Relocated `cluster-proof` into `scripts/fixtures/clustered/cluster-proof` and retargeted the route-free package, scaffold, and Todo Docker consumers.**

## What Happened

Copied the source-only `cluster-proof` package into `scripts/fixtures/clustered/cluster-proof/`, updated its README, Dockerfile, Fly config, and Mesh smoke test so the lower-level proof now names the relocated fixture path truthfully while keeping the package name, runtime handler (`Work.add`), log prefix (`[cluster-proof]`), Docker entrypoint, and Fly discovery seed unchanged. Extended `compiler/meshc/tests/support/m046_route_free.rs` with shared cluster-proof fixture constants plus fail-closed validation for required files, retargeted `compiler/meshc/tests/e2e_m046_s04.rs` and `compiler/meshc/tests/e2e_m045_s02.rs` to that helper, and added a negative helper test proving a missing `Dockerfile` fails closed before any build runs. Updated `compiler/meshc/tests/support/m047_todo_scaffold.rs` so the Linux-output builder image now builds from `scripts/fixtures/clustered/cluster-proof/Dockerfile`, proved that through the targeted M047 Docker test, then deleted the repo-root `cluster-proof/` directory and cleaned the in-place binary emitted by direct fixture builds so the relocated package ends source-only.

## Verification

Task-owned verification passed against the relocated fixture after the repo-root `cluster-proof/` directory was deleted: direct `meshc test` and `meshc build` worked on `scripts/fixtures/clustered/cluster-proof`, `cargo test -p meshc --test e2e_m046_s04 -- --nocapture` and `cargo test -p meshc --test e2e_m045_s02 -- --nocapture` both stayed green on the moved helper/path contract, the narrowed structural check confirmed the root directory is gone and the Todo builder resolves the shared fixture Dockerfile constant, and the targeted M047 Docker rail proved the helper image still builds through the moved `cluster-proof` Dockerfile. Slice-level verification is still partially red, as expected for an intermediate task: `bash scripts/verify-m039-s01.sh` still shells `meshc build cluster-proof`, and `bash scripts/verify-m045-s02.sh` still bootstraps through `e2e_m045_s01`, which has its own stale repo-root `cluster-proof` assumptions plus an older scaffold handler expectation.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo run -q -p meshc -- test scripts/fixtures/clustered/cluster-proof/tests` | 0 | ✅ pass | 9200ms |
| 2 | `cargo run -q -p meshc -- build scripts/fixtures/clustered/cluster-proof` | 0 | ✅ pass | 7900ms |
| 3 | `cargo test -p meshc --test e2e_m046_s04 -- --nocapture` | 0 | ✅ pass | 24800ms |
| 4 | `cargo test -p meshc --test e2e_m045_s02 -- --nocapture` | 0 | ✅ pass | 20300ms |
| 5 | `test ! -e cluster-proof && test -d scripts/fixtures/clustered/cluster-proof && test ! -e scripts/fixtures/clustered/cluster-proof/cluster-proof && ! rg -n 'repo_root\(\)\.join\("cluster-proof"\)' compiler/meshc/tests/e2e_m046_s04.rs compiler/meshc/tests/e2e_m045_s02.rs compiler/meshc/tests/support/m047_todo_scaffold.rs compiler/meshc/tests/support/m046_route_free.rs && ! rg -n '"cluster-proof/Dockerfile"' compiler/meshc/tests/support/m047_todo_scaffold.rs && rg -n 'CLUSTER_PROOF_FIXTURE_DOCKERFILE_RELATIVE|scripts/fixtures/clustered/cluster-proof/Dockerfile' compiler/meshc/tests/support/m047_todo_scaffold.rs compiler/meshc/tests/support/m046_route_free.rs` | 0 | ✅ pass | 164ms |
| 6 | `cargo test -p meshc --test e2e_m047_s05 m047_s05_todo_scaffold_runtime_truth_persists_natively_and_in_container -- --nocapture` | 0 | ✅ pass | 62200ms |
| 7 | `bash scripts/verify-m039-s01.sh` | 1 | ❌ fail | 60600ms |
| 8 | `bash scripts/verify-m045-s02.sh` | 1 | ❌ fail | 65900ms |


## Deviations

Extended `compiler/meshc/tests/support/m046_route_free.rs` with shared cluster-proof fixture discovery and added a negative helper test in `compiler/meshc/tests/e2e_m046_s04.rs`, even though the written task plan only named the direct consumer files. That kept the path cutover fail-closed and avoided open-coding the relocated fixture root or Dockerfile path in each rail.

## Known Issues

`scripts/verify-m039-s01.sh` still shells `cargo run -q -p meshc -- build cluster-proof`, so it now fails immediately with `Project directory 'cluster-proof' does not exist` until the older direct bash verifier family is retargeted in later S04 work. `scripts/verify-m045-s02.sh` still bootstraps through `cargo test -p meshc --test e2e_m045_s01 m045_s01_ -- --nocapture`, and that target still reads the deleted repo-root `cluster-proof` fixture plus expects the older `@cluster pub fn execute_declared_work` scaffold shape. Those failures are outside T02’s owned files.

## Files Created/Modified

- `scripts/fixtures/clustered/cluster-proof/README.md`
- `scripts/fixtures/clustered/cluster-proof/Dockerfile`
- `scripts/fixtures/clustered/cluster-proof/fly.toml`
- `scripts/fixtures/clustered/cluster-proof/tests/work.test.mpl`
- `compiler/meshc/tests/support/m046_route_free.rs`
- `compiler/meshc/tests/e2e_m046_s04.rs`
- `compiler/meshc/tests/e2e_m045_s02.rs`
- `compiler/meshc/tests/support/m047_todo_scaffold.rs`
- `.gsd/KNOWLEDGE.md`


## Deviations
Extended `compiler/meshc/tests/support/m046_route_free.rs` with shared cluster-proof fixture discovery and added a negative helper test in `compiler/meshc/tests/e2e_m046_s04.rs`, even though the written task plan only named the direct consumer files. That kept the path cutover fail-closed and avoided open-coding the relocated fixture root or Dockerfile path in each rail.

## Known Issues
`scripts/verify-m039-s01.sh` still shells `cargo run -q -p meshc -- build cluster-proof`, so it now fails immediately with `Project directory 'cluster-proof' does not exist` until the older direct bash verifier family is retargeted in later S04 work. `scripts/verify-m045-s02.sh` still bootstraps through `cargo test -p meshc --test e2e_m045_s01 m045_s01_ -- --nocapture`, and that target still reads the deleted repo-root `cluster-proof` fixture plus expects the older `@cluster pub fn execute_declared_work` scaffold shape. Those failures are outside T02’s owned files.
