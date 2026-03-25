---
estimated_steps: 4
estimated_files: 7
skills_used:
  - test
---

# T01: Replace the S01 placeholder with a current proof-driven UAT

**Slice:** S06 — S01 acceptance artifact backfill
**Milestone:** M032

## Description

Replace the doctor-generated `S01-UAT.md` placeholder with a real artifact-driven acceptance script derived from the proof surfaces that already exist. This task should not reopen compiler or Mesher implementation work. It should rewrite the UAT so S01’s accepted matrix remains grounded in current repo truth: the replay script, the non-empty `m032_` Cargo filters, the retained live-request warning for route closures, and the named `xmod_identity` handoff/current-proof family.

## Steps

1. Read `.gsd/milestones/M032/slices/S01/S01-UAT.md`, `.gsd/milestones/M032/slices/S01/S01-SUMMARY.md`, `.gsd/milestones/M032/slices/S06/S06-RESEARCH.md`, `.gsd/milestones/M032/slices/S05/S05-UAT.md`, `scripts/verify-m032-s01.sh`, `compiler/meshc/tests/e2e.rs`, and `compiler/meshc/tests/e2e_stdlib.rs` so the new UAT reflects current repo state instead of a historical pre-S02 failure story.
2. Rewrite `.gsd/milestones/M032/slices/S01/S01-UAT.md` using the established artifact-driven structure (`UAT Type`, `Preconditions`, `Smoke Test`, `Test Cases`, `Edge Cases`, `Failure Signals`, `Requirements Proved By This UAT`, `Not Proven By This UAT`, `Notes for Tester`).
3. Make the smoke test `bash scripts/verify-m032-s01.sh`, keep the matrix checks tied to `.gsd/milestones/M032/slices/S01/S01-SUMMARY.md`, point at the broad `cargo test -q -p meshc --test e2e m032_ -- --nocapture` and `cargo test -q -p meshc --test e2e_stdlib m032_ -- --nocapture` filters, require non-zero test counts, keep the route-closure live-request warning explicit, and describe `xmod_identity` as a named handoff/current-proof family rather than as a failure that must still reproduce.
4. Point debuggers first to `.tmp/m032-s01/verify/`, then run the verification commands. If any command fails or the wording drifts from current proof surfaces, fix the artifact instead of weakening the acceptance checks.

## Must-Haves

- [ ] `.gsd/milestones/M032/slices/S01/S01-UAT.md` no longer contains `Recovery placeholder UAT` or `Doctor created this placeholder`.
- [ ] The new UAT starts with `bash scripts/verify-m032-s01.sh` and explicitly references the broad `m032_` proof filters in `compiler/meshc/tests/e2e.rs` and `compiler/meshc/tests/e2e_stdlib.rs`.
- [ ] The new UAT keeps the route-closure live-request warning explicit and treats `xmod_identity` as visible S01 handoff/current-proof context without pretending S06 re-fixes it.
- [ ] The new UAT calls out zero-test false positives as unacceptable and points to `.tmp/m032-s01/verify/` as the first debug surface.

## Verification

- `test -s .gsd/milestones/M032/slices/S01/S01-SUMMARY.md && test -s .gsd/milestones/M032/slices/S01/S01-UAT.md`
- `! rg -n "Recovery placeholder UAT|Doctor created this placeholder" .gsd/milestones/M032/slices/S01/S01-UAT.md`
- `rg -n "verify-m032-s01|cargo test -q -p meshc --test e2e m032_|cargo test -q -p meshc --test e2e_stdlib m032_|xmod_identity|route closures|Timer.send_after|Zero-test false positives|\.tmp/m032-s01/verify" .gsd/milestones/M032/slices/S01/S01-UAT.md`
- `rg -n "Stale Folklore|Real Blockers|Real Keep-Sites|Mixed-Truth Comments|Next-Slice Handoff|xmod_identity|route closures|Timer.send_after" .gsd/milestones/M032/slices/S01/S01-SUMMARY.md`
- `cargo test -q -p meshc --test e2e m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-filter.log && rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-filter.log`
- `cargo test -q -p meshc --test e2e_stdlib m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log && rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log`
- `bash scripts/verify-m032-s01.sh`

## Inputs

- `.gsd/milestones/M032/slices/S01/S01-UAT.md` — placeholder artifact that must be replaced.
- `.gsd/milestones/M032/slices/S01/S01-SUMMARY.md` — authoritative stale-vs-real matrix the UAT must reference.
- `.gsd/milestones/M032/slices/S06/S06-RESEARCH.md` — current-state guidance that constrains S06 to artifact backfill only.
- `.gsd/milestones/M032/slices/S05/S05-UAT.md` — nearby artifact-driven UAT shape to mirror.
- `scripts/verify-m032-s01.sh` — integrated smoke-test and replay surface.
- `compiler/meshc/tests/e2e.rs` — current `m032_` compiler proof family that the UAT should cite.
- `compiler/meshc/tests/e2e_stdlib.rs` — current stdlib/runtime proof family, including live route behavior.

## Expected Output

- `.gsd/milestones/M032/slices/S01/S01-UAT.md` — real artifact-driven UAT aligned to current S01 proof surfaces and handoff truth.

## Observability Impact

- This task changes the acceptance artifact, not compiler or Mesher runtime code, so the durable inspection surface is the rewritten `S01-UAT.md` plus the existing replay bundle it names.
- Future agents should inspect `.tmp/m032-s01/verify/` first when the smoke test or named proofs drift; the UAT must make that debug path explicit instead of forcing rediscovery.
- Failure visibility depends on preserving the zero-test guard around `cargo test -q -p meshc --test e2e m032_ -- --nocapture` and `cargo test -q -p meshc --test e2e_stdlib m032_ -- --nocapture`; a green exit with `running 0 tests` is not a pass.
- Route-closure status remains runtime-only truth, so the UAT must keep the live-request warning explicit and treat compile-only success as insufficient evidence.
- Redaction constraint: keep diagnostics limited to repo-local logs and paths; do not record or restate secret-bearing environment output.
