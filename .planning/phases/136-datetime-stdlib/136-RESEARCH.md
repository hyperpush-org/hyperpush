# Phase 136: DateTime Stdlib - Research

**Researched:** 2026-02-28
**Domain:** chrono 0.4 Rust DateTime API, Mesh stdlib extension pattern
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Timezone handling**
- DateTime accepts timezone offsets in ISO 8601 input (e.g. `+05:30`)
- All offsets are normalized to UTC at parse time — DateTime is always stored as UTC internally
- `to_iso8601` always emits `Z` suffix (never `+00:00` or other offsets)
- Naive datetime strings with no timezone (e.g. `"2024-01-15T10:30:00"`) → `Err` — callers must provide explicit timezone

**Unix timestamp API naming**
- Millisecond pair (primary): `DateTime.from_unix_ms(ms)` / `DateTime.to_unix_ms(dt)` — matches JS/HTTP convention
- Seconds pair (POSIX interop): `DateTime.from_unix_secs(s)` / `DateTime.to_unix_secs(dt)`
- Both `from_unix_ms` and `from_unix_secs` return `Result<DateTime, String>` for out-of-range or invalid values
- Note: roadmap names `from_unix`/`to_unix` — these should be updated to `from_unix_ms`/`to_unix_ms`

**ISO 8601 format**
- `from_iso8601` accepts RFC 3339 only: `"2024-01-15T10:30:00Z"` or `"2024-01-15T10:30:00+05:30"`
- Space separator (`"2024-01-15 10:30:00Z"`) is NOT accepted — use strict `T` separator
- Fractional seconds are accepted and preserved at millisecond precision (e.g. `"2024-01-15T10:30:00.123Z"`)
- `to_iso8601` always emits milliseconds: `"2024-01-15T10:30:00.000Z"` even for whole-second values

**Duration units in add/diff**
- Supported atoms: `:ms`, `:second`, `:minute`, `:hour`, `:day`, `:week` (all fixed-length)
- `:month` and `:year` are excluded — variable-length units add edge cases and belong in a future phase
- Unknown atom → runtime error/panic with a clear message (not a `Result` error)
- `DateTime.diff(dt1, dt2, unit)` returns `Float` — fractional units preserved (e.g. `2.7` for `:hour`)
- Float is the uniform return type regardless of unit (e.g. `5000.0` for `:ms`)
- `DateTime.add(dt, n, unit)` takes an integer `n` (negative for subtraction)

### Claude's Discretion
- Internal representation: i64 Unix milliseconds (as noted in roadmap plan)
- `utc_now()` implementation details
- Error message text for parse failures and invalid atoms
- E2E test fixture design

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DTIME-01 | User can get the current UTC datetime via `DateTime.utc_now()` returning a DateTime value | chrono `Utc::now()` with `clock` feature; internal i64 ms representation |
| DTIME-02 | User can parse an ISO 8601 string into a DateTime via `DateTime.from_iso8601(s)` returning Result<DateTime, String> | chrono `DateTime::parse_from_rfc3339` + `.with_timezone(&Utc)` + strict T-separator enforcement |
| DTIME-03 | User can format a DateTime as an ISO 8601 string via `DateTime.to_iso8601(dt)` returning String | chrono `to_rfc3339_opts(SecondsFormat::Millis, true)` for milliseconds + Z suffix |
| DTIME-04 | User can convert a Unix timestamp Int to DateTime via `DateTime.from_unix(n)` | Renamed to `from_unix_ms(ms)` + `from_unix_secs(s)`: chrono `DateTime::from_timestamp_millis` / `from_timestamp_secs` |
| DTIME-05 | User can convert a DateTime to a Unix timestamp Int via `DateTime.to_unix(dt)` | Renamed to `to_unix_ms(dt)` + `to_unix_secs(dt)`: chrono `.timestamp_millis()` / `.timestamp()` |
| DTIME-06 | User can add a duration to a DateTime via `DateTime.add(dt, n, unit)` with units :second/:minute/:hour/:day | chrono `TimeDelta::milliseconds/seconds/minutes/hours/days/weeks(n)` + `+` operator |
| DTIME-07 | User can compute the signed difference between two DateTimes via `DateTime.diff(dt1, dt2, unit)` returning Int | chrono `.signed_duration_since()` then `.num_milliseconds()` / convert to Float by dividing |
| DTIME-08 | User can compare two DateTimes via `DateTime.before?(dt1, dt2)` and `DateTime.after?(dt1, dt2)` returning Bool | Direct i64 ms comparison: `a_ms < b_ms` and `a_ms > b_ms` |
</phase_requirements>

