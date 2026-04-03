#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACT_ROOT=".tmp/m047-s05"
ARTIFACT_DIR="$ARTIFACT_ROOT/verify"
PHASE_REPORT_PATH="$ARTIFACT_DIR/phase-report.txt"
STATUS_PATH="$ARTIFACT_DIR/status.txt"
CURRENT_PHASE_PATH="$ARTIFACT_DIR/current-phase.txt"
LATEST_PROOF_BUNDLE_PATH="$ARTIFACT_DIR/latest-proof-bundle.txt"
RETAINED_M047_S04_VERIFY_DIR="$ARTIFACT_DIR/retained-m047-s04-verify"
RETAINED_M047_S05_ARTIFACTS_DIR="$ARTIFACT_DIR/retained-m047-s05-artifacts"
RETAINED_PROOF_BUNDLE_DIR="$ARTIFACT_DIR/retained-proof-bundle"

rm -rf "$ARTIFACT_DIR"
mkdir -p "$ARTIFACT_DIR"
exec > >(tee "$ARTIFACT_DIR/full-contract.log") 2>&1

: >"$PHASE_REPORT_PATH"
printf 'running\n' >"$STATUS_PATH"
printf 'init\n' >"$CURRENT_PHASE_PATH"

on_exit() {
  local exit_code=$?
  if [[ $exit_code -eq 0 ]]; then
    printf 'ok\n' >"$STATUS_PATH"
    printf 'complete\n' >"$CURRENT_PHASE_PATH"
  elif [[ ! -f "$STATUS_PATH" || "$(<"$STATUS_PATH")" != "failed" ]]; then
    printf 'failed\n' >"$STATUS_PATH"
  fi
}
trap on_exit EXIT

record_phase() {
  printf '%s\t%s\n' "$1" "$2" >>"$PHASE_REPORT_PATH"
}

print_log_excerpt() {
  local log_path="$1"
  python3 - "$log_path" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
if not path.exists():
    print(f"missing log: {path}")
    raise SystemExit(0)
lines = path.read_text(errors="replace").splitlines()
for line in lines[:220]:
    print(line)
if len(lines) > 220:
    print(f"... truncated after 220 lines (total {len(lines)})")
PY
}

fail_phase() {
  local phase="$1"
  local reason="$2"
  local log_path="${3:-}"
  local artifact_hint="${4:-}"
  printf 'failed\n' >"$STATUS_PATH"
  printf '%s\n' "$phase" >"$CURRENT_PHASE_PATH"
  echo "verification drift: ${reason}" >&2
  if [[ -n "$artifact_hint" ]]; then
    echo "artifact hint: ${artifact_hint}" >&2
  fi
  if [[ -n "$log_path" ]]; then
    echo "failing log: ${log_path}" >&2
    echo "--- ${log_path} ---" >&2
    print_log_excerpt "$log_path" >&2
  fi
  exit 1
}

run_command() {
  local timeout_secs="$1"
  local log_path="$2"
  shift 2
  local -a cmd=("$@")
  {
    printf '$'
    printf ' %q' "${cmd[@]}"
    printf '\n'
    "${cmd[@]}"
  } >"$log_path" 2>&1 &
  local cmd_pid=$!
  local deadline=$((SECONDS + timeout_secs))
  while kill -0 "$cmd_pid" 2>/dev/null; do
    if (( SECONDS >= deadline )); then
      echo "command timed out after ${timeout_secs}s" >>"$log_path"
      kill -TERM "$cmd_pid" 2>/dev/null || true
      sleep 1
      kill -KILL "$cmd_pid" 2>/dev/null || true
      wait "$cmd_pid" 2>/dev/null || true
      return 124
    fi
    sleep 1
  done
  wait "$cmd_pid"
}

assert_test_filter_ran() {
  local phase="$1"
  local log_path="$2"
  local label="$3"
  if ! python3 - "$log_path" "$label" >"$ARTIFACT_DIR/${label}.test-count.log" 2>&1 <<'PY'
import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(errors="replace")
label = sys.argv[2]
counts = [int(value) for value in re.findall(r"running (\d+) test", text)]
if not counts:
    raise SystemExit(f"{label}: missing 'running N test' line")
if max(counts) <= 0:
    raise SystemExit(f"{label}: test filter ran 0 tests")
print(f"{label}: running-counts={counts}")
PY
  then
    fail_phase "$phase" "named test filter ran 0 tests or produced malformed output" "$ARTIFACT_DIR/${label}.test-count.log"
  fi
}

