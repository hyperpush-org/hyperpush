# Deferred Items — Phase 120

## Pre-existing Test Failures (Out of Scope)

### e2e_service_bool_return (e2e_concurrency_stdlib.rs:180)

**Status:** Pre-existing failure since commit 30847013 (Phase 109.1-02)

**Symptom:** Binary exits with code None (timeout / hang), prints `false\nfalse\n` instead of `true\ntrue\nfalse\nenabled:true\ndisabled:false\n`

**Root cause (suspected):** Service loop with large struct state (LimitState = {Int, Int} = 16 bytes) combined with Bool reply type. The handler returns `(new_state, true)` as a tuple, but the Bool value from `mesh_tuple_second` is being encoded/decoded incorrectly. The program hangs after the first two calls (returns false instead of true, then blocks waiting for r3 which never arrives — the service loop likely exits or deadlocks after incorrect state update).

**Scope:** NOT introduced by Phase 120 (or any v12.0 phase). Verified by checking out the commit that added the test and running it — same failure.

**Suggested fix approach:**
1. Debug the codegen_make_tuple large struct path — when `LimitState` is the first tuple element, it gets heap-allocated and its pointer stored as i64. Verify `mesh_tuple_first` returns the correct pointer.
2. Check `new_state_val` reconstruction at expr.rs:3735-3753 — for large struct state extracted from tuple, it does `inttoptr` then `load`. Verify the pointer is valid.
3. The Bool result is `mesh_tuple_second` -> i64 = 1 -> truncate to i1. This should be correct. Check if the issue is the state update causing a crash before the reply is sent.

**Phase to address:** Phase 121+ (future cleanup work)
