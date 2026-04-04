# reference-backend

`reference-backend/` is the canonical Mesh backend package for this slice. It proves one real runtime can compose:

- env-driven startup validation
- Postgres migrations
- `GET /health`
- `POST /jobs`
- `GET /jobs/:id`
- a timer-driven worker that moves the same persisted row from `pending` to `processed`

## Startup contract

These variables are required by `reference-backend/main.mpl` and by the staged native binary:

- `DATABASE_URL` — required Postgres connection string
- `PORT` — required positive integer HTTP port
- `JOB_POLL_MS` — required positive integer worker poll interval in milliseconds

## Prerequisites

### Repo and local-development prerequisites

- Rust toolchain for `cargo`
- a reachable Postgres instance
- `curl`, `psql`, and `python3` available in your shell
- environment loaded from `reference-backend/.env.example` or exported in your shell

Example local setup:

```bash
cp reference-backend/.env.example .env
# Update DATABASE_URL for your local Postgres, then load it:
set -a && source .env && set +a
```

## Boring native deployment

This is the verified package-local deployment path from S04. Build once on a build host, copy the staged bundle to a runtime host, apply the checked-in SQL artifact through `psql`, start the staged binary, then run the probe-only smoke script.

After staging, the runtime host does not need `meshc`, `cargo`, or a repo checkout. It only needs the staged bundle, the runtime env contract above, and a reachable Postgres instance.

### Build host requirements

The build host is where you run the repo-local staging command.

- this repository checkout
- Rust toolchain for `cargo`
- `bash`
- the same target OS/architecture you plan to run on

### Stage the deploy bundle on the build host

From the repo root:

```bash
tmp_dir="$(mktemp -d)"
bash reference-backend/scripts/stage-deploy.sh "$tmp_dir"
```

`stage-deploy.sh` already runs `cargo run -p meshc -- build reference-backend` and stages this bundle layout:

```text
$tmp_dir/reference-backend
$tmp_dir/reference-backend.up.sql
$tmp_dir/apply-deploy-migrations.sh
$tmp_dir/deploy-smoke.sh
```

Copy that staged directory to the runtime host. The ignored deploy-artifact e2e proves the bundle can start from a temp directory outside the repo root.

### Runtime host requirements

The runtime host is where you apply schema, start the staged binary, and optionally run the probe-only smoke command.

- the staged bundle copied from the build host
- `DATABASE_URL`, `PORT`, and `JOB_POLL_MS`
- `psql` on `PATH` to run `apply-deploy-migrations.sh`
- `curl` and `python3` on `PATH` to run `deploy-smoke.sh`
- no `meshc`, no `cargo`, and no source-tree checkout after staging

### Apply schema on the runtime host

The runtime-side schema step uses the staged SQL artifact and does not invoke `meshc`:

```bash
bundle_dir=/opt/reference-backend
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} \
  bash "$bundle_dir/apply-deploy-migrations.sh" "$bundle_dir/reference-backend.up.sql"
```

`apply-deploy-migrations.sh` prints named `[deploy-apply]` phases, applies the staged SQL through `psql`, and verifies that `_mesh_migrations` recorded version `20260323010000`.

### Start the staged binary on the runtime host

Start the binary from the staged location with the bundle directory as the working directory:

```bash
bundle_dir=/opt/reference-backend
(
  cd "$bundle_dir"
  DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} \
  PORT=18080 \
  JOB_POLL_MS=500 \
  ./reference-backend
)
```

The staged runtime contract is still just `DATABASE_URL`, `PORT`, and `JOB_POLL_MS`.

### Smoke-check the running staged artifact

Once the binary is up, run the probe-only deploy smoke script against the running instance:

```bash
bundle_dir=/opt/reference-backend
BASE_URL=http://127.0.0.1:18080 \
  bash "$bundle_dir/deploy-smoke.sh"
```

`deploy-smoke.sh` does not rebuild anything. It waits for `/health`, creates a job through `POST /jobs`, polls `GET /jobs/:id`, and exits only after the job reaches `processed`. If `BASE_URL` is unset, the script falls back to `http://127.0.0.1:$PORT` and defaults `PORT` to `18080`.

### Repo-level proof for this deploy path

This exact build/apply/run/smoke story is exercised by the ignored e2e below:

```bash
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture
```

That proof stages the bundle outside the repo root, applies the staged SQL artifact, starts the staged binary from the staged bundle, runs `deploy-smoke.sh`, and then cross-checks `/health`, `/jobs/:id`, `jobs`, `_mesh_migrations`, and log redaction.

## Canonical commands

### Daily-driver edit loop

These are the repo-level commands that now define the verified backend workflow:

```bash
cargo run -p meshc -- fmt --check reference-backend
cargo run -p meshc -- test reference-backend
cargo test -p meshc --test e2e_lsp -- --nocapture
```

Use `cargo run -p meshc -- lsp` as your editor's language-server command; the repo-level LSP regression suite above proves diagnostics, hover, go-to-definition, document formatting, and signature help against backend-shaped files.

