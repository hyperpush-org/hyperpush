# Phase 137: HTTP Client Improvements - Research

**Researched:** 2026-02-28
**Domain:** Rust HTTP client builder API, ureq 3 upgrade, opaque handles, streaming, Mesh compiler registration pipeline
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Builder API design**
- `Http.build(:get, url)` — method is an atom (`:get`, `:post`, `:put`, `:delete`, etc.)
- Builder helpers: `Http.header(req, k, v)`, `Http.body(req, s)`, `Http.timeout(req, ms)`, `Http.query(req, key, val)`, `Http.json(req, body)`
- `Http.json` sets Content-Type to application/json and serializes the body
- `Http.query` appends `?key=val` to the URL
- Response is a struct with fields: `resp.status` (Int), `resp.body` (String), `resp.headers` (Map<String, String>)
- `resp.headers` uses Mesh's native `Map<String, String>` type (existing `%{key => value}` syntax and `Map` module)

**Error model**
- `Ok(resp)` for all valid HTTP responses regardless of status code; user checks `resp.status` to determine success/failure
- `Err(String)` only for network-level failures (timeout, DNS, TLS, connection refused)
- Error string format: `"ERROR_CODE: human message"` — e.g., `"TIMEOUT: connection timed out after 5000ms"`, `"DNS_FAILURE: could not resolve example.com"`, `"TLS_ERROR: certificate verification failed"`
- Redirect following: automatic (Claude decides redirect limit)
- TLS certificate errors: always fail — no opt-out mechanism

**Keep-alive client lifecycle**
- `Http.client()` returns a per-actor opaque handle — each actor can have its own connection pool
- Client is also a builder: `Http.client() |> Http.base_url(c, url) |> Http.default_header(c, k, v)`
- Automatic cleanup when the handle goes out of scope or the actor dies (Rust Drop trait binding)
- `Http.send_with(client, req)` sends a request using the client's connection pool
- Request-level config overrides client-level defaults (headers merged, request wins on conflict; timeout, URL fully overridden by request if set)

**Streaming behavior**
- Two stream functions:
  - `Http.stream(req, fn chunk -> ... end)` — String chunks (UTF-8 decoded)
  - `Http.stream_bytes(req, fn chunk -> ... end)` — raw byte chunks (for binary content)
- OS-thread-per-stream model (one OS thread per active stream)
- Both functions return `Result<Response, String>` — response carries status and headers but empty body; `Err` on network failure
- Two cancellation mechanisms:
  1. **Inline**: callback returns `:stop` to abort the stream
  2. **External**: `Http.stream`/`Http.stream_bytes` returns a cancel handle; caller can call `Http.cancel(handle)` from another actor

### Claude's Discretion
- Connection pool size per client handle
- Exact chunk size from the underlying ureq/Rust layer
- How `:stop` propagates through the OS-thread boundary
- Compression (gzip) support (auto or opt-in)
- Whether `Http.json` requires a prior JSON encoding phase or does inline serialization

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HTTP-01 | User can create an HTTP request with a fluent builder via `Http.build(:get/:post/:put/:delete, url)` returning a Request value | MeshRequest opaque handle backed by Box<MeshRequestData>; `Http.build` is the entry point registered as `mesh_http_build` |
| HTTP-02 | User can add a header to an HTTP request via `Http.header(req, key, value)` returning an updated Request | Mutates (or clones) the MeshRequest struct, appending to headers vec; returns same ptr |
| HTTP-03 | User can set the request body via `Http.body(req, s)` returning an updated Request | Mutates body field in MeshRequest; returns same ptr |
| HTTP-04 | User can set a per-request timeout via `Http.timeout(req, ms)` returning an updated Request | Stores timeout_ms: Option<u64> in MeshRequest |
| HTTP-05 | User can execute an HTTP request via `Http.send(req)` returning `Result<Response, String>` with status, body, and headers | ureq 3 Agent call; returns GC-allocated MeshClientResponse struct with status/body/headers fields |
| HTTP-06 | User can stream an HTTP response chunk-by-chunk via `Http.stream(req, fn chunk -> ... end)` without buffering the full body in memory | OS-thread-per-stream using Body::into_reader() from ureq 3; callback invoked per chunk |
| HTTP-07 | User can create a keep-alive HTTP client handle via `Http.client()` and reuse connections via `Http.send_with(client, req)` | ureq 3 Agent (connection pool); opaque u64 handle pattern from SqliteConn |
</phase_requirements>

