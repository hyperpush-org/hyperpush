---
title: Standard Library
description: Cryptography, encoding (Base64, Hex), and date/time utilities in Mesh
---

# Standard Library

Mesh ships a set of stdlib modules for cryptography, binary encoding, and date/time operations. All modules are available without any imports — use them directly in your Mesh programs.

## Crypto

The `Crypto` module provides cryptographic hashing, HMAC signatures, UUIDs, and constant-time comparison.

### Hashing

```mesh
fn main() do
  let hash = Crypto.sha256("hello")
  println(hash)   # 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

  let hash512 = Crypto.sha512("hello")
  println(hash512)
end
```

| Function | Returns | Description |
|----------|---------|-------------|
| `Crypto.sha256(s)` | `String` | SHA-256 hash as lowercase hex |
| `Crypto.sha512(s)` | `String` | SHA-512 hash as lowercase hex |

### HMAC

```mesh
fn main() do
  let mac = Crypto.hmac_sha256("secret-key", "message")
  let mac512 = Crypto.hmac_sha512("secret-key", "message")
  let ok = Crypto.secure_compare(mac, mac)   # true — constant-time equality
end
```

| Function | Returns | Description |
|----------|---------|-------------|
| `Crypto.hmac_sha256(key, msg)` | `String` | HMAC-SHA256 as lowercase hex |
| `Crypto.hmac_sha512(key, msg)` | `String` | HMAC-SHA512 as lowercase hex |
| `Crypto.secure_compare(a, b)` | `Bool` | Constant-time string comparison (safe for token verification) |

### UUID

```mesh
fn main() do
  let id = Crypto.uuid4()
  println(id)   # e.g. "550e8400-e29b-41d4-a716-446655440000"
end
```

`Crypto.uuid4()` generates a cryptographically random UUID v4 in the standard `8-4-4-4-12` format.

## Encoding

### Base64

The `Base64` module encodes and decodes binary data in Base64 format. Decoding returns `Result<String, String>` because the input may be malformed.

```mesh
fn main() do
  let encoded = Base64.encode("hello world")
  println(encoded)   # aGVsbG8gd29ybGQ=

  case Base64.decode(encoded) do
    Ok(s) -> println(s)   # hello world
    Err(e) -> println("decode error: #{e}")
  end

  # URL-safe variant (replaces + with - and / with _)
  let url_enc = Base64.encode_url("hello world")
  case Base64.decode_url(url_enc) do
    Ok(s) -> println(s)
    Err(e) -> println(e)
  end
end
```

| Function | Returns | Description |
|----------|---------|-------------|
| `Base64.encode(s)` | `String` | Encode to standard Base64 (padded) |
| `Base64.decode(s)` | `Result<String, String>` | Decode standard Base64 |
| `Base64.encode_url(s)` | `String` | Encode to URL-safe Base64 |
| `Base64.decode_url(s)` | `Result<String, String>` | Decode URL-safe Base64 |

### Hex

The `Hex` module encodes binary data as lowercase hexadecimal. Decoding is case-insensitive and returns `Result<String, String>`.

```mesh
fn main() do
  let h = Hex.encode("hi")
  println(h)   # 6869

  case Hex.decode(h) do
    Ok(s) -> println(s)   # hi
    Err(e) -> println("decode error: #{e}")
  end
end
```

| Function | Returns | Description |
|----------|---------|-------------|
| `Hex.encode(s)` | `String` | Encode bytes as lowercase hex |
| `Hex.decode(s)` | `Result<String, String>` | Decode hex string (case-insensitive) |

## DateTime

The `DateTime` module provides UTC timestamps, ISO 8601 parsing and formatting, Unix timestamp interop, arithmetic, and comparison. Internally, `DateTime` values are backed by a 64-bit Unix millisecond timestamp.

### Current Time

```mesh
fn main() do
  let dt = DateTime.utc_now()
  let ms = DateTime.to_unix_ms(dt)
  let iso = DateTime.to_iso8601(dt)
  println(iso)   # e.g. "2024-01-15T10:30:00.000Z"
end
```

### Parsing and Formatting

```mesh
fn main() do
  case DateTime.from_iso8601("2024-01-15T10:30:00Z") do
    Ok(dt) ->
      let formatted = DateTime.to_iso8601(dt)
      println(formatted)   # "2024-01-15T10:30:00.000Z"
    Err(e) -> println("parse error: #{e}")
  end
end
```

### Unix Timestamp Interop

```mesh
fn main() do
  let dt = DateTime.from_unix_ms(1705316200000)
  let ms = DateTime.to_unix_ms(dt)

  let dt2 = DateTime.from_unix_secs(1705316200)
  let secs = DateTime.to_unix_secs(dt2)
end
```

### Arithmetic

```mesh
fn main() do
  case DateTime.from_iso8601("2024-01-15T10:30:00Z") do
    Ok(dt) ->
      let next_week = DateTime.add(dt, 7, :day)
      let tomorrow = DateTime.add(dt, 1, :day)
      let later = DateTime.add(dt, 2, :hour)
      let diff = DateTime.diff(next_week, dt, :day)
      println("#{diff}")   # 7.0
    Err(_) -> println("error")
  end
end
```

`DateTime.add(dt, n, unit)` supports units: `:second`, `:minute`, `:hour`, `:day`. Negative `n` subtracts.

`DateTime.diff(dt1, dt2, unit)` returns a `Float` representing how much later `dt1` is than `dt2` in the given unit. Negative if `dt1` is earlier.

### Comparison

```mesh
fn main() do
  case DateTime.from_iso8601("2024-01-15T10:30:00Z") do
    Ok(dt) ->
      let future = DateTime.add(dt, 1, :day)
      let is_before = DateTime.is_before(dt, future)   # true
      let is_after = DateTime.is_after(future, dt)     # true
      println("#{is_before}")
    Err(_) -> println("error")
  end
end
```

| Function | Returns | Description |
|----------|---------|-------------|
| `DateTime.utc_now()` | `DateTime` | Current UTC time |
| `DateTime.from_iso8601(s)` | `Result<DateTime, String>` | Parse ISO 8601 string |
| `DateTime.to_iso8601(dt)` | `String` | Format as ISO 8601 (`"...Z"`) |
| `DateTime.from_unix_ms(n)` | `DateTime` | From Unix milliseconds |
| `DateTime.from_unix_secs(n)` | `DateTime` | From Unix seconds |
| `DateTime.to_unix_ms(dt)` | `Int` | To Unix milliseconds |
| `DateTime.to_unix_secs(dt)` | `Int` | To Unix seconds |
| `DateTime.add(dt, n, unit)` | `DateTime` | Add duration (`:second`, `:minute`, `:hour`, `:day`) |
| `DateTime.diff(dt1, dt2, unit)` | `Float` | Signed difference in given unit |
| `DateTime.is_before(dt1, dt2)` | `Bool` | True if dt1 is before dt2 |
| `DateTime.is_after(dt1, dt2)` | `Bool` | True if dt1 is after dt2 |

## What's Next?

- [Testing](/docs/testing/) — write and run tests with `meshc test`
- [Developer Tools](/docs/tooling/) — meshc, meshpkg, formatter, REPL, LSP
- [Web](/docs/web/) — HTTP server, client, and WebSocket
