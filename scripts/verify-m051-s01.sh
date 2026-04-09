#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERIFY_DIR="$ROOT_DIR/.tmp/m051-s01/verify"
STATUS_PATH="$VERIFY_DIR/status.txt"
CURRENT_PHASE_PATH="$VERIFY_DIR/current-phase.txt"
PHASE_REPORT_PATH="$VERIFY_DIR/phase-report.txt"
FULL_CONTRACT_LOG_PATH="$VERIFY_DIR/full-contract.log"
LATEST_PROOF_BUNDLE_PATH="$VERIFY_DIR/latest-proof-bundle.txt"
DELEGATED_VERIFIER="$ROOT_DIR/mesher/scripts/verify-maintainer-surface.sh"

fail() {
  echo "verification drift: $1" >&2
  exit 1
}

require_file() {
  local path="$1"
  local description="$2"
  if [[ ! -f "$path" ]]; then
    fail "missing ${description}: ${path}"
  fi
}

require_phase_marker() {
  local marker="$1"
  if ! rg -Fq "$marker" "$PHASE_REPORT_PATH"; then
    fail "delegated verifier phase report drifted: missing ${marker} in ${PHASE_REPORT_PATH}"
  fi
}

require_file "$DELEGATED_VERIFIER" "delegated verifier"

echo "[verify-m051-s01] product-root wrapper delegating to bash mesher/scripts/verify-maintainer-surface.sh"
bash "$DELEGATED_VERIFIER"

for required in \
  "$STATUS_PATH" \
  "$CURRENT_PHASE_PATH" \
  "$PHASE_REPORT_PATH" \
  "$FULL_CONTRACT_LOG_PATH" \
  "$LATEST_PROOF_BUNDLE_PATH"; do
  require_file "$required" "delegated verifier artifact"
done

[[ "$(<"$STATUS_PATH")" == "ok" ]] || fail "delegated verifier did not finish ok: ${STATUS_PATH}=$(<"$STATUS_PATH")"
[[ "$(<"$CURRENT_PHASE_PATH")" == "complete" ]] || fail "delegated verifier did not finish complete: ${CURRENT_PHASE_PATH}=$(<"$CURRENT_PHASE_PATH")"

for expected_phase in \
  $'init\tpassed' \
  $'mesher-package-tests\tpassed' \
  $'mesher-package-build\tpassed' \
  $'product-contract\tpassed' \
  $'mesher-postgres-start\tpassed' \
  $'mesher-migrate-status\tpassed' \
  $'mesher-migrate-up\tpassed' \
  $'mesher-runtime-smoke\tpassed' \
  $'mesher-bundle-shape\tpassed'; do
  require_phase_marker "$expected_phase"
done

DELEGATED_BUNDLE_PATH="$(<"$LATEST_PROOF_BUNDLE_PATH")"
[[ -n "$DELEGATED_BUNDLE_PATH" ]] || fail "delegated verifier latest-proof-bundle pointer was empty: ${LATEST_PROOF_BUNDLE_PATH}"
[[ -d "$DELEGATED_BUNDLE_PATH" ]] || fail "delegated verifier latest-proof-bundle path does not exist: ${DELEGATED_BUNDLE_PATH}"

echo "verify-m051-s01: ok"
echo "artifacts: .tmp/m051-s01/verify"
echo "proof bundle: ${DELEGATED_BUNDLE_PATH}"