## Summary

Phase 136 adds a `DateTime` stdlib module to Mesh backed by `chrono 0.4`. The internal representation is a plain `i64` of Unix milliseconds — this avoids introducing a new heap-allocated opaque type and keeps the GC unaware of DateTime values (same approach used for SqliteConn which is stored as i64). The chrono crate is the unambiguous Rust standard for date/time operations and must be added to `mesh-rt/Cargo.toml` with the `clock` feature.

The implementation follows the exact same 5-registration-point pattern established in Phase 135 (Crypto/Base64/Hex): runtime functions in `mesh-rt/src/`, typeck registration in `builtins.rs`, module map in `infer.rs`, MIR wiring in `lower.rs` (STDLIB_MODULES + map_builtin_name + known_functions), and LLVM declarations in `intrinsics.rs`. The DateTime type is represented as `i64` (MirType::Int) at the MIR/LLVM level — no new opaque type machinery needed.

The key design decision is that "datetime-typed" values ARE plain i64s at the Mesh type level — the Mesh type system uses an opaque `DateTime` type constructor (like `Regex`) so the type checker knows the value is a DateTime, but at the MIR/LLVM level it is just `i64`. All DateTime functions take and return `i64` parameters at the ABI boundary. The atom-based `add`/`diff` dispatch happens inside the runtime function using a string argument for the atom name.

**Primary recommendation:** Add `chrono = { version = "0.4", features = ["clock"] }` to `mesh-rt/Cargo.toml`, implement `mesh_datetime_*.rs` in `mesh-rt/src/`, then wire the 9 functions through the 4 compiler files following the exact Phase 135 pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chrono | 0.4 | Date/time parsing, formatting, arithmetic | The Rust ecosystem standard; used by nearly all production Rust date/time code; stable API; RFC 3339 parse/format built-in |

### Cargo feature requirement
```toml
# In compiler/mesh-rt/Cargo.toml
chrono = { version = "0.4", features = ["clock"] }
```

The `clock` feature is required for `Utc::now()`. Without it, chrono compiles but `Utc::now()` is not available. Other functionality (parsing, formatting, arithmetic) works without `clock`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chrono 0.4 | time 0.3 | time 0.3 is newer but has a different API; chrono 0.4 is more widely adopted and CONTEXT.md specifies chrono |
| chrono DateTime<Utc> heap | i64 ms internally | Using DateTime<Utc> directly in the Mesh runtime would require an opaque heap type; i64 avoids new type machinery |

## Architecture Patterns

### Recommended File Structure
```
compiler/mesh-rt/src/
└── datetime.rs              # New file: all DateTime extern C functions

compiler/mesh-typeck/src/
└── builtins.rs              # Add DateTime type + 9 function registrations

compiler/mesh-typeck/src/
└── infer.rs                 # Add DateTime to stdlib_modules() HashMap + STDLIB_MODULE_NAMES

compiler/mesh-codegen/src/mir/
└── lower.rs                 # Add "DateTime" to STDLIB_MODULES, 9 name mappings in map_builtin_name,
                             # 9 known_functions registrations

compiler/mesh-codegen/src/codegen/
└── intrinsics.rs            # 9 LLVM external function declarations

tests/e2e/
├── datetime_utc_now.mpl
├── datetime_iso8601_roundtrip.mpl
├── datetime_unix_ms.mpl
├── datetime_unix_secs.mpl
├── datetime_add_diff.mpl
└── datetime_compare.mpl

compiler/meshc/tests/
└── e2e.rs                   # New test functions for all DTIME-01 through DTIME-08
```

### Pattern 1: DateTime as i64 Opaque Type (established pattern)

**What:** DateTime values are plain `i64` (Unix milliseconds) at the ABI level, but registered as a named type constructor `DateTime` in the type checker — exactly like `Regex` is an opaque `Ptr` in the type system but managed via raw pointers at the ABI level.

**When to use:** Any new stdlib type that doesn't need GC awareness (not a collection) and can be represented as a scalar.

**Example — Type registration in builtins.rs:**
```rust
// Source: Phase 135 pattern / builtins.rs
// DateTime is an opaque type constructor at the Mesh type level
env.insert("DateTime".into(), Scheme::mono(Ty::Con(TyCon::new("DateTime"))));
```

