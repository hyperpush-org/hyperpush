---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - test
  - review
---

# T03: Add backend-shaped JSON-RPC LSP integration proof

**Slice:** S03 — Daily-Driver Tooling Trust
**Milestone:** M028

## Description

Turn LSP trust from “unit tests and `--help` exist” into “a real `meshc lsp` process behaves correctly on backend-shaped code.” This task should add a transport-level Rust harness that speaks JSON-RPC to `meshc lsp`, uses `reference-backend/` files as proof inputs, and fixes any backend-shaped transport bug that the harness exposes.

## Steps

1. Create `compiler/meshc/tests/e2e_lsp.rs` with reusable JSON-RPC helpers that spawn `meshc lsp`, send `initialize`, `initialized`, `textDocument/didOpen`, and then issue explicit LSP requests against backend-shaped files from `reference-backend/`.
2. Assert backend-shaped diagnostics publication plus at least hover/definition, document formatting, and one assist surface such as completion or signature help so the proof covers both passive analysis and interactive editor behavior.
3. If the transport harness exposes backend-specific correctness issues, fix them in `compiler/mesh-lsp/src/server.rs` and/or `compiler/mesh-lsp/src/analysis.rs` instead of weakening the proof to toy-only snippets.
4. Keep the harness deterministic: named requests, bounded waits for server responses, and failure output that shows which JSON-RPC capability regressed.

## Must-Haves

- [ ] `compiler/meshc/tests/e2e_lsp.rs` spawns the real `meshc lsp` binary instead of bypassing transport through unit-only helper calls.
- [ ] The e2e harness uses `reference-backend/` files as proof inputs, not only synthetic toy strings.
- [ ] The test suite covers diagnostics plus formatting and at least one navigation/intellisense surface.
- [ ] Any bug fix needed for backend-shaped LSP behavior lands in production code (`server.rs` / `analysis.rs`), not only in the test harness.

## Verification

- `cargo test -p mesh-lsp -- --nocapture`
- `cargo test -p meshc --test e2e_lsp -- --nocapture`

## Observability Impact

- Signals added/changed: backend-shaped LSP regressions become named JSON-RPC assertion failures rather than editor-only anecdotes.
- How a future agent inspects this: run `cargo test -p meshc --test e2e_lsp -- --nocapture` to see which request/notification path failed.
- Failure state exposed: missing diagnostics, bad hover/definition positions, formatting crashes, and broken assist responses are localized to explicit request phases.

## Inputs

- `compiler/mesh-lsp/src/server.rs` — advertised capabilities and transport handlers
- `compiler/mesh-lsp/src/analysis.rs` — analysis/hover/diagnostic plumbing used by the server
- `compiler/meshc/tests/tooling_e2e.rs` — current shallow tooling proof surface to avoid duplicating weak patterns
- `reference-backend/api/health.mpl` — backend-shaped file for formatting/diagnostic proof
- `reference-backend/api/jobs.mpl` — backend-shaped file for navigation/assist proof

## Expected Output

- `compiler/meshc/tests/e2e_lsp.rs` — real JSON-RPC LSP integration harness for backend-shaped code
- `compiler/mesh-lsp/src/server.rs` — transport or formatting fixes required by the new proof
- `compiler/mesh-lsp/src/analysis.rs` — analysis fixes required by the new proof
