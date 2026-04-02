# M047: 

## Vision
Replace the narrow `clustered(work)` / manifest-centered clustered authoring model with a source-first `@cluster` declaration and `HTTP.clustered(...)` route wrapper story, then dogfood that reset into the canonical examples and a simple SQLite Todo scaffold with a complete Dockerfile.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Source decorator reset for clustered functions | high | — | ✅ | After this: `@cluster` and `@cluster(3)` compile on ordinary functions and surface clustered metadata/counts through compiler and LSP diagnostics without relying on `clustered(work)` or `.toml`. |
| S02 | Replication-count semantics for clustered functions | high | S01 | ✅ | After this: a non-HTTP clustered function using `@cluster` defaults to replication count `2`, explicit counts are preserved, and runtime truth no longer depends on a hardcoded `Work.execute_declared_work` story. |
| S03 | Clustered HTTP route wrapper | high | S01, S02 | ✅ | After this: router chains can use `HTTP.clustered(handle)` and `HTTP.clustered(N, handle)` on selected routes, and live HTTP requests prove the route handler is the clustered boundary. |
| S04 | Hard cutover and dogfood migration | medium | S01, S02, S03 | ✅ | After this: `tiny-cluster/`, `cluster-proof/`, generated clustered surfaces, and repo proof rails no longer teach `clustered(work)` or `.toml` clustering as the public model. |
| S05 | Simple clustered Todo scaffold | medium | S03, S04 | ✅ | After this: a new scaffold command generates a SQLite Todo API with several routes, actors, rate limiting, clustered route syntax, and a complete Dockerfile, and the result reads like a starting point. |
| S06 | Docs, migration, and assembled proof closeout | low | S04, S05 | ✅ | After this: one assembled verifier can regenerate the scaffold, build its Docker image, exercise the Todo API and clustered routes, and replay docs/migration/proof checks on the new model end to end. |
| S07 | Clustered HTTP route wrapper completion | high | S02, S04 | ✅ | After this: router chains can use `HTTP.clustered(handle)` and `HTTP.clustered(N, handle)`, the compiler/runtime lower selected routes onto the shared clustered declaration + replication-count seam, and live HTTP requests plus continuity inspection prove the route handler is the clustered boundary. |
| S08 | Clustered route adoption in scaffold, docs, and closeout proof | medium | S05, S06, S07 | ✅ | After this: the Todo scaffold, public docs, and assembled M047 verifier stop teaching `HTTP.clustered(...)` as a non-goal, selected Todo routes use the shipped wrapper truthfully, and native/Docker proof rails exercise clustered routes end to end. |
