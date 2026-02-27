# Deferred Items — Phase 122

## Pre-existing Test Failure (Out of Scope)

**Test:** `e2e_service_bool_return` in `compiler/meshc/tests/e2e_concurrency_stdlib.rs`
**Status:** FAILED — pre-existing bug, not introduced by Phase 122 reorganization
**Error:** Binary exits with code None (crash/hang), outputs `false\nfalse` instead of `true\ntrue\nfalse\nenabled:true\ndisabled:false\n`
**Root cause:** Bool truncation path (i64 -> i1) in codegen_service_call_helper for service with struct state — appears to be a regression from the service call path changes
**Fixture:** `tests/e2e/service_bool_return.mpl` (committed in phase 109.1, 130 commits ago)
**Action needed:** Investigate Bool return path in `compiler/mesh-codegen/src/codegen.rs` — this is a Phase 124 or later issue
**Out of scope:** Phase 122 only moves files/directories; no changes to compiler codegen