run_expect_success() {
  local phase="$1"
  local label="$2"
  local require_tests="$3"
  local timeout_secs="$4"
  shift 4
  local -a cmd=("$@")
  local log_path="$ARTIFACT_DIR/${label}.log"
  record_phase "$phase" started
  printf '%s\n' "$phase" >"$CURRENT_PHASE_PATH"
  echo "==> ${cmd[*]}"
  if ! run_command "$timeout_secs" "$log_path" "${cmd[@]}"; then
    record_phase "$phase" failed
    fail_phase "$phase" "expected success within ${timeout_secs}s" "$log_path"
  fi
  if [[ "$require_tests" == "yes" ]]; then
    assert_test_filter_ran "$phase" "$log_path" "$label"
  fi
  record_phase "$phase" passed
}

capture_snapshot() {
  local source_root="$1"
  local snapshot_path="$2"
  python3 - "$source_root" "$snapshot_path" <<'PY'
from pathlib import Path
import sys

source_root = Path(sys.argv[1])
snapshot_path = Path(sys.argv[2])
names = []
if source_root.exists():
    names = sorted(
        path.name
        for path in source_root.iterdir()
        if path.is_dir() and path.name != 'verify'
    )
snapshot_path.write_text(''.join(f"{name}\n" for name in names))
PY
}

copy_new_artifacts_or_fail() {
  local phase="$1"
  local before_snapshot="$2"
  local source_root="$3"
  local dest_root="$4"
  local manifest_path="$5"

  if ! python3 - "$before_snapshot" "$source_root" "$dest_root" >"$manifest_path" 2>"$ARTIFACT_DIR/${phase}.artifact-check.log" <<'PY'
from pathlib import Path
import shutil
import sys

before_snapshot = Path(sys.argv[1])
source_root = Path(sys.argv[2])
dest_root = Path(sys.argv[3])

before = {
    line.strip()
    for line in before_snapshot.read_text(errors='replace').splitlines()
    if line.strip()
}
after_paths = {
    path.name: path
    for path in source_root.iterdir()
    if path.is_dir() and path.name != 'verify'
}
new_names = sorted(name for name in after_paths if name not in before)
if not new_names:
    raise SystemExit('expected fresh .tmp/m047-s05 artifact directories from the Todo scaffold e2e replay')

if dest_root.exists():
    shutil.rmtree(dest_root)
dest_root.mkdir(parents=True, exist_ok=True)
manifest_lines = []
for name in new_names:
    src = after_paths[name]
    if not any(src.iterdir()):
        raise SystemExit(f'{src}: expected non-empty artifact directory')
    dst = dest_root / name
    shutil.copytree(src, dst)
    manifest_lines.append(f'{name}\t{src}')
    for child in sorted(src.rglob('*')):
        if child.is_file():
            manifest_lines.append(f'  - {child}')

sys.stdout.write('\n'.join(manifest_lines) + ('\n' if manifest_lines else ''))
PY
  then
    fail_phase "$phase" "expected fresh retained Todo scaffold artifacts from e2e_m047_s05" "$ARTIFACT_DIR/${phase}.artifact-check.log" "$source_root"
  fi
}

record_phase init passed

run_expect_success m047-s04-replay m047-s04-replay no 3600 bash scripts/verify-m047-s04.sh
record_phase retain-m047-s04-verify started
rm -rf "$RETAINED_M047_S04_VERIFY_DIR"
cp -R .tmp/m047-s04/verify "$RETAINED_M047_S04_VERIFY_DIR"
record_phase retain-m047-s04-verify passed

run_expect_success m047-s05-pkg m047-s05-pkg yes 2400 \
  cargo test -p meshc --test e2e_m047_s05 m047_s05_todo_fixture_contract_is_committed_and_helper_is_fixture_backed -- --nocapture
run_expect_success m047-s05-tooling m047-s05-tooling yes 2400 \
  cargo test -p meshc --test e2e_m047_s05 m047_s05_public_clustered_surfaces_use_source_first_names_and_todo_template -- --nocapture

SNAPSHOT_BEFORE_E2E="$ARTIFACT_DIR/m047-s05-before.snapshot"
capture_snapshot "$ARTIFACT_ROOT" "$SNAPSHOT_BEFORE_E2E"

OLD_RUST_TEST_THREADS="${RUST_TEST_THREADS-}"
OLD_RUST_TEST_THREADS_SET=0
if [[ "${RUST_TEST_THREADS+x}" == x ]]; then
  OLD_RUST_TEST_THREADS_SET=1
fi
export RUST_TEST_THREADS=1
run_expect_success m047-s05-e2e m047-s05-e2e yes 3600 cargo test -p meshc --test e2e_m047_s05 -- --nocapture
if [[ $OLD_RUST_TEST_THREADS_SET -eq 1 ]]; then
  export RUST_TEST_THREADS="$OLD_RUST_TEST_THREADS"
