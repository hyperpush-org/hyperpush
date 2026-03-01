# Phase 142: Update Docs Page with Changes/Additions from v14 - Research

**Researched:** 2026-03-01
**Domain:** VitePress documentation site + Mesh agent skills — content update for v14.0 stdlib modules
**Confidence:** HIGH

## Summary

Phase 142 updates the Mesh documentation website (`website/docs/`) and the Mesh agent skill files (`tools/skill/mesh/`) to reflect the six new v14.0 features: Crypto stdlib, Encoding stdlib (Base64 + Hex), DateTime stdlib, HTTP Client improvements (fluent builder, streaming, keep-alive), Testing Framework (`meshc test`), and Package Registry.

This follows the same pattern established in Phase 125 (v12.0 docs update), Phase 131 (v13.0 docs update), and Phase 134 (v13.0 skill update). The pattern is: identify which doc pages and skill files need updates, add new sections or expand existing ones using verified syntax from passing e2e tests, and update the VitePress config sidebar/nav if new top-level pages are added.

The documentation site currently has 10 markdown files across 9 sections. The tooling page (`website/docs/docs/tooling/index.md`) does not yet mention `meshc test` or `meshpkg`. The web page (`website/docs/docs/web/index.md`) has an outdated HTTP Client section that documents only the old `HTTP.get` API, not the new fluent builder. There is no Crypto, Encoding, DateTime, or Testing page yet. The sidebar and `meshVersion` in VitePress config still say `12.0`.

**Primary recommendation:** Add three new doc pages (Crypto/Encoding/DateTime as a "Standard Library" page, Testing Framework, and Package Manager/Registry), heavily update the Tooling page and Web page, update the cheatsheet, and update the Mesh top-level SKILL.md plus the HTTP skill to reflect v14.0 additions.

## Standard Stack

### Core (already in place — no new dependencies needed)

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| VitePress | `^1.6.4` | Static site generator | In use |
| Vue 3 | `^3.5.28` | Component framework | In use |
| Tailwind CSS 4 | `^4.1.18` | Styling | In use |
| TypeScript | `^5.9.3` | Config typing | In use |

No new npm packages are required. This phase is purely content (Markdown) + config.

## Architecture Patterns

### Recommended Doc Structure After Phase 142

```
website/docs/docs/
├── getting-started/index.md      (no change needed)
├── language-basics/index.md      (no change needed)
├── type-system/index.md          (no change needed)
├── iterators/index.md            (no change needed)
├── concurrency/index.md          (no change needed)
├── web/index.md                  (UPDATE: HTTP Client section)
├── databases/index.md            (no change needed)
├── distributed/index.md          (no change needed)
├── tooling/index.md              (UPDATE: meshc test + meshpkg sections)
├── cheatsheet/index.md           (UPDATE: testing + stdlib entries)
├── stdlib/index.md               (NEW: Crypto, Encoding, DateTime)
├── testing/index.md              (NEW: Testing Framework)
└── packages/index.md             (already exists as packages site; tooling page links)
```

### Pattern 1: New Page Creation (from Phase 131 precedent)

**What:** Create new `index.md` files under `website/docs/docs/<section>/`.

**When to use:** When a new feature domain is large enough to warrant its own doc page (like testing framework, stdlib modules).

**VitePress config update required:** Add new entries to the `sidebar['/docs/']` array in `website/docs/.vitepress/config.mts`. Current sidebar groups: Getting Started, Language Guide, Web & Networking, Data, Distribution, Tooling, Reference. New group "Standard Library" should be added with stdlib, testing pages. Also update `meshVersion: '12.0'` to `meshVersion: '14.0'`.

**Example sidebar entry to add:**
```typescript
{
  text: 'Standard Library',
  collapsed: false,
  items: [
    { text: 'Crypto & Encoding', link: '/docs/stdlib/' },
    { text: 'DateTime', link: '/docs/datetime/' },
    { text: 'Testing', link: '/docs/testing/' },
  ],
},
```