**Example — MIR type mapping in lower.rs:**
```rust
// Source: Phase 135 pattern / lower.rs
// DateTime values are i64 at the MIR/LLVM level
self.known_functions.insert("mesh_datetime_utc_now".to_string(),
    MirType::FnPtr(vec![], Box::new(MirType::Int)));
self.known_functions.insert("mesh_datetime_from_iso8601".to_string(),
    MirType::FnPtr(vec![MirType::String], Box::new(MirType::Ptr)));  // Result
self.known_functions.insert("mesh_datetime_to_iso8601".to_string(),
    MirType::FnPtr(vec![MirType::Int], Box::new(MirType::String)));
self.known_functions.insert("mesh_datetime_from_unix_ms".to_string(),
    MirType::FnPtr(vec![MirType::Int], Box::new(MirType::Ptr)));  // Result
self.known_functions.insert("mesh_datetime_to_unix_ms".to_string(),
    MirType::FnPtr(vec![MirType::Int], Box::new(MirType::Int)));
self.known_functions.insert("mesh_datetime_from_unix_secs".to_string(),
    MirType::FnPtr(vec![MirType::Int], Box::new(MirType::Ptr)));  // Result
self.known_functions.insert("mesh_datetime_to_unix_secs".to_string(),
    MirType::FnPtr(vec![MirType::Int], Box::new(MirType::Int)));
self.known_functions.insert("mesh_datetime_add".to_string(),
    MirType::FnPtr(vec![MirType::Int, MirType::Int, MirType::String], Box::new(MirType::Int)));
self.known_functions.insert("mesh_datetime_diff".to_string(),
    MirType::FnPtr(vec![MirType::Int, MirType::Int, MirType::String], Box::new(MirType::Float)));
self.known_functions.insert("mesh_datetime_before".to_string(),
    MirType::FnPtr(vec![MirType::Int, MirType::Int], Box::new(MirType::Bool)));
self.known_functions.insert("mesh_datetime_after".to_string(),
    MirType::FnPtr(vec![MirType::Int, MirType::Int], Box::new(MirType::Bool)));
```

### Pattern 2: Atom Dispatch in Runtime Functions

**What:** The `add` and `diff` functions take a string atom argument (`:ms`, `:second`, `:minute`, `:hour`, `:day`, `:week`) dispatched at runtime in the Rust function. Unknown atoms panic with a clear message.

**When to use:** When a function family has a small set of variants and adding separate functions for each would clutter the API.

**Example — Atom dispatch in datetime.rs:**
```rust
// Source: verified chrono 0.4 API via docs.rs
#[no_mangle]
pub extern "C" fn mesh_datetime_add(
    ms: i64,
    n: i64,
    unit: *const MeshString,
) -> i64 {
    use chrono::{DateTime, TimeDelta, Utc};
    unsafe {
        let unit_str = (*unit).as_str();
        let delta = match unit_str {
            ":ms"     => TimeDelta::milliseconds(n),
            ":second" => TimeDelta::seconds(n),
            ":minute" => TimeDelta::minutes(n),
            ":hour"   => TimeDelta::hours(n),
            ":day"    => TimeDelta::days(n),
            ":week"   => TimeDelta::weeks(n),
            other => panic!("DateTime.add: unknown unit {:?}; valid units are :ms, :second, :minute, :hour, :day, :week", other),
        };
        let dt: DateTime<Utc> = DateTime::from_timestamp_millis(ms)
            .expect("DateTime.add: invalid ms timestamp");
        let result = dt + delta;
        result.timestamp_millis()
    }
}
```

### Pattern 3: RFC 3339 Strict Parse with UTC Normalization

**What:** Parse with `DateTime::parse_from_rfc3339` (strict `T` separator), reject naive strings, normalize any offset to UTC, return `Err` on failure.

**Key enforcement:** chrono's `parse_from_rfc3339` already requires `T` separator — space separator is NOT accepted, which matches the locked decision. Naive strings (no timezone info) will fail `parse_from_rfc3339` because RFC 3339 requires a timezone offset, which also matches the locked decision.

**Example — ISO 8601 parse in datetime.rs:**
```rust
// Source: verified chrono 0.4 API via docs.rs
#[no_mangle]
pub extern "C" fn mesh_datetime_from_iso8601(
    s: *const MeshString,
) -> *mut MeshResult {
    use chrono::DateTime;
    unsafe {
        let text = (*s).as_str();
        match DateTime::parse_from_rfc3339(text) {
            Err(_) => {
                let e = "invalid ISO 8601 datetime";
                alloc_result(1, mesh_string_new(e.as_ptr(), e.len() as u64) as *mut u8)
            }
            Ok(dt) => {
                let ms: i64 = dt.timestamp_millis();
                alloc_result(0, ms as *mut u8)  // pack i64 as ptr -- see note below
            }
        }
    }
}
```