### Build compiler/runtime prerequisites

```bash
cargo build -p mesh-rt
```

### Build the package

```bash
cargo run -p meshc -- build reference-backend
```

### Run the backend Mesh tests from the project root

```bash
cargo run -p meshc -- test reference-backend
```

### Run only the backend test directory

```bash
cargo run -p meshc -- test reference-backend/tests
```

### Run one backend Mesh test file

```bash
cargo run -p meshc -- test reference-backend/tests/config.test.mpl
```

### Coverage contract

```bash
cargo run -p meshc -- test --coverage reference-backend
```

`--coverage` is not implemented yet for `meshc test`; the command exits non-zero with an explicit unsupported message instead of pretending coverage succeeded.

### Check the explicit missing-env failure

```bash
env -u DATABASE_URL PORT=18080 JOB_POLL_MS=500 ./reference-backend/reference-backend 2>&1 | rg "DATABASE_URL"
```

### Inspect migration state

```bash
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo run -p meshc -- migrate reference-backend status
```

### Apply migrations

```bash
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo run -p meshc -- migrate reference-backend up
```

### Run the backend

```bash
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} PORT=18080 JOB_POLL_MS=500 ./reference-backend/reference-backend
```

### Run the package smoke path

```bash
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} PORT=18080 JOB_POLL_MS=500 bash reference-backend/scripts/smoke.sh
```

## Supervision and recovery

The public recovery contract for `reference-backend/` is not implied by the generic backend guides. It is the named S07 proof set below, and the public proof page plus `scripts/verify-production-proof-surface.sh` are expected to stay aligned with this exact command list.

```bash
cargo run -p meshc -- build reference-backend
cargo run -p meshc -- fmt --check reference-backend
cargo run -p meshc -- test reference-backend
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_migration_status_and_apply -- --ignored --nocapture
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_deploy_artifact_smoke -- --ignored --nocapture
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_crash_recovers_job -- --ignored --nocapture
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_worker_restart_is_visible_in_health -- --ignored --nocapture
DATABASE_URL=${DATABASE_URL:?set DATABASE_URL} cargo test -p meshc --test e2e_reference_backend e2e_reference_backend_process_restart_recovers_inflight_job -- --ignored --nocapture
bash scripts/verify-production-proof-surface.sh
```

Run the ignored database-backed proofs serially against one `DATABASE_URL`. They reset and migrate shared state and are not safe to run in parallel against the same database.

### `/health` fields that define recovery truth

`GET /health` is the operator-facing recovery surface that the ignored proofs assert against.

- `restart_count` — worker-supervision restart counter. The worker-crash proofs expect it to increment to `1` after `worker_crash_after_claim`. The whole-process restart proof keeps this at `0` because the process was replaced rather than the in-process worker supervisor restarting the actor.
- `last_exit_reason` — last worker-supervision exit reason. It must become `"worker_crash_after_claim"` for the worker-crash proofs and remain `null` for the whole-process restart proof.
- `recovered_jobs` — count of jobs requeued from interrupted processing. It reaches `1` in both the worker-crash and whole-process restart proofs once the abandoned job has been recovered.
- `last_recovery_at`, `last_recovery_job_id`, `last_recovery_count` — the most recent recovery event. The restart-visibility proof and the process restart proof both require these fields during the degraded recovery window and after the backend returns to healthy state.
- `recovery_active` — `true` while the backend is still in the degraded/recovering window and `false` once the recovered job has been processed and the backend is healthy again.

A degraded recovery window should therefore read as `status: "degraded"` with worker `liveness: "recovering"`. The final steady-state success case is `status: "ok"`, worker `liveness: "healthy"`, and the recovery fields above preserved as historical evidence.

### How to interpret worker crash vs process restart proofs

- **Worker crash proof** — `e2e_reference_backend_worker_crash_recovers_job` proves the worker crashes after claiming a job, the supervisor restarts it, the job is requeued to `pending` with one attempt and a recovery error marker, then the restarted worker processes that same job to `processed`. Expect `restart_count=1`, `last_exit_reason="worker_crash_after_claim"`, and `recovered_jobs=1`.
- **Restart visibility proof** — `e2e_reference_backend_worker_restart_is_visible_in_health` proves the degraded `/health` window is visible instead of skipped. Expect a new `boot_id` / `started_at`, `recovery_active=true`, and populated `last_recovery_*` fields before the backend settles back to healthy.
- **Process restart proof** — `e2e_reference_backend_process_restart_recovers_inflight_job` kills the whole backend while a job is still `processing`, starts a fresh process, and requires boot recovery to requeue that abandoned row. Expect a new `boot_id` / `started_at`, `recovered_jobs=1`, `recovery_active=true` during recovery, and `last_exit_reason=null` because this path is a process restart, not a worker-supervisor restart.

If the migration and deploy proofs pass but one of the restart proofs fails, treat that as a real recovery regression. If the runtime proofs stay green but `bash scripts/verify-production-proof-surface.sh` fails, treat that as proof-surface drift in the docs rather than a backend runtime failure.
