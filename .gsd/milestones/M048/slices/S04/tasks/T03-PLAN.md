---
estimated_steps: 5
estimated_files: 5
skills_used:
  - create-skill
  - test
---

# T03: Refresh the Mesh init-time skill bundle and pin clustered/runtime guidance

**Slice:** S04 — Syntax and init-skill parity reset
**Milestone:** M048

## Description

Refresh the auto-loaded Mesh skill bundle so first-contact clustered guidance matches the current source-first runtime story. This task adds a dedicated clustering sub-skill, routes the root skill plus syntax/http sub-skills through it, and adds a retained Node contract test so missing `@cluster`, `Node.start_from_env()`, scaffold/init commands, operator commands, or bounded `HTTP.clustered(...)` guidance fails closed.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `tools/skill/mesh/SKILL.md` and new `tools/skill/mesh/skills/clustering/SKILL.md` | Fail the contract test if clustered/runtime routing is missing from the auto-loaded root skill or the new sub-skill. | N/A for local file reads. | Treat missing `@cluster`, `Node.start_from_env()`, init scaffold commands, or operator CLI commands as drift. |
| `tools/skill/mesh/skills/syntax/SKILL.md` and `tools/skill/mesh/skills/http/SKILL.md` | Fail if syntax/http guidance omits decorator syntax, `HTTP.on_*`, or `HTTP.clustered(...)`, or if it implies generic routing disappeared. | N/A. | Reject stale `[cluster]` / `clustered(work)` guidance or overclaims about route ownership as malformed content. |
| `README.md`, `compiler/mesh-pkg/src/scaffold.rs`, `tiny-cluster/README.md`, `cluster-proof/README.md`, `compiler/mesh-typeck/tests/http_clustered_routes.rs` | Use these as the source truth; fail the task if skill wording drifts away from the shipped scaffold/runtime contract. | N/A. | Treat unsupported commands or ungrounded API claims as contract failure. |

## Load Profile

- **Shared resources**: the Mesh skill tree plus the clustered source-truth docs/tests listed above.
- **Per-operation cost**: a handful of file reads and string assertions in one Node test.
- **10x breakpoint**: duplicated wording drift across skill files fails before any resource limit does, so the task should minimize redundant phrasing and centralize routing to the clustering sub-skill.

## Negative Tests

- **Malformed inputs**: missing clustering sub-skill entry, missing root-skill routing bullets, missing `HTTP.on_get` / `HTTP.on_post` / `HTTP.on_put` / `HTTP.on_delete`, or missing `HTTP.clustered(...)` mention.
- **Error paths**: fail if any skill file still teaches `[cluster]`, `clustered(work)`, package-owned inspection routes, or omits `meshc cluster status|continuity|diagnostics`.
- **Boundary conditions**: keep `HTTP.route(...)` documented as the generic route API while making the route-free `@cluster` story canonical and the Todo starter’s explicit-count `HTTP.clustered(1, ...)` usage truthful.

## Steps

1. Add `tools/skill/mesh/skills/clustering/SKILL.md` with the source-first clustered contract: `@cluster` / `@cluster(N)`, `Node.start_from_env()`, `meshc init --clustered`, `meshc init --template todo-api`, `meshc cluster status|continuity|diagnostics`, and bounded `HTTP.clustered(...)` guidance grounded in shipped sources.
2. Update `tools/skill/mesh/SKILL.md` to mention the current clustered/runtime story in the overview, list `skills/clustering`, and route cluster/runtime questions there.
3. Add a short decorator note and cross-link in `tools/skill/mesh/skills/syntax/SKILL.md` so generic syntax questions do not miss `@cluster`.
4. Expand `tools/skill/mesh/skills/http/SKILL.md` to cover `HTTP.on_get` / `HTTP.on_post` / `HTTP.on_put` / `HTTP.on_delete`, `HTTP.clustered(handler)` / `HTTP.clustered(1, handler)`, and the constraint that route-free `@cluster` remains the canonical clustered surface while `HTTP.route(...)` stays valid.
5. Add `scripts/tests/verify-m048-s04-skill-contract.test.mjs` that asserts the exact clustered/runtime guidance and cross-links remain present in the root skill and sub-skills.

## Must-Haves

- [ ] `tools/skill/mesh/SKILL.md` routes clustered/runtime questions to a dedicated `skills/clustering` sub-skill.
- [ ] `tools/skill/mesh/skills/clustering/SKILL.md` teaches `@cluster`, `Node.start_from_env()`, `meshc init --clustered`, `meshc init --template todo-api`, and `meshc cluster status|continuity|diagnostics` from current repo truth.
- [ ] `tools/skill/mesh/skills/syntax/SKILL.md` and `tools/skill/mesh/skills/http/SKILL.md` add the missing decorator and bounded clustered-route guidance without deleting `HTTP.route(...)`.
- [ ] `scripts/tests/verify-m048-s04-skill-contract.test.mjs` fails closed on missing clustered/runtime guidance or stale deleted patterns.

## Verification

- `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs`
- Inspect any failing assertion for the exact missing file/token path before broadening wording or duplicating guidance.

## Observability Impact

- Signals added/changed: the skill contract test names the missing skill file and required guidance token/path directly.
- How a future agent inspects this: rerun `node --test scripts/tests/verify-m048-s04-skill-contract.test.mjs` and compare the failing skill text against `README.md`, `compiler/mesh-pkg/src/scaffold.rs`, `tiny-cluster/README.md`, `cluster-proof/README.md`, and `compiler/mesh-typeck/tests/http_clustered_routes.rs`.
- Failure state exposed: root-skill routing drift, missing clustering sub-skill coverage, or HTTP/syntax cross-link drift is attributable to one file instead of the whole bundle.

## Inputs

- `tools/skill/mesh/SKILL.md` — current auto-loaded Mesh root skill that omits the clustered/runtime story.
- `tools/skill/mesh/skills/syntax/SKILL.md` — current syntax sub-skill that needs a decorator note or cross-link.
- `tools/skill/mesh/skills/http/SKILL.md` — current HTTP sub-skill missing method-specific and clustered-route guidance.
- `README.md` — current public clustered quick-start and operator command truth.
- `compiler/mesh-pkg/src/scaffold.rs` — scaffold-generated README/source truth for `meshc init --clustered` and `meshc init --template todo-api`.
- `tiny-cluster/README.md` — canonical minimal route-free clustered package runbook.
- `cluster-proof/README.md` — canonical deeper packaged clustered runbook.
- `compiler/mesh-typeck/tests/http_clustered_routes.rs` — accepted `HTTP.clustered(...)` forms and constraints.

## Expected Output

- `tools/skill/mesh/SKILL.md` — root skill updated with clustering/runtime routing.
- `tools/skill/mesh/skills/clustering/SKILL.md` — new dedicated clustering/runtime sub-skill.
- `tools/skill/mesh/skills/syntax/SKILL.md` — syntax skill updated with `@cluster` note/cross-link.
- `tools/skill/mesh/skills/http/SKILL.md` — HTTP skill updated with method-specific and bounded `HTTP.clustered(...)` guidance.
- `scripts/tests/verify-m048-s04-skill-contract.test.mjs` — retained skill contract test for clustered/runtime truth.
