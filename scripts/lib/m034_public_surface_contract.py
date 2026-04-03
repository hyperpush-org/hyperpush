#!/usr/bin/env python3
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
import subprocess
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Sequence

CONTRACT_VERSION = "m034-s07-public-surface-v1"
HELPER_RELATIVE_PATH = "scripts/lib/m034_public_surface_contract.py"

DEFAULT_RETRY_ATTEMPTS = 6
DEFAULT_RETRY_SLEEP_SECONDS = 15
DEFAULT_FETCH_TIMEOUT_SECONDS = 20

PACKAGE_NAME = "snowdamiz/mesh-registry-proof"
PACKAGE_DESCRIPTION = "Real registry publish/install proof fixture for M034 S01"
SCOPED_QUERY = "snowdamiz%2Fmesh-registry-proof"

README_REQUIRED_MARKERS = [
    "https://meshlang.dev/install.sh",
    "https://meshlang.dev/install.ps1",
    "meshc --version",
    "meshpkg --version",
    "Production Backend Proof",
    "set -a && source .env && set +a && bash scripts/verify-m034-s05.sh",
    "v<Cargo version>",
    "ext-v<extension version>",
    "deploy.yml",
    "deploy-services.yml",
    "authoritative-verification.yml",
    "release.yml",
    "extension-release-proof.yml",
    "publish-extension.yml",
    "https://meshlang.dev/docs/getting-started/",
    "https://meshlang.dev/docs/tooling/",
    "https://packages.meshlang.dev/packages/snowdamiz/mesh-registry-proof",
    "https://packages.meshlang.dev/search?q=snowdamiz%2Fmesh-registry-proof",
    "https://api.packages.meshlang.dev/api/v1/packages?search=snowdamiz%2Fmesh-registry-proof",
    ".tmp/m034-s05/verify/candidate-tags.json",
    ".tmp/m034-s05/verify/remote-runs.json",
]

GETTING_STARTED_SOURCE_MARKERS = [
    "https://meshlang.dev/install.sh",
    "https://meshlang.dev/install.ps1",
    "meshc --version",
    "meshpkg --version",
    "Use the documented installer scripts to install both `meshc` and `meshpkg`.",
]

TOOLING_SOURCE_MARKERS = [
    "https://meshlang.dev/install.sh",
    "https://meshlang.dev/install.ps1",
    "meshpkg --version",
    "packages.meshlang.dev",
    "Browse and search available packages at [packages.meshlang.dev](https://packages.meshlang.dev).",
    "set -a && source .env && set +a && bash scripts/verify-m034-s05.sh",
    "v<Cargo version>",
    "ext-v<extension version>",
    "deploy.yml",
    "deploy-services.yml",
    "authoritative-verification.yml",
    "release.yml",
    "extension-release-proof.yml",
    "publish-extension.yml",
    "https://meshlang.dev/docs/getting-started/",
    "https://meshlang.dev/docs/tooling/",
    "https://packages.meshlang.dev/packages/snowdamiz/mesh-registry-proof",
    "https://packages.meshlang.dev/search?q=snowdamiz%2Fmesh-registry-proof",
    "https://api.packages.meshlang.dev/api/v1/packages?search=snowdamiz%2Fmesh-registry-proof",
    ".tmp/m034-s05/verify/candidate-tags.json",
    ".tmp/m034-s05/verify/remote-runs.json",
]

INSTALL_SH_REQUIRED_MARKERS = [
    'REPO="snowdamiz/mesh-lang"',
    'install_binary "meshc" "$_version"',
    'install_binary "meshpkg" "$_version"',
    'Installed meshc and meshpkg v${_version} to ~/.mesh/bin/',
]

INSTALL_PS1_REQUIRED_MARKERS = [
    '$Repo = "snowdamiz/mesh-lang"',
    'Installed meshc and meshpkg v$RequestedVersion to ~\\.mesh\\bin\\',
    'meshc and meshpkg',
]