**IMPORTANT NOTE on Result<DateTime, String> at ABI level:** The existing `alloc_result` machinery wraps a `*mut u8` payload. For `Result<String, String>` in Base64/Hex, the Ok payload is a `*mut MeshString`. For `Result<DateTime, String>`, the Ok payload must be the i64 ms value. This requires careful ABI design — either: (a) allocate a heap i64 and pass its pointer as the payload, or (b) extend `alloc_result` / add a companion `alloc_result_i64`. Research the existing `alloc_result` signature below.

### Anti-Patterns to Avoid
- **Storing DateTime as a heap-allocated struct:** Unnecessary allocation; a plain i64 is sufficient and avoids GC registration.
- **Using `chrono::DateTime<FixedOffset>` as the stored type:** Always normalize to UTC at parse time; store only the i64 ms value.
- **Using `TimeDelta::try_*` and ignoring `None`:** Mesh panics on invalid operations — use `expect()` or the panicking variants for arithmetic (the range is astronomically large; normal usage never overflows).
- **Accepting space separator in `from_iso8601`:** The locked decision requires strict RFC 3339 (`T` separator only). Use `parse_from_rfc3339` not `parse` (the `parse()` method accepts both `T` and space).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RFC 3339 parsing | Custom regex/string parser | `chrono::DateTime::parse_from_rfc3339` | Leap seconds, timezone offset parsing, fractional seconds — all edge cases handled |
| Duration arithmetic | Manual ms calculation | `chrono::TimeDelta::days/hours/minutes/seconds/milliseconds/weeks` | Correct overflow handling; `days` is exactly 86400 seconds as chrono docs specify |
| UTC normalization | Manual offset subtraction | `dt.with_timezone(&Utc)` | chrono handles all DST and offset edge cases |
| Millisecond output format | Custom string formatter | `dt.to_rfc3339_opts(SecondsFormat::Millis, true)` | Correctly emits `Z` suffix and always 3 decimal digits |
| Unix ms from timestamp | Custom multiplication | `DateTime::from_timestamp_millis(i64)` | Handles range validation, returns `Option<DateTime<Utc>>` |

**Key insight:** DateTime arithmetic has a deceptively large number of edge cases — overflow, leap seconds in display, timezone normalization. chrono handles them all correctly.

## Common Pitfalls

### Pitfall 1: `from_timestamp_millis` Returns `Option`, Not `Result`
**What goes wrong:** Calling `.unwrap()` on an `Option<DateTime<Utc>>` and producing a panic without a clear message when the ms value is out of range.
**Why it happens:** chrono returns `None` for out-of-range values, not `Err`. The from_unix functions must return `Result<DateTime, String>` to Mesh.
**How to avoid:** Convert `None` to a specific error string: `DateTime::from_timestamp_millis(ms).ok_or_else(|| "unix timestamp out of range".to_string())`
**Warning signs:** Runtime panics when using large or negative Unix timestamps.

### Pitfall 2: `to_rfc3339_opts` Produces `+00:00` Without `use_z = true`
**What goes wrong:** `dt.to_rfc3339_opts(SecondsFormat::Millis, false)` produces `"2024-01-15T10:30:00.000+00:00"` instead of `"2024-01-15T10:30:00.000Z"`.
**Why it happens:** The second parameter controls whether to emit `Z` or `+00:00` for UTC. Default is `false`.
**How to avoid:** Always call `dt.to_rfc3339_opts(SecondsFormat::Millis, true)` — the `true` means "use Z for UTC".
**Warning signs:** ISO 8601 output contains `+00:00` instead of `Z`.

### Pitfall 3: `diff` Returns Float — MIR Type Must Be `MirType::Float`
**What goes wrong:** Registering `mesh_datetime_diff` with `Box::new(MirType::Int)` in `known_functions` causes type mismatch at codegen.
**Why it happens:** The locked decision makes `diff` return `Float` (not `Int`) for fractional precision.
**How to avoid:** Use `MirType::Float` in the `known_functions` registration AND `Ty::float()` in `builtins.rs` / `infer.rs`.
**Warning signs:** Typeck errors mentioning Float/Int mismatch on `DateTime.diff` calls.

