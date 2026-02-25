# Service Call Reply Type Segfault (SIGSEGV / exit 139)

## Summary

When Mesher receives an authenticated HTTP request, service calls (e.g. `RateLimiter.check_limit`, `EventProcessor.process_event`) crash with SIGSEGV (exit code 139). The root cause is that service call helper functions always used `MirType::Int` as their return type, regardless of the actual reply type. This causes incorrect LLVM IR for non-Int reply types (Bool, SumType, String, Struct, etc.).

## Root Cause

In `crates/mesh-codegen/src/mir/lower.rs`, the service call lowering hardcoded `MirType::Int` in three places:

1. **Known function registration** (~line 9797): `Box::new(MirType::Int)` — the FnPtr return type
2. **Call expression type** (~line 9854): `ty: MirType::Int` — the MIR Call node's type
3. **MirFunction return_type** (~line 9860): `return_type: MirType::Int`

This meant `codegen_service_call_helper` in `expr.rs` always received `reply_ty = MirType::Int`, causing it to return the raw i64 reply value without any conversion. For types that need conversion (SumType via inttoptr+load, Bool via truncate, String via inttoptr, etc.), this produces type mismatches or garbage values at the LLVM level.

### Concrete example: EventProcessor

`EventProcessor.process_event` returns `String!String` (aka `Result<String, String>`), which is `MirType::SumType("Result_String_String")` — a 16-byte `{i8, ptr}` struct. The handler encodes this as a heap-allocated pointer stored as i64 in the reply message. But because the helper function returned raw i64 (MirType::Int), the caller tried to use that i64 as a 16-byte struct value, reading garbage memory → segfault.

### Concrete example: RateLimiter

`RateLimiter.check_limit` returns `Bool`. With `MirType::Int`, the function returns i64 in LLVM. The caller expects i64 and uses it in a conditional. Since Bool true = 1 and Int 1 is truthy, this *appeared* to work before, but once the return type was corrected to `MirType::Bool` (LLVM `i1`), the full conversion path is needed.

## What Was Tried

### Attempt 1: Use `resolve_range(block.syntax().text_range())`

**Approach**: Get the handler body Block's syntax range, look up its type in the type checker's `HashMap<TextRange, Ty>`, extract the second tuple element as the reply type.

```rust
let reply_type = handler.body()
    .map(|block| self.resolve_range(block.syntax().text_range()))
    .and_then(|ty| { /* extract Tuple element [1] */ })
    .unwrap_or(MirType::Int);
```

**Result**: Did not work. Always fell back to `MirType::Int`.

**Why it failed**: The type checker (`mesh-typeck/src/infer.rs`) does NOT store a type entry for the BLOCK node itself. It stores types for individual expressions within the block, but not the block wrapper node. So `self.types.get(&block_range)` returns `None`, and `resolve_range` returns `MirType::Unit`, which doesn't match `MirType::Tuple(...)`, causing fallback to `MirType::Int`.

### Attempt 2: Use `block.tail_expr().syntax().text_range()`

**Approach**: Instead of the block's range, use the tail expression (last expression in the block). The type checker DOES record types for expressions. The tail expression of a handler body like `check_limit_impl(state, project_id)` has type `Tuple(RateLimitState, Bool)`.

```rust
let reply_type = handler.body()
    .and_then(|block| block.tail_expr())
    .map(|expr| self.resolve_range(expr.syntax().text_range()))
    .and_then(|ty| { /* extract Tuple element [1] */ })
    .unwrap_or(MirType::Int);
```

**Result**: Type resolution now works correctly (confirmed via debug eprintln). All handlers get correct reply types:
- `CheckLimit` → `Bool`
- `ProcessEvent` → `SumType("Result_String_String")`
- `IsStreamClient` → `Bool`
- `GetProjectId` → `String`
- `GetPool` → `Int`
- `GetRateLimiter` → `Pid(None)`
- Various user/org/project services → `SumType("Result_*_String")`

**However**: Mesher still crashes with exit 139 on the first authenticated request. Also returns HTTP 429 (rate limited) on the very first request, which should be allowed (limit is 1000/60s).

### Codegen changes (expr.rs)

Added type-aware reply conversion in `codegen_service_call_helper` (~line 4049):

