use std::path::PathBuf;
use std::process::Command;

use serde_json::Value;

fn meshpkg_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_meshpkg"))
}

#[test]
fn help_lists_update_command() {
    let output = Command::new(meshpkg_bin())
        .arg("--help")
        .output()
        .expect("failed to run meshpkg --help");

    assert!(
        output.status.success(),
        "meshpkg --help failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("update"),
        "meshpkg --help should list the update subcommand, got:\n{}",
        stdout
    );
    assert!(
        stdout.contains("Refresh installed meshc and meshpkg"),
        "meshpkg --help should describe the update subcommand honestly, got:\n{}",
        stdout
    );
}

#[test]
fn update_help_mentions_canonical_installer_path() {
    let output = Command::new(meshpkg_bin())
        .args(["update", "--help"])
        .output()
        .expect("failed to run meshpkg update --help");

    assert!(
        output.status.success(),
        "meshpkg update --help failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("Refresh installed meshc and meshpkg"),
        "meshpkg update --help should explain the toolchain surface, got:\n{}",
        stdout
    );
    assert!(
        stdout.contains("canonical installer path"),
        "meshpkg update --help should mention the canonical installer path, got:\n{}",
        stdout
    );
}

#[test]
fn json_mode_rejects_update_before_installer_launch() {
    let output = Command::new(meshpkg_bin())
        .args(["--json", "update"])
        .env("MESH_UPDATE_INSTALLER_URL", "http://127.0.0.1:9/install.sh")
        .output()
        .expect("failed to run meshpkg --json update");

    assert!(
        !output.status.success(),
        "meshpkg --json update should fail closed"
    );
    assert!(
        output.stdout.is_empty(),
        "meshpkg --json update should not write stdout on failure, got:\n{}",
        String::from_utf8_lossy(&output.stdout)
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    let json: Value = serde_json::from_str(stderr.trim())
        .unwrap_or_else(|error| panic!("meshpkg --json update should emit one JSON error: {error}\nstderr:\n{stderr}"));
    let message = json["error"]
        .as_str()
        .expect("json error payload should contain an error string");

    assert!(
        message.contains("does not support --json"),
        "expected explicit JSON-mode guard message, got: {message}"
    );
    assert!(
        !message.contains("127.0.0.1:9"),
        "guard should fire before any installer download is attempted, got: {message}"
    );
    assert!(
        !message.contains("toolchain update download failed"),
        "guard should fail before the shared updater runs, got: {message}"
    );
}
