#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source scripts/lib/clustered_fixture_paths.sh
clustered_fixture_require_cluster_proof_root

ARTIFACT_ROOT=".tmp/m045-s02"
ARTIFACT_DIR="$ARTIFACT_ROOT/verify"
PHASE_REPORT_PATH="$ARTIFACT_DIR/phase-report.txt"
STATUS_PATH="$ARTIFACT_DIR/status.txt"
CURRENT_PHASE_PATH="$ARTIFACT_DIR/current-phase.txt"
LATEST_PROOF_BUNDLE_PATH="$ARTIFACT_DIR/latest-proof-bundle.txt"

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

assert_file_contains_regex() {
  local phase="$1"
  local path="$2"
  local regex="$3"
  local description="$4"
  local log_path="${5:-}"
  if ! python3 - "$path" "$regex" "$description" >"$ARTIFACT_DIR/${phase}.content-check.log" 2>&1 <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
regex = sys.argv[2]
description = sys.argv[3]
text = path.read_text(errors="replace")
if not re.search(regex, text, re.MULTILINE):
    raise SystemExit(f"{description}: missing regex {regex!r} in {path}")
print(f"{description}: matched {regex!r}")
PY
  then
    fail_phase "$phase" "$description" "$ARTIFACT_DIR/${phase}.content-check.log" "$path"
  fi
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

capture_m045_s02_snapshot() {
  local snapshot_path="$1"
  python3 - "$snapshot_path" <<'PY'
from pathlib import Path
import sys

snapshot_path = Path(sys.argv[1])
root = Path('.tmp/m045-s02')
names = []
if root.exists():
    names = sorted(
        path.name
        for path in root.iterdir()
        if path.is_dir() and path.name != 'verify'
    )
snapshot_path.write_text(''.join(f"{name}\n" for name in names))
PY
}

copy_new_m045_s02_artifacts() {
  local phase="$1"
  local before_snapshot="$2"
  local dest_root="$3"
  local manifest_path="$4"

  if ! python3 - "$before_snapshot" "$dest_root" >"$manifest_path" 2>"$ARTIFACT_DIR/${phase}.artifact-check.log" <<'PY'
from pathlib import Path
import shutil
import sys

before_snapshot = Path(sys.argv[1])
dest_root = Path(sys.argv[2])
source_root = Path('.tmp/m045-s02')

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
    raise SystemExit('expected fresh .tmp/m045-s02 artifact directories from the S02 e2e replay')

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

print('\n'.join(manifest_lines))
PY
  then
    fail_phase "$phase" "missing or malformed copied evidence" "$ARTIFACT_DIR/${phase}.artifact-check.log" "$dest_root"
  fi
}

assert_retained_bundle_shape() {
  local phase="$1"
  local dest_root="$2"
  local manifest_path="$3"
  local pointer_path="$4"
  local log_path="$ARTIFACT_DIR/${phase}.bundle-check.log"
  if ! python3 - "$dest_root" "$manifest_path" "$pointer_path" >"$log_path" 2>&1 <<'PY'
from pathlib import Path
import sys

bundle_root = Path(sys.argv[1])
manifest_path = Path(sys.argv[2])
pointer_path = Path(sys.argv[3])
expected_pointer = str(bundle_root)
actual_pointer = pointer_path.read_text(errors='replace').strip()
if actual_pointer != expected_pointer:
    raise SystemExit(
        f'latest-proof-bundle pointer drifted: expected {expected_pointer!r}, got {actual_pointer!r}'
    )
manifest_lines = [line for line in manifest_path.read_text(errors='replace').splitlines() if line.strip()]
if not manifest_lines:
    raise SystemExit(f'{manifest_path}: expected non-empty copied-artifact manifest')

children = sorted(path for path in bundle_root.iterdir() if path.is_dir())
if not children:
    raise SystemExit(f'{bundle_root}: expected copied artifact directories')

def find_one(prefix: str) -> Path:
    matches = [path for path in children if path.name.startswith(prefix)]
    if not matches:
        raise SystemExit(f'{bundle_root}: missing copied artifact directory with prefix {prefix!r}')
    if len(matches) > 1:
        raise SystemExit(f'{bundle_root}: expected exactly one copied artifact directory with prefix {prefix!r}, found {[path.name for path in matches]}')
    return matches[0]

remote = find_one('declared-work-remote-spawn-')
scaffold_local = find_one('scaffold-runtime-completion-local-')
scaffold_contract = find_one('scaffold-runtime-completion-contract-')

required_remote = [
    'init.log',
    'generated-project/mesh.toml',
    'generated-project/main.mpl',
    'generated-project/work.mpl',
    'generated-project/README.md',
    'package/mesh.toml',
    'package/main.mpl',
    'package/work.mpl',
    'package/README.md',
    'references/cluster-proof.main.mpl',
    'references/cluster-proof.README.md',
    'references/cluster-proof.work.mpl',
    'references/cluster-proof.work.test.mpl',
]
for name in required_remote:
    if not (remote / name).exists():
        raise SystemExit(f'{remote}: missing required retained file {name}')

required_local = [
    'init.log',
    'build.log',
    'build-meta.json',
    'bin/clustered-runtime-completion',
    'generated-project/mesh.toml',
    'generated-project/main.mpl',
    'generated-project/work.mpl',
    'generated-project/README.md',
    'package/mesh.toml',
    'package/main.mpl',
    'package/work.mpl',
    'package/README.md',
    'cluster-status.log',
    'cluster-status.json',
    'cluster-continuity-list.log',
    'cluster-continuity-list.json',
    'cluster-continuity-completed.log',
    'cluster-continuity-completed.json',
    'cluster-diagnostics.log',
    'cluster-diagnostics.json',
    'scaffold.stdout.log',
    'scaffold.stderr.log',
    'scaffold.combined.log',
]
for name in required_local:
    if not (scaffold_local / name).exists():
        raise SystemExit(f'{scaffold_local}: missing required retained file {name}')

required_contract = [
    'init.log',
    'build.log',
    'build-meta.json',
    'bin/clustered-runtime-completion',
    'generated-project/mesh.toml',
    'generated-project/main.mpl',
    'generated-project/work.mpl',
    'generated-project/README.md',
    'package/mesh.toml',
    'package/main.mpl',
    'package/work.mpl',
    'package/README.md',
]
for name in required_contract:
    if not (scaffold_contract / name).exists():
        raise SystemExit(f'{scaffold_contract}: missing required retained file {name}')

print('retained-bundle-shape: ok')
PY
  then
    fail_phase "$phase" "missing retained proof artifacts or malformed bundle pointer" "$log_path" "$dest_root"
  fi
}

run_expect_success m045-s01-bootstrap 00-m045-s01-bootstrap yes 2400 \
  cargo test -p meshc --test e2e_m045_s01 m045_s01_ -- --nocapture
run_expect_success mesh-rt-build 00a-mesh-rt-build no 1800 \
  cargo build -q -p mesh-rt
run_expect_success cluster-proof-build 01-cluster-proof-build no 1800 \
  cargo run -q -p meshc -- build "$CLUSTER_PROOF_FIXTURE_ROOT"
run_expect_success cluster-proof-tests 02-cluster-proof-tests no 1800 \
  cargo run -q -p meshc -- test "$CLUSTER_PROOF_FIXTURE_TESTS"
run_expect_success m044-s02-declared-work 03-m044-s02-declared-work yes 1800 \
  cargo test -p meshc --test e2e_m044_s02 m044_s02_declared_work_ -- --nocapture
run_expect_success tooling-clustered-init 04-tooling-clustered-init yes 1200 \
  cargo test -p meshc --test tooling_e2e test_init_clustered_creates_project -- --nocapture

S02_BEFORE="$ARTIFACT_DIR/05-m045-s02.before.txt"
capture_m045_s02_snapshot "$S02_BEFORE"
run_expect_success m045-s02-e2e 05-m045-s02-e2e yes 1800 \
  cargo test -p meshc --test e2e_m045_s02 m045_s02_ -- --nocapture
record_phase m045-s02-artifacts started
BUNDLE_ROOT="$ARTIFACT_DIR/retained-m045-s02-artifacts"
copy_new_m045_s02_artifacts \
  m045-s02-artifacts \
  "$S02_BEFORE" \
  "$BUNDLE_ROOT" \
  "$ARTIFACT_DIR/05-m045-s02-artifacts.txt"
printf '%s\n' "$BUNDLE_ROOT" >"$LATEST_PROOF_BUNDLE_PATH"
record_phase m045-s02-artifacts passed
record_phase m045-s02-bundle-shape started
assert_retained_bundle_shape \
  m045-s02-bundle-shape \
  "$BUNDLE_ROOT" \
  "$ARTIFACT_DIR/05-m045-s02-artifacts.txt" \
  "$LATEST_PROOF_BUNDLE_PATH"
record_phase m045-s02-bundle-shape passed

assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^m045-s01-bootstrap\tpassed$' "M045 S01 bootstrap rail did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^mesh-rt-build\tpassed$' "mesh-rt build did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^cluster-proof-build\tpassed$' "cluster-proof build did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^cluster-proof-tests\tpassed$' "cluster-proof tests did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^m044-s02-declared-work\tpassed$' "M044 S02 declared-handler rail did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^tooling-clustered-init\tpassed$' "clustered init contract did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^m045-s02-e2e\tpassed$' "M045 S02 e2e rail did not pass" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^m045-s02-artifacts\tpassed$' "M045 S02 artifacts were not retained" "$ARTIFACT_DIR/full-contract.log"
assert_file_contains_regex verifier-status "$PHASE_REPORT_PATH" '^m045-s02-bundle-shape\tpassed$' "M045 S02 bundle shape check did not pass" "$ARTIFACT_DIR/full-contract.log"

echo "verify-m045-s02: ok"