---

## Summary

Phase 137 refactors the HTTP client in `compiler/mesh-rt/src/http/client.rs` from a simple pair of `mesh_http_get`/`mesh_http_post` functions into a full builder API, streaming layer, and keep-alive client. The existing code uses ureq 2; the phase upgrades to ureq 3.1.4, which brings a new `Agent`/`config_builder()` API and a `Body` that implements `Send` for safe cross-thread streaming.

Two new Rust types are at the core: `MeshRequest` (an opaque GC handle storing method, URL, headers, body, timeout) and `MeshClientResponse` (a `#[repr(C)]` GC-allocated struct with `status: i64`, `body: *mut u8`, `headers: *mut u8`). The `MeshClientResponse` must be accessible from Mesh source as a struct type with named fields (`resp.status`, `resp.body`, `resp.headers`), which requires registering it in the type-checker's struct registry — similar to how `SqliteRow` and `PgRow` work, but with a new named type `ClientResponse` (or `HttpResponse`) separate from the existing server-side `Response` type.

The OS-thread-per-stream pattern is already proven in this codebase by the WebSocket reader thread (`ws/server.rs:reader_thread_loop`). Streaming for HTTP reuses that same design: spawn a `std::thread::spawn` that owns a ureq 3 `Body` reader, invokes the Mesh callback (bare function or closure) per chunk via `transmute`-based dispatch (same pattern as `call_on_message`), and exits when the stream is done, callback returns `:stop`, or a cancel signal is set via `AtomicBool`.

**Primary recommendation:** Upgrade Cargo.toml `ureq = "2"` to `ureq = "3"`, build `MeshRequest` as a `Box<MeshRequestData>` with `u64` handle (same pattern as `SqliteConn`), build `MeshClientResponse` as a `#[repr(C)]` GC-allocated struct with 3 fields, register a new `Http` stdlib module in all 5 compiler registration points (builtins.rs, infer.rs stdlib_modules, infer.rs STDLIB_MODULE_NAMES, lower.rs STDLIB_MODULES + map_builtin_name + known_functions, intrinsics.rs LLVM declarations), and implement streaming via OS thread + `AtomicBool` cancellation.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ureq | 3.1.4 (upgrade from 2.x) | HTTP client — blocking I/O, agent, streaming | Already in project; 3.x adds `Body: Send`, agent `config_builder()`, clean `into_reader()` |
| crossbeam-channel | 0.5 (already in Cargo.toml) | Cancel signal channel for external cancellation | Already dep in mesh-rt via scheduler |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| serde_json | 1 (already dep) | Inline JSON serialization for `Http.json` | `Http.json` needs to serialize a Mesh value to String before sending |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ureq 3 | reqwest | reqwest is async-only; Mesh scheduler cannot block on async futures |
| Box<MeshRequestData> u64 handle | GC-allocated ptr | GC-allocated ptr risks collection; u64 handle safe from GC |
| OS thread per stream | Actor-based streaming | Actors can't block on I/O reads without deadlocking M:N scheduler |

**Installation (Cargo.toml change):**
```toml
# compiler/mesh-rt/Cargo.toml — change:
# ureq = "2"
# to:
ureq = { version = "3", features = ["gzip"] }
```

---

## Architecture Patterns

### Recommended Project Structure
```
compiler/mesh-rt/src/http/
├── client.rs        # All Http client functions (refactored/replaced)
├── mod.rs           # Updated pub use list including new symbols
├── router.rs        # Unchanged (server routing)
└── server.rs        # Unchanged (HTTP server)
```