### Pitfall 4: `before?` / `after?` Method Names Contain `?`
**What goes wrong:** The function name `before?` contains a question mark, which is not a valid Rust identifier. The Mesh-level name must be translated to a valid C symbol name.
**Why it happens:** Mesh allows `?` in method names (Elixir-style predicate convention) but C/Rust extern functions cannot.
**How to avoid:** Map `"before?"` (Mesh-side prefixed to `datetime_before?`) → `mesh_datetime_before` in `map_builtin_name`. The `?` is stripped in the mangling — check how other `?`-named methods are handled in the codebase.
**Warning signs:** Linker errors about undefined `mesh_datetime_before?` symbols.

### Pitfall 5: `diff` Division Requires Float Arithmetic
**What goes wrong:** Computing `diff` in `:hour` by doing `total_ms / 3_600_000` performs integer division, truncating fractional hours.
**Why it happens:** The ms delta is an `i64`. Dividing two `i64` values gives `i64`. Float precision must be explicitly requested.
**How to avoid:** Cast to `f64` before dividing: `(total_ms as f64) / 3_600_000.0_f64`. The Rust function return type should be `f64`.
**Warning signs:** `DateTime.diff(dt1, dt2, :hour)` returns whole numbers only, never `2.7`.

### Pitfall 6: atom_dispatch_order - `diff` ms baseline
**What goes wrong:** `diff(dt1, dt2, :ms)` could be computed as either `dt1_ms - dt2_ms` or `dt2_ms - dt1_ms`. The sign convention must match the documentation (positive if dt1 is AFTER dt2).
**Why it happens:** The function name `diff(dt1, dt2)` is ambiguous about which direction is positive.
**How to avoid:** Define convention: `DateTime.diff(dt1, dt2, unit)` = how much later dt1 is than dt2. If dt1 is after dt2, result is positive. Formula: `(dt1_ms - dt2_ms) / unit_ms as f64`. Verify with e2e tests that include both positive and negative diffs.

### Pitfall 7: `alloc_result` ABI for i64 Ok Payload
**What goes wrong:** `alloc_result(0, ms as *mut u8)` interprets the i64 ms value as a pointer, which is architecturally undefined behavior and will crash.
**Why it happens:** `alloc_result` expects a `*mut u8` pointer — the existing Ok payloads for Base64/Hex are pointers to `MeshString`. For `Result<DateTime, String>`, the Ok payload is an i64 scalar.
**How to avoid:** Two safe options:
  - Option A: Box the i64 on the heap and pass a pointer: `Box::into_raw(Box::new(ms)) as *mut u8`
  - Option B: Create a companion `alloc_result_int(tag, i64) -> *mut MeshResult` in `mesh-rt/src/io.rs`
  - Preferred: Use Option A (box the i64) to remain consistent with the existing `alloc_result` signature without modifying io.rs.
**Warning signs:** Segfaults when matching `Ok(dt)` on a parsed DateTime result.

## Code Examples

Verified patterns from official chrono 0.4 documentation:

### UTC Now (DTIME-01)
```rust
// Source: https://docs.rs/chrono/latest/chrono/struct.DateTime.html
use chrono::Utc;

#[no_mangle]
pub extern "C" fn mesh_datetime_utc_now() -> i64 {
    Utc::now().timestamp_millis()
}
```

### ISO 8601 Parse (DTIME-02)
```rust
// Source: https://docs.rs/chrono/latest/chrono/struct.DateTime.html
use chrono::DateTime;
use crate::io::{MeshResult, alloc_result};
use crate::string::{MeshString, mesh_string_new};

#[no_mangle]
pub extern "C" fn mesh_datetime_from_iso8601(s: *const MeshString) -> *mut MeshResult {
    unsafe {
        let text = (*s).as_str();
        match DateTime::parse_from_rfc3339(text) {
            Err(_) => {
                let e = "invalid ISO 8601 datetime";
                alloc_result(1, mesh_string_new(e.as_ptr(), e.len() as u64) as *mut u8)
            }
            Ok(dt) => {
                let ms: i64 = dt.timestamp_millis();
                // Box the i64 so we can pass it as a *mut u8 payload
                let boxed = Box::into_raw(Box::new(ms)) as *mut u8;
                alloc_result(0, boxed)
            }
        }
    }
}
```

