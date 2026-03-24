# S02 UAT: Trailing Commas & Multiline Imports

## Preconditions

- Mesh compiler builds: `cargo build -p meshc`
- Both dogfood codebases compile before testing

## Test Cases

### TC1: Parenthesized import — single line

**Steps:**
1. Create a two-file Mesh project where `lib.mpl` exports `pub fn greet() -> String do "hello" end`
2. In `main.mpl`, write `from Lib import (greet)`
3. Compile and run

**Expected:** Compiles successfully; `greet()` is callable and returns `"hello"`.

### TC2: Parenthesized import — multiline

**Steps:**
1. Create `lib.mpl` exporting two functions: `pub fn add(a: Int, b: Int) -> Int do a + b end` and `pub fn greet() -> String do "hi" end`
2. In `main.mpl`, write:
   ```
   from Lib import (
     add,
     greet
   )
   ```
3. Compile and run, calling both functions

**Expected:** Compiles successfully; both `add` and `greet` are accessible.

### TC3: Parenthesized import — trailing comma

**Steps:**
1. Same `lib.mpl` as TC2
2. In `main.mpl`, write:
   ```
   from Lib import (
     add,
     greet,
   )
   ```
3. Compile and run

**Expected:** The trailing comma after `greet` is accepted. Both functions work.

### TC4: Trailing comma in function call — single line

**Steps:**
1. Write a Mesh program with `fn add(a: Int, b: Int) -> Int do a + b end`
2. Call it as `add(1, 2,)` — note trailing comma
3. Compile and run

**Expected:** Compiles and runs, producing the correct result.

### TC5: Trailing comma in function call — multiline

**Steps:**
1. Same function as TC4
2. Call it as:
   ```
   add(
     1,
     2,
   )
   ```
3. Compile and run

**Expected:** Compiles and runs correctly.

### TC6: Formatter — parenthesized import preserved

**Steps:**
1. Write a file with `from Lib import (\n  add,\n  greet\n)`
2. Run `meshc fmt` on it
3. Inspect the output

**Expected:** Formatter preserves the parenthesized multiline layout with one name per indented line. Does not collapse to a single line.

### TC7: Formatter — trailing comma in arg list

**Steps:**
1. Write a file with `add(1, 2,)` on one line
2. Run `meshc fmt`

**Expected:** No extra space before `)` — result is `add(1, 2,)`, not `add(1, 2, )`.

### TC8: Malformed paren import — missing closing paren

**Steps:**
1. Write `from Lib import (add, greet` — no closing `)`
2. Attempt to parse/compile

**Expected:** Parser emits a clear `expected R_PAREN` diagnostic with span information pointing to the end of the import list.

### TC9: Dogfood build stability

**Steps:**
1. `cargo run -p meshc -- build reference-backend`
2. `cargo run -p meshc -- build mesher`

**Expected:** Both build without errors. No regressions from the parser/formatter changes.

### TC10: Full e2e suite regression check

**Steps:**
1. `cargo test -p meshc --test e2e`

**Expected:** 313+ tests pass. Only the 10 pre-existing `try_*`/`from_try_*` failures remain. No new failures.

## Edge Cases

- **Empty paren import:** `from Lib import ()` — should this parse? Current behavior: treated as zero imports. Not a required pattern but should not crash the parser.
- **Nested parens in import position:** Not applicable — import names are identifiers, not expressions. No disambiguation needed.
- **Trailing comma with no args:** `fn_call(,)` — should be a parse error, not silently accepted.
