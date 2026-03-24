# Project

## What This Is

Mesh is a programming language and application platform repository focused on becoming a production-trustworthy general-purpose language with a lean toward server/backend code. It already contains the compiler, runtime, standard library, formatter, LSP, REPL, package tooling, registry, docs site, benchmarks, and dogfooded applications. The current priority is fixing syntax rough edges and DX friction discovered through real backend dogfooding, then cleaning up both dogfood codebases to use idiomatic Mesh.

## Core Value

Mesh should be something you can trust for a real production app backend in any capacity, starting with an honest API + DB + migrations + background jobs path that feels as easy to deploy as a Go binary.

## Current State

The repository ships a broad backend-oriented language platform:
- Rust workspace crates for lexing, parsing, type checking, code generation, runtime, formatter, LSP, REPL, package resolution, and CLI tooling
- native LLVM code generation to standalone binaries
- runtime support for actors, supervision, HTTP, WebSocket, JSON, database access, migrations, files, env, crypto, datetime, and collections
- package and registry infrastructure plus a docs/website surface
- dogfooded backend applications: `reference-backend/` (API + DB + jobs) and `mesher/` (error monitoring platform)

M028 established the backend trust baseline with recovery proof, deployment proof, tooling trust, and documentation. M031/S01 fixed three compiler bugs that blocked idiomatic Mesh patterns: trailing-closure disambiguation in control-flow conditions (`if fn_call() do`), `else if` chain value correctness, and multiline function call type resolution. M031/S02 added parenthesized multiline imports (`from Module import (\n  a,\n  b\n)`) and trailing-comma formatter support. M031/S03 cleaned `reference-backend/` to use idiomatic Mesh throughout — zero `let _ =`, zero `== true`, struct update syntax, `else if` chains, and multiline imports. M031/S04 cleaned `mesher/` — zero `let _ =` (72 removed), 11 `<>` replaced with interpolation, 3 else/if chains flattened (multiline imports deferred on formatter bug). The remaining M031 gap is expanded language test coverage (S05).

## Architecture / Key Patterns

- Rust workspace under `compiler/` with distinct crates for lexer, parser, type checker, codegen, runtime, formatter, LSP, REPL, package tooling, and CLI
- native-binary compilation via LLVM rather than a VM runtime requirement
- runtime centered on actors, supervision, HTTP, WebSocket, DB, migrations, and other backend primitives
- dogfooding through `reference-backend/` and `mesher/`
- proof-first rule: if a language limitation blocks the app, fix Mesh at the source and prove it through a real backend workflow

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M028: Language Baseline Audit & Hardening — slice work landed, closure blocked by serial recovery-proof instability
- [ ] M029: Backend Ergonomics — improve the language/runtime/DX where real backend pressure exposes friction
- [ ] M030: Tooling & Package Trust — make fmt/LSP/tests/coverage/dependency flow credible for daily backend work
- [ ] M031: Language DX Audit & Rough Edge Fixes — fix parser/codegen bugs, clean up dogfood code, expand test coverage