### ISO 8601 Format (DTIME-03)
```rust
// Source: https://docs.rs/chrono/latest/chrono/struct.DateTime.html
// to_rfc3339_opts(SecondsFormat::Millis, true) -> always Z, always 3 decimal digits
use chrono::{DateTime, SecondsFormat, Utc};

#[no_mangle]
pub extern "C" fn mesh_datetime_to_iso8601(ms: i64) -> *mut MeshString {
    let dt: DateTime<Utc> = DateTime::from_timestamp_millis(ms)
        .expect("mesh_datetime_to_iso8601: ms out of range");
    let s = dt.to_rfc3339_opts(SecondsFormat::Millis, true);
    mesh_string_new(s.as_ptr(), s.len() as u64)
}
```

### From Unix Ms (DTIME-04, primary pair)
```rust
// Source: https://docs.rs/chrono/latest/chrono/struct.DateTime.html
#[no_mangle]
pub extern "C" fn mesh_datetime_from_unix_ms(ms: i64) -> *mut MeshResult {
    use chrono::DateTime;
    match DateTime::from_timestamp_millis(ms) {
        None => {
            let e = "unix timestamp out of range";
            alloc_result(1, mesh_string_new(e.as_ptr(), e.len() as u64) as *mut u8)
        }
        Some(dt) => {
            let result_ms: i64 = dt.timestamp_millis(); // same as ms, but validated
            let boxed = Box::into_raw(Box::new(result_ms)) as *mut u8;
            alloc_result(0, boxed)
        }
    }
}
```

### Diff (DTIME-07) — Returns Float
```rust
// Source: https://docs.rs/chrono/latest/chrono/struct.TimeDelta.html
#[no_mangle]
pub extern "C" fn mesh_datetime_diff(
    dt1_ms: i64,
    dt2_ms: i64,
    unit: *const MeshString,
) -> f64 {
    unsafe {
        let unit_str = (*unit).as_str();
        let delta_ms = (dt1_ms - dt2_ms) as f64;
        match unit_str {
            ":ms"     => delta_ms,
            ":second" => delta_ms / 1_000.0,
            ":minute" => delta_ms / 60_000.0,
            ":hour"   => delta_ms / 3_600_000.0,
            ":day"    => delta_ms / 86_400_000.0,
            ":week"   => delta_ms / 604_800_000.0,
            other => panic!("DateTime.diff: unknown unit {:?}", other),
        }
    }
}
```

### Compare (DTIME-08)
```rust
// Source: direct i64 comparison — no chrono needed for this operation
#[no_mangle]
pub extern "C" fn mesh_datetime_before(dt1_ms: i64, dt2_ms: i64) -> i8 {
    if dt1_ms < dt2_ms { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn mesh_datetime_after(dt1_ms: i64, dt2_ms: i64) -> i8 {
    if dt1_ms > dt2_ms { 1 } else { 0 }
}
```

### Typeck Registration (builtins.rs)
```rust
// Source: Phase 135 pattern from builtins.rs
let dt_t = Ty::Con(TyCon::new("DateTime"));
env.insert("DateTime".into(), Scheme::mono(dt_t.clone()));

// DateTime.utc_now() -> DateTime
env.insert("datetime_utc_now".into(),
    Scheme::mono(Ty::fun(vec![], dt_t.clone())));
// DateTime.from_iso8601(s) -> Result<DateTime, String>
env.insert("datetime_from_iso8601".into(),
    Scheme::mono(Ty::fun(vec![Ty::string()], Ty::result(dt_t.clone(), Ty::string()))));
// DateTime.to_iso8601(dt) -> String
env.insert("datetime_to_iso8601".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone()], Ty::string())));
// DateTime.from_unix_ms(ms) -> Result<DateTime, String>
env.insert("datetime_from_unix_ms".into(),
    Scheme::mono(Ty::fun(vec![Ty::int()], Ty::result(dt_t.clone(), Ty::string()))));
// DateTime.to_unix_ms(dt) -> Int
env.insert("datetime_to_unix_ms".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone()], Ty::int())));
// DateTime.from_unix_secs(s) -> Result<DateTime, String>
env.insert("datetime_from_unix_secs".into(),
    Scheme::mono(Ty::fun(vec![Ty::int()], Ty::result(dt_t.clone(), Ty::string()))));
// DateTime.to_unix_secs(dt) -> Int
env.insert("datetime_to_unix_secs".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone()], Ty::int())));
// DateTime.add(dt, n, unit) -> DateTime
env.insert("datetime_add".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone(), Ty::int(), Ty::string()], dt_t.clone())));
// DateTime.diff(dt1, dt2, unit) -> Float
env.insert("datetime_diff".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone(), dt_t.clone(), Ty::string()], Ty::float())));
// DateTime.before?(dt1, dt2) -> Bool
env.insert("datetime_before?".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone(), dt_t.clone()], Ty::bool())));
// DateTime.after?(dt1, dt2) -> Bool
env.insert("datetime_after?".into(),
    Scheme::mono(Ty::fun(vec![dt_t.clone(), dt_t.clone()], Ty::bool())));
```

