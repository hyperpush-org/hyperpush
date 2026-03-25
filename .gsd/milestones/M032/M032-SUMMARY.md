---
id: M032
provides:
  - A verified Mesher limitation ledger that retires stale workaround folklore, dogfoods the inferred-export fix back into Mesher, and hands M033 a short honest keep-list.
key_decisions:
  - D049: repair unconstrained inferred exports from concrete call-site usage and emit per-signature MIR clones for mixed ABIs instead of widening generic export machinery.
patterns_established:
  - Limitation comments in `mesher/` now need named proof, owning slice, and either direct dogfood cleanup or a retained keep-site entry.
  - Closeout proof for Mesher limitation work pairs compiler/runtime regressions with direct `mesher/` fmt/build and targeted grep sweeps so supported-now and still-real boundaries stay separate.
observability_surfaces:
  - `git diff --name-only $(git merge-base HEAD origin/main) HEAD -- ':!.gsd/'`
  - `bash scripts/verify-m032-s01.sh`
  - `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture`
  - `cargo test -q -p meshc --test e2e e2e_m032_supported_nested_wrapper_list_from_json -- --nocapture`
  - `cargo test -q -p meshc --test e2e e2e_m032_supported_inline_writer_cast_body -- --nocapture`
  - `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture`
  - `cargo run -q -p meshc -- fmt --check mesher`
  - `cargo run -q -p meshc -- build mesher`
  - negative/positive stale-phrase and keep-site sweeps over `mesher/`
requirement_outcomes:
  - id: R010
    from_status: active
    to_status: validated
    proof: M028 native deploy proof plus the M032 closeout bundle (`bash scripts/verify-m032-s01.sh`; inferred-export, nested-wrapper, inline-cast, and route-closure tests; Mesher fmt/build).
  - id: R011
    from_status: active
    to_status: validated
    proof: The M032 slice chain fixed only friction found in real `mesher/` pressure sites, and the closeout replay kept those proof surfaces green.
  - id: R013
    from_status: active
    to_status: validated
    proof: `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture` passed after the compiler repair, and Mesher now imports `flush_batch` from `Storage.Writer` while `cargo run -q -p meshc -- build mesher` stays green.
  - id: R035
    from_status: active
    to_status: validated
    proof: Named `e2e_m032_*` proofs, `bash scripts/verify-m032-s01.sh`, Mesher fmt/build, the negative stale-phrase sweep, the positive retained keep-site sweep, and the backfilled `S01-UAT.md`.
duration: 6 slices plus milestone closeout replay
verification_result: passed
completed_at: 2026-03-24T14:39:33-0400
---

# M032: Mesher Limitation Truth & Mesh Dogfood Retirement

**Retired stale Mesher limitation folklore, fixed the real inferred-export blocker in Mesh, dogfooded that repair back into Mesher, and closed the milestone with a short evidence-backed keep-list for the limits that still remain real.**

## What Happened

S01 turned the old Mesher limitation comments into a proof inventory instead of a pile of lore. It split the audited families into stale-supported paths, real blockers, real keep-sites, and mixed-truth comments. That classification kept the milestone honest: cross-module `from_json` was already supported on the real CLI path, while the imported inferred-polymorphic export failure (`xmod_identity`) was the actual blocker worth fixing.

S02 repaired that blocker in Mesh itself. `compiler/meshc/src/main.rs` now collects concrete call-site usage for inferred exported functions, and `compiler/mesh-codegen/src/mir/lower.rs` uses that evidence to repair the base ABI or emit per-signature MIR clones when one inferred export is used at multiple concrete types. Mesher immediately dogfooded the repaired path by moving `flush_batch(...)` into `mesher/storage/writer.mpl` and importing it from `mesher/services/writer.mpl` instead of keeping the workaround local.

S03 and S04 then retired the stale folklore without smuggling in product changes. `mesher/ingestion/routes.mpl` now reads `Request.query(...)` directly for issue filtering, `mesher/services/user.mpl` inlines the service-call `case` that used to be explained away as a limitation, `mesher/services/stream_manager.mpl` inlines the cast-handler `if/else`, and the stale cross-module `from_json` rationale was removed from the event/storage path comments while the real PostgreSQL JSONB and ORM-boundary notes stayed explicit.