FORBIDDEN_MARKERS = {
    "README.md": [
        'Today the verified install path is building `meshc` from source',
        'mesh-lang/mesh',
    ],
    "website/docs/docs/getting-started/index.md": [
        'Today the verified install path is building `meshc` from source',
        'mesh-lang/mesh',
    ],
    "website/docs/docs/tooling/index.md": [
        'Today the verified install path is building `meshc` from source',
        'mesh-lang/mesh',
    ],
    "website/docs/public/install.ps1": [
        'mesh-lang/mesh',
    ],
}

GETTING_STARTED_COMPACT_MARKERS = [
    "https://meshlang.dev/install.sh",
    "https://meshlang.dev/install.ps1",
]
GETTING_STARTED_REGEX_MARKERS = [
    r"meshc\s+--version",
    r"meshpkg\s+--version",
]

TOOLING_COMPACT_MARKERS = [
    "https://meshlang.dev/install.sh",
    "https://meshlang.dev/install.ps1",
    "packages.meshlang.dev",
    "deploy.yml",
    "deploy-services.yml",
    "authoritative-verification.yml",
    "release.yml",
    "extension-release-proof.yml",
    "publish-extension.yml",
    "https://meshlang.dev/docs/getting-started/",
    "https://meshlang.dev/docs/tooling/",
    "https://packages.meshlang.dev/packages/snowdamiz/mesh-registry-proof",
    "https://packages.meshlang.dev/search?q=snowdamiz%2Fmesh-registry-proof",
    "https://api.packages.meshlang.dev/api/v1/packages?search=snowdamiz%2Fmesh-registry-proof",
    ".tmp/m034-s05/verify/candidate-tags.json",
    ".tmp/m034-s05/verify/remote-runs.json",
    "v<Cargoversion>",
    "ext-v<extensionversion>",
]
TOOLING_REGEX_MARKERS = [
    r"meshpkg\s+--version",
    r"set\s+-a\s+&&\s+source\s+\.env\s+&&\s+set\s+\+a\s+&&\s+bash\s+scripts/verify-m034-s05\.sh",
]

WORKFLOW_CONTRACT = {
    "deployDocsStepName": "Verify public docs contract",
    "deployDocsCommand": 'python3 scripts/lib/m034_public_surface_contract.py built-docs --root "$GITHUB_WORKSPACE" --dist-root "$GITHUB_WORKSPACE/website/docs/.vitepress/dist"',
    "deployServicesStepName": "Verify public surface contract",
    "deployServicesCommand": 'python3 scripts/lib/m034_public_surface_contract.py public-http --root "$GITHUB_WORKSPACE" --artifact-dir "$RUNNER_TEMP/m034-public-surface-contract"',
}


class ContractError(RuntimeError):
    pass


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data:
            self.parts.append(data)


@dataclass(frozen=True)
class UrlTargets:
    site_base_url: str
    packages_site_base_url: str
    registry_base_url: str

    @property
    def install_sh_url(self) -> str:
        return f"{self.site_base_url}/install.sh"

    @property
    def install_ps1_url(self) -> str:
        return f"{self.site_base_url}/install.ps1"

    @property
    def getting_started_url(self) -> str:
        return f"{self.site_base_url}/docs/getting-started/"

    @property
    def tooling_url(self) -> str:
        return f"{self.site_base_url}/docs/tooling/"

    @property
    def package_detail_url(self) -> str:
        return f"{self.packages_site_base_url}/packages/{PACKAGE_NAME}"

    @property
    def package_search_url(self) -> str:
        return f"{self.packages_site_base_url}/search?q={SCOPED_QUERY}"

    @property
    def registry_search_url(self) -> str:
        return f"{self.registry_base_url}/api/v1/packages?search={SCOPED_QUERY}"


@dataclass
class FetchResult:
    label: str
    url: str
    status: int | None
    content_type: str
    body: bytes
    body_path: Path
    headers_path: Path
    status_path: Path
    log_path: Path
    transport_error: str | None = None


