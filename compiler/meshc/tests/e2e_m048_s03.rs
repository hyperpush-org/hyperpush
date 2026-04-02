mod support;

use serde::Serialize;
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Output};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex, OnceLock,
};
use std::thread::{self, JoinHandle};
use std::time::Duration;
use support::m046_route_free as route_free;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

const DOWNLOAD_TIMEOUT_SEC: &str = "20";
const STRICT_PROOF: &str = "1";
const CREDENTIALS_FIXTURE: &str = "[registry]\ntoken = \"fixture-token\"\n";

fn artifact_dir(test_name: &str) -> PathBuf {
    route_free::artifact_dir("m048-s03", test_name)
}

fn repo_root() -> PathBuf {
    route_free::repo_root()
}

fn meshc_source_bin() -> PathBuf {
    route_free::meshc_bin()
}

fn meshpkg_source_bin() -> PathBuf {
    static BUILD_ONCE: OnceLock<()> = OnceLock::new();
    BUILD_ONCE.get_or_init(|| {
        let output = Command::new("cargo")
            .current_dir(repo_root())
            .args(["build", "-q", "-p", "meshpkg"])
            .output()
            .expect("failed to invoke cargo build -q -p meshpkg");
        assert!(
            output.status.success(),
            "cargo build -q -p meshpkg failed:\n{}",
            route_free::command_output_text(&output)
        );
    });

    let binary = repo_root().join("target").join("debug").join(if cfg!(windows) {
        "meshpkg.exe"
    } else {
        "meshpkg"
    });
    assert!(binary.is_file(), "expected meshpkg binary at {}", binary.display());
    binary
}

fn repo_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

fn host_release_target() -> String {
    let mut os = command_stdout("uname", &["-s"]);
    let mut arch = command_stdout("uname", &["-m"]);

    match os.as_str() {
        "Linux" => os = "unknown-linux-gnu".to_string(),
        "Darwin" => {
            os = "apple-darwin".to_string();
            if arch == "x86_64" {
                let sysctl = Command::new("sysctl")
                    .args(["-n", "hw.optional.arm64"])
                    .output();
                if let Ok(output) = sysctl {
                    if output.status.success()
                        && String::from_utf8_lossy(&output.stdout).trim() == "1"
                    {
                        arch = "aarch64".to_string();
                    }
                }
            }
        }
        other => panic!("unsupported host OS for m048 s03 acceptance rail: {other}"),
    }

    arch = match arch.as_str() {
        "x86_64" | "amd64" => "x86_64".to_string(),
        "aarch64" | "arm64" => "aarch64".to_string(),
        other => panic!("unsupported host architecture for m048 s03 acceptance rail: {other}"),
    };

    format!("{arch}-{os}")
}

