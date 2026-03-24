# Project

## What This Is

Mesh is a programming language and application platform repository focused on becoming a production-trustworthy general-purpose language with a lean toward server/backend code. It already contains the compiler, runtime, standard library, formatter, LSP, REPL, package tooling, registry, docs site, benchmarks, and dogfooded applications. The current priority is not to keep adding features blindly; it is to make Mesh trustworthy for real backend use.

## Core Value

Mesh should be something you can trust for a real production app backend in any capacity, starting with an honest API + DB + migrations + background jobs path that feels as easy to deploy as a Go binary.

## Current State

The repository already ships a broad backend-oriented language platform:
- Rust workspace crates for lexing, parsing, type checking, code generation, runtime, formatter, LSP, REPL, package resolution, and CLI tooling
- native LLVM code generation to standalone binaries
- runtime support for actors, supervision, HTTP, WebSocket, JSON, database access, migrations, files, env, crypto, datetime, and collections
- package and registry infrastructure plus a docs/website surface
- dogfooded backend applications and benchmarks inside the repo

The current gap is not feature count. The current gap is still trust, although M028 materially improved the repo’s baseline. The repo now contains a real `reference-backend/` package that builds, starts, migrates, serves HTTP, persists jobs in Postgres, and runs durable background jobs; the compiler-facing Rust harness now covers migration truth, HTTP/DB/health agreement, multi-instance exact-once processing, worker-crash recovery, restart visibility, whole-process restart recovery, and deploy smoke; the same backend now has materially stronger formatter, test-runner, LSP, and doc/editor proof surfaces; and the public README/docs/runbook surface now points at this backend instead of relying on toy examples. But M028 is not sealed yet: closeout reruns reconfirmed build/fmt/test/migrate/smoke, docs proof-surface verification, website build, and multi-instance exact-once behavior, while the serial recovery gate still flakes on `e2e_reference_backend_worker_crash_recovers_job` because `/health` can go stale before processed-state accounting aligns after recovery. The immediate project gap is therefore to stabilize that recovery proof in the full serial acceptance sequence, then continue with post-baseline backend ergonomics and differentiators.

## Architecture / Key Patterns

- Rust workspace under `compiler/` with distinct crates for lexer, parser, type checker, codegen, runtime, formatter, LSP, REPL, package tooling, and CLI
- native-binary compilation via LLVM rather than a VM runtime requirement
- runtime centered on actors, supervision, HTTP, WebSocket, DB, migrations, and other backend primitives
- dogfooding through repo-local applications such as `mesher/` and benchmark fixtures
- proof-first rule for this phase: if a baseline/backend trust gap is exposed, fix Mesh at the source and prove it through a real backend workflow rather than a toy-only demo

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M028: Language Baseline Audit & Hardening — slice work landed, but closure is still blocked by a serial recovery-proof instability in `e2e_reference_backend_worker_crash_recovers_job`
- [ ] M029: Backend Ergonomics — improve the language/runtime/DX where real backend pressure exposes friction
- [ ] M030: Tooling & Package Trust — make fmt/LSP/tests/coverage/dependency flow credible for daily backend work
- [ ] M031: Production Backend Maturity — extend proof to long-running services, realtime, and distributed backends credibly