@dataclass
class SurfaceResult:
    label: str
    passed: bool
    summary: str
    detail_path: Path | None = None


@dataclass
class SurfaceContext:
    root: Path
    artifact_dir: Path
    targets: UrlTargets
    fetch_timeout_seconds: int


def normalize_base_url(value: str) -> str:
    return value.rstrip("/")


def relative_display(base_root: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(base_root.resolve()).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def spaced_and_compact_text(text: str) -> tuple[str, str]:
    extractor = TextExtractor()
    extractor.feed(text)
    spaced = re.sub(r"\s+", " ", " ".join(part.strip() for part in extractor.parts if part.strip()))
    compact = re.sub(r"\s+", "", "".join(extractor.parts))
    return spaced, compact


def print_errors(errors: Sequence[str]) -> None:
    for error in errors:
        print(f"- {error}", file=sys.stderr)


def require_contains(errors: list[str], relative_path: str, text: str, needles: Sequence[str]) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{relative_path} missing {needle!r}")
        else:
            print(f"ok: {relative_path} contains {needle!r}")


def require_absent(errors: list[str], relative_path: str, text: str, needles: Sequence[str]) -> None:
    for needle in needles:
        if needle in text:
            errors.append(f"{relative_path} still contains stale text {needle!r}")
        else:
            print(f"ok: {relative_path} does not contain stale text {needle!r}")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def remove_if_exists(path: Path) -> None:
    if path.exists():
        path.unlink()


def fetch_url(label: str, url: str, artifact_dir: Path, timeout_seconds: int) -> FetchResult:
    body_path = artifact_dir / f"{label}.body"
    headers_path = artifact_dir / f"{label}.headers"
    status_path = artifact_dir / f"{label}.status"
    log_path = artifact_dir / f"{label}.log"

    write_bytes(body_path, b"")
    write_text(headers_path, "")

    command = [
        "curl",
        "--silent",
        "--show-error",
        "--location",
        "--user-agent",
        "mesh-m034-public-surface-contract",
        "--max-time",
        str(timeout_seconds),
        "--output",
        str(body_path),
        "--dump-header",
        str(headers_path),
        "--write-out",
        "%{http_code}\n%{content_type}\n",
        url,
    ]

    status: int | None = None
    content_type = ""
    transport_error = None
    stderr_text = ""

    try:
        completed = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
    except Exception as exc:  # pragma: no cover - transport details vary by platform
        transport_error = str(exc)
    else:
        stderr_text = completed.stderr
        status_lines = completed.stdout.splitlines()
        status_text = status_lines[0].strip() if status_lines else ""
        content_type = status_lines[1].strip() if len(status_lines) > 1 else ""
        if status_text.isdigit() and status_text != "000":
            status = int(status_text)
        if completed.returncode != 0:
            transport_error = stderr_text.strip() or f"curl exited {completed.returncode}"

    body = body_path.read_bytes() if body_path.exists() else b""
    headers_text = headers_path.read_text() if headers_path.exists() else ""

    write_text(status_path, "" if status is None else f"{status}\n")

    lines = [
        f"url: {url}",
        f"status: {status if status is not None else ''}",
        f"content-type: {content_type}",
        f"body: {body_path}",
        f"headers: {headers_path}",
    ]
    if transport_error:
        lines.append(f"transport-error: {transport_error}")
    if stderr_text:
        lines.append(f"curl-stderr: {stderr_text.strip()}")
    write_text(log_path, "\n".join(lines) + "\n")

    return FetchResult(
        label=label,
        url=url,
        status=status,
        content_type=content_type,
        body=body,
        body_path=body_path,
        headers_path=headers_path,
        status_path=status_path,
        log_path=log_path,
        transport_error=transport_error,
    )


def validate_response(fetch: FetchResult, expected_status: int, expected_content_type_prefix: str) -> SurfaceResult | None:
    if fetch.transport_error:
        return SurfaceResult(fetch.label, False, f"transport failure: {fetch.transport_error}", fetch.log_path)
    if fetch.status != expected_status:
        return SurfaceResult(fetch.label, False, f"HTTP {fetch.status} != {expected_status}", fetch.log_path)
    if expected_content_type_prefix and not fetch.content_type.startswith(expected_content_type_prefix):
        return SurfaceResult(
            fetch.label,
            False,
            f"content-type {fetch.content_type!r} did not start with {expected_content_type_prefix!r}",
            fetch.log_path,
        )
    return None


def clear_validation_artifacts(*paths: Path) -> None:
    for path in paths:
        remove_if_exists(path)


def unified_diff(expected_text: str, actual_text: str, fromfile: str, tofile: str) -> str:
    return "".join(
        difflib.unified_diff(
            expected_text.splitlines(keepends=True),
            actual_text.splitlines(keepends=True),
            fromfile=fromfile,
            tofile=tofile,
        )
    )


def check_install_sh(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-install-sh", context.targets.install_sh_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "application/x-sh")
    diff_path = context.artifact_dir / "public-install-sh.diff"
    if baseline is not None:
        return baseline

    expected_path = context.root / "website/docs/public/install.sh"
    expected_text = expected_path.read_text()
    actual_text = fetch.body.decode("utf-8", errors="replace")
    if expected_text != actual_text:
        write_text(
            diff_path,
            unified_diff(expected_text, actual_text, str(expected_path), relative_display(context.root, fetch.body_path)),
        )
        return SurfaceResult("public-install-sh", False, "body drifted from website/docs/public/install.sh", diff_path)

    clear_validation_artifacts(diff_path)
    return SurfaceResult("public-install-sh", True, "exact installer bytes match")


def check_install_ps1(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-install-ps1", context.targets.install_ps1_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "application/octet-stream")
    diff_path = context.artifact_dir / "public-install-ps1.diff"
    if baseline is not None:
        return baseline

    expected_path = context.root / "website/docs/public/install.ps1"
    expected_text = expected_path.read_text()
    actual_text = fetch.body.decode("utf-8", errors="replace")
    if expected_text != actual_text:
        write_text(
            diff_path,
            unified_diff(expected_text, actual_text, str(expected_path), relative_display(context.root, fetch.body_path)),
        )
        return SurfaceResult("public-install-ps1", False, "body drifted from website/docs/public/install.ps1", diff_path)

    clear_validation_artifacts(diff_path)
    return SurfaceResult("public-install-ps1", True, "exact PowerShell installer bytes match")


def check_getting_started(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-getting-started", context.targets.getting_started_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "text/html")
    check_log = context.artifact_dir / "public-getting-started-check.log"
    if baseline is not None:
        return baseline

    spaced, compact = spaced_and_compact_text(fetch.body.decode("utf-8", errors="replace"))
    missing: list[str] = []
    missing.extend(needle for needle in GETTING_STARTED_COMPACT_MARKERS if needle not in compact)
    missing.extend(pattern for pattern in GETTING_STARTED_REGEX_MARKERS if not re.search(pattern, spaced))
    if missing:
        write_text(check_log, "public getting-started page missing exact markers:\n" + "\n".join(f"- {item}" for item in missing) + "\n")
        return SurfaceResult("public-getting-started", False, f"missing markers: {missing}", check_log)

    clear_validation_artifacts(check_log)
    return SurfaceResult("public-getting-started", True, "getting-started markers match")


def check_tooling(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-tooling", context.targets.tooling_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "text/html")
    check_log = context.artifact_dir / "public-tooling-check.log"
    if baseline is not None:
        return baseline

    spaced, compact = spaced_and_compact_text(fetch.body.decode("utf-8", errors="replace"))
    missing: list[str] = []
    missing.extend(needle for needle in TOOLING_COMPACT_MARKERS if needle not in compact)
    missing.extend(pattern for pattern in TOOLING_REGEX_MARKERS if not re.search(pattern, spaced))
    if missing:
        write_text(check_log, "public tooling page missing exact markers:\n" + "\n".join(f"- {item}" for item in missing) + "\n")
        return SurfaceResult("public-tooling", False, f"missing markers: {missing}", check_log)

    clear_validation_artifacts(check_log)
    return SurfaceResult("public-tooling", True, "tooling markers match")


def check_package_detail(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-package-detail", context.targets.package_detail_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "text/html")
    check_log = context.artifact_dir / "public-package-detail-check.log"
    if baseline is not None:
        return baseline

    body_text = fetch.body.decode("utf-8", errors="replace")
    missing = [needle for needle in [PACKAGE_NAME, PACKAGE_DESCRIPTION] if needle not in body_text]
    if missing:
        write_text(check_log, "public package detail page missing markers:\n" + "\n".join(f"- {item}" for item in missing) + "\n")
        return SurfaceResult("public-package-detail", False, f"missing markers: {missing}", check_log)

    clear_validation_artifacts(check_log)
    return SurfaceResult("public-package-detail", True, "package detail markers match")


def check_package_search(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-package-search", context.targets.package_search_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "text/html")
    check_log = context.artifact_dir / "public-package-search-check.log"
    if baseline is not None:
        return baseline

    spaced, _compact = spaced_and_compact_text(fetch.body.decode("utf-8", errors="replace"))
    required = [f'Results for "{PACKAGE_NAME}"', PACKAGE_NAME, PACKAGE_DESCRIPTION]
    missing = [needle for needle in required if needle not in spaced]
    if missing:
        write_text(check_log, "public package search page missing visible-text markers:\n" + "\n".join(f"- {item}" for item in missing) + "\n")
        return SurfaceResult("public-package-search", False, f"missing markers: {missing}", check_log)

    clear_validation_artifacts(check_log)
    return SurfaceResult("public-package-search", True, "package search markers match")


def check_registry_search(context: SurfaceContext) -> SurfaceResult:
    fetch = fetch_url("public-registry-search", context.targets.registry_search_url, context.artifact_dir, context.fetch_timeout_seconds)
    baseline = validate_response(fetch, 200, "application/json")
    check_log = context.artifact_dir / "public-registry-search-check.log"
    if baseline is not None:
        return baseline

    try:
        payload = json.loads(fetch.body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        write_text(check_log, f"invalid JSON: {exc}\n")
        return SurfaceResult("public-registry-search", False, f"invalid JSON: {exc}", check_log)

    matches = [item for item in payload if isinstance(item, dict) and item.get("name") == PACKAGE_NAME]
    if not matches:
        write_text(check_log, f"registry search response did not include {PACKAGE_NAME}\n")
        return SurfaceResult("public-registry-search", False, f"exact {PACKAGE_NAME} match missing", check_log)
    if not any(item.get("description") == PACKAGE_DESCRIPTION for item in matches):
        write_text(check_log, "registry search response did not preserve the S01 proof description\n")
        return SurfaceResult("public-registry-search", False, "S01 proof description missing", check_log)

    clear_validation_artifacts(check_log)
    return SurfaceResult("public-registry-search", True, f"registry search markers match ({len(matches)} exact hits)")


def verify_local_docs(root: Path) -> int:
    errors: list[str] = []

    readme_path = root / "README.md"
    getting_started_path = root / "website/docs/docs/getting-started/index.md"
    tooling_path = root / "website/docs/docs/tooling/index.md"
    install_sh_path = root / "website/docs/public/install.sh"
    install_ps1_path = root / "website/docs/public/install.ps1"
    package_json_path = root / "tools/editors/vscode-mesh/package.json"

    require_contains(errors, "README.md", readme_path.read_text(), README_REQUIRED_MARKERS)
    require_contains(errors, "website/docs/docs/getting-started/index.md", getting_started_path.read_text(), GETTING_STARTED_SOURCE_MARKERS)
    require_contains(errors, "website/docs/docs/tooling/index.md", tooling_path.read_text(), TOOLING_SOURCE_MARKERS)
    require_contains(errors, "website/docs/public/install.sh", install_sh_path.read_text(), INSTALL_SH_REQUIRED_MARKERS)
    require_contains(errors, "website/docs/public/install.ps1", install_ps1_path.read_text(), INSTALL_PS1_REQUIRED_MARKERS)

    for relative_path, needles in FORBIDDEN_MARKERS.items():
        require_absent(errors, relative_path, (root / relative_path).read_text(), needles)

    package_json = json.loads(package_json_path.read_text())
    repository_url = ((package_json.get("repository") or {}).get("url"))
    if repository_url != "https://github.com/snowdamiz/mesh-lang.git":
        errors.append("tools/editors/vscode-mesh/package.json repository.url drifted away from https://github.com/snowdamiz/mesh-lang.git")
    else:
        print("ok: tools/editors/vscode-mesh/package.json repository.url is current")

    bugs_url = ((package_json.get("bugs") or {}).get("url"))
    if bugs_url != "https://github.com/snowdamiz/mesh-lang/issues":
        errors.append("tools/editors/vscode-mesh/package.json bugs.url drifted away from https://github.com/snowdamiz/mesh-lang/issues")
    else:
        print("ok: tools/editors/vscode-mesh/package.json bugs.url is current")

    if errors:
        print_errors(errors)
        return 1
    return 0


def verify_built_docs(root: Path, dist_root: Path) -> int:
    errors: list[str] = []

    required_paths = [
        dist_root / "install.sh",
        dist_root / "install.ps1",
        dist_root / "docs/getting-started/index.html",
        dist_root / "docs/tooling/index.html",
    ]
    for path in required_paths:
        if not path.is_file():
            errors.append(f"missing built artifact {relative_display(root, path)}")
        else:
            print(f"ok: {relative_display(root, path)} exists")

    for relative in ["install.sh", "install.ps1"]:
        source_path = root / "website/docs/public" / relative
        built_path = dist_root / relative
        if built_path.is_file() and source_path.read_bytes() != built_path.read_bytes():
            errors.append(
                f"built {relative_display(root, built_path)} drifted from {relative_display(root, source_path)}"
            )
        elif built_path.is_file():
            print(f"ok: {relative_display(root, built_path)} matches source installer exactly")

    getting_started_path = dist_root / "docs/getting-started/index.html"
    if getting_started_path.is_file():
        spaced, compact = spaced_and_compact_text(getting_started_path.read_text())
        for needle in GETTING_STARTED_COMPACT_MARKERS:
            if needle not in compact:
                errors.append(f"{relative_display(root, getting_started_path)} missing {needle!r} in compact text")
            else:
                print(f"ok: {relative_display(root, getting_started_path)} compact text contains {needle!r}")
        for pattern in GETTING_STARTED_REGEX_MARKERS:
            if not re.search(pattern, spaced):
                errors.append(f"{relative_display(root, getting_started_path)} missing regex {pattern!r}")
            else:
                print(f"ok: {relative_display(root, getting_started_path)} spaced text matches {pattern!r}")

    tooling_path = dist_root / "docs/tooling/index.html"
    if tooling_path.is_file():
        spaced, compact = spaced_and_compact_text(tooling_path.read_text())
        for needle in TOOLING_COMPACT_MARKERS:
            if needle not in compact:
                errors.append(f"{relative_display(root, tooling_path)} missing {needle!r} in compact text")
            else:
                print(f"ok: {relative_display(root, tooling_path)} compact text contains {needle!r}")
        for pattern in TOOLING_REGEX_MARKERS:
            if not re.search(pattern, spaced):
                errors.append(f"{relative_display(root, tooling_path)} missing regex {pattern!r}")
            else:
                print(f"ok: {relative_display(root, tooling_path)} spaced text matches {pattern!r}")

    if errors:
        print_errors(errors)
        return 1
    return 0


def verify_public_http(
    root: Path,
    artifact_dir: Path,
    targets: UrlTargets,
    retry_attempts: int,
    retry_sleep_seconds: int,
    fetch_timeout_seconds: int,
) -> int:
    artifact_dir.mkdir(parents=True, exist_ok=True)
    public_log = artifact_dir / "public-http.log"

    context = SurfaceContext(
        root=root,
        artifact_dir=artifact_dir,
        targets=targets,
        fetch_timeout_seconds=fetch_timeout_seconds,
    )
    checks = [
        check_install_sh,
        check_install_ps1,
        check_getting_started,
        check_tooling,
        check_package_detail,
        check_package_search,
        check_registry_search,
    ]

    with public_log.open("w", encoding="utf-8") as log:
        log.write(f"contract_version\t{CONTRACT_VERSION}\n")
        log.write(f"retry_attempts\t{retry_attempts}\n")
        log.write(f"retry_sleep_seconds\t{retry_sleep_seconds}\n")
        log.write(f"fetch_timeout_seconds\t{fetch_timeout_seconds}\n")
        log.write(f"site_base_url\t{targets.site_base_url}\n")
        log.write(f"packages_site_base_url\t{targets.packages_site_base_url}\n")
        log.write(f"registry_base_url\t{targets.registry_base_url}\n")

        last_failures: list[SurfaceResult] = []
        for attempt in range(1, retry_attempts + 1):
            log.write(f"attempt\t{attempt}/{retry_attempts}\n")
            print(f"public surface contract attempt {attempt}/{retry_attempts}")
            failures: list[SurfaceResult] = []
            for check in checks:
                result = check(context)
                detail = ""
                if result.detail_path is not None:
                    detail = relative_display(root, result.detail_path)
                log.write(
                    f"surface\t{result.label}\t{'passed' if result.passed else 'failed'}\t{result.summary}\t{detail}\n"
                )
                print(f"- {result.label}: {result.summary}")
                if not result.passed:
                    failures.append(result)

            if not failures:
                log.write(f"final\tpassed\tattempt {attempt}/{retry_attempts}\n")
                print(f"public surface contract passed on attempt {attempt}/{retry_attempts}")
                print(f"artifact-dir: {relative_display(root, artifact_dir)}")
                return 0

            last_failures = failures
            summary = "; ".join(f"{failure.label}: {failure.summary}" for failure in failures)
            log.write(f"attempt_result\tretry\t{summary}\n")
            print(f"remaining public drift after attempt {attempt}/{retry_attempts}: {summary}", file=sys.stderr)
            if attempt < retry_attempts:
                log.write(f"sleep\t{retry_sleep_seconds}\n")
                if retry_sleep_seconds > 0:
                    time.sleep(retry_sleep_seconds)

        summary = "; ".join(f"{failure.label}: {failure.summary}" for failure in last_failures)
        log.write(f"final\tfailed\t{summary}\n")
        print(
            f"public surface contract exhausted {retry_attempts} attempts; last mismatch: {summary}",
            file=sys.stderr,
        )
        print(f"artifact-dir: {relative_display(root, artifact_dir)}", file=sys.stderr)
        return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="M034 shared public surface contract")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("describe", help="emit the shared contract as JSON")

    local_parser = subparsers.add_parser("local-docs", help="verify local README/docs/installers metadata")
    local_parser.add_argument("--root", type=Path, required=True)

    built_parser = subparsers.add_parser("built-docs", help="verify built VitePress output")
    built_parser.add_argument("--root", type=Path, required=True)
    built_parser.add_argument("--dist-root", type=Path, required=True)

    public_parser = subparsers.add_parser("public-http", help="verify live public surfaces with one bounded freshness budget")
    public_parser.add_argument("--root", type=Path, required=True)
    public_parser.add_argument("--artifact-dir", type=Path, required=True)
    public_parser.add_argument("--site-base-url", default="https://meshlang.dev")
    public_parser.add_argument("--packages-site-base-url", default="https://packages.meshlang.dev")
    public_parser.add_argument("--registry-base-url", default="https://api.packages.meshlang.dev")
    public_parser.add_argument("--retry-attempts", type=int, default=DEFAULT_RETRY_ATTEMPTS)
    public_parser.add_argument("--retry-sleep-seconds", type=int, default=DEFAULT_RETRY_SLEEP_SECONDS)
    public_parser.add_argument("--fetch-timeout-seconds", type=int, default=DEFAULT_FETCH_TIMEOUT_SECONDS)

    return parser


def describe_contract() -> int:
    payload = {
        "contractVersion": CONTRACT_VERSION,
        "helperPath": HELPER_RELATIVE_PATH,
        "retryBudget": {
            "attempts": DEFAULT_RETRY_ATTEMPTS,
            "sleepSeconds": DEFAULT_RETRY_SLEEP_SECONDS,
            "fetchTimeoutSeconds": DEFAULT_FETCH_TIMEOUT_SECONDS,
        },
        "workflowContract": WORKFLOW_CONTRACT,
        "surfaces": {
            "public-install-sh": {
                "urlPath": "/install.sh",
                "expectedContentTypePrefix": "application/x-sh",
                "comparison": "exact-bytes-vs-website/docs/public/install.sh",
            },
            "public-install-ps1": {
                "urlPath": "/install.ps1",
                "expectedContentTypePrefix": "application/octet-stream",
                "comparison": "exact-bytes-vs-website/docs/public/install.ps1",
            },
            "public-getting-started": {
                "urlPath": "/docs/getting-started/",
                "expectedContentTypePrefix": "text/html",
                "compactMarkers": GETTING_STARTED_COMPACT_MARKERS,
                "regexMarkers": GETTING_STARTED_REGEX_MARKERS,
            },
            "public-tooling": {
                "urlPath": "/docs/tooling/",
                "expectedContentTypePrefix": "text/html",
                "compactMarkers": TOOLING_COMPACT_MARKERS,
                "regexMarkers": TOOLING_REGEX_MARKERS,
            },
            "public-package-detail": {
                "urlPath": f"/packages/{PACKAGE_NAME}",
                "expectedContentTypePrefix": "text/html",
                "requiredMarkers": [PACKAGE_NAME, PACKAGE_DESCRIPTION],
            },
            "public-package-search": {
                "urlPath": f"/search?q={SCOPED_QUERY}",
                "expectedContentTypePrefix": "text/html",
                "requiredMarkers": [f'Results for "{PACKAGE_NAME}"', PACKAGE_NAME, PACKAGE_DESCRIPTION],
            },
            "public-registry-search": {
                "urlPath": f"/api/v1/packages?search={SCOPED_QUERY}",
                "expectedContentTypePrefix": "application/json",
                "requiredJsonName": PACKAGE_NAME,
                "requiredJsonDescription": PACKAGE_DESCRIPTION,
            },
        },
    }
    print(json.dumps(payload, indent=2))
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "describe":
        return describe_contract()
    if args.command == "local-docs":
        return verify_local_docs(args.root.resolve())
    if args.command == "built-docs":
        return verify_built_docs(args.root.resolve(), args.dist_root.resolve())
    if args.command == "public-http":
        if args.retry_attempts <= 0:
            raise SystemExit("--retry-attempts must be > 0")
        if args.retry_sleep_seconds < 0:
            raise SystemExit("--retry-sleep-seconds must be >= 0")
        if args.fetch_timeout_seconds <= 0:
            raise SystemExit("--fetch-timeout-seconds must be > 0")
        targets = UrlTargets(
            site_base_url=normalize_base_url(args.site_base_url),
            packages_site_base_url=normalize_base_url(args.packages_site_base_url),
            registry_base_url=normalize_base_url(args.registry_base_url),
        )
        return verify_public_http(
            root=args.root.resolve(),
            artifact_dir=args.artifact_dir.resolve(),
            targets=targets,
            retry_attempts=args.retry_attempts,
            retry_sleep_seconds=args.retry_sleep_seconds,
            fetch_timeout_seconds=args.fetch_timeout_seconds,
        )
    raise AssertionError(f"unhandled command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
