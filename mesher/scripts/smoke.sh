#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=mesher/scripts/lib/mesh-toolchain.sh
source "$SCRIPT_DIR/lib/mesh-toolchain.sh"

PORT_VALUE="${PORT:-18080}"
WS_PORT_VALUE="${MESHER_WS_PORT:-18081}"
BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT_VALUE}}"
ARTIFACT_DIR="${MESHER_SMOKE_ARTIFACT_DIR:-$MESHER_PACKAGE_DIR/../.tmp/m055-s02/mesher-smoke}"
BUILD_DIR="$ARTIFACT_DIR/build"
BINARY_PATH="$BUILD_DIR/mesher"
LOG_FILE="$ARTIFACT_DIR/mesher.log"
SETTINGS_RESPONSE_PATH="$ARTIFACT_DIR/project-settings-last-response.txt"
rm -f "$SETTINGS_RESPONSE_PATH"
SERVER_PID=''
LAST_RESPONSE=''

usage() {
  echo 'usage: bash mesher/scripts/smoke.sh' >&2
}

fail() {
  echo "[mesher-smoke] $1" >&2
  exit 1
}

json_field() {
  local field="$1"
  python3 -c '
import json
import sys

field = sys.argv[1]
try:
    value = json.load(sys.stdin)
except json.JSONDecodeError:
    raise SystemExit(1)
for key in field.split("."):
    if not isinstance(value, dict):
        raise SystemExit(1)
    value = value.get(key)
    if value is None:
        raise SystemExit(1)
if isinstance(value, bool):
    print("true" if value else "false")
elif isinstance(value, (dict, list)):
    print(json.dumps(value, separators=(",", ":")))
else:
    print(value)
' "$field"
}

cleanup() {
  local status=$?
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  if [[ $status -ne 0 ]]; then
    echo "[mesher-smoke] failure; tailing server log from $LOG_FILE" >&2
    tail -n 200 "$LOG_FILE" >&2 || true
  fi
}
trap cleanup EXIT

if [[ $# -ne 0 ]]; then
  usage
  exit 1
fi

mesher_require_command curl
mesher_require_command psql
mesher_require_command python3
mesher_require_database_url

if [[ ! "$PORT_VALUE" =~ ^[1-9][0-9]*$ ]]; then
  fail "PORT must be a positive integer, got: $PORT_VALUE"
fi

if [[ ! "$WS_PORT_VALUE" =~ ^[1-9][0-9]*$ ]]; then
  fail "MESHER_WS_PORT must be a positive integer, got: $WS_PORT_VALUE"
fi

case "$BASE_URL" in
  http://*|https://*) ;;
  *) fail "BASE_URL must start with http:// or https://, got: $BASE_URL" ;;
esac

ARTIFACT_DIR="$(mesher_prepare_bundle_dir "$ARTIFACT_DIR")"
BUILD_DIR="$ARTIFACT_DIR/build"
BINARY_PATH="$BUILD_DIR/mesher"
LOG_FILE="$ARTIFACT_DIR/mesher.log"
SETTINGS_RESPONSE_PATH="$ARTIFACT_DIR/project-settings-last-response.txt"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
rm -f "$LOG_FILE" "$SETTINGS_RESPONSE_PATH"

seed_exists="$(psql "$DATABASE_URL" -Atqc "SELECT count(*)::text FROM projects WHERE slug = 'default'")"
if [[ "$seed_exists" != '1' ]]; then
  fail "seeded default project is missing; run bash mesher/scripts/migrate.sh up first"
fi

printf '[mesher-smoke] building Mesher into %s\n' "$BUILD_DIR" >&2
bash "$SCRIPT_DIR/build.sh" "$BUILD_DIR"

printf '[mesher-smoke] starting Mesher base_url=%s\n' "$BASE_URL" >&2
(
  cd "$BUILD_DIR"
  DATABASE_URL="$DATABASE_URL" \
  PORT="$PORT_VALUE" \
  MESHER_WS_PORT="$WS_PORT_VALUE" \
  MESHER_RATE_LIMIT_WINDOW_SECONDS="${MESHER_RATE_LIMIT_WINDOW_SECONDS:-60}" \
  MESHER_RATE_LIMIT_MAX_EVENTS="${MESHER_RATE_LIMIT_MAX_EVENTS:-1000}" \
  MESH_CLUSTER_COOKIE="${MESH_CLUSTER_COOKIE:-dev-cookie}" \
  MESH_NODE_NAME="${MESH_NODE_NAME:-mesher@127.0.0.1:4370}" \
  MESH_DISCOVERY_SEED="${MESH_DISCOVERY_SEED:-localhost}" \
  MESH_CLUSTER_PORT="${MESH_CLUSTER_PORT:-4370}" \
  MESH_CONTINUITY_ROLE="${MESH_CONTINUITY_ROLE:-primary}" \
  MESH_CONTINUITY_PROMOTION_EPOCH="${MESH_CONTINUITY_PROMOTION_EPOCH:-0}" \
  "$BINARY_PATH" >"$LOG_FILE" 2>&1
) &
SERVER_PID=$!

printf '[mesher-smoke] waiting for project settings base_url=%s\n' "$BASE_URL" >&2
for attempt in $(seq 1 80); do
  if LAST_RESPONSE="$(curl -fsS "$BASE_URL/api/v1/projects/default/settings" 2>/dev/null)"; then
    retention_days="$(printf '%s' "$LAST_RESPONSE" | json_field retention_days || true)"
    sample_rate="$(printf '%s' "$LAST_RESPONSE" | json_field sample_rate || true)"
    printf '[mesher-smoke] settings poll=%s retention_days=%s sample_rate=%s\n' "$attempt" "${retention_days:-missing}" "${sample_rate:-missing}" >&2
    if [[ "$retention_days" == '90' && -n "$sample_rate" ]]; then
      break
    fi
  fi
  sleep 0.25
  if [[ "$attempt" == '80' ]]; then
    printf '%s\n' "$LAST_RESPONSE" >"$SETTINGS_RESPONSE_PATH"
    fail "/api/v1/projects/default/settings never became ready at $BASE_URL (last response: $SETTINGS_RESPONSE_PATH)"
  fi
done

storage_response="$(curl -fsS "$BASE_URL/api/v1/projects/default/storage")"
event_count="$(printf '%s' "$storage_response" | json_field event_count || true)"
estimated_bytes="$(printf '%s' "$storage_response" | json_field estimated_bytes || true)"
if [[ -z "$event_count" || -z "$estimated_bytes" ]]; then
  fail "storage readback was missing expected fields"
fi

printf '[mesher-smoke] storage event_count=%s estimated_bytes=%s\n' "$event_count" "$estimated_bytes" >&2
printf '%s\n' "$storage_response"