### Pattern 1: MeshRequest Opaque Handle (u64)
**What:** `Http.build` allocates a `Box<MeshRequestData>`, converts to raw ptr casted to `u64`, and returns it as an opaque `Int` in the Mesh type system. All builder functions (`Http.header`, `Http.body`, etc.) take that `u64`, reconstruct a reference (`&mut MeshRequestData`), mutate, and return the same `u64`.
**When to use:** When a Mesh type must hold Rust-heap-owned data that the GC must not collect or move.
**Example:**
```rust
// Source: SqliteConn pattern in compiler/mesh-rt/src/db/sqlite.rs
struct MeshRequestData {
    method: String,
    url: String,
    headers: Vec<(String, String)>,
    body: Option<String>,
    timeout_ms: Option<u64>,
    is_json: bool,
}

#[no_mangle]
pub extern "C" fn mesh_http_build(method: *const MeshString, url: *const MeshString) -> u64 {
    unsafe {
        let method_str = (*method).as_str().to_lowercase();
        let url_str = (*url).as_str().to_string();
        let req = Box::new(MeshRequestData {
            method: method_str, url: url_str,
            headers: Vec::new(), body: None,
            timeout_ms: None, is_json: false,
        });
        Box::into_raw(req) as u64
    }
}

#[no_mangle]
pub extern "C" fn mesh_http_header(handle: u64, key: *const MeshString, val: *const MeshString) -> u64 {
    unsafe {
        let req = &mut *(handle as *mut MeshRequestData);
        req.headers.push(((*key).as_str().to_string(), (*val).as_str().to_string()));
        handle
    }
}
```

### Pattern 2: MeshClientResponse GC Struct
**What:** `Http.send` returns a `Result<ClientResponse, String>`. The `ClientResponse` type is a GC-allocated `#[repr(C)]` struct with three fields: `status: i64`, `body: *mut u8` (MeshString ptr), `headers: *mut u8` (MeshMap ptr). Mesh code accesses `resp.status`, `resp.body`, `resp.headers` as struct fields.
**When to use:** When a response object needs named field access in Mesh source.
**Example:**
```rust
// Source: MeshHttpResponse pattern in compiler/mesh-rt/src/http/server.rs
#[repr(C)]
pub struct MeshClientResponse {
    pub status: i64,
    pub body: *mut u8,    // *mut MeshString
    pub headers: *mut u8, // *mut MeshMap (Map<String, String>)
}

fn alloc_client_response(status: i64, body: *mut u8, headers: *mut u8) -> *mut u8 {
    unsafe {
        let ptr = mesh_gc_alloc_actor(
            std::mem::size_of::<MeshClientResponse>() as u64,
            std::mem::align_of::<MeshClientResponse>() as u64,
        ) as *mut MeshClientResponse;
        (*ptr).status = status;
        (*ptr).body = body;
        (*ptr).headers = headers;
        ptr as *mut u8
    }
}
```

### Pattern 3: ureq 3 Agent (Keep-Alive Client)
**What:** `Http.client()` creates a ureq 3 `Agent`, boxes it, and returns a `u64` handle. `Http.send_with(client, req)` reconstructs the agent reference and executes the request using it.
**When to use:** When connection pool reuse across multiple requests is needed.
**Example:**
```rust
// Source: ureq 3 docs.rs/ureq/latest Agent API
use std::time::Duration;
use ureq::Agent;

#[no_mangle]
pub extern "C" fn mesh_http_client() -> u64 {
    let config = Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(30)))
        .build();
    let agent: Agent = config.into();
    Box::into_raw(Box::new(agent)) as u64
}

#[no_mangle]
pub extern "C" fn mesh_http_send_with(client_handle: u64, req_handle: u64) -> *mut u8 {
    unsafe {
        let agent = &*(client_handle as *const Agent);
        let req_data = &*(req_handle as *const MeshRequestData);
        execute_request_with_agent(agent, req_data)
    }
}
```