- **SumType**: Check struct size. ≤8 bytes: alloca i64, store, load as struct type. >8 bytes: inttoptr, load struct from heap pointer.
- **Struct**: Same size-based branching as SumType.
- **String/Ptr**: inttoptr to get pointer back.
- **Bool**: `build_int_truncate(reply_i64, i1)` to get i1 from i64.
- **Float**: alloca i64, store, load as f64 (bitcast via memory).
- **Default (Int, Pid, Unit)**: Return raw i64 unchanged.

## Current State of Code Changes

### `crates/mesh-codegen/src/mir/lower.rs`

1. Added `reply_type: MirType` field to `CallInfo` struct (~line 9397-9401)
2. Reply type determination using `tail_expr()` approach (~line 9442-9459)
3. Three usage sites changed from `MirType::Int` to `info.reply_type.clone()`:
   - Known function FnPtr return type (~line 9797)
   - Call expression `ty` field (~line 9854)
   - MirFunction `return_type` (~line 9860)

### `crates/mesh-codegen/src/codegen/expr.rs`

1. Full `match reply_ty` block replacing the old scalar-only path (~lines 4049-4137)
2. Handles: SumType, Struct, String, Ptr, Bool, Float, and default (Int/Pid/Unit)

## Test Results

- **179 codegen tests**: All pass
- **509 runtime tests**: All pass
- **91/93 E2E tests**: Pass (2 pre-existing HTTP test failures)
- **4 service tests**: All pass
- **4 supervisor tests**: All pass
- **8 tooling tests**: All pass

## What Still Fails

Live Mesher testing with PostgreSQL:

1. **HTTP 429 on first request**: `RateLimiter.check_limit` returns `Bool`. The rate limiter should allow the first request (0 < 1000), but returns "rate limited". This suggests the Bool value is being inverted or corrupted somewhere in the reply path.

2. **SIGSEGV after first request**: Server crashes with exit 139 after responding to the first request. The crash likely occurs in a subsequent service call (possibly EventProcessor.process_event or one of the PipelineRegistry calls), or during cleanup/GC after the request.

## Key Technical Details

### Service call mechanism

1. Caller invokes `ServiceName.method(pid, args...)` which calls a generated helper function
2. Helper packs args into a message buffer: `[u64 tag][u64 caller_pid][i64 args...]`
3. Calls `mesh_service_call(pid, msg_ptr, msg_size)` — blocks until reply
4. Reply comes back as a message pointer; reply data is at offset +16 bytes
5. Loads an i64 from the reply data area
6. **Must convert that i64 back to the correct type** (this is what was broken)

### Tuple element encoding (how values become i64)

- Small structs (≤8 bytes): bitcast struct to i64
- Large structs (>8 bytes): heap-allocated, pointer stored as i64 via ptrtoint
- Pointers (String, Ptr): ptrtoint to i64
- Scalars (Int, Pid): value IS the i64
- Bool: zero-extended from i1 to i64

### Type checker types map

