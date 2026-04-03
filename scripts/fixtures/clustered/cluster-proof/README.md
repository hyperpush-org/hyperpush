# cluster-proof

`scripts/fixtures/clustered/cluster-proof/` is one of the three equal canonical clustered surfaces in this repository alongside the generated `meshc init --clustered` scaffold and `scripts/fixtures/clustered/tiny-cluster/`. It keeps the same route-free source-first contract while carrying the deeper packaged failover/operator runbook.

## Package contract

- `mesh.toml` is package-only and intentionally omits manifest cluster declarations
- `main.mpl` has one bootstrap path: `Node.start_from_env()`
- `work.mpl` defines `@cluster pub fn add()`
- the runtime-owned handler name is derived from the ordinary source function name as `Work.add`
- the visible work body stays `1 + 1`
- the package does not own HTTP routes, submit handlers, proxy config, or work-delay seams

## Runtime contract

Set these environment variables when you want the app to participate in a cluster:

- `MESH_CLUSTER_COOKIE` — shared cluster cookie used for authenticated node traffic
- `MESH_NODE_NAME` — optional advertised node identity (`name@host:port`); defaults to `app@127.0.0.1:$MESH_CLUSTER_PORT`
- `MESH_DISCOVERY_SEED` — discovery seed used by the runtime DNS discovery loop
- `MESH_CLUSTER_PORT` — node listener port (default `4370`)
- `MESH_CONTINUITY_ROLE` — runtime continuity role (`primary` or `standby`)
- `MESH_CONTINUITY_PROMOTION_EPOCH` — bounded promotion epoch (`0` by default)

The runtime automatically starts the source-declared `@cluster` function and closes the continuity record when it returns.

## Smoke rail

```bash
cargo run -q -p meshc -- build scripts/fixtures/clustered/cluster-proof
cargo run -q -p meshc -- test scripts/fixtures/clustered/cluster-proof/tests
docker build -f scripts/fixtures/clustered/cluster-proof/Dockerfile -t mesh-cluster-proof .
```

## Runtime inspection

Once a built `cluster-proof` node is running in cluster mode, inspect it through Mesh-owned CLI surfaces instead of app-owned routes:

```bash
meshc cluster status <node-name@host:port> --json
meshc cluster continuity <node-name@host:port> --json
meshc cluster continuity <node-name@host:port> <request-key> --json
meshc cluster diagnostics <node-name@host:port> --json
```

Use the list form first to discover request keys and runtime-owned startup records, then inspect a single record when you want the per-request continuity detail.

## Packaging contract

- `scripts/fixtures/clustered/cluster-proof/Dockerfile` is a two-stage build that copies only the built `cluster-proof` binary into the runtime image
- `scripts/fixtures/clustered/cluster-proof/fly.toml` keeps only the process/build settings needed to run the binary in a Fly machine cluster
- Fly proxying and package-owned health surfaces are out of scope for this proof package
- if you need the repo-wide cutover rail, use `bash scripts/verify-m047-s04.sh`; `bash scripts/verify-m046-s06.sh`, `bash scripts/verify-m046-s05.sh`, and `bash scripts/verify-m045-s05.sh` remain historical compatibility aliases into that M047 cutover rail

## Scope

This directory is intentionally the deeper packaged failover/operator runbook, not a separate clustered contract. Keep it aligned with the generated scaffold and `scripts/fixtures/clustered/tiny-cluster/`, and treat package-owned control routes as drift rather than documentation variation.
