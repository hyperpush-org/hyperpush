# S06: S01 acceptance artifact backfill

**Goal:** Replace the doctor-generated S01 UAT placeholder with a real artifact-driven acceptance script that replays the live M032/S01 proof bundle and keeps the stale-vs-real classification anchored to named Mesher evidence.
**Demo:** `.gsd/milestones/M032/slices/S01/S01-UAT.md` is a non-placeholder UAT that starts with `bash scripts/verify-m032-s01.sh`, points at the current non-empty `m032_` compiler proof filters, keeps the route-closure live-request warning explicit, and treats `xmod_identity` as a named S01 handoff/current-proof family instead of pretending the old pre-S02 failure still has to exist.

## Must-Haves

- `.gsd/milestones/M032/slices/S01/S01-UAT.md` is rewritten from placeholder text into a real artifact-driven UAT using the current proof bundle: `scripts/verify-m032-s01.sh`, the `m032_` Cargo filters, `S01-SUMMARY.md`, and `.tmp/m032-s01/verify/`.
- The backfilled UAT proves R035 truthfulness by checking the S01 matrix landmarks in `.gsd/milestones/M032/slices/S01/S01-SUMMARY.md` and by removing all placeholder language from the final artifact.
- The backfilled UAT supports R011 and R013 by explicitly naming Mesher-facing proof and handoff surfaces — including `xmod_identity`, route closures, and `Timer.send_after` — without claiming that S06 itself re-fixes those families.
- Verification guards against zero-test false positives on the filtered Cargo commands, so a green exit with `running 0 tests` does not count as acceptance.

## Verification

- `test -s .gsd/milestones/M032/slices/S01/S01-SUMMARY.md && test -s .gsd/milestones/M032/slices/S01/S01-UAT.md`
- `! rg -n "Recovery placeholder UAT|Doctor created this placeholder" .gsd/milestones/M032/slices/S01/S01-UAT.md`
- `rg -n "verify-m032-s01|cargo test -q -p meshc --test e2e m032_|cargo test -q -p meshc --test e2e_stdlib m032_|xmod_identity|route closures|Timer.send_after|Zero-test false positives|\.tmp/m032-s01/verify" .gsd/milestones/M032/slices/S01/S01-UAT.md`
- `rg -n "Stale Folklore|Real Blockers|Real Keep-Sites|Mixed-Truth Comments|Next-Slice Handoff|xmod_identity|route closures|Timer.send_after" .gsd/milestones/M032/slices/S01/S01-SUMMARY.md`
- `cargo test -q -p meshc --test e2e m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-filter.log && rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-filter.log`
- `cargo test -q -p meshc --test e2e_stdlib m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log && rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log`
- `bash scripts/verify-m032-s01.sh`

## Observability / Diagnostics

- Primary replay surface: `bash scripts/verify-m032-s01.sh`; success ends with `verify-m032-s01: ok`, and failures dump named logs under `.tmp/m032-s01/verify/`.
- Filtered Cargo commands are only trustworthy when both the exit code is zero and the output says `running [1-9][0-9]* tests`; `running 0 tests` is an explicit failure signal for this slice.
- Artifact truthfulness stays anchored to named grep hits in `S01-UAT.md` and `S01-SUMMARY.md`, especially `xmod_identity`, route closures, and `Timer.send_after`.
- First debug path is `.tmp/m032-s01/verify/`; only if those logs are clean should the executor suspect wording drift in the rewritten UAT.
- Redaction constraint: keep diagnostics limited to repo-local logs and command output; do not add or capture secret-bearing environment dumps.

## Tasks

- [x] **T01: Replace the S01 placeholder with a current proof-driven UAT** `est:45m`
  - Why: S06 exists because the accepted S01 proof bundle is real but the required UAT artifact is still a doctor stub, leaving the slice without the acceptance file that closes R035 truthfulness cleanly.
  - Files: `.gsd/milestones/M032/slices/S01/S01-UAT.md`, `.gsd/milestones/M032/slices/S01/S01-SUMMARY.md`, `.gsd/milestones/M032/slices/S06/S06-RESEARCH.md`, `.gsd/milestones/M032/slices/S05/S05-UAT.md`, `scripts/verify-m032-s01.sh`, `compiler/meshc/tests/e2e.rs`, `compiler/meshc/tests/e2e_stdlib.rs`
  - Do: Rewrite `S01-UAT.md` into a real artifact-driven UAT that uses the current proof bundle, starts with `bash scripts/verify-m032-s01.sh`, preserves S01’s truthful stale-vs-real landmarks from `S01-SUMMARY.md`, keeps the route-closure live-request warning explicit, treats `xmod_identity` as a named handoff/current-proof family rather than an expected pre-S02 failure, and points debuggers to `.tmp/m032-s01/verify/` instead of inventing new evidence surfaces.
  - Verify: `test -s .gsd/milestones/M032/slices/S01/S01-SUMMARY.md && test -s .gsd/milestones/M032/slices/S01/S01-UAT.md && ! rg -n "Recovery placeholder UAT|Doctor created this placeholder" .gsd/milestones/M032/slices/S01/S01-UAT.md && rg -n "verify-m032-s01|cargo test -q -p meshc --test e2e m032_|cargo test -q -p meshc --test e2e_stdlib m032_|xmod_identity|route closures|Timer.send_after|Zero-test false positives|\.tmp/m032-s01/verify" .gsd/milestones/M032/slices/S01/S01-UAT.md && rg -n "Stale Folklore|Real Blockers|Real Keep-Sites|Mixed-Truth Comments|Next-Slice Handoff|xmod_identity|route closures|Timer.send_after" .gsd/milestones/M032/slices/S01/S01-SUMMARY.md && cargo test -q -p meshc --test e2e m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-filter.log && rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-filter.log && cargo test -q -p meshc --test e2e_stdlib m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log && rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log && bash scripts/verify-m032-s01.sh`
  - Done when: `S01-UAT.md` is non-placeholder, cites the current replayable proof commands, guards against zero-test false positives, and tells a truthful current-state S01 story without reopening compiler or Mesher code.

## Files Likely Touched

- `.gsd/milestones/M032/slices/S01/S01-UAT.md`
