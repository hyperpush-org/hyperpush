# S04 UAT: Mesher Dogfood Cleanup

## Preconditions

- Rust toolchain installed, `cargo` available
- Working directory: repo root (`mesh-lang/`)
- `mesher/` source tree present with all `.mpl` files

---

## Test Cases

### TC-01: Zero `let _ =` in mesher

**Steps:**
1. Run: `rg 'let _ =' mesher/ -g '*.mpl'`

**Expected:** Exit code 1 (no matches). Zero output lines.

---

### TC-02: Mesher builds clean

**Steps:**
1. Run: `cargo run -p meshc -- build mesher`

**Expected:** Exit 0 with `Compiled: mesher/mesher` output. No compilation errors.

---

### TC-03: E2E test suite stability

**Steps:**
1. Run: `cargo test -p meshc --test e2e`

**Expected:** 313+ passed, exactly 10 failed (all `try_*`/`from_try_*` — pre-existing). No new failures.

---

### TC-04: Interpolation replaces `<>` in clear-win files

**Steps:**
1. Run: `rg '<>' mesher/ingestion/validation.mpl mesher/ingestion/ws_handler.mpl mesher/ingestion/fingerprint.mpl mesher/services/event_processor.mpl mesher/api/helpers.mpl mesher/ingestion/routes.mpl`

**Expected:** Exit code 1 (no matches). All `<>` in these 6 files replaced with `#{}` interpolation.

---

### TC-05: `<>` preserved in D029-designated files

**Steps:**
1. Run: `rg '<>' mesher/storage/schema.mpl mesher/storage/queries.mpl mesher/api/detail.mpl mesher/api/search.mpl mesher/api/alerts.mpl`

**Expected:** Matches found — these files legitimately use `<>` for SQL DDL, JSONB embedding, crypto construction, and manual JSON assembly per D029.

---

### TC-06: `else if` chains in search.mpl

**Steps:**
1. Run: `rg 'else if' mesher/api/search.mpl`

**Expected:** At least 2 matches — `cap_limit` and `filter_by_tag_inner` use `else if` chains instead of nested else+if.

---

### TC-07: `else if` chain in pipeline.mpl

**Steps:**
1. Run: `rg 'else if' mesher/ingestion/pipeline.mpl`

**Expected:** At least 1 match — peer-change detection in `load_monitor` uses `else if`.

---

### TC-08: Formatter check (known pre-existing failure)

**Steps:**
1. Run: `cargo run -p meshc -- fmt --check mesher`

**Expected:** Exit code 1. Reports 35 files needing reformat. This is a pre-existing formatter limitation (multiline import collapsing + dot-path spacing) documented in D032 and KNOWLEDGE.md. Not a regression from S04.

---

## Edge Cases

### EC-01: No stray `let _ =` patterns with extra whitespace

**Steps:**
1. Run: `rg 'let\s+_\s*=' mesher/ -g '*.mpl'`

**Expected:** Zero matches. No whitespace-variant `let _ =` patterns remain.

---

### EC-02: Interpolation syntax correctness

**Steps:**
1. Run: `rg '#\{' mesher/ingestion/fingerprint.mpl`

**Expected:** At least 5 matches — the 5 `<>` sites converted to interpolation use `#{}` syntax.

---

### EC-03: No accidental removal of legitimate `let` bindings

**Steps:**
1. Run: `rg '^  let ' mesher/ingestion/pipeline.mpl | head -5`

**Expected:** Legitimate `let` bindings still present (e.g. `let peer_count = ...`, `let batch = ...`). Only `let _ = <side-effect>` was removed; named bindings are untouched.