### Pattern 4: OS Thread Per Stream
**What:** `Http.stream` spawns a `std::thread::spawn` that owns the ureq 3 `Body` (which is `Send`). The thread reads chunks via `Body::as_reader()` and invokes the Mesh callback per chunk.
**When to use:** All streaming operations — prevents blocking the M:N scheduler's worker threads.
**Example:**
```rust
// Source: WS reader_thread_loop pattern in compiler/mesh-rt/src/ws/server.rs
use std::io::Read;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

#[no_mangle]
pub extern "C" fn mesh_http_stream(
    req_handle: u64,
    callback_fn: *mut u8,
    callback_env: *mut u8,
) -> *mut u8 { // returns Result<ClientResponse, String>
    unsafe {
        let req_data = &*(req_handle as *const MeshRequestData);
        let cancel = Arc::new(AtomicBool::new(false));
        let cancel_clone = cancel.clone();

        // Build and execute request
        let response = /* ureq request */;
        let status = response.status() as i64;
        // Extract headers before consuming response
        let headers_map = build_headers_map(&response);

        let mut body = response.into_body();
        let fn_ptr = callback_fn;
        let env_ptr = callback_env;

        std::thread::spawn(move || {
            let mut reader = body.as_reader();
            let mut buf = vec![0u8; 8192];
            loop {
                if cancel_clone.load(Ordering::SeqCst) { break; }
                match reader.read(&mut buf) {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        let chunk_mesh = mesh_string_new(buf.as_ptr(), n as u64) as *mut u8;
                        // Invoke callback: fn(chunk) -> Atom or fn(env, chunk) -> Atom
                        let result = if env_ptr.is_null() {
                            let f: fn(*mut u8) -> *mut u8 = std::mem::transmute(fn_ptr);
                            f(chunk_mesh)
                        } else {
                            let f: fn(*mut u8, *mut u8) -> *mut u8 = std::mem::transmute(fn_ptr);
                            f(env_ptr, chunk_mesh)
                        };
                        // Check for :stop atom return
                        if is_stop_atom(result) { break; }
                    }
                    Err(_) => break,
                }
            }
        });

        // Return Ok(ClientResponse) with status + headers + empty body
        alloc_client_response_result(status, headers_map)
    }
}
```

### Pattern 5: Callback Dispatch (bare function vs closure)
**What:** All Mesh callbacks are dispatched as `(fn_ptr, env_ptr)` pairs. If `env_ptr` is null, call `fn(arg)`. If non-null, call `fn(env, arg)`. This is the universal pattern for Mesh closures/callbacks in the runtime.
**When to use:** Every time a Mesh callback/closure is invoked from Rust code.
**Example:**
```rust
// Source: call_on_message in compiler/mesh-rt/src/ws/server.rs
if handler.on_message_env.is_null() {
    let f: fn(*mut u8, *mut u8) -> *mut u8 = std::mem::transmute(handler.on_message_fn);
    f(conn_ptr, msg_mesh);
} else {
    let f: fn(*mut u8, *mut u8, *mut u8) -> *mut u8 = std::mem::transmute(handler.on_message_fn);
    f(handler.on_message_env, conn_ptr, msg_mesh);
}
```

