#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=mesher/scripts/lib/mesh-toolchain.sh
source "$SCRIPT_DIR/lib/mesh-toolchain.sh"

usage() {
  echo 'usage: bash mesher/scripts/test.sh' >&2
}

if [[ $# -ne 0 ]]; then
  usage
  exit 1
fi

mesher_run_meshc 'mesher-test' "${MESHER_TEST_TIMEOUT_SECONDS:-120}" test tests