S05 closed the audit as a three-bucket ledger instead of collapsing back into one folklore list: supported-now proofs, still-real Mesh keep-sites, and real M033 data-layer boundaries. S06 then backfilled the missing S01 acceptance artifact so the milestone's earliest audit evidence is replayable from slice artifacts rather than living only in summary prose. The final result is a cleaner Mesher codebase, a repaired compiler path used by the app, and a short honest handoff into M033.

## Cross-Slice Verification

- **Implementation delta exists outside `.gsd/`.** The required `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'` check was empty because this closeout worktree is already on local `main`. Using the equivalent integration baseline against `origin/main` showed real non-`.gsd` changes in `compiler/mesh-codegen/src/lib.rs`, `compiler/mesh-codegen/src/mir/lower.rs`, `compiler/meshc/src/main.rs`, `compiler/meshc/tests/e2e.rs`, `compiler/meshc/tests/e2e_stdlib.rs`, the cleaned `mesher/` modules, and `scripts/verify-m032-s01.sh`.

- **Success criterion: `mesher/` no longer carries disproven limitation comments for capabilities Mesh already supports.** Verified by the focused Mesher diff plus the negative stale-phrase sweep:
  - `mesher/ingestion/routes.mpl` now uses `Request.query(request, "status")` directly.
  - `mesher/services/user.mpl` inlines the service-call `case`.
  - `mesher/services/stream_manager.mpl` inlines the cast-handler `if/else`.
  - `mesher/services/event_processor.mpl`, `mesher/storage/queries.mpl`, and `mesher/storage/writer.mpl` no longer explain current behavior through stale cross-module `from_json` folklore.
  - `! rg -n "query string unavailable|Request\\.query unavailable|from_json unavailable|from_json can.?t cross module|from_json cannot cross module|if/else inside cast|complex case in service call|services must live in main\\.mpl" mesher -g '*.mpl'` returned no matches.

- **Success criterion: at least one real blocker is fixed in Mesh and then used directly from `mesher/`.** Verified by:
  - `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture` → `2 passed`.
  - Compiler changes in `compiler/meshc/src/main.rs` and `compiler/mesh-codegen/src/mir/lower.rs` that thread inferred-export usage types into MIR lowering.
  - Mesher dogfood change: `mesher/services/writer.mpl` imports `flush_batch` from `Storage.Writer`, and `mesher/storage/writer.mpl` now exports that helper.
  - `cargo run -q -p meshc -- build mesher` succeeded after the move.

- **Success criterion: a short retained-limit ledger remains, and each retained comment is tied to current evidence rather than folklore.** Verified by:
  - `bash scripts/verify-m032-s01.sh` → `verify-m032-s01: ok`, including the retained `nested_and`, timer-service-cast, and live route-closure checks.
  - `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture` → `1 passed`.
  - Positive keep-site sweep over the retained comments and helpers in `mesher/ingestion/routes.mpl`, `mesher/services/stream_manager.mpl`, `mesher/services/writer.mpl`, `mesher/ingestion/pipeline.mpl`, `mesher/services/event_processor.mpl`, `mesher/ingestion/fingerprint.mpl`, `mesher/services/retention.mpl`, `mesher/api/team.mpl`, `mesher/storage/queries.mpl`, `mesher/storage/writer.mpl`, `mesher/migrations/20260216120000_create_initial_schema.mpl`, `mesher/types/event.mpl`, and `mesher/types/issue.mpl`.

- **Success criterion: `cargo run -q -p meshc -- fmt --check mesher` and `cargo run -q -p meshc -- build mesher` still pass.**
  - `cargo run -q -p meshc -- fmt --check mesher` → exit 0 with no output.
  - `cargo run -q -p meshc -- build mesher` → `Compiled: mesher/mesher`.