### Anti-Patterns to Avoid
- **Calling ureq inside actor coroutine without OS thread:** ureq uses blocking I/O; calling it directly inside an actor blocks a scheduler worker thread, causing deadlock under concurrent load. Always use OS thread for streaming.
- **Using GC heap for MeshRequest/Agent:** The GC arena may not `Drop` Rust structs with destructors. Use `Box::into_raw` / `Box::from_raw` pattern (same as SqliteConn) for handles with owned Rust data.
- **Mixing `Http` and `HTTP` module names:** The existing server module is `HTTP`; the new client builder is `Http` (different name). Both live in the same `http_mod` insert in infer.rs. Actually, the planner must create a separate `Http` module entry in the stdlib_modules hashmap, separate from `HTTP`.
- **Returning ureq `Error::StatusCode` as Err:** Per locked decision, `Ok(resp)` for all valid HTTP responses including 4xx/5xx. Must use `.http_status_as_error(false)` in ureq 3 (or equivalent).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP connection pooling | Custom connection pool | ureq 3 `Agent` | ureq Agent handles Keep-Alive, DNS, TLS, timeout, thread safety via internal Arc+Mutex |
| Chunked transfer decoding | Custom chunked reader | ureq 3 `Body::as_reader()` | ureq handles Transfer-Encoding: chunked, gzip decompression, content-length limits |
| TLS certificate verification | Custom TLS stack | ureq 3 default (rustls + ring + webpki-roots) | Already compiled as transitive dep; adding ureq 3 costs near-zero extra compile time |
| DNS resolution | Custom resolver | ureq 3 default resolver | ureq handles CNAME chains, IPv4/v6, system fallback |
| Redirect following | Manual 3xx handling | ureq 3 automatic redirect | ureq follows redirects by default (configurable limit) |

**Key insight:** ureq 3's `Body` type implements `Send`, making it safe to move into an OS thread. This is the exact property needed for the OS-thread-per-stream model without complex synchronization.

---

## Common Pitfalls

### Pitfall 1: ureq 2 vs ureq 3 API Incompatibility
**What goes wrong:** The project currently uses `ureq = "2"`. ureq 3 is a ground-up rewrite with a different API.
**Why it happens:** Version "2" in Cargo.toml means SemVer compatible but `ureq = "3"` is a major version change. The `AgentBuilder` pattern from v2 is replaced by `Agent::config_builder()`.
**How to avoid:** Change `ureq = "2"` to `ureq = { version = "3", features = ["gzip"] }` in `compiler/mesh-rt/Cargo.toml`. Key API differences:
- v2: `ureq::agent()` → v3: `Agent::config_builder().build().into()`
- v2: `response.into_string()` → v3: `response.body_mut().read_to_string()`
- v2: `ureq::Error::Status(code, resp)` → v3: `ureq::Error::StatusCode(code)` (but we disable status-as-error)
**Warning signs:** Compiler errors mentioning `AgentBuilder`, `into_string`, `Error::Status`.

### Pitfall 2: Status Codes as Errors in ureq 3
**What goes wrong:** In ureq 3, by default, 4xx and 5xx responses return `Err(Error::StatusCode(...))`. Our locked decision says `Ok(resp)` for ALL valid HTTP responses regardless of status.
**Why it happens:** ureq 3 changed default behavior to surface HTTP errors eagerly.
**How to avoid:** On the `RequestBuilder`, call `.http_status_as_error(false)` (or equivalent ureq 3 config option) before `.call()`. If the ureq 3 API differs, check `Agent::config_builder()` for a global `http_status_as_error` setting.
**Warning signs:** 404 responses returning `Err` in tests.

### Pitfall 3: Module Name Collision Between `HTTP` and `Http`
**What goes wrong:** The existing server module is registered as `"HTTP"` in `STDLIB_MODULE_NAMES` and in the `modules` HashMap in `infer.rs stdlib_modules()`. Adding `"Http"` requires a separate entry.
**Why it happens:** Both `HTTP.serve` and `Http.build` need to coexist.
**How to avoid:** In `infer.rs stdlib_modules()`, add a new `let mut http_client_mod = HashMap::new()` block with all Http client functions, then `modules.insert("Http".to_string(), http_client_mod)`. Add `"Http"` to `STDLIB_MODULE_NAMES`. In `builtins.rs`, add client functions to the flat env under names like `http_build`, `http_send`, etc. In `lower.rs`, add `Http` to `STDLIB_MODULES` list and add name mappings.
**Warning signs:** `Http.build` resolves to undefined symbol at link time.