### STDLIB_MODULES and map_builtin_name additions (lower.rs)
```rust
// Source: Phase 135 pattern — lower.rs
// In STDLIB_MODULES:
"DateTime",  // Phase 136

// In map_builtin_name:
"datetime_utc_now"       => "mesh_datetime_utc_now".to_string(),
"datetime_from_iso8601"  => "mesh_datetime_from_iso8601".to_string(),
"datetime_to_iso8601"    => "mesh_datetime_to_iso8601".to_string(),
"datetime_from_unix_ms"  => "mesh_datetime_from_unix_ms".to_string(),
"datetime_to_unix_ms"    => "mesh_datetime_to_unix_ms".to_string(),
"datetime_from_unix_secs"=> "mesh_datetime_from_unix_secs".to_string(),
"datetime_to_unix_secs"  => "mesh_datetime_to_unix_secs".to_string(),
"datetime_add"           => "mesh_datetime_add".to_string(),
"datetime_diff"          => "mesh_datetime_diff".to_string(),
"datetime_before?"       => "mesh_datetime_before".to_string(),
"datetime_after?"        => "mesh_datetime_after".to_string(),
```

### LLVM Declarations (intrinsics.rs)
```rust
// Source: Phase 135 pattern — intrinsics.rs
// ── DateTime functions (Phase 136) ──────────────────────────────────────

// mesh_datetime_utc_now() -> i64
let utc_now_ty = i64_type.fn_type(&[], false);
module.add_function("mesh_datetime_utc_now", utc_now_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_from_iso8601(s: ptr) -> ptr (MeshResult)
let from_iso_ty = ptr_type.fn_type(&[ptr_type.into()], false);
module.add_function("mesh_datetime_from_iso8601", from_iso_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_to_iso8601(ms: i64) -> ptr (MeshString)
let to_iso_ty = ptr_type.fn_type(&[i64_type.into()], false);
module.add_function("mesh_datetime_to_iso8601", to_iso_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_from_unix_ms(ms: i64) -> ptr (MeshResult)
let from_unix_ms_ty = ptr_type.fn_type(&[i64_type.into()], false);
module.add_function("mesh_datetime_from_unix_ms", from_unix_ms_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_to_unix_ms(ms: i64) -> i64
let to_unix_ms_ty = i64_type.fn_type(&[i64_type.into()], false);
module.add_function("mesh_datetime_to_unix_ms", to_unix_ms_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_from_unix_secs(s: i64) -> ptr (MeshResult)
let from_unix_secs_ty = ptr_type.fn_type(&[i64_type.into()], false);
module.add_function("mesh_datetime_from_unix_secs", from_unix_secs_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_to_unix_secs(ms: i64) -> i64
let to_unix_secs_ty = i64_type.fn_type(&[i64_type.into()], false);
module.add_function("mesh_datetime_to_unix_secs", to_unix_secs_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_add(dt_ms: i64, n: i64, unit: ptr) -> i64
let add_ty = i64_type.fn_type(&[i64_type.into(), i64_type.into(), ptr_type.into()], false);
module.add_function("mesh_datetime_add", add_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_diff(dt1_ms: i64, dt2_ms: i64, unit: ptr) -> f64
let diff_ty = f64_type.fn_type(&[i64_type.into(), i64_type.into(), ptr_type.into()], false);
module.add_function("mesh_datetime_diff", diff_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_before(dt1_ms: i64, dt2_ms: i64) -> i8 (Bool)
let before_ty = i8_type.fn_type(&[i64_type.into(), i64_type.into()], false);
module.add_function("mesh_datetime_before", before_ty, Some(inkwell::module::Linkage::External));

// mesh_datetime_after(dt1_ms: i64, dt2_ms: i64) -> i8 (Bool)
let after_ty = i8_type.fn_type(&[i64_type.into(), i64_type.into()], false);
module.add_function("mesh_datetime_after", after_ty, Some(inkwell::module::Linkage::External));
```