fn command_stdout(program: &str, args: &[&str]) -> String {
    let output = Command::new(program)
        .args(args)
        .output()
        .unwrap_or_else(|error| panic!("failed to run {program} {:?}: {error}", args));
    assert!(
        output.status.success(),
        "{} {:?} failed:\n{}",
        program,
        args,
        route_free::command_output_text(&output)
    );
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

#[derive(Debug, Serialize)]
struct LoggedCommandEnv {
    key: String,
    value: String,
}

#[derive(Debug, Serialize)]
struct LoggedCommand {
    program: String,
    args: Vec<String>,
    cwd: String,
    env: Vec<LoggedCommandEnv>,
    exit_code: Option<i32>,
    stdout_path: String,
    stderr_path: String,
}

fn run_logged_command(
    artifacts: &Path,
    label: &str,
    program: &Path,
    args: &[&str],
    envs: &[(String, String)],
) -> Output {
    let stdout_path = artifacts.join(format!("{label}.stdout.log"));
    let stderr_path = artifacts.join(format!("{label}.stderr.log"));

    let mut command = Command::new(program);
    command.current_dir(repo_root()).args(args).envs(envs.iter().cloned());
    let output = command.output().unwrap_or_else(|error| {
        panic!(
            "failed to run {} {:?}: {error}",
            program.display(),
            args
        )
    });

    fs::write(&stdout_path, &output.stdout)
        .unwrap_or_else(|error| panic!("failed to write {}: {error}", stdout_path.display()));
    fs::write(&stderr_path, &output.stderr)
        .unwrap_or_else(|error| panic!("failed to write {}: {error}", stderr_path.display()));

    let metadata = LoggedCommand {
        program: program.display().to_string(),
        args: args.iter().map(|arg| (*arg).to_string()).collect(),
        cwd: repo_root().display().to_string(),
        env: envs
            .iter()
            .map(|(key, value)| LoggedCommandEnv {
                key: key.clone(),
                value: value.clone(),
            })
            .collect(),
        exit_code: output.status.code(),
        stdout_path: stdout_path.display().to_string(),
        stderr_path: stderr_path.display().to_string(),
    };
    route_free::write_json_artifact(&artifacts.join(format!("{label}.json")), &metadata);

    output
}

#[derive(Debug, Serialize)]
struct FakeHomeEntry {
    relative_path: String,
    kind: String,
    size: Option<u64>,
    executable: Option<bool>,
    note: Option<String>,
}

fn record_fake_home_snapshot(root: &Path, artifact_path: &Path) {
    let mut entries = Vec::new();
    if root.exists() {
        collect_fake_home_entries(root, root, &mut entries);
    }
    route_free::write_json_artifact(artifact_path, &entries);
}

fn collect_fake_home_entries(root: &Path, current: &Path, entries: &mut Vec<FakeHomeEntry>) {
    let Ok(read_dir) = fs::read_dir(current) else {
        return;
    };

    let mut children: Vec<PathBuf> = read_dir
        .filter_map(|entry| entry.ok().map(|value| value.path()))
        .collect();
    children.sort();

    for child in children {
        let relative = child
            .strip_prefix(root)
            .expect("snapshot child should stay under root");
        let metadata = fs::symlink_metadata(&child)
            .unwrap_or_else(|error| panic!("failed to stat {}: {error}", child.display()));
        let relative_string = relative.display().to_string();

        if metadata.is_dir() {
            entries.push(FakeHomeEntry {
                relative_path: relative_string,
                kind: "dir".to_string(),
                size: None,
                executable: None,
                note: None,
            });
            collect_fake_home_entries(root, &child, entries);
            continue;
        }

        let is_credentials = relative == Path::new(".mesh").join("credentials");
        entries.push(FakeHomeEntry {
            relative_path: relative_string,
            kind: "file".to_string(),
            size: Some(metadata.len()),
            executable: Some(is_executable(&metadata)),
            note: if is_credentials {
                Some("credentials redacted; presence and size only".to_string())
            } else {
                None
            },
        });
    }
}

#[cfg(unix)]
fn is_executable(metadata: &fs::Metadata) -> bool {
    metadata.permissions().mode() & 0o111 != 0
}

#[cfg(not(unix))]
fn is_executable(_: &fs::Metadata) -> bool {
    false
}

fn record_version_state(version_path: &Path, artifact_path: &Path) {
    let state = if version_path.is_file() {
        json!({
            "exists": true,
            "path": version_path.display().to_string(),
            "value": fs::read_to_string(version_path)
                .unwrap_or_else(|error| panic!("failed to read {}: {error}", version_path.display()))
                .trim()
                .to_string(),
        })
    } else {
        json!({
            "exists": false,
            "path": version_path.display().to_string(),
            "value": null,
        })
    };
    route_free::write_json_artifact(artifact_path, &state);
}

fn credential_presence(path: &Path) -> serde_json::Value {
    let metadata = fs::metadata(path).ok();
    json!({
        "path": path.display().to_string(),
        "exists": metadata.is_some(),
        "size": metadata.as_ref().map(std::fs::Metadata::len),
    })
}

fn copy_binary(source: &Path, dest: &Path) {
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .unwrap_or_else(|error| panic!("failed to create {}: {error}", parent.display()));
    }
    fs::copy(source, dest).unwrap_or_else(|error| {
        panic!(
            "failed to copy {} -> {}: {error}",
            source.display(),
            dest.display()
        )
    });

    #[cfg(unix)]
    {
        let permissions = fs::metadata(source)
            .unwrap_or_else(|error| panic!("failed to stat {}: {error}", source.display()))
            .permissions();
        fs::set_permissions(dest, permissions)
            .unwrap_or_else(|error| panic!("failed to chmod {}: {error}", dest.display()));
    }
}