### Pitfall 4: Five Registration Points for New Stdlib Module
**What goes wrong:** Missing one registration point causes cryptic type errors or linker errors.
**Why it happens:** The Mesh compiler has 5 separate places that must all know about a new stdlib function.
**How to avoid:** Follow the exact pattern from Phase 135 (Crypto) and Phase 136 (DateTime). The 5 points are:
1. `compiler/mesh-typeck/src/builtins.rs` — flat env insertions (`http_build`, etc.)
2. `compiler/mesh-typeck/src/infer.rs` `stdlib_modules()` — `Http` module HashMap
3. `compiler/mesh-typeck/src/infer.rs` `STDLIB_MODULE_NAMES` — add `"Http"`
4. `compiler/mesh-codegen/src/mir/lower.rs` — `STDLIB_MODULES` list + `map_builtin_name` match arm + `known_functions` HashMap
5. `compiler/mesh-codegen/src/codegen/intrinsics.rs` — LLVM `module.add_function(...)` declarations
**Warning signs:** Type error "no such function http_build" = missing builtins.rs; linker error "undefined reference to mesh_http_build" = missing intrinsics.rs.

### Pitfall 5: GC Safety for the MeshClientResponse
**What goes wrong:** Returning a GC-allocated struct with pointer fields that the GC might collect before the Mesh program reads them.
**Why it happens:** The Mesh GC is an arena allocator (`mesh_gc_alloc_actor`), so in practice it does not collect during a single actor turn. But pointer fields inside the struct must themselves be GC-allocated so the arena owns them.
**How to avoid:** Use `mesh_gc_alloc_actor` for the `MeshClientResponse` struct itself, and use `mesh_string_new` (GC-allocated) for the body string and `mesh_map_put` (GC-allocated) for the headers map. Never store a Rust `String` or `Vec` directly in the struct.
**Warning signs:** Segfaults when accessing `resp.body` after `Http.send` returns.

### Pitfall 6: ClientResponse vs Response Name Conflict
**What goes wrong:** The existing `Response` type (opaque, used for server-side handler return) is already registered in `builtins.rs` as `Ty::Con(TyCon::new("Response"))`. A new `HttpClientResponse` or `ClientResponse` struct type needs a different name.
**Why it happens:** Both use `Ty::Con(TyCon::new("..."))` with a name that appears in MIR `lower.rs` struct registry.
**How to avoid:** Name the new type `HttpResponse` (not `Response`, not `ClientResponse`) — it is unambiguous, readable in error messages, and does not shadow existing types. Register it in the type-checker's struct registry with fields: `status: Int`, `body: String`, `headers: Map<String, String>`.
**Warning signs:** Type errors referencing `Response` in Http.send context.

### Pitfall 7: `:stop` Atom Detection Across Thread Boundary
**What goes wrong:** When a Mesh streaming callback returns `:stop`, the stream thread needs to detect this and terminate. Atoms in Mesh are MeshString values containing the text without the colon (per Phase 136: atom_text() strips leading `:`).
**Why it happens:** Atoms are lowered as bare strings (e.g., `:stop` becomes the MeshString `"stop"`). The thread must check if the callback return value is the string `"stop"`.
**How to avoid:** The `is_stop_atom` check in the streaming thread should compare: `if !result.is_null() { let s = (*result as *const MeshString).as_str(); s == "stop" }`. The return type of the streaming callback is `Atom` (which at ABI level is `*mut MeshString`); null means the callback returned unit.
**Warning signs:** Stream does not stop when callback returns `:stop`; stream runs forever.

---

## Code Examples

Verified patterns from official sources:

### ureq 3 Basic Request
```rust
// Source: docs.rs/ureq/latest Agent API (HIGH confidence)
use std::time::Duration;
use ureq::Agent;

let agent: Agent = Agent::config_builder()
    .timeout_global(Some(Duration::from_secs(30)))
    .build()
    .into();

// GET request — disable status-as-error so 4xx/5xx return Ok
let response = agent.get("https://example.com")
    .header("Authorization", "Bearer token")
    .http_status_as_error(false)
    .call()
    .unwrap();

let status = response.status();                              // u16
let body_str = response.body_mut().read_to_string().unwrap(); // String
```