### E2E Fixture Examples (Mesh source)
```
# tests/e2e/datetime_iso8601_roundtrip.mpl
fn main() do
  let result = DateTime.from_iso8601("2024-01-15T10:30:00Z")
  case result do
    Ok(dt) -> println(DateTime.to_iso8601(dt))
    Err(e)  -> println(e)
  end
  let with_offset = DateTime.from_iso8601("2024-01-15T10:30:00+05:30")
  case with_offset do
    Ok(dt) -> println(DateTime.to_iso8601(dt))
    Err(e)  -> println(e)
  end
  let naive = DateTime.from_iso8601("2024-01-15T10:30:00")
  case naive do
    Ok(dt) -> println("should not reach")
    Err(e)  -> println(e)
  end
end
# Expected output:
# 2024-01-15T10:30:00.000Z
# 2024-01-15T05:00:00.000Z
# invalid ISO 8601 datetime
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `from_unix` / `to_unix` (roadmap) | `from_unix_ms` / `from_unix_secs` (CONTEXT decision) | Phase 136 design | No unit ambiguity at call sites |
| `diff` returns `Int` (roadmap) | `diff` returns `Float` (CONTEXT decision) | Phase 136 design | Fractional precision preserved (2.7 hours vs 2 hours) |
| `chrono::Duration` (old name) | `chrono::TimeDelta` (renamed in 0.4.35+) | chrono 0.4.35 | Use `TimeDelta` — `Duration` is deprecated alias |

**Deprecated/outdated:**
- `chrono::Duration`: Renamed to `chrono::TimeDelta` in chrono 0.4.35+. The old name still compiles as a type alias but is deprecated — use `TimeDelta` directly.
- `DateTime::from_timestamp(secs, nanos)`: Replaced by `DateTime::from_timestamp_secs` and `DateTime::from_timestamp_millis` in recent chrono 0.4. The old API may still compile but new code should use the named constructors.

## Open Questions

1. **`before?`/`after?` method name mangling**
   - What we know: Mesh allows `?` in method names; other `?`-named functions like `file_exists` don't have `?` in their internal names
   - What's unclear: Whether the Mesh parser strips `?` during module-qualified field access resolution, or whether `lower.rs` must map `"datetime_before?"` → `"mesh_datetime_before"` explicitly
   - Recommendation: Search `lower.rs` for any existing `?`-named method handling. If none exists, register both `"datetime_before?"` and `"datetime_before"` as aliases in `map_builtin_name` to be safe.

2. **ABI for `Result<DateTime, String>` Ok payload**
   - What we know: Existing `alloc_result` takes `(tag: u8, payload: *mut u8)`. For String payloads, the ptr points to a `MeshString`. For i64 payloads, we need to pass the i64 somehow.
   - What's unclear: Whether the codegen that unpacks `MeshResult` knows to treat the Ok payload as an i64 vs a pointer based on the expected return type
   - Recommendation: Box the i64 (`Box::into_raw(Box::new(ms)) as *mut u8`) and ensure the codegen correctly dereferences it. Inspect how codegen handles `Result<SqliteConn, String>` (SqliteConn is also stored as i64) for the established pattern.

## Sources

### Primary (HIGH confidence)
- [chrono 0.4 DateTime docs](https://docs.rs/chrono/latest/chrono/struct.DateTime.html) — UTC now, parse_from_rfc3339, to_rfc3339_opts, timestamp_millis, from_timestamp_millis, from_timestamp_secs, signed_duration_since
- [chrono 0.4 TimeDelta docs](https://docs.rs/chrono/latest/chrono/struct.TimeDelta.html) — milliseconds, seconds, minutes, hours, days, weeks constructors; TimeDelta vs Duration naming
- Phase 135 codebase (crypto.rs, builtins.rs, lower.rs, intrinsics.rs) — 5-registration-point pattern, MirType mappings, alloc_result usage, known_functions pattern

### Secondary (MEDIUM confidence)
- WebSearch result for chrono 0.4 API (2026) — confirmed Utc::now() clock feature, to_rfc3339_opts SecondsFormat::Millis true for Z suffix, timestamp_millis() method
- WebSearch result confirming TimeDelta renamed from Duration in 0.4.35+

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — chrono 0.4 is the specified library; API verified via official docs
- Architecture: HIGH — follows identical Phase 135 5-point pattern; all code examples are derived from live codebase
- Pitfalls: HIGH — all pitfalls derived from actual code analysis and verified chrono API behavior

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (chrono 0.4 is stable; patterns from Phase 135 are stable)
