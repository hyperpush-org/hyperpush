# S06: S01 acceptance artifact backfill — UAT

**Milestone:** M032
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S06 does not change Mesh or Mesher runtime behavior. It backfills the missing S01 acceptance artifact, hardens the verification command surface, and proves the existing M032/S01 bundle still replays cleanly from current repo state.

## Preconditions

- Run from repo root: `/Users/sn0w/Documents/dev/mesh-lang`
- Rust/Cargo and `rg` are available
- `scripts/verify-m032-s01.sh` exists and `.tmp/m032-s01/verify/` is writable
- `.gsd/milestones/M032/slices/S01/S01-SUMMARY.md` and `.gsd/milestones/M032/slices/S01/S01-UAT.md` exist
- `.gsd/milestones/M032/slices/S06/S06-SUMMARY.md` and `.gsd/milestones/M032/slices/S06/S06-UAT.md` exist
- Treat the repo as post-S02/S03/S04/S05: this UAT proves current accepted behavior and current handoffs, not historical pre-fix failures

## Smoke Test

1. Run `bash scripts/verify-m032-s01.sh`
2. **Expected:** exit code 0 and `verify-m032-s01: ok`

## Test Cases

### 1. Replay the broad S01 proof bundle with non-zero test guards

1. Run `cargo test -q -p meshc --test e2e m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-filter.log`
2. Run `rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-filter.log`
3. Run `cargo test -q -p meshc --test e2e_stdlib m032_ -- --nocapture 2>&1 | tee .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log`
4. Run `rg -q "running [1-9][0-9]* tests" .tmp/m032-s01/verify/s06-e2e-stdlib-filter.log`
5. **Expected:** both commands pass and the logs show non-zero test counts (`running 10 tests` for `e2e`, `running 2 tests` for `e2e_stdlib`). A green exit without those lines is not acceptance.

### 2. The S01 artifacts carry the current proof surfaces and no placeholder language

1. Run `test -s .gsd/milestones/M032/slices/S01/S01-SUMMARY.md && test -s .gsd/milestones/M032/slices/S01/S01-UAT.md`
2. Run `! rg -n "Recovery placeholder UAT|Doctor created this placeholder" .gsd/milestones/M032/slices/S01/S01-UAT.md`
3. Run `rg -n "verify-m032-s01|cargo test -q -p meshc --test e2e m032_|cargo test -q -p meshc --test e2e_stdlib m032_|xmod_identity|route closures|Timer.send_after|Zero-test false positives|\.tmp/m032-s01/verify" .gsd/milestones/M032/slices/S01/S01-UAT.md`
4. Run `rg -n "Stale Folklore|Real Blockers|Real Keep-Sites|Mixed-Truth Comments|Next-Slice Handoff|xmod_identity|route closures|Timer.send_after" .gsd/milestones/M032/slices/S01/S01-SUMMARY.md`
5. **Expected:** the placeholder strings are gone, `S01-UAT.md` names the replay script, broad `m032_` filters, `xmod_identity`, route closures, `Timer.send_after`, the zero-test guard, and `.tmp/m032-s01/verify/`, and `S01-SUMMARY.md` still carries the authoritative stale/real/handoff landmarks.

### 3. The slice closeout artifacts and milestone state reflect the finished backfill

1. Run `test -s .gsd/milestones/M032/slices/S06/S06-SUMMARY.md && test -s .gsd/milestones/M032/slices/S06/S06-UAT.md`
2. Run `rg -n "\[x\] \*\*S06: S01 acceptance artifact backfill\*\*" .gsd/milestones/M032/M032-ROADMAP.md`
3. Run `rg -n "verdict: pass|S01 summary and UAT now substantiate the stale-vs-real matrix" .gsd/milestones/M032/M032-VALIDATION.md`
4. **Expected:** both S06 artifacts exist, the roadmap marks S06 complete, and milestone validation no longer reports S01 as a placeholder-driven remediation gap.

## Edge Cases

### Zero-test false positives are unacceptable

1. Inspect `.tmp/m032-s01/verify/s06-e2e-filter.log` and `.tmp/m032-s01/verify/s06-e2e-stdlib-filter.log`
2. **Expected:** neither log says `running 0 tests`. Zero-test filters are a failure even if Cargo exits 0.

### Route closures still require live-request proof

1. Treat `bash scripts/verify-m032-s01.sh` and `e2e_m032_route_closure_runtime_failure` as the authoritative route-closure checks
2. **Expected:** compile-only success is still insufficient evidence for that family. The backfilled artifacts must keep the live-request warning explicit.

### `xmod_identity` is current-proof context, not a required regression

1. Treat `xmod_identity` as part of the current S01 story and current proof bundle
2. **Expected:** this UAT does not demand the pre-S02 failure to return. It only requires that the family stay visible in the summary/UAT and replay surfaces.

### Automation should use self-contained verification commands

1. Prefer the direct commands listed above or `bash scripts/verify-m032-s01.sh` when rerunning slice verification
2. **Expected:** no command depends on an outer `bash -lc` wrapper or a shell-local `$log` variable. If automation reports malformed fragments, rerun the self-contained commands before treating it as a repo regression.

## Failure Signals

- `bash scripts/verify-m032-s01.sh` fails or its logs under `.tmp/m032-s01/verify/` drift from the established proof bundle
- either broad Cargo filter exits 0 while reporting `running 0 tests`
- `.gsd/milestones/M032/slices/S01/S01-UAT.md` reintroduces placeholder text or drops the required current-proof landmarks
- `.gsd/milestones/M032/M032-ROADMAP.md` does not show S06 as complete
- `.gsd/milestones/M032/M032-VALIDATION.md` still treats S01 as a remediation blocker

## Requirements Proved By This UAT

- R035 — S01 now has a real replayable acceptance artifact derived from the live proof bundle instead of a placeholder
- Supports R011 — the acceptance story stays anchored to real Mesher-facing friction and named proof surfaces
- Supports R013 — the acceptance story keeps `xmod_identity` visible as the named blocker / supported-path family without reopening the compiler fix

## Not Proven By This UAT

- That any new Mesh behavior shipped in S06; this slice is artifact and verification closure only
- That the retained Mesh keep-sites are solved; route closures, nested `&&`, `Timer.send_after`, parser-bound case-arm extraction, and the M033 `ORM boundary` / `PARTITION BY` families remain the honest current keep-list
- Any future SQLite-specific data-layer work beyond the M033 planning constraint

## Notes for Tester

- Start from `bash scripts/verify-m032-s01.sh`; it is still the fastest truthful replay surface.
- If that script fails, inspect `.tmp/m032-s01/verify/` before editing wording or closing artifacts.
- Keep the route-closure live-request warning explicit. That family is still easy to misclassify if someone only runs `meshc build`.
- If automation produces malformed command fragments, use the self-contained commands in this UAT and the S06 plan files; do not trust the malformed fragments over the direct rerun.