else
  unset RUST_TEST_THREADS
fi
run_expect_success m047-s05-docs-build m047-s05-docs-build no 2400 npm --prefix website run build

record_phase retain-m047-s05-artifacts started
copy_new_artifacts_or_fail \
  m047-s05-artifacts \
  "$SNAPSHOT_BEFORE_E2E" \
  "$ARTIFACT_ROOT" \
  "$RETAINED_M047_S05_ARTIFACTS_DIR" \
  "$ARTIFACT_DIR/retained-m047-s05-artifacts.manifest.txt"
record_phase retain-m047-s05-artifacts passed

record_phase m047-s05-fixture-provenance started
if ! python3 - "$RETAINED_M047_S05_ARTIFACTS_DIR" >"$ARTIFACT_DIR/m047-s05-fixture-provenance.log" 2>"$ARTIFACT_DIR/m047-s05-fixture-provenance.error.log" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
init_logs = sorted(root.rglob('init.log'))
if not init_logs:
    raise SystemExit('missing retained init.log files from the fixture-backed todo replay')

matching_logs = []
for path in init_logs:
    text = path.read_text(errors='replace')
    if 'source=fixture-copy' not in text:
        continue
    if 'fixture_root_relative=scripts/fixtures/m047-s05-clustered-todo' not in text:
        raise SystemExit(f'{path}: missing fixture_root_relative marker')
    if 'meshc init --template todo-api' in text:
        raise SystemExit(f'{path}: retained fixture provenance regressed back to public meshc init text')
    matching_logs.append(path)

if not matching_logs:
    raise SystemExit('missing retained fixture-copy provenance markers in init.log files')

required = [
    'generated-project/mesh.toml',
    'generated-project/main.mpl',
    'generated-project/work.mpl',
    'generated-project/README.md',
]
for relative in required:
    if not any(path.as_posix().endswith(relative) for path in root.rglob(Path(relative).name)):
        raise SystemExit(f'missing retained {relative} in copied m047-s05 artifacts')

print('fixture provenance logs:')
for path in matching_logs:
    print(path)
print('retained generated-project markers:')
for relative in required:
    print(relative)
PY
then
  fail_phase m047-s05-fixture-provenance "missing fixture-copy provenance or generated-project markers in retained m047-s05 artifacts" "$ARTIFACT_DIR/m047-s05-fixture-provenance.error.log" "$RETAINED_M047_S05_ARTIFACTS_DIR"
fi
record_phase m047-s05-fixture-provenance passed

record_phase m047-s05-bundle-shape started
rm -rf "$RETAINED_PROOF_BUNDLE_DIR"
mkdir -p "$RETAINED_PROOF_BUNDLE_DIR"
cp -R "$RETAINED_M047_S04_VERIFY_DIR" "$RETAINED_PROOF_BUNDLE_DIR/retained-m047-s04-verify"
cp -R "$RETAINED_M047_S05_ARTIFACTS_DIR" "$RETAINED_PROOF_BUNDLE_DIR/retained-m047-s05-artifacts"
[[ -f "$RETAINED_PROOF_BUNDLE_DIR/retained-m047-s04-verify/status.txt" ]] || fail_phase m047-s05-bundle-shape "missing retained M047/S04 status.txt" "$ARTIFACT_DIR/retained-m047-s05-artifacts.manifest.txt"
[[ -f "$RETAINED_PROOF_BUNDLE_DIR/retained-m047-s04-verify/phase-report.txt" ]] || fail_phase m047-s05-bundle-shape "missing retained M047/S04 phase-report.txt" "$ARTIFACT_DIR/retained-m047-s05-artifacts.manifest.txt"
[[ -f "$ARTIFACT_DIR/retained-m047-s05-artifacts.manifest.txt" ]] || fail_phase m047-s05-bundle-shape "missing retained Todo scaffold artifact manifest"
printf '%s\n' "$RETAINED_PROOF_BUNDLE_DIR" >"$LATEST_PROOF_BUNDLE_PATH"
record_phase m047-s05-bundle-shape passed

for expected_phase in \
  init \
  m047-s04-replay \
  retain-m047-s04-verify \
  m047-s05-pkg \
  m047-s05-tooling \
  m047-s05-e2e \
  m047-s05-docs-build \
  retain-m047-s05-artifacts \
  m047-s05-fixture-provenance \
  m047-s05-bundle-shape; do
  if ! rg -q "^${expected_phase}\\tpassed$" "$PHASE_REPORT_PATH"; then
    fail_phase verifier-status "missing ${expected_phase} pass marker" "$ARTIFACT_DIR/full-contract.log" "$PHASE_REPORT_PATH"
  fi
done

echo "verify-m047-s05: ok"