- `HashMap<TextRange, Ty>` — maps AST node text ranges to inferred types
- Types are resolved through union-find before being returned (`ctx.resolve(ty)`)
- Stores types for: expressions, parameters, let bindings, function definitions
- Does NOT store types for: Block nodes, CallHandler nodes, CastHandler nodes
- The tail expression of a block IS stored (it's an expression)

### MIR type mapping for service replies

| Mesh type | MirType | LLVM type | Conversion needed |
|-----------|---------|-----------|-------------------|
| Int | Int | i64 | None (raw i64) |
| Bool | Bool | i1 | truncate i64→i1 |
| Float | Float | f64 | bitcast via alloca |
| String | String | ptr | inttoptr |
| Result<A,B> | SumType("Result_A_B") | {i8, ptr} | inttoptr + load (16 bytes, heap) |
| Pid | Pid(None) | i64 | None (raw i64) |
| PoolHandle | Int | i64 | None (raw i64) |
| Struct (small) | Struct("Name") | struct type | bitcast via alloca |
| Struct (large) | Struct("Name") | struct type | inttoptr + load |

## Deep Investigation: What Was Verified Correct

A thorough code trace of the entire service call data flow was performed. The following components were verified as correct:

### Handler function return type is NOT affected by the fix

The handler function (`__service_{name}_handle_call_{snake}`) always returns `MirType::Ptr` (line 9612 in `lower.rs`). This was NOT changed by the fix. The handler body creates a tuple `(new_state, reply)` via `__mesh_make_tuple`, which returns a heap pointer. This is correct and unchanged.

### Service loop reply extraction is correct

The service loop in `expr.rs` (lines 3320-3730):
1. Calls handler → gets pointer to `(state, reply)` tuple (lines 3524-3533)
2. Handles both IntValue (legacy) and PointerValue result (lines 3624-3630)
3. Calls `mesh_tuple_first(result_ptr)` → extracts state as i64 (lines 3632-3640)
4. Calls `mesh_tuple_second(result_ptr)` → extracts reply as i64 (lines 3642-3650)
5. Stores reply i64 into 8-byte alloca buffer (lines 3652-3658)
6. Calls `mesh_service_reply(caller_pid, reply_buf, 8)` (lines 3661-3668)

This path always works with i64 values (tuple elements are always stored/extracted as i64). The fix did not change any of this. **The service loop correctly sends reply as i64 regardless of the actual reply type.**

### Tuple encoding/decoding is correct

`codegen_make_tuple` in `expr.rs` (lines 3842-3930) correctly coerces all types to i64:
- IntValue with bit_width < 64: `build_int_z_extend` (covers Bool i1 → i64)
- PointerValue: `build_ptr_to_int`
- FloatValue: store f64, load as i64
- StructValue ≤8 bytes: store struct, load as i64
- StructValue >8 bytes: heap-allocate struct, store pointer-as-i64

`mesh_tuple_second` (in `mesh-rt/src/collections/tuple.rs` line 32) simply reads the u64 at offset `tuple_ptr + 8 + index*8`. This correctly retrieves the i64-encoded value.

### Message transport is correct

The reply message flow:
1. Service loop stores i64 in 8-byte alloca, calls `mesh_service_reply(pid, ptr, 8)`
2. `mesh_service_reply` (line 126 in `service.rs`) calls `mesh_actor_send(pid, ptr, 8)`
3. `mesh_actor_send` (line 261 in `mod.rs`) deep-copies the 8 bytes into a `MessageBuffer`
4. `copy_msg_to_actor_heap` (line 606) creates: `[u64 type_tag][u64 data_len][u8... data]`
5. Returns pointer to this 16-byte-header + data structure
6. Client loads i64 from `reply_ptr + 16` (skipping the header) — gets the original i64

### Call helper function codegen is correct

`codegen_service_call_helper` in `expr.rs` (lines 3965-4138):
1. Packs handler args into i64 payload buffer via `coerce_to_i64`
2. Calls `mesh_service_call(pid, tag, payload_ptr, payload_size)` → gets reply message ptr
3. Loads i64 from reply_data at offset +16
4. Converts based on `reply_ty`:
   - Bool: `build_int_truncate(i64, i1)` — i64(1) → i1(1) = true ✓
   - SumType >8B: `inttoptr(i64)` → load `{i8, ptr}` from heap pointer
   - String/Ptr: `inttoptr(i64)` → ptr
   - Float: store i64, load as f64
   - Int/Pid/Unit: raw i64

### Call site type resolution is correct

When the caller code does `let allowed = RateLimiter.check_limit(pid, project_id)`:

1. `lower_call_expr` (line 5889) recognizes service module → falls through to generic path
2. `lower_field_access` (line 6404) resolves `RateLimiter.check_limit` → `MirExpr::Var("__service_rate_limiter_call_check_limit", ty)` where `ty` comes from type checker
3. Call expression type `ty = self.resolve_range(call.syntax().text_range())` — type checker gives `Bool`
4. If type checker gives Unit (unresolved), fallback to `known_functions` registry (line 6028-6048) which has `Bool` from the fix
5. Let binding type = `value.ty()` = Call's `ty` field = `MirType::Bool`
6. Alloca is `i1`, store is `i1`, load is `i1` — all consistent

### LLVM function types are consistent

`declare_functions` (line 328 in `mod.rs`) uses `llvm_fn_type` with `func.return_type`:
- Call helper function: `return_type = info.reply_type` (e.g., `MirType::Bool` → `i1`)
- `llvm_type` (line 31 in `types.rs`) maps `MirType::Bool` → `context.bool_type()` = `i1`
- Function body returns `i1` (from `codegen_service_call_helper`)
- `compile_function` (line 504) coerces return value → types match → no coercion needed
- Call site: `build_call(fn_val, args, ...)` returns `i1` → used directly

### If-expression handles both i1 and i64 correctly

`codegen_if` (line 1407): checks `cond_val.get_type().get_bit_width()`:
- If != 1 (i64): truncates to i1 via `build_int_truncate`
- If == 1 (i1): uses directly
- After the fix, service call Bool results arrive as i1 → used directly, no truncation

### Bool data path trace (should work correctly)

Complete trace for `RateLimiter.check_limit` returning `true`:
1. Handler body: `check_limit_impl` returns `(state, true)` — creates tuple
2. Tuple construction: Bool `true` (i1=1) → `build_int_z_extend(i1, i64)` → i64=1
3. Stored in tuple at offset 16 (element 1)
4. `mesh_tuple_second` → reads u64=1 from offset 16
5. Service loop stores i64=1 in reply buffer
6. `mesh_service_reply` sends 8 bytes containing i64=1
7. Client loads i64=1 from reply message offset +16
8. `build_int_truncate(i64=1, i1)` → i1=1 (true)
9. Caller `if allowed` → i1=1 → takes then branch → processes event

**This should work. Yet the live test shows 429 (rate limited).**

## Remaining Hypotheses

### Hypothesis A: Cross-actor heap pointer invalidation (SumType replies)

For `EventProcessor.process_event` returning `Result<String, String>` (`{i8, ptr}`, 16 bytes):
1. Handler creates Result struct → heap-allocated on SERVICE actor's GC heap
2. Tuple stores pointer-as-i64 in element 1
3. `mesh_tuple_second` returns i64 (pointer into service actor's heap)
4. Reply sends this i64 to caller
5. **Caller does `inttoptr(i64)` → `load {i8, ptr}` from that pointer**
6. This reads 16 bytes from the SERVICE actor's heap — cross-actor memory access

All actors share the same address space (coroutines in same process), so the pointer is valid. BUT if the service actor's GC runs between reply-send and caller-read, the memory could be freed. This is unlikely on the first request but could explain crashes under load.

**Counter-argument**: This same cross-heap access pattern exists for ALL heap-allocated tuple elements (including state structs). If it were broken, nothing would work. The existing state extraction path (`mesh_tuple_first` for large structs) does the same thing and works.

### Hypothesis B: Pre-existing issue unrelated to reply types

The 429 on first request could be caused by:
- `Map.get(state.limits, project_id)` returning an unexpected value when key doesn't exist (e.g., a large number instead of 0)
- State corruption during spawn (the `RateLimitState` struct is 24+ bytes, loaded from spawn args buffer)
- A pre-existing bug that was always present but masked by the previous crash happening before the response was sent

The SIGSEGV could be caused by:
- A completely different service call failing (not rate limiter)
- State struct corruption in the service loop's state update path
- A bug in the spawn args serialization for large state types

### Hypothesis C: Service loop arg loading type mismatch for non-i64/ptr params

The service loop loads handler arguments from the message buffer (lines 3492-3521):
```rust
let load_ty = if handler_param_types[param_idx].is_pointer_type() {
    ptr_ty.into()
} else {
    i64_ty.into()  // ALL non-pointer types loaded as i64
};
```

This only checks for `ptr` vs `i64`. If any handler parameter is `i1` (Bool), `f64` (Float), or a struct type, the argument is loaded as `i64` but passed to a function expecting a different type. **This would be a type mismatch at the LLVM call instruction.**

For the current Mesher services, handler params are String (ptr) and Int (i64), so this is not the immediate issue. But it IS a latent bug for services with Bool/Float/struct parameters.

### Hypothesis D: The fix is correct but Mesher binary wasn't rebuilt

If the live test binary was compiled before the fix, or if incremental compilation didn't recompile all dependent modules, the old (broken) code would still be running.

## Code Location Reference

### Two functions per call handler

| Function | Name pattern | Returns | Generated at |
|----------|-------------|---------|-------------|
| Handler function | `__service_{name}_handle_call_{snake}` | `MirType::Ptr` (tuple ptr, ALWAYS) | `lower.rs:9613` |
| Call helper function | `__service_{name}_call_{snake}` | `info.reply_type` (Bool, SumType, etc.) | `lower.rs:9857-9865` |

### Key codegen locations

| Component | File | Lines | What it does |
|-----------|------|-------|-------------|
| Service loop | `expr.rs` | 3320-3730 | Receive → dispatch → call handler → extract reply → send reply → loop |
| Call helper | `expr.rs` | 3965-4138 | Pack args → `mesh_service_call` → load reply → convert type |
| Tuple construction | `expr.rs` | 3842-3930 | Coerce elements to i64, heap-allocate `{u64 len, u64[N] elems}` |
| Tuple extraction | `mesh-rt` tuple.rs | 26-34 | `mesh_tuple_first`/`second`: read u64 at offset |
| State update | `expr.rs` | 3670-3710 | Convert i64 back to state LLVM type (ptr/small struct/large struct) |
| Arg loading | `expr.rs` | 3492-3521 | Load handler args from message: ptr or i64 only |
| Function declaration | `mod.rs` | 328-361 | `llvm_fn_type(params, return_type)` → LLVM function type |
| Return coercion | `mod.rs` | 527-611 | `coerce_return_value`: ptr↔struct, int↔ptr, struct↔struct |

### Mesher source locations

| File | What |
|------|------|
| `mesher/services/rate_limiter.mpl:26-44` | RateLimiter service definition |
| `mesher/services/rate_limiter.mpl:11-20` | `check_limit_impl` — the actual rate limit logic |
| `mesher/ingestion/routes.mpl:169-177` | `handle_event_authed` — calls `RateLimiter.check_limit` |
| `mesher/ingestion/pipeline.mpl:401-403` | `RateLimiter.start(60, 1000)` — initialization |

### Rate limiter logic

```mesh
fn check_limit_impl(state :: RateLimitState, project_id :: String) -> (RateLimitState, Bool) do
  let count = Map.get(state.limits, project_id)
  if count >= state.max_events do
    (state, false)        # rate limited
  else
    let new_limits = Map.put(state.limits, project_id, count + 1)
    let new_state = RateLimitState { limits: new_limits, ... }
    (new_state, true)     # allowed
  end
end
```

First request: `count` = `Map.get` on empty map (should be 0), `0 >= 1000` = false → should return `true`.

## RESOLVED — Root Cause Found and Fixed

### The actual root cause: `llvm_type(MirType::Tuple)` returned by-value struct instead of ptr

The bug was **not** in the service call reply type handling (which was correct). It was in `crates/mesh-codegen/src/codegen/types.rs` line 43-50.

**`llvm_type(MirType::Tuple([Int, Int]))` returned `struct { i64, i64 }` (a 16-byte by-value struct type).** But tuples at runtime are **always heap-allocated pointers** from `__mesh_make_tuple`, which returns a `ptr` to `{u64 len, u64[N] elements}`.

This caused a **type/size mismatch** anywhere a tuple-typed value flowed through an alloca:

1. **In `codegen_if`** (line 1427-1475): When an `if` expression returns a tuple from both branches:
   - `result_alloca` was created as `alloca {i64, i64}` (16 bytes)
   - But the actual branch values were `ptr` (8 bytes) from `__mesh_make_tuple`
   - `build_store(result_alloca, ptr)` stored only 8 bytes into 16-byte alloca
   - `build_load({i64,i64}, result_alloca)` loaded 16 bytes — 8 bytes of pointer + 8 bytes of zeroed/garbage stack
   - `coerce_return_value` then heap-allocated this corrupted {ptr_val, 0} struct
   - Service loop's `mesh_tuple_first`/`mesh_tuple_second` read garbage offsets → returned 0 for both state and reply

2. **Same pattern would affect `codegen_let`** for let-bindings with tuple types.

### Why this wasn't caught by existing tests

All existing service E2E tests used `Int` return types exclusively. The `if`-expression-returning-tuple pattern only appears in handlers like `check_limit_impl` that conditionally return different tuples. The simple `(state, state)` pattern (no `if`) worked because the tuple pointer flowed directly to the return without going through an alloca.

### The fix

**`crates/mesh-codegen/src/codegen/types.rs`**: Changed `MirType::Tuple(...)` to return `ptr` instead of a by-value struct:

```rust
MirType::Tuple(_) => {
    // Tuples are always heap-allocated via __mesh_make_tuple at runtime,
    // which returns a pointer to {u64 len, u64[N] elements}. The LLVM
    // representation is therefore ptr, not a by-value struct.
    context.ptr_type(inkwell::AddressSpace::default()).into()
}
```

### New E2E tests added

- **`tests/e2e/service_bool_return.mpl`**: Service with Bool return + struct state (LimitState). Tests the Bool truncation path AND the if-expression-returning-tuple codegen path.
- **`tests/e2e/service_string_return.mpl`**: Service with String return type. Tests the inttoptr pointer conversion path.

### How this explains both symptoms

1. **HTTP 429 on first request**: The `if count >= state.max_events` inside `check_limit_impl` returned a tuple from an if-expression. The tuple was corrupted (both elements → 0). The service loop stored 0 as the new state AND sent 0 as the reply. Reply i64=0 → Bool truncation → false → rate limited → 429.

2. **SIGSEGV on subsequent requests**: After the corrupted state (0) was stored, the next request's handler received state=0 as an `Int`. For the Mesher's actual `RateLimitState` (a 24-byte struct), the service loop did `inttoptr(0)` → `load {ptr, i64, i64} from null` → **segfault**.

### Verification of previous hypotheses

- **Hypothesis A (cross-actor heap pointer)**: Not the issue. Heap pointers are valid across actors.
- **Hypothesis B (pre-existing Map.get issue)**: Not the issue. `Map.get` correctly returns 0 for missing keys.
- **Hypothesis C (service loop arg loading)**: Latent bug exists but not triggered by current Mesher services.
- **Hypothesis D (stale binary)**: Partially relevant — the reply type fix was correct, but the separate Tuple type bug was the real cause.
- **NEW: Hypothesis E (Tuple llvm_type mismatch)**: **This was the root cause.**

### Test results after fix

- **179 codegen tests**: All pass
- **227 main E2E tests**: All pass
- **93 stdlib E2E tests**: 91 pass (2 pre-existing HTTP test failures)
- **13 concurrency E2E tests**: All pass (including 2 new service return type tests)
- **9 actor tests**: All pass
- **4 supervisor tests**: All pass
- **8 tooling tests**: All pass

### Remaining items

1. **Latent arg-loading bug** (Hypothesis C): The service loop's argument loading only distinguishes `ptr` vs `i64`. Services with Bool, Float, or struct parameters would have type mismatches. Not triggered by current Mesher services but should be fixed for correctness.

2. **Live Mesher retest**: Rebuild Mesher from clean and verify against PostgreSQL.

## Live Verification (Phase 114)

Rebuilt Mesher from clean with MirType::Tuple fix (types.rs: ptr, not by-value struct). Tested against PostgreSQL (Docker container mesher-postgres, credentials mesh/mesh/mesher). Test data seeded via psql: user, org, project (id: 90b526d8-145a-4631-bc05-9eb2bea8445f), api_key (testkey123).

**Auth note:** Event ingestion uses `x-sentry-auth` header (mesher/ingestion/auth.mpl), not `X-Api-Key` as listed in the plan interface section.

**Smoke test results (all domains):**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| POST /api/v1/events | POST | 202 | x-sentry-auth: testkey123 -- no SIGSEGV |
| GET /api/v1/projects/:id/issues | GET | 200 | search domain |
| GET /api/v1/projects/:id/dashboard/volume | GET | 200 | dashboard domain |
| GET /api/v1/projects/:id/dashboard/health | GET | 200 | dashboard domain |
| GET /api/v1/projects/:id/alert-rules | GET | 200 | returns [] |
| GET /api/v1/projects/:id/alerts | GET | 200 | returns [] |
| GET /api/v1/projects/:id/settings | GET | 200 | returns {"retention_days":90,"sample_rate":1} |
| GET /api/v1/projects/:id/storage | GET | 200 | returns {"event_count":0,"estimated_bytes":0} |
| ws://localhost:8081/ | WS upgrade | 101 | HTTP/1.1 Switching Protocols |

- First authenticated POST /api/v1/events: **202 Accepted** — no SIGSEGV
- Mesher process alive after all endpoint tests (PID 57256): **CONFIRMED**
- Status: **RESOLVED**