#[cfg(unix)]
fn write_executable_script(path: &Path, script: &str) {
    fs::write(path, script)
        .unwrap_or_else(|error| panic!("failed to write {}: {error}", path.display()));
    let mut permissions = fs::metadata(path)
        .unwrap_or_else(|error| panic!("failed to stat {}: {error}", path.display()))
        .permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(path, permissions)
        .unwrap_or_else(|error| panic!("failed to chmod {}: {error}", path.display()));
}

#[cfg(not(unix))]
fn write_executable_script(path: &Path, script: &str) {
    fs::write(path, script)
        .unwrap_or_else(|error| panic!("failed to write {}: {error}", path.display()));
}

fn sha256_hex(path: &Path) -> String {
    let bytes = fs::read(path).unwrap_or_else(|error| panic!("failed to read {}: {error}", path.display()));
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn stage_tarball(source_binary: &Path, archive_path: &Path, entry_name: &str) {
    let payload_root = archive_path
        .parent()
        .expect("archive path should have a parent")
        .join("payload")
        .join(entry_name);
    fs::create_dir_all(&payload_root)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", payload_root.display()));
    let staged_binary = payload_root.join(entry_name);
    fs::copy(source_binary, &staged_binary).unwrap_or_else(|error| {
        panic!(
            "failed to stage {} -> {}: {error}",
            source_binary.display(),
            staged_binary.display()
        )
    });

    let output = Command::new("tar")
        .arg("-czf")
        .arg(archive_path)
        .arg("-C")
        .arg(&payload_root)
        .arg(entry_name)
        .output()
        .unwrap_or_else(|error| panic!("failed to run tar for {}: {error}", archive_path.display()));
    assert!(
        output.status.success(),
        "tar failed while building {}:\n{}",
        archive_path.display(),
        route_free::command_output_text(&output)
    );
}

#[derive(Debug, Serialize)]
struct StagedReleaseLayout {
    version: String,
    target: String,
    server_root: String,
    installer_path: String,
    release_api_path: String,
    release_base_path: String,
    meshc_archive: String,
    meshpkg_archive: String,
}

fn stage_release_server_root(artifacts: &Path) -> StagedReleaseLayout {
    let version = repo_version().to_string();
    let target = host_release_target();
    let server_root = artifacts.join("server-root");
    let installer_path = server_root.join("install.sh");
    let release_api_path = server_root.join("api").join("releases").join("latest.json");
    let release_dir = server_root
        .join("snowdamiz")
        .join("mesh-lang")
        .join("releases")
        .join("download")
        .join(format!("v{version}"));

    fs::create_dir_all(&release_dir)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", release_dir.display()));
    if let Some(parent) = release_api_path.parent() {
        fs::create_dir_all(parent)
            .unwrap_or_else(|error| panic!("failed to create {}: {error}", parent.display()));
    }

    fs::copy(
        repo_root().join("website/docs/public/install.sh"),
        &installer_path,
    )
    .unwrap_or_else(|error| panic!("failed to stage installer: {error}"));

    let meshc_archive = format!("meshc-v{version}-{target}.tar.gz");
    let meshpkg_archive = format!("meshpkg-v{version}-{target}.tar.gz");
    stage_tarball(
        &meshc_source_bin(),
        &release_dir.join(&meshc_archive),
        "meshc",
    );
    stage_tarball(
        &meshpkg_source_bin(),
        &release_dir.join(&meshpkg_archive),
        "meshpkg",
    );

    let checksums = format!(
        "{}  {}\n{}  {}\n",
        sha256_hex(&release_dir.join(&meshc_archive)),
        meshc_archive,
        sha256_hex(&release_dir.join(&meshpkg_archive)),
        meshpkg_archive
    );
    fs::write(release_dir.join("SHA256SUMS"), checksums).unwrap_or_else(|error| {
        panic!(
            "failed to write {}: {error}",
            release_dir.join("SHA256SUMS").display()
        )
    });

    fs::write(
        &release_api_path,
        serde_json::to_string_pretty(&json!({
            "tag_name": format!("v{version}"),
            "name": "M048 S03 staged release",
            "assets": [
                { "name": &meshc_archive },
                { "name": &meshpkg_archive },
                { "name": "SHA256SUMS" }
            ]
        }))
        .expect("failed to render release json"),
    )
    .unwrap_or_else(|error| panic!("failed to write {}: {error}", release_api_path.display()));

    StagedReleaseLayout {
        version,
        target,
        server_root: server_root.display().to_string(),
        installer_path: installer_path.display().to_string(),
        release_api_path: release_api_path.display().to_string(),
        release_base_path: release_dir.display().to_string(),
        meshc_archive,
        meshpkg_archive,
    }
}

struct StaticFileServer {
    base_url: String,
    stop: Arc<AtomicBool>,
    join: Option<JoinHandle<()>>,
    request_log_path: PathBuf,
    requests: Arc<Mutex<Vec<String>>>,
}

impl StaticFileServer {
    fn start(root: PathBuf, request_log_path: PathBuf) -> Self {
        let listener = TcpListener::bind((route_free::LOOPBACK_V4, 0))
            .expect("failed to bind staged release server listener");
        listener
            .set_nonblocking(true)
            .expect("failed to set staged release server listener nonblocking");
        let port = listener
            .local_addr()
            .expect("staged release server should have a local addr")
            .port();
        let stop = Arc::new(AtomicBool::new(false));
        let requests = Arc::new(Mutex::new(Vec::new()));
        let stop_clone = Arc::clone(&stop);
        let requests_clone = Arc::clone(&requests);

        let join = thread::spawn(move || {
            while !stop_clone.load(Ordering::Relaxed) {
                match listener.accept() {
                    Ok((stream, _)) => handle_static_request(stream, &root, &requests_clone),
                    Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                        thread::sleep(Duration::from_millis(25));
                    }
                    Err(error) => {
                        requests_clone
                            .lock()
                            .expect("request log mutex poisoned")
                            .push(format!("accept-error: {error}"));
                        thread::sleep(Duration::from_millis(25));
                    }
                }
            }
        });

        Self {
            base_url: format!("http://{}:{port}", route_free::LOOPBACK_V4),
            stop,
            join: Some(join),
            request_log_path,
            requests,
        }
    }

    fn base_url(&self) -> &str {
        &self.base_url
    }
}

