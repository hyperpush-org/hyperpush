# S03 Research: Reference-Backend Dogfood Cleanup

## Summary

Mechanical cleanup of `reference-backend/` to remove workaround patterns and adopt idiomatic Mesh. All required language features — bare expressions, `else if` chains, `if fn_call() do`, struct update `%{state | field: value}`, multiline imports, and `not` prefix — are confirmed working through live probes. The codebase has 11 `.mpl` files; the cleanup concentrates in 4 files, with `worker.mpl` being 80% of the work.

## Requirement Targets

- **R023** (primary): Zero `let _ =` for side effects, zero `== true`, struct update syntax, idiomatic pipes
- **R011** (supporting): This cleanup is directly driven by backend friction

## Implementation Landscape

### Anti-Pattern Inventory

| File | `let _ =` | `== true` | Struct reconstruction | Nested `if/else/if` (→ `else if`) | `<>` concat | Long imports |
|------|-----------|-----------|----------------------|-----------------------------------|-------------|-------------|
| `jobs/worker.mpl` | 44 | 11 | 8 full 18-field reconstructions | 3 chains (NoteBoot, worker_needs_restart, handle_claim_error) | 0 | 0 |
| `api/health.mpl` | 0 | 4 | 0 | 4 chains (is_recovering_status, worker_liveness, health_status, recovery_active) | 1 (massive health_json) | 1 (410 chars) |
| `api/jobs.mpl` | 4 | 0 | 0 | 0 | 1 (job_to_json) | 0 |
| `storage/jobs.mpl` | 2 | 0 | 0 | 0 | 2 (SQL builders) | 0 |
| `main.mpl` | 2 | 0 | 0 | 0 | 0 | 0 |
| `runtime/registry.mpl` | 1 | 0 | 0 | 0 | 0 | 0 |

**Totals:** 53 `let _ =`, 15 `== true`, 8 struct reconstructions, 7 nested-if chains.

### What Each Transformation Looks Like

**`let _ =` removal:** Just delete `let _ = ` prefix. Bare expressions are confirmed working at codegen level (D028).

```
# Before
let _ = println("hello")
# After
println("hello")
```

**`== true` removal:** Drop `== true` from Bool-returning expressions. For `if fn_call() == true do`, change to `if fn_call() do` (works after S01 trailing-closure fix).

```
# Before
if worker_tick_is_stale(poll_ms, tick_age_ms) == true do
# After
if worker_tick_is_stale(poll_ms, tick_age_ms) do
```

**Struct update in service calls:** Replace 18-field `WorkerState { ... }` reconstruction with `%{state | changed_field: value}`. The 8 service `call` handlers in `JobWorkerState` each rebuild the full struct — most only change 2-4 fields.

```
# Before (NoteTick — only changes last_tick_at)
let next_state = WorkerState { poll_ms: state.poll_ms, boot_id: state.boot_id, ... all 18 fields ... }
# After
let next_state = %{state | last_tick_at: ts}
```

**`else if` chains:** Flatten nested `if/else/if/else` into `else if` chains (works after S01 codegen fix).

```
# Before (is_recovering_status)
if status == "recovering" do
  true
else
  if status == "crashing" do
    true
  else
    if status == "starting" do
      true
    else
      false
    end
  end
end
# After
if status == "recovering" do
  true
else if status == "crashing" do
  true
else if status == "starting" do
  true
else
  false
end
```

**Multiline imports:** The 410-char import in `health.mpl` becomes parenthesized multiline (works after S02).

**`<>` in SQL:** Per D029, keep `<>` for SQL template construction in `storage/jobs.mpl`. The SQL strings use `table` variable injection and are clearer with explicit concatenation.

**`<>` in JSON construction:** The `health_json()` and `job_to_json()` functions build JSON manually with `<>`. Per D029, these could use interpolation but are borderline — the template structure is already visible. The planner should decide whether to touch these or leave them.

### Confirmed Feature Probes

| Feature | Probe result |
|---------|-------------|
| Bare expression (`println()` without `let _ =`) | ✓ compiles and runs |
| `if fn_call() do` (no `== true`) | ✓ S01 trailing-closure fix |
| `else if` chains returning String values | ✓ S01 codegen fix |
| Struct update `%{state \| field: value}` | ✓ compiles and runs |
| Struct update in service `call` handler | ✓ compiles and runs |
| Multiline struct update | ✓ compiles and runs |
| `not fn_call()` prefix | ✓ compiles and runs |
| Parenthesized multiline imports | ✓ S02 parser fix |
| Formatter handles struct update | ✓ roundtrips clean |