### Pattern 2: Update Existing Sections (from Phase 131 + 134 precedent)

**What:** Add new H2/H3 sections to existing pages, never modify unrelated sections.

**Pattern in use:**
- Add `## Testing` section to tooling page (or link to the new testing page)
- Add `## Package Manager` section to tooling page with `meshpkg` CLI documentation
- Update `## HTTP Client` in the web page to document the new fluent builder API
- Add `meshc test` and `meshpkg` rows to the Tool Summary table in tooling

### Pattern 3: Skills Update (from Phase 134 precedent)

**What:** Update `tools/skill/mesh/SKILL.md` and relevant sub-skills to reflect v14 features.

**Skills to update:**

| File | What to Update |
|------|---------------|
| `tools/skill/mesh/SKILL.md` | Ecosystem Overview: add Crypto/Encoding/DateTime/Testing to Stdlib list; add Testing to Available Sub-Skills; update meshVersion |
| `tools/skill/mesh/skills/http/SKILL.md` | Add HTTP Client v14 section: `Http.build`, `Http.header`, `Http.body`, `Http.timeout`, `Http.send`, `Http.stream`, `Http.client`, `Http.send_with`, `Http.client_close` |

Optionally add a new `tools/skill/mesh/skills/testing/SKILL.md` if testing needs to be a routable sub-skill.

### Anti-Patterns to Avoid

- **Modifying sections not related to v14:** Do not touch language-basics, type-system, iterators, concurrency, databases, distributed pages — they have no v14 additions.
- **Undocumented syntax in code examples:** All `mesh` code blocks MUST come from passing e2e tests. Do NOT invent examples. Use the verified e2e test files as canonical sources.
- **Breaking VitePress sidebar order:** Insert new sidebar entries after the existing "Tooling" group, not in the middle of it.
- **Forgetting to update meshVersion:** `meshVersion: '12.0'` in `.vitepress/config.mts` is stale — update to `'14.0'`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| New doc framework | Custom HTML | VitePress Markdown (`.md` files) | Already in use; Markdown is the pattern |
| Custom syntax highlighting | Custom tokenizer | The Mesh TextMate grammar already registered | Already wired in config.mts |
| New sidebar component | Vue component | VitePress `sidebar` config in `config.mts` | The sidebar config is declarative |

## Common Pitfalls

### Pitfall 1: Using Unverified Mesh Syntax in Code Examples

**What goes wrong:** Doc page shows syntax that doesn't actually compile, confusing users and breaking trust.

**Why it happens:** Author writes examples from memory rather than from passing test files.

**How to avoid:** ALL mesh code blocks must be sourced from passing e2e test files in `tests/e2e/`. The e2e tests are the authoritative source of truth for every API signature.

**Warning signs:** Any example not directly traceable to a specific e2e test file.

### Pitfall 2: Forgetting the `Http` vs `HTTP` Module Name Change

**What goes wrong:** The v14 HTTP Client uses `Http.build`, `Http.header`, `Http.send` — but the existing HTTP Server API uses `HTTP.router`, `HTTP.serve`. These are two different module names. Mixing them in documentation causes confusion.

**Why it happens:** The naming inconsistency (`Http` vs `HTTP`) is subtle.

**How to avoid:** The HTTP Client (v14 fluent builder) uses lowercase `Http.*`. The HTTP Server (pre-v14) uses uppercase `HTTP.*`. Document them in separate subsections clearly labelled "HTTP Server" and "HTTP Client".

**Verification:** Check `tests/e2e/http_client_builder.mpl` — it uses `Http.build`, `Http.header`, `Http.timeout` (all lowercase `Http`).

### Pitfall 3: VitePress Config Sidebar Link Path Format

**What goes wrong:** A sidebar item with the wrong `link` path 404s in the built site.