impl Drop for StaticFileServer {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        if let Some(join) = self.join.take() {
            let _ = join.join();
        }
        let contents = self
            .requests
            .lock()
            .map(|entries| entries.join("\n"))
            .unwrap_or_else(|_| "request log unavailable".to_string());
        let _ = fs::write(&self.request_log_path, contents);
    }
}

fn handle_static_request(stream: TcpStream, root: &Path, requests: &Arc<Mutex<Vec<String>>>) {
    let mut stream = stream;
    stream
        .set_nonblocking(false)
        .expect("failed to switch accepted staged release socket to blocking mode");
    let mut buffer = [0_u8; 8192];
    let read = match stream.read(&mut buffer) {
        Ok(0) => return,
        Ok(read) => read,
        Err(error) => {
            requests
                .lock()
                .expect("request log mutex poisoned")
                .push(format!("read-error: {error}"));
            return;
        }
    };

    let request = String::from_utf8_lossy(&buffer[..read]);
    let request_line = request.lines().next().unwrap_or_default().to_string();
    requests
        .lock()
        .expect("request log mutex poisoned")
        .push(request_line.clone());

    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or_default();
    let raw_path = parts.next().unwrap_or("/");

    if method != "GET" {
        write_http_response(
            &mut stream,
            "405 Method Not Allowed",
            "text/plain; charset=utf-8",
            b"method not allowed",
        );
        return;
    }

    if raw_path == "/" {
        write_http_response(
            &mut stream,
            "200 OK",
            "text/plain; charset=utf-8",
            b"mesh staged release server",
        );
        return;
    }

    let Some(path) = resolve_request_path(root, raw_path) else {
        write_http_response(
            &mut stream,
            "400 Bad Request",
            "text/plain; charset=utf-8",
            b"invalid path",
        );
        return;
    };

    match fs::read(&path) {
        Ok(body) => write_http_response(
            &mut stream,
            "200 OK",
            content_type_for(&path),
            &body,
        ),
        Err(_) => write_http_response(
            &mut stream,
            "404 Not Found",
            "text/plain; charset=utf-8",
            b"not found",
        ),
    }
}

