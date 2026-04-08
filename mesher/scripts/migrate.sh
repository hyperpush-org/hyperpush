#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=mesher/scripts/lib/mesh-toolchain.sh
source "$SCRIPT_DIR/lib/mesh-toolchain.sh"

usage() {
  echo 'usage: bash mesher/scripts/migrate.sh <status|up>' >&2
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  status|up)
    ;;
  *)
    mesher_toolchain_fail "unsupported migrate subcommand: $1 (expected status|up)"
    ;;
esac

mesher_require_database_url
mesher_run_meshc "mesher-migrate-$1" "${MESHER_MIGRATE_TIMEOUT_SECONDS:-120}" migrate . "$1"