**Why it happens:** VitePress clean URLs mean `link: '/docs/testing/'` maps to `website/docs/docs/testing/index.md`. The link must include the trailing slash.

**How to avoid:** Follow the existing pattern — every sidebar link ends with `/`.

### Pitfall 4: Adding a Skills Sub-Skill Without Updating the Routing Table

**What goes wrong:** A new `tools/skill/mesh/skills/testing/SKILL.md` is created but `tools/skill/mesh/SKILL.md` does not list it in "Available Sub-Skills", so the skill is never routed to.

**Why it happens:** The sub-skill routing table must be manually maintained.

**How to avoid:** For every new sub-skill file created, add a corresponding entry to the "Available Sub-Skills" list in `tools/skill/mesh/SKILL.md`.

### Pitfall 5: meshVersion Left Stale

**What goes wrong:** The website header still shows "Mesh 12.0" after the v14.0 docs launch.

**Why it happens:** `meshVersion: '12.0'` is a custom config value in the VitePress `themeConfig` — it is easy to overlook.

**How to avoid:** Update `meshVersion` in `website/docs/.vitepress/config.mts` as part of Plan 01.

## Code Examples

Verified patterns from passing e2e tests:

### Crypto stdlib

```mesh
# Source: tests/e2e/crypto_sha256.mpl, crypto_hmac.mpl, crypto_uuid4.mpl, crypto_secure_compare.mpl
fn main() do
  let hash = Crypto.sha256("hello")         # → "2cf24dba5fb0a30e..."
  let hash512 = Crypto.sha512("hello")      # → "9b71d224bd62..."
  let hmac = Crypto.hmac_sha256("key", "message")
  let id = Crypto.uuid4()                   # → "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  let same = Crypto.secure_compare("abc", "abc")  # → true
end
```

### Encoding stdlib (Base64 + Hex)

```mesh
# Source: tests/e2e/base64_encode_decode.mpl, hex_encode_decode.mpl
fn main() do
  let encoded = Base64.encode("hello")
  let decoded = Base64.decode(encoded)
  case decoded do
    Ok(s) -> println(s)
    Err(e) -> println(e)
  end

  let h = Hex.encode("hi")    # → "6869"
  let d = Hex.decode(h)
  case d do
    Ok(s) -> println(s)
    Err(e) -> println(e)
  end
end
```

### DateTime stdlib

```mesh
# Source: tests/e2e/datetime_utc_now.mpl, datetime_iso8601_roundtrip.mpl, datetime_add_diff.mpl, datetime_compare.mpl
fn main() do
  let dt = DateTime.utc_now()
  let ms = DateTime.to_unix_ms(dt)
  let iso = DateTime.to_iso8601(dt)

  let r = DateTime.from_iso8601("2024-01-15T10:30:00Z")
  case r do
    Ok(dt2) ->
      let future = DateTime.add(dt2, 7, :day)
      let diff = DateTime.diff(future, dt2, :day)
      println("${diff}")
    Err(e) -> println(e)
  end
end
```

### HTTP Client v14 (fluent builder)

```mesh
# Source: tests/e2e/http_client_builder.mpl, http_client_keepalive.mpl, http_stream_compile.mpl
fn main() do
  # Fluent builder
  let req = Http.build(:get, "https://api.example.com/data")
  let req = Http.header(req, "Authorization", "Bearer token")
  let req = Http.timeout(req, 5000)
  let result = Http.send(req)
  case result do
    Ok(resp) -> println(resp)
    Err(e) -> println(e)
  end

  # Streaming
  let req2 = Http.build(:get, "https://example.com/stream")
  let _handle = Http.stream(req2, fn chunk do
    println(chunk)
    "ok"
  end)

  # Keep-alive client
  let client = Http.client()
  # Http.send_with(client, req) to reuse connections
  Http.client_close(client)
end
```

### Testing Framework