fn resolve_request_path(root: &Path, raw_path: &str) -> Option<PathBuf> {
    let trimmed = raw_path.split('?').next().unwrap_or(raw_path);
    let mut resolved = root.to_path_buf();
    for component in Path::new(trimmed.trim_start_matches('/')).components() {
        match component {
            Component::Normal(part) => resolved.push(part),
            Component::CurDir => {}
            Component::RootDir => {}
            Component::ParentDir | Component::Prefix(_) => return None,
        }
    }
    Some(resolved)
}

fn content_type_for(path: &Path) -> &'static str {
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("json") => "application/json",
        Some("sh") => "text/x-shellscript; charset=utf-8",
        Some("txt") => "text/plain; charset=utf-8",
        Some("gz") => "application/gzip",
        _ => "application/octet-stream",
    }
}

fn write_http_response(stream: &mut TcpStream, status: &str, content_type: &str, body: &[u8]) {
    let headers = format!(
        "HTTP/1.1 {status}\r\nContent-Length: {}\r\nContent-Type: {content_type}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    stream
        .write_all(headers.as_bytes())
        .expect("failed to write staged response headers");
    stream
        .write_all(body)
        .expect("failed to write staged response body");
}

struct UpdateHarness {
    artifacts: PathBuf,
    release: StagedReleaseLayout,
    server: StaticFileServer,
}

impl UpdateHarness {
    fn new(test_name: &str) -> Self {
        let artifacts = artifact_dir(test_name);
        let release = stage_release_server_root(&artifacts);
        let server = StaticFileServer::start(
            PathBuf::from(&release.server_root),
            artifacts.join("server.requests.log"),
        );
        route_free::write_json_artifact(
            &artifacts.join("release-layout.json"),
            &json!({
                "version": &release.version,
                "target": &release.target,
                "server_root": &release.server_root,
                "installer_url": format!("{}/install.sh", server.base_url()),
                "release_api_url": format!("{}/api/releases/latest.json", server.base_url()),
                "release_base_url": format!("{}/snowdamiz/mesh-lang/releases/download", server.base_url()),
                "meshc_archive": &release.meshc_archive,
                "meshpkg_archive": &release.meshpkg_archive,
            }),
        );
        Self {
            artifacts,
            release,
            server,
        }
    }

    fn fake_home(&self) -> PathBuf {
        self.artifacts.join("fake-home")
    }

    fn mesh_home(&self) -> PathBuf {
        self.fake_home().join(".mesh")
    }

    fn installed_meshc_path(&self) -> PathBuf {
        self.mesh_home().join("bin").join("meshc")
    }

    fn installed_meshpkg_path(&self) -> PathBuf {
        self.mesh_home().join("bin").join("meshpkg")
    }

    fn version_path(&self) -> PathBuf {
        self.mesh_home().join("version")
    }

    fn credentials_path(&self) -> PathBuf {
        self.mesh_home().join("credentials")
    }

    fn installer_env(&self) -> Vec<(String, String)> {
        vec![
            ("HOME".to_string(), self.fake_home().display().to_string()),
            ("SHELL".to_string(), "/bin/bash".to_string()),
            ("NO_COLOR".to_string(), "1".to_string()),
            (
                "MESH_UPDATE_INSTALLER_URL".to_string(),
                format!("{}/install.sh", self.server.base_url()),
            ),
            (
                "MESH_INSTALL_RELEASE_API_URL".to_string(),
                format!("{}/api/releases/latest.json", self.server.base_url()),
            ),
            (
                "MESH_INSTALL_RELEASE_BASE_URL".to_string(),
                format!("{}/snowdamiz/mesh-lang/releases/download", self.server.base_url()),
            ),
            (
                "MESH_INSTALL_DOWNLOAD_TIMEOUT_SEC".to_string(),
                DOWNLOAD_TIMEOUT_SEC.to_string(),
            ),
            (
                "MESH_INSTALL_STRICT_PROOF".to_string(),
                STRICT_PROOF.to_string(),
            ),
        ]
    }

    fn prepare_fake_home(&self) {
        fs::create_dir_all(self.fake_home())
            .unwrap_or_else(|error| panic!("failed to create {}: {error}", self.fake_home().display()));
        fs::write(self.fake_home().join(".bashrc"), "")
            .unwrap_or_else(|error| panic!("failed to seed .bashrc: {error}"));
    }
}

#[test]
fn m048_s03_staged_meshc_update_installs_both_binaries_into_fake_mesh_home() {
    let harness = UpdateHarness::new("staged-meshc-update");
    harness.prepare_fake_home();

    let staged_dir = harness.artifacts.join("staged-binary");
    let staged_meshc = staged_dir.join("meshc");
    copy_binary(&meshc_source_bin(), &staged_meshc);
    route_free::write_json_artifact(
        &harness.artifacts.join("staged-binary.json"),
        &json!({
            "path": staged_meshc.display().to_string(),
            "source": meshc_source_bin().display().to_string(),
        }),
    );

    record_fake_home_snapshot(&harness.fake_home(), &harness.artifacts.join("fake-home-before.json"));
    record_version_state(&harness.version_path(), &harness.artifacts.join("version-before.json"));

    let update = run_logged_command(
        &harness.artifacts,
        "meshc-update",
        &staged_meshc,
        &["update"],
        &harness.installer_env(),
    );
    assert!(
        update.status.success(),
        "staged meshc update failed:\n{}",
        route_free::command_output_text(&update)
    );

    record_fake_home_snapshot(&harness.fake_home(), &harness.artifacts.join("fake-home-after.json"));
    record_version_state(&harness.version_path(), &harness.artifacts.join("version-after.json"));

    assert!(
        harness.installed_meshc_path().is_file(),
        "meshc update should install ~/.mesh/bin/meshc"
    );
    assert!(
        harness.installed_meshpkg_path().is_file(),
        "meshc update should install ~/.mesh/bin/meshpkg"
    );
    let version = fs::read_to_string(harness.version_path())
        .unwrap_or_else(|error| panic!("failed to read {}: {error}", harness.version_path().display()));
    assert_eq!(
        version.trim(),
        harness.release.version,
        "meshc update should refresh ~/.mesh/version"
    );

    let meshc_version = run_logged_command(
        &harness.artifacts,
        "installed-meshc-version",
        &harness.installed_meshc_path(),
        &["--version"],
        &[("HOME".to_string(), harness.fake_home().display().to_string())],
    );
    assert!(
        meshc_version.status.success(),
        "installed meshc --version failed:\n{}",
        route_free::command_output_text(&meshc_version)
    );
    assert!(
        String::from_utf8_lossy(&meshc_version.stdout).contains(&harness.release.version),
        "installed meshc --version should report {}:\n{}",
        harness.release.version,
        route_free::command_output_text(&meshc_version)
    );

    let meshpkg_version = run_logged_command(
        &harness.artifacts,
        "installed-meshpkg-version",
        &harness.installed_meshpkg_path(),
        &["--version"],
        &[("HOME".to_string(), harness.fake_home().display().to_string())],
    );
    assert!(
        meshpkg_version.status.success(),
        "installed meshpkg --version failed:\n{}",
        route_free::command_output_text(&meshpkg_version)
    );
    assert!(
        String::from_utf8_lossy(&meshpkg_version.stdout).contains(&harness.release.version),
        "installed meshpkg --version should report {}:\n{}",
        harness.release.version,
        route_free::command_output_text(&meshpkg_version)
    );
}

#[test]
fn m048_s03_installed_meshpkg_update_repairs_meshc_and_preserves_credentials() {
    let harness = UpdateHarness::new("installed-meshpkg-update");
    harness.prepare_fake_home();
    fs::create_dir_all(harness.mesh_home().join("bin")).unwrap_or_else(|error| {
        panic!(
            "failed to create {}: {error}",
            harness.mesh_home().join("bin").display()
        )
    });

    copy_binary(&meshc_source_bin(), &harness.installed_meshc_path());
    copy_binary(&meshpkg_source_bin(), &harness.installed_meshpkg_path());
    fs::write(harness.version_path(), "0.0.0-stale\n")
        .unwrap_or_else(|error| panic!("failed to seed stale version file: {error}"));
    fs::write(harness.credentials_path(), CREDENTIALS_FIXTURE)
        .unwrap_or_else(|error| panic!("failed to seed credentials fixture: {error}"));
    write_executable_script(
        &harness.installed_meshc_path(),
        "#!/bin/sh\necho corrupted meshc >&2\nexit 1\n",
    );

    let credential_before = credential_presence(&harness.credentials_path());
    route_free::write_json_artifact(
        &harness.artifacts.join("credential-before.json"),
        &credential_before,
    );
    record_fake_home_snapshot(&harness.fake_home(), &harness.artifacts.join("fake-home-before.json"));
    record_version_state(&harness.version_path(), &harness.artifacts.join("version-before.json"));

    let broken_meshc = run_logged_command(
        &harness.artifacts,
        "pre-update-broken-meshc-version",
        &harness.installed_meshc_path(),
        &["--version"],
        &[("HOME".to_string(), harness.fake_home().display().to_string())],
    );
    assert!(
        !broken_meshc.status.success(),
        "corrupted installed meshc should fail before update"
    );

    let update = run_logged_command(
        &harness.artifacts,
        "meshpkg-update",
        &harness.installed_meshpkg_path(),
        &["update"],
        &harness.installer_env(),
    );
    assert!(
        update.status.success(),
        "installed meshpkg update failed:\n{}",
        route_free::command_output_text(&update)
    );

    let credential_after = credential_presence(&harness.credentials_path());
    route_free::write_json_artifact(
        &harness.artifacts.join("credential-after.json"),
        &credential_after,
    );
    record_fake_home_snapshot(&harness.fake_home(), &harness.artifacts.join("fake-home-after.json"));
    record_version_state(&harness.version_path(), &harness.artifacts.join("version-after.json"));

    assert_eq!(
        credential_before["exists"],
        json!(true),
        "credentials fixture should exist before update"
    );
    assert_eq!(
        credential_after["exists"],
        json!(true),
        "credentials should survive installed meshpkg update"
    );
    assert_eq!(
        credential_before["size"],
        credential_after["size"],
        "credentials size should remain stable across update"
    );

    let version = fs::read_to_string(harness.version_path())
        .unwrap_or_else(|error| panic!("failed to read {}: {error}", harness.version_path().display()));
    assert_eq!(
        version.trim(),
        harness.release.version,
        "installed meshpkg update should refresh ~/.mesh/version"
    );

    let repaired_meshc = run_logged_command(
        &harness.artifacts,
        "post-update-meshc-version",
        &harness.installed_meshc_path(),
        &["--version"],
        &[("HOME".to_string(), harness.fake_home().display().to_string())],
    );
    assert!(
        repaired_meshc.status.success(),
        "installed meshc should be repaired after meshpkg update:\n{}",
        route_free::command_output_text(&repaired_meshc)
    );
    assert!(
        String::from_utf8_lossy(&repaired_meshc.stdout).contains(&harness.release.version),
        "repaired meshc --version should report {}:\n{}",
        harness.release.version,
        route_free::command_output_text(&repaired_meshc)
    );

    let repaired_meshpkg = run_logged_command(
        &harness.artifacts,
        "post-update-meshpkg-version",
        &harness.installed_meshpkg_path(),
        &["--version"],
        &[("HOME".to_string(), harness.fake_home().display().to_string())],
    );
    assert!(
        repaired_meshpkg.status.success(),
        "installed meshpkg should still run after self-update:\n{}",
        route_free::command_output_text(&repaired_meshpkg)
    );
    assert!(
        String::from_utf8_lossy(&repaired_meshpkg.stdout).contains(&harness.release.version),
        "repaired meshpkg --version should report {}:\n{}",
        harness.release.version,
        route_free::command_output_text(&repaired_meshpkg)
    );
}