- **Definition of done: all slices and slice artifacts are present, and cross-slice integration holds.**
  - Roadmap slices S01-S06 are `[x]` in the inlined roadmap.
  - `find .gsd/milestones/M032/slices -maxdepth 2 -type f \( -name 'S*-SUMMARY.md' -o -name 'S*-UAT.md' \)` found all 6 slice summaries and all 6 slice UAT files.
  - `find .gsd/milestones/M032/slices -maxdepth 3 -type f -name 'T*-SUMMARY.md' | wc -l` found 12 task summaries.
  - Cross-slice integration proof passed through the compiler tests, the `verify-m032-s01.sh` replay script, Mesher fmt/build, and the retained-limit sweeps.

- **Criteria not met:** none.

## Requirement Changes

- R010: active → validated — M028's native deploy proof plus the M032 closeout bundle now give a concrete backend-development differentiator instead of vague "better than Elixir" language.
- R011: active → validated — the M032 slice chain and closeout replay show that the new compiler/runtime work came from real Mesher pressure, not speculative language work.
- R013: active → validated — the inferred-export blocker was fixed in Mesh and dogfooded back into Mesher through the `flush_batch` module-boundary move.
- R035: active → validated — the limitation comments were reconciled against named proofs, stale folklore was removed, and the retained keep-sites are now tied to current evidence and an acceptance artifact.

## Forward Intelligence

### What the next milestone should know
- M033 should start from the honest keep-list only: the remaining pressure is the data-layer and migration boundary in `mesher/storage/queries.mpl`, `mesher/storage/writer.mpl`, and the `PARTITION BY` migration note, not the stale `from_json` or handler folklore that M032 already retired.

### What's fragile
- Route-closure status is still fragile if anyone stops at compile-only proof — `meshc build` passes, but the real failure appears only on a live HTTP request. Treat `e2e_m032_route_closure_runtime_failure` and the replay script as the authority.

### Authoritative diagnostics
- `bash scripts/verify-m032-s01.sh` — fastest full replay of supported-now paths, retained-failure checks, live route behavior, and Mesher fmt/build in one place.
- `cargo test -q -p meshc --test e2e m032_inferred -- --nocapture` — authoritative gate for the inferred-export repair and the Mesher dogfood move.
- `cargo test -q -p meshc --test e2e_stdlib e2e_m032_route_closure_runtime_failure -- --nocapture` — authoritative runtime proof for the route-closure keep-site.

### What assumptions changed
- "Cross-module `from_json` is the real blocker." — It was already supported on the real CLI path; the real blocker was inferred exported functions losing concrete ABI at module boundaries.
- "A Mesher limitation comment is probably true if nearby code still uses a workaround." — Not reliable; M032 showed stale and real claims were mixed in the same files, so every comment now needs named proof or a retained keep-site entry.
- "Mesher closeout only needs fmt/build." — Not enough; some retained limits are runtime-only and need live proof or targeted compiler regressions.

## Files Created/Modified

- `compiler/meshc/src/main.rs` — collected concrete usage types for inferred exported functions before MIR lowering.
- `compiler/mesh-codegen/src/mir/lower.rs` — repaired inferred-export lowering with ABI recovery and per-signature MIR specialization.
- `compiler/meshc/tests/e2e.rs` — added the supported-now Mesher proofs and the inferred-export regression coverage.
- `compiler/meshc/tests/e2e_stdlib.rs` — added the bare-route control and live closure-route failure proof.
- `mesher/storage/writer.mpl` — exports `flush_batch(...)` across the repaired module boundary.
- `mesher/services/writer.mpl` — imports and uses `Storage.Writer.flush_batch(...)` directly.
- `mesher/ingestion/routes.mpl` — retired the stale query-string limitation comment and used `Request.query(...)` directly.
- `mesher/services/user.mpl` — inlined the service-call `case` that had been preserved only for stale folklore reasons.
- `mesher/services/stream_manager.mpl` — inlined the cast-handler `if/else` while keeping the real nested-`&&` helper.
- `mesher/services/event_processor.mpl` — rewrote event-path comments around the real SQL extraction boundary instead of stale `from_json` lore.
- `mesher/storage/queries.mpl` — kept the honest JSONB/ORM boundary comment and removed the stale module-boundary explanation.
- `scripts/verify-m032-s01.sh` — added the self-contained replay script for the supported/retained Mesher limitation matrix.