```mesh
# Source: tests/e2e/test_basic.test.mpl, test_describe.test.mpl, test_setup_teardown.test.mpl, test_mock_actor.test.mpl

# File: my_module.test.mpl
test("arithmetic is correct") do
  assert(1 + 1 == 2)
  assert_eq(10, 5 + 5)
  assert_ne(3, 4)
end

describe("string operations") do
  setup do
    assert(true)
  end

  teardown do
    assert(true)
  end

  test("length") do
    assert(String.length("hello") == 5)
  end
end

test("mock actor messaging") do
  let me = self()
  send(me, 42)
  assert_receive 42, 500
end
```

Run with:
```bash
meshc test .              # all *.test.mpl in current dir
meshc test path/to/dir/  # specific directory
```

### mesh.toml package manifest

```toml
# Source: mesher/mesh.toml (created in Phase 141)
[package]
name = "my_app"
version = "1.0.0"
description = "A Mesh application"
license = "MIT"

[dependencies]
# registry: some_pkg = "1.0.0"
# path:     my_lib = { path = "../my_lib" }
# git:      utils = { git = "https://github.com/user/utils", tag = "v1.0.0" }
```

## State of the Art

| Old Approach | Current Approach | Since | Documentation Impact |
|--------------|------------------|-------|---------------------|
| `HTTP.get(url)` only | `Http.build`, `Http.header`, `Http.body`, `Http.timeout`, `Http.send`, `Http.stream`, `Http.client`, `Http.send_with` | v14.0 (Phase 137) | Update web page HTTP Client section |
| No test infrastructure | `meshc test *.test.mpl` runner | v14.0 (Phase 138) | Add Testing section to tooling page; new testing doc page |
| No stdlib crypto/encoding | `Crypto.*`, `Base64.*`, `Hex.*` modules | v14.0 (Phase 135) | New stdlib doc page |
| No datetime stdlib | `DateTime.*` module | v14.0 (Phase 136) | Add to stdlib doc page |
| No package ecosystem | `mesh.toml` + `meshpkg` CLI + registry | v14.0 (Phase 139-140) | Update tooling page; new packages section |
| meshVersion '12.0' | '14.0' | v14.0 | Update config.mts |

**Deprecated/outdated:**
- `HTTP.get(url)` docs (web page HTTP Client section): replace with fluent builder explanation while keeping the old `HTTP.get` mentioned as the legacy single-call API.

## Scope: What Needs Updating

### Files to Create (NEW)

| File | Content |
|------|---------|
| `website/docs/docs/stdlib/index.md` | Crypto module (sha256, sha512, hmac_sha256, hmac_sha512, secure_compare, uuid4) + Encoding (Base64 standard + URL-safe, Hex encode/decode) + DateTime (utc_now, from_iso8601, to_iso8601, from_unix_ms, from_unix_secs, to_unix_ms, to_unix_secs, add, diff, is_before, is_after) |
| `website/docs/docs/testing/index.md` | meshc test runner, test/describe/setup/teardown DSL, assert/assert_eq/assert_ne/assert_raises, Test.mock_actor, assert_receive, --coverage stub |

### Files to Update (EXISTING)

| File | Changes Required |
|------|----------------|
| `website/docs/.vitepress/config.mts` | Add sidebar entries for stdlib + testing pages; update `meshVersion: '12.0'` → `'14.0'` |
| `website/docs/docs/tooling/index.md` | Add `meshc test` section; add `meshpkg` section with login/publish/install/search; update Tool Summary table |
| `website/docs/docs/web/index.md` | Expand HTTP Client section from single `HTTP.get` to full fluent builder API |
| `website/docs/docs/cheatsheet/index.md` | Add testing assertions, Crypto/Encoding/DateTime quick reference entries |
| `tools/skill/mesh/SKILL.md` | Update Ecosystem Overview stdlib list; add Testing to Available Sub-Skills; note Http client v14 |
| `tools/skill/mesh/skills/http/SKILL.md` | Add HTTP Client v14 section with all new `Http.*` functions |