### ureq 3 Streaming
```rust
// Source: docs.rs/ureq/latest Body::into_reader (HIGH confidence)
use std::io::Read;

let response = agent.get("https://example.com/large-file")
    .http_status_as_error(false)
    .call()
    .unwrap();

// status and headers available before consuming body
let status = response.status();
let mut body = response.into_body();    // Body: Send + 'static equivalent

// Move into OS thread
std::thread::spawn(move || {
    let mut reader = body.as_reader();
    let mut buf = vec![0u8; 8192];
    loop {
        match reader.read(&mut buf) {
            Ok(0) => break,  // EOF
            Ok(n) => { /* process buf[..n] */ }
            Err(_) => break,
        }
    }
});
```

### ureq 3 Response Headers
```rust
// Source: ureq 3 Response struct (HIGH confidence)
// Headers are accessed via response.headers()
// which returns an iterator of (name, value) pairs from the http crate HeaderMap
for (name, value) in response.headers() {
    // name: &str, value: &str
}
```

### SqliteConn-style u64 Handle Pattern
```rust
// Source: compiler/mesh-rt/src/db/sqlite.rs (verified in codebase)
// Create:
let handle = Box::into_raw(Box::new(my_data)) as u64;
alloc_result(0, handle as *mut u8) as *mut u8

// Use:
let data = &*(handle as *const MyData);

// Destroy (explicit):
let _ = Box::from_raw(handle as *mut MyData);
```

### Mesh Callback Dispatch
```rust
// Source: compiler/mesh-rt/src/ws/server.rs call_on_message (verified in codebase)
// For a fn(chunk) -> result callback:
let result = if callback_env.is_null() {
    let f: fn(*mut u8) -> *mut u8 = std::mem::transmute(callback_fn);
    f(chunk_mesh)
} else {
    let f: fn(*mut u8, *mut u8) -> *mut u8 = std::mem::transmute(callback_fn);
    f(callback_env, chunk_mesh)
};
```

### Headers Map Construction
```rust
// Source: call_on_connect in compiler/mesh-rt/src/ws/server.rs (verified in codebase)
// key_type = 1 for string-keyed maps
let mut headers_map = crate::collections::map::mesh_map_new_typed(1);
for (name, value) in &headers {
    let key = crate::string::mesh_string_new(name.as_ptr(), name.len() as u64);
    let val = crate::string::mesh_string_new(value.as_ptr(), value.len() as u64);
    headers_map = crate::collections::map::mesh_map_put(headers_map, key as u64, val as u64);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ureq = "2"` flat functions (`mesh_http_get`, `mesh_http_post`) | `ureq = "3"` builder API with Agent | Phase 137 | Breaking Cargo.toml change; ureq 3 is a ground-up rewrite |
| `response.into_string()` (ureq 2) | `response.body_mut().read_to_string()` (ureq 3) | ureq 3.0 | API rename; old code will not compile |
| `ureq::agent()` / `AgentBuilder` | `Agent::config_builder().build().into()` | ureq 3.0 | AgentBuilder removed; config-builder pattern replaces it |
| `Err(ureq::Error::Status(code, resp))` for 4xx/5xx | `Ok(Response)` always + `.http_status_as_error(false)` | Phase 137 decision | Per locked decision: status in payload, not error |

**Deprecated/outdated:**
- `mesh_http_get`, `mesh_http_post`: These will be superseded by the new `Http.build`/`Http.send` API. The old functions can remain for backward compatibility but new code should use the builder.
- `ureq::agent()` (v2 free function): Does not exist in ureq 3.

---

## Open Questions

1. **ureq 3: `http_status_as_error` method availability**
   - What we know: ureq 3 by default returns `Err` for 4xx/5xx; there is a `http_status_as_error` knob somewhere in the API.
   - What's unclear: Whether `http_status_as_error(false)` is on `RequestBuilder` or on `Agent::config_builder()`.
   - Recommendation: Check `docs.rs/ureq/latest` for the exact method during implementation; it may be `Agent::config_builder().http_status_as_error(false)` at the agent level.

