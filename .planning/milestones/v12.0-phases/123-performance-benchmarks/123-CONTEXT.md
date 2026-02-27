# Phase 123: Performance Benchmarks - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish HTTP benchmark results comparing Mesh performance against Rust (axum), Go (stdlib net/http), and Elixir (Plug + Cowboy). Includes benchmark servers for all four languages, an automated runner script, documented methodology, and committed results. Benchmark infrastructure and documentation only — no changes to the Mesh runtime itself.

</domain>

<decisions>
## Implementation Decisions

### Benchmark tooling
- Load testing tool: wrk
- Concurrency: 100 connections
- Duration: 10s warmup + 30s timed run, averaged across 3 runs
- Automation: single `run_benchmarks.sh` shell script that starts all servers, runs wrk, collects output, and prints a summary

### Language frameworks
- Rust: axum (tokio-based, modern, widely cited)
- Go: stdlib `net/http` (idiomatic Go, no framework overhead)
- Elixir: Plug + Cowboy (raw HTTP, no Phoenix overhead)
- Directory layout: `benchmarks/mesh/`, `benchmarks/go/`, `benchmarks/rust/`, `benchmarks/elixir/` under a root `benchmarks/` directory

### Benchmark scenario
- Two endpoints per server: plain text (`text/plain`) and JSON (`{"message": "Hello, World!"}`)
- Each endpoint benchmarked and reported separately
- Protocol: HTTP/1.1 only (wrk default)
- Worker/thread count: match CPU core count (natural optimal for each runtime)
- Load topology: TWO dedicated Fly.io performance-2x VMs. Server VM hosts all four language servers; load generator VM hosts wrk. Both in the same region, communicating over Fly.io private WireGuard network. This eliminates CPU contention between load generator and servers.

### Results publication
- Top-line summary table added to README.md with a link to full results
- Full breakdown in `benchmarks/RESULTS.md` (committed to repo)
- Metrics reported: req/s (throughput), p50 latency, p99 latency
- Presentation: markdown tables + SVG/PNG bar chart for visual comparison
- Methodology doc includes: CPU model + core count, OS + version, and exact language runtime versions used

### Claude's Discretion
- Chart generation tooling (gnuplot, Python matplotlib, a Go script, etc.)
- Exact server port assignments
- How to handle server startup/shutdown in the runner script
- Formatting details of RESULTS.md beyond the table structure

</decisions>

<specifics>
## Specific Ideas

- Results should be comparable to other published language benchmarks (TechEmpower-style methodology is the reference)
- Plain text endpoint tests throughput ceiling; JSON endpoint shows serialization overhead — report both separately
- Warmup period ensures JIT/startup artifacts don't skew Elixir results

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 123-performance-benchmarks*
*Context gathered: 2026-02-26*