### Files That Do NOT Need Changes

| File | Reason |
|------|--------|
| `website/docs/docs/language-basics/index.md` | No v14 language changes |
| `website/docs/docs/type-system/index.md` | No v14 type system changes |
| `website/docs/docs/iterators/index.md` | No v14 iterator changes |
| `website/docs/docs/concurrency/index.md` | No v14 concurrency changes |
| `website/docs/docs/databases/index.md` | No v14 database changes |
| `website/docs/docs/distributed/index.md` | No v14 distributed changes |
| `website/docs/docs/getting-started/index.md` | No v14 getting-started changes |

## Open Questions

1. **Should meshpkg get its own doc page, or live in tooling?**
   - What we know: The existing tooling page already covers formatter, REPL, package manager scaffold (`meshc new`), and LSP. It has a logical structure.
   - What's unclear: Whether `meshpkg` (publish/install/search/login) is large enough to warrant its own page.
   - Recommendation: Add `meshpkg` as a new H2 section in the tooling page. It's related to developer tooling. Only break it out to a separate page if the content exceeds 200 lines.

2. **Should Crypto, Encoding, and DateTime be one page or three?**
   - What we know: Each module is relatively small (6-8 functions). The v13.0 precedent combined features (multi-line pipes + type aliases) into a single docs update plan.
   - What's unclear: Whether users expect these in a "Standard Library" page or separate pages.
   - Recommendation: Combine Crypto, Base64, Hex, and DateTime into a single "Standard Library" page (`/docs/stdlib/`). This keeps the sidebar clean and follows the pattern of other languages that group stdlib modules on one reference page.

3. **Does the HTTP skill need a sub-skill re-architecture to separate server vs client?**
   - What we know: `tools/skill/mesh/skills/http/SKILL.md` currently documents only the HTTP server plus the old `HTTP.get` client. The v14 HTTP Client is substantially larger.
   - What's unclear: Whether expanding the existing skill file is sufficient or if it should be split into `http-server` and `http-client` sub-skills.
   - Recommendation: Add a new "## HTTP Client v14 (Builder API)" section to the existing HTTP skill. Do not split into two files — the existing routing still works. Re-architecture is out of scope for this phase.

## Sources

### Primary (HIGH confidence)

- Direct inspection of `website/docs/docs/` — all 10 existing markdown files read
- Direct inspection of `website/docs/.vitepress/config.mts` — sidebar structure verified
- Direct inspection of `tools/skill/mesh/SKILL.md` and `skills/http/SKILL.md`
- `tests/e2e/` — crypto_sha256.mpl, crypto_uuid4.mpl, crypto_hmac.mpl, crypto_secure_compare.mpl, base64_encode_decode.mpl, base64_url_encode_decode.mpl, hex_encode_decode.mpl, datetime_utc_now.mpl, datetime_iso8601_roundtrip.mpl, datetime_add_diff.mpl, datetime_compare.mpl, http_client_builder.mpl, http_client_keepalive.mpl, http_stream_compile.mpl, test_basic.test.mpl, test_describe.test.mpl, test_setup_teardown.test.mpl, test_mock_actor.test.mpl
- Phase 131 plan (131-01-PLAN.md) — doc update pattern: target specific files, verified syntax only, add sections not rewrite pages
- Phase 134 plan (134-01-PLAN.md) — skills update pattern: targeted edits to SKILL.md entries

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` — v14.0 API signatures verified from requirements
- `.planning/STATE.md` decisions log — confirms Http vs HTTP naming, DateTime ABI, test runner behavior

### Tertiary (LOW confidence)

- None — all findings are from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Scope of changes: HIGH — based on direct read of all existing doc files and all e2e tests
- Code examples: HIGH — all from passing e2e tests, not invented
- VitePress config patterns: HIGH — verified from existing config.mts
- Skills update patterns: HIGH — verified from Phase 134 precedent

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable — all APIs are shipped and tested)