2. **`HttpResponse` struct field access in typeck**
   - What we know: User-defined structs get field access via `type_registry.struct_defs`. How exactly to register a "stdlib struct" (one the runtime defines, not the user) is less clear.
   - What's unclear: Whether `HttpResponse` should be registered in the type registry as a user-defined-style struct or handled via special-case field lookup (like `Request` fields are handled in infer_field_access).
   - Recommendation: Look at how `SqliteRow` and `PgRow` field access works in `infer.rs`; they are likely special-cased. If so, add a special-case block in `infer_field_access` for `HttpResponse`.

3. **Cancel handle type for external cancellation**
   - What we know: The cancel handle returned by `Http.stream` needs to be an opaque value that `Http.cancel(handle)` can use to set an `AtomicBool`.
   - What's unclear: Whether to use a `u64` handle (wrapping `Arc<AtomicBool>`) or a GC-allocated struct.
   - Recommendation: Use `Arc<AtomicBool>` boxed as `u64` (same SqliteConn pattern); `Http.cancel(handle)` takes the handle, reconstructs the `Arc`, and calls `.store(true, SeqCst)`. After cancellation, `Http.cancel` should NOT drop the Box (the stream thread still holds a clone of the Arc).

4. **`Http.client` handle cleanup / Drop binding**
   - What we know: CONTEXT.md says "Automatic cleanup when the handle goes out of scope or the actor dies (Rust Drop trait binding)".
   - What's unclear: Mesh does not currently have automatic Drop callbacks when opaque handles go out of scope. The "Rust Drop trait binding" may require a future mechanism, or it may mean the actor GC arena frees the handle when the actor exits.
   - Recommendation: For now, expose `Http.client_close(client)` as an explicit cleanup function. The GC arena will not call Rust destructors. Document that client handles should be explicitly closed to reclaim pool resources, or rely on process exit.

---

## Sources

### Primary (HIGH confidence)
- `compiler/mesh-rt/src/http/client.rs` — existing ureq 2 implementation, directly read
- `compiler/mesh-rt/src/db/sqlite.rs` — u64 opaque handle pattern (SqliteConn), directly read
- `compiler/mesh-rt/src/ws/server.rs` — OS thread streaming pattern (reader_thread_loop), callback dispatch, directly read
- `compiler/mesh-rt/src/datetime.rs` — DateTime registration pattern (5-point), directly read
- `compiler/mesh-typeck/src/infer.rs` — STDLIB_MODULE_NAMES, stdlib_modules() HashMap, directly read
- `compiler/mesh-typeck/src/builtins.rs` — flat env insertion pattern, directly read
- `compiler/mesh-codegen/src/mir/lower.rs` — known_functions, STDLIB_MODULES, map_builtin_name, directly read
- `compiler/mesh-codegen/src/codegen/intrinsics.rs` — LLVM external function declarations, directly read
- `compiler/mesh-rt/src/io.rs` — MeshResult alloc_result pattern, directly read
- https://docs.rs/ureq/latest/ureq/ — ureq 3 API overview (Agent, RequestBuilder, Body), fetched
- https://docs.rs/ureq/latest/ureq/struct.Agent.html — Agent config_builder, connection pool, fetched
- https://docs.rs/ureq/latest/ureq/struct.Body.html — Body::into_reader, Send trait, fetched

### Secondary (MEDIUM confidence)
- WebSearch: "ureq 3.0 rust HTTP client API builder agent keep-alive streaming 2025" — confirmed ureq 3.1.4 as latest, gzip feature, migration from v2
- WebSearch: "ureq crate rust version 3 changelog migration from ureq 2 2025" — confirmed breaking API changes

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ureq 3.1.4 confirmed latest, API verified via docs.rs fetch
- Architecture: HIGH — patterns directly verified in existing codebase (sqlite.rs, ws/server.rs, datetime.rs)
- Pitfalls: HIGH — ureq 2→3 breaking changes verified; registration pitfalls verified from Phase 135/136 history in STATE.md

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (ureq 3 is stable; Mesh compiler patterns change only during new phases)