### Files Requiring No Changes

- `config.mpl` — no anti-patterns
- `types/job.mpl` — no anti-patterns
- `api/router.mpl` — no anti-patterns (pipe usage already idiomatic)
- `tests/config.test.mpl` — no anti-patterns
- `migrations/20260323010000_create_jobs.mpl` — no anti-patterns

## Risks and Mitigations

**Risk: E2e test regressions from worker behavior changes.** The worker's exact log output and `/health` JSON are parsed by multiple e2e tests in `compiler/meshc/tests/e2e_reference_backend.rs`. Any change to log format or health JSON structure breaks those tests.

**Mitigation:** The cleanup is strictly behavioral-preserving — same log messages, same JSON output, same control flow. The `let _ =` removal doesn't change output. The struct update produces identical struct values. The `else if` refactoring produces identical return values (proven by S01). The e2e tests should pass unchanged.

**Risk: Formatter may not format struct update multiline cleanly.** The formatter handles struct update through the fallback inline-token path. Multiline struct updates with many fields might produce ugly formatting.

**Mitigation:** Confirmed `meshc fmt --check` passes on struct update code already. If formatting looks bad on very long updates, that's cosmetic and can be addressed later — the goal is correctness and idiomaticity.

**Risk: `meshc fmt` child-spec handling.** Per KNOWLEDGE.md, the formatter has known issues with `child ... do ... end` blocks. The worker file contains supervisor-related patterns.

**Mitigation:** The worker file uses `actor` and `service` blocks, not `child` specs. This known issue doesn't apply here.

## Recommendation

### Task Decomposition

The work splits naturally by file and risk level:

**T01: `jobs/worker.mpl` cleanup** (~80% of the work)
- Remove 44 `let _ =` → bare expressions
- Remove 11 `== true` → direct Bool usage / `if fn_call() do`
- Replace 8 full `WorkerState` reconstructions → `%{state | ...}` struct update
- Flatten 3 nested if/else chains → `else if`
- Estimated: largest task, highest value, moderate risk due to e2e test sensitivity

**T02: `api/health.mpl` + `api/jobs.mpl` + remaining files cleanup**
- `health.mpl`: Remove 4 `== true`, flatten 4 nested if/else chains → `else if`, convert 410-char import to multiline
- `jobs.mpl`: Remove 4 `let _ =`
- `storage/jobs.mpl`: Remove 2 `let _ =` (the `Repo.update_where` calls — needs care with `?` error propagation)
- `main.mpl`: Remove 2 `let _ =`
- `runtime/registry.mpl`: Remove 1 `let _ =`

**T03: Verification gate**
- `cargo run -p meshc -- build reference-backend`
- `cargo run -p meshc -- fmt --check reference-backend`
- `cargo run -p meshc -- test reference-backend`
- `cargo test -p meshc --test e2e` (full suite)
- `rg 'let _ =' reference-backend/ -g '*.mpl'` → 0 results
- `rg '== true' reference-backend/ -g '*.mpl'` → 0 results

Alternatively, T01 and T02 could merge into a single task since both are mechanical. The planner should decide based on context budget.

### Verification

The existing e2e tests in `compiler/meshc/tests/e2e_reference_backend.rs` are the primary gate. The cleanup should not change any observable behavior. After cleanup:
1. `cargo run -p meshc -- build reference-backend` must succeed
2. `cargo run -p meshc -- fmt --check reference-backend` must pass (11 files formatted)
3. `cargo run -p meshc -- test reference-backend` must pass
4. `rg 'let _ =' reference-backend/ -g '*.mpl'` must return 0 matches
5. `rg '== true' reference-backend/ -g '*.mpl'` must return 0 matches
6. Full e2e suite must remain at ≥313 passing tests

### Storage `let _ =` Caution

Two `let _ =` in `storage/jobs.mpl` (lines 91, 102) wrap `Repo.update_where(...)` calls that are followed by `?` error propagation: `let _ = Repo.update_where(...) ?`. Removing `let _ =` here means the expression becomes `Repo.update_where(...) ?` as a bare statement — the `?` must still propagate errors correctly. This should work (bare `expr ?` is just an expression statement with error propagation), but verify carefully.
