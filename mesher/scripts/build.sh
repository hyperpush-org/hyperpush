#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=mesher/scripts/lib/mesh-toolchain.sh
source "$SCRIPT_DIR/lib/mesh-toolchain.sh"

BUNDLE_DIR="${1:-}"
STAGED_BINARY=''

usage() {
  echo 'usage: bash mesher/scripts/build.sh <bundle-dir>' >&2
}

cleanup_on_failure() {
  local status=$?
  if [[ $status -ne 0 && -n "$STAGED_BINARY" ]]; then
    rm -f "$STAGED_BINARY"
  fi
}
trap cleanup_on_failure EXIT

if [[ $# -ne 1 || -z "$BUNDLE_DIR" ]]; then
  usage
  exit 1
fi

BUNDLE_DIR="$(mesher_prepare_bundle_dir "$BUNDLE_DIR")"
STAGED_BINARY="$BUNDLE_DIR/mesher"
rm -f "$STAGED_BINARY"

printf '[mesher-build] bundle_dir=%s\n' "$BUNDLE_DIR" >&2
printf '[mesher-build] output_path=%s\n' "$STAGED_BINARY" >&2

mesher_run_meshc 'mesher-build' "${MESHER_BUILD_TIMEOUT_SECONDS:-180}" build . --output "$STAGED_BINARY"

if [[ ! -f "$STAGED_BINARY" ]]; then
  mesher_toolchain_fail "meshc build reported success but the staged binary is missing: ${STAGED_BINARY}"
fi

if [[ ! -x "$STAGED_BINARY" ]]; then
  mesher_toolchain_fail "staged binary is not executable: ${STAGED_BINARY}"
fi

printf '[mesher-build] ready output_path=%s\n' "$STAGED_BINARY" >&2
