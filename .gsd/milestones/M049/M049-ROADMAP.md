# M049: 

## Vision
Replace Mesh's proof-app-shaped onboarding with a dual-database scaffold and generated examples that present one truthful public starter story: SQLite stays explicitly local, Postgres is the serious clustered path, and already-landed M048 tooling truths remain green while the repo stops teaching from top-level proof packages.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Postgres starter contract | high | — | ✅ | `meshc init --template todo-api --db postgres <name>` emits a modern starter that builds, tests, and tells the serious clustered/deployable story honestly. |
| S02 | SQLite local starter contract | medium | S01 | ✅ | `meshc init --template todo-api --db sqlite <name>` emits the matching local-first starter with explicit single-node/local guidance and no fake clustered durability claims. |
| S03 | Generated `/examples` from scaffold output | high | S01, S02 | ✅ | `/examples/todo-postgres` and `/examples/todo-sqlite` exist as generated outputs that build, test, and match scaffold output mechanically. |
| S04 | Retire top-level proof-app onboarding surfaces | high | S03 | ✅ | `tiny-cluster/` and `cluster-proof/` are gone as top-level onboarding projects, and repo references now point at `/examples` or lower-level fixtures/support instead. |
| S05 | Assembled scaffold/example truth replay | medium | S04 | ✅ | One named repo verifier proves dual-db scaffold generation, generated-example parity, proof-app removal, and M048 non-regression guardrails together. |
