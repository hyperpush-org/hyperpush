use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use std::collections::HashSet;
use std::fs::{self, File};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Output, Stdio};
use std::sync::OnceLock;
use std::thread::sleep;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

pub const LOOPBACK_V4: &str = "127.0.0.1";
pub const LOOPBACK_V6: &str = "::1";
pub const STATUS_TIMEOUT: Duration = Duration::from_secs(20);
pub const CONTINUITY_TIMEOUT: Duration = Duration::from_secs(20);
pub const DIAGNOSTIC_TIMEOUT: Duration = Duration::from_secs(20);
pub const STARTUP_RUNTIME_NAME: &str = "Work.add";
pub const STARTUP_SOURCE_DECLARATION: &str = "@cluster pub fn add()";
pub const STARTUP_RUNTIME_NAME_GUIDANCE: &str =
    "the runtime-owned handler name is derived from the ordinary source function name as `Work.add`";
pub const STARTUP_AUTOSTART_GUIDANCE: &str =
    "The runtime automatically starts the source-declared `@cluster` function and closes the continuity record when it returns.";
pub const TINY_CLUSTER_FIXTURE_ROOT_RELATIVE: &str =
    "scripts/fixtures/clustered/tiny-cluster";
pub const TINY_CLUSTER_FIXTURE_PACKAGE_NAME: &str = "tiny-cluster";
pub const TINY_CLUSTER_FIXTURE_REQUIRED_FILES: &[&str] = &[
    "mesh.toml",
    "main.mpl",
    "work.mpl",
    "README.md",
    "tests/work.test.mpl",
];
pub const CLUSTER_PROOF_FIXTURE_ROOT_RELATIVE: &str =
    "scripts/fixtures/clustered/cluster-proof";
pub const CLUSTER_PROOF_FIXTURE_DOCKERFILE_RELATIVE: &str =
    "scripts/fixtures/clustered/cluster-proof/Dockerfile";
pub const CLUSTER_PROOF_FIXTURE_PACKAGE_NAME: &str = "cluster-proof";
pub const CLUSTER_PROOF_FIXTURE_REQUIRED_FILES: &[&str] = &[
    "mesh.toml",
    "main.mpl",
    "work.mpl",
    "README.md",
    "Dockerfile",
    "fly.toml",
    "tests/work.test.mpl",
];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BuildOutputMetadata {
    pub source_package_dir: PathBuf,
    pub binary_path: PathBuf,
}

pub struct SpawnedProcess {
    pub child: Child,
    pub stdout_path: PathBuf,
    pub stderr_path: PathBuf,
}

pub struct StoppedProcess {
    pub stdout: String,
    pub stderr: String,
    pub combined: String,
}

pub fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

fn validate_required_fixture_root(
    fixture_name: &str,
    fixture_root_relative: &str,
    root: &Path,
    expected_package_name: &str,
    required_files: &[&str],
) -> Result<(), String> {
    if !root.is_dir() {
        return Err(format!(
            "{fixture_name} fixture root {} is missing; expected {}",
            root.display(),
            fixture_root_relative
        ));
    }

    let missing_files = required_files
        .iter()
        .copied()
        .filter(|relative_path| !root.join(relative_path).is_file())
        .collect::<Vec<_>>();
    if !missing_files.is_empty() {
        return Err(format!(
            "{fixture_name} fixture root {} is missing required files: {}; reference fixture path is {}",
            root.display(),
            missing_files.join(", "),
            fixture_root_relative
        ));
    }

    let manifest_path = root.join("mesh.toml");
    let manifest = fs::read_to_string(&manifest_path).map_err(|error| {
        format!(
            "failed to read {fixture_name} fixture manifest {}: {error}",
            manifest_path.display()
        )
    })?;
    let expected_package_line = format!("name = \"{expected_package_name}\"");
    if !manifest.contains(&expected_package_line) {
        return Err(format!(
            "{fixture_name} fixture root {} is not the expected package directory; {} does not contain {}",
            root.display(),
            manifest_path.display(),
            expected_package_line
        ));
    }

    Ok(())
}

pub fn validate_tiny_cluster_fixture_root(root: &Path) -> Result<(), String> {
    validate_required_fixture_root(
        "tiny-cluster",
        TINY_CLUSTER_FIXTURE_ROOT_RELATIVE,
        root,
        TINY_CLUSTER_FIXTURE_PACKAGE_NAME,
        TINY_CLUSTER_FIXTURE_REQUIRED_FILES,
    )
}

pub fn tiny_cluster_fixture_root() -> PathBuf {
    let root = repo_root().join(TINY_CLUSTER_FIXTURE_ROOT_RELATIVE);
    validate_tiny_cluster_fixture_root(&root).unwrap_or_else(|message| panic!("{message}"));
    root
}

pub fn validate_cluster_proof_fixture_root(root: &Path) -> Result<(), String> {
    validate_required_fixture_root(
        "cluster-proof",
        CLUSTER_PROOF_FIXTURE_ROOT_RELATIVE,
        root,
        CLUSTER_PROOF_FIXTURE_PACKAGE_NAME,
        CLUSTER_PROOF_FIXTURE_REQUIRED_FILES,
    )
}

pub fn cluster_proof_fixture_root() -> PathBuf {
    let root = repo_root().join(CLUSTER_PROOF_FIXTURE_ROOT_RELATIVE);
    validate_cluster_proof_fixture_root(&root).unwrap_or_else(|message| panic!("{message}"));
    root
}

pub fn meshc_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_meshc"))
}

pub fn ensure_mesh_rt_staticlib() {
    static BUILD_ONCE: OnceLock<()> = OnceLock::new();
    BUILD_ONCE.get_or_init(|| {
        let output = Command::new("cargo")
            .current_dir(repo_root())
            .args(["build", "-p", "mesh-rt"])
            .output()
            .expect("failed to invoke cargo build -p mesh-rt");
        assert!(
            output.status.success(),
            "cargo build -p mesh-rt failed:\n{}",
            command_output_text(&output)
        );
    });
}

pub fn command_output_text(output: &Output) -> String {
    format!(
        "status: {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
}

pub fn panic_payload_to_string(payload: Box<dyn Any + Send>) -> String {
    if let Some(message) = payload.downcast_ref::<&str>() {
        (*message).to_string()
    } else if let Some(message) = payload.downcast_ref::<String>() {
        message.clone()
    } else {
        "non-string panic payload".to_string()
    }
}

pub fn dual_stack_cluster_port() -> u16 {
    for _ in 0..64 {
        let listener = TcpListener::bind((LOOPBACK_V4, 0))
            .expect("failed to bind IPv4 loopback for ephemeral cluster port");
        let port = listener
            .local_addr()
            .expect("failed to read IPv4 ephemeral cluster port")
            .port();
        drop(listener);

        if TcpListener::bind((LOOPBACK_V4, port)).is_ok()
            && TcpListener::bind((LOOPBACK_V6, port)).is_ok()
        {
            return port;
        }
    }

    panic!("failed to find a dual-stack cluster port");
}

pub fn artifact_dir(bucket: &str, test_name: &str) -> PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = repo_root()
        .join(".tmp")
        .join(bucket)
        .join(format!("{test_name}-{stamp}"));
    fs::create_dir_all(&dir).expect("failed to create e2e artifact dir");
    dir
}

pub fn write_artifact(path: &Path, contents: impl AsRef<str>) {
    fs::write(path, contents.as_ref())
        .unwrap_or_else(|error| panic!("failed to write artifact {}: {error}", path.display()));
}

pub fn write_json_artifact(path: &Path, value: &impl Serialize) {
    write_artifact(
        path,
        serde_json::to_string_pretty(value).expect("json pretty print failed"),
    );
}

pub fn read_and_archive(source_path: &Path, artifact_path: &Path) -> String {
    let contents = fs::read_to_string(source_path)
        .unwrap_or_else(|error| panic!("failed to read {}: {error}", source_path.display()));
    if let Some(parent) = artifact_path.parent() {
        fs::create_dir_all(parent)
            .unwrap_or_else(|error| panic!("failed to create {}: {error}", parent.display()));
    }
    write_artifact(artifact_path, &contents);
    contents
}

pub fn archive_directory_tree(source_dir: &Path, artifact_dir: &Path) {
    assert!(
        source_dir.is_dir(),
        "expected {} to be a directory before archiving",
        source_dir.display()
    );
    fs::create_dir_all(artifact_dir).unwrap_or_else(|error| {
        panic!(
            "failed to create archive directory {}: {error}",
            artifact_dir.display()
        )
    });

    for entry in fs::read_dir(source_dir)
        .unwrap_or_else(|error| panic!("failed to read {}: {error}", source_dir.display()))
    {
        let entry = entry
            .unwrap_or_else(|error| panic!("failed to iterate {}: {error}", source_dir.display()));
        let source_path = entry.path();
        let artifact_path = artifact_dir.join(entry.file_name());
        if source_path.is_dir() {
            archive_directory_tree(&source_path, &artifact_path);
        } else {
            if let Some(parent) = artifact_path.parent() {
                fs::create_dir_all(parent).unwrap_or_else(|error| {
                    panic!("failed to create {}: {error}", parent.display())
                });
            }
            fs::copy(&source_path, &artifact_path).unwrap_or_else(|error| {
                panic!(
                    "failed to archive {} -> {}: {error}",
                    source_path.display(),
                    artifact_path.display()
                )
            });
        }
    }
}

pub fn init_clustered_project(
    workspace_dir: &Path,
    project_name: &str,
    artifacts: &Path,
) -> PathBuf {
    let output = Command::new(meshc_bin())
        .current_dir(workspace_dir)
        .args(["init", "--clustered", project_name])
        .output()
        .unwrap_or_else(|error| {
            panic!(
                "failed to invoke meshc init --clustered {} in {}: {error}",
                project_name,
                workspace_dir.display()
            )
        });
    write_artifact(&artifacts.join("init.log"), command_output_text(&output));
    assert!(
        output.status.success(),
        "meshc init --clustered {} should succeed:\n{}",
        project_name,
        command_output_text(&output)
    );

    let project_dir = workspace_dir.join(project_name);
    assert!(
        project_dir.is_dir(),
        "meshc init --clustered reported success but {} is missing",
        project_dir.display()
    );
    archive_directory_tree(&project_dir, &artifacts.join("generated-project"));
    project_dir
}

pub fn build_package_binary_to_output(
    package_dir: &Path,
    output_path: &Path,
    artifacts: &Path,
) -> BuildOutputMetadata {
    let Some(parent) = output_path.parent() else {
        let message = format!(
            "route-free proof build output {} is missing a parent directory",
            output_path.display()
        );
        write_artifact(&artifacts.join("build-preflight-error.txt"), &message);
        panic!("{message}");
    };
    if !parent.exists() {
        let message = format!(
            "route-free proof build requires a pre-created temp output parent {}; refusing to build {} in place",
            parent.display(),
            package_dir.display()
        );
        write_artifact(&artifacts.join("build-preflight-error.txt"), &message);
        panic!("{message}");
    }
    if output_path.starts_with(package_dir) {
        let message = format!(
            "route-free proof build output {} must stay outside package dir {} to avoid churning tracked binaries",
            output_path.display(),
            package_dir.display()
        );
        write_artifact(&artifacts.join("build-preflight-error.txt"), &message);
        panic!("{message}");
    }

    ensure_mesh_rt_staticlib();

    let output = Command::new(meshc_bin())
        .current_dir(repo_root())
        .arg("build")
        .arg(package_dir)
        .arg("--output")
        .arg(output_path)
        .output()
        .unwrap_or_else(|error| {
            panic!(
                "failed to invoke meshc build {} --output {}: {error}",
                package_dir.display(),
                output_path.display()
            )
        });
    write_artifact(&artifacts.join("build.log"), command_output_text(&output));
    assert!(
        output.status.success(),
        "meshc build {} --output {} should succeed:\n{}",
        package_dir.display(),
        output_path.display(),
        command_output_text(&output)
    );
    assert!(
        output_path.exists(),
        "meshc build {} reported success but temp binary is missing at {}",
        package_dir.display(),
        output_path.display()
    );

    let metadata = BuildOutputMetadata {
        source_package_dir: package_dir.to_path_buf(),
        binary_path: output_path.to_path_buf(),
    };
    write_json_artifact(&artifacts.join("build-meta.json"), &metadata);
    metadata
}

pub fn read_required_build_metadata(artifacts: &Path) -> Result<BuildOutputMetadata, String> {
    let path = artifacts.join("build-meta.json");
    let raw = fs::read_to_string(&path)
        .map_err(|error| format!("missing temp output metadata {}: {error}", path.display()))?;
    let metadata = serde_json::from_str::<BuildOutputMetadata>(&raw).map_err(|error| {
        format!(
            "temp output metadata {} is malformed JSON: {error}",
            path.display()
        )
    })?;

    if metadata.source_package_dir.as_os_str().is_empty() {
        return Err(format!(
            "temp output metadata {} is missing source_package_dir",
            path.display()
        ));
    }
    if metadata.binary_path.as_os_str().is_empty() {
        return Err(format!(
            "temp output metadata {} is missing binary_path",
            path.display()
        ));
    }
    if !metadata.binary_path.exists() {
        return Err(format!(
            "temp output metadata {} points to missing binary {}",
            path.display(),
            metadata.binary_path.display()
        ));
    }

    Ok(metadata)
}

pub fn run_package_tests(package_tests_dir: &Path, artifacts: &Path, log_name: &str) {
    let output = Command::new(meshc_bin())
        .current_dir(repo_root())
        .arg("test")
        .arg(package_tests_dir)
        .output()
        .unwrap_or_else(|error| {
            panic!(
                "failed to invoke meshc test {}: {error}",
                package_tests_dir.display()
            )
        });
    write_artifact(
        &artifacts.join(format!("{log_name}.log")),
        command_output_text(&output),
    );
    assert!(
        output.status.success(),
        "meshc test {} should succeed:\n{}",
        package_tests_dir.display(),
        command_output_text(&output)
    );
}

pub fn spawn_route_free_runtime(
    binary_path: &Path,
    current_dir: &Path,
    artifacts: &Path,
    log_label: &str,
    node_name: &str,
    cluster_port: u16,
    cluster_role: &str,
    promotion_epoch: u64,
    cookie: &str,
    discovery_seed: &str,
) -> SpawnedProcess {
    let stdout_path = artifacts.join(format!("{log_label}.stdout.log"));
    let stderr_path = artifacts.join(format!("{log_label}.stderr.log"));
    let stdout = File::create(&stdout_path).expect("failed to create runtime stdout log");
    let stderr = File::create(&stderr_path).expect("failed to create runtime stderr log");

    let mut command = Command::new(binary_path);
    command
        .current_dir(current_dir)
        .env("MESH_CLUSTER_COOKIE", cookie)
        .env("MESH_NODE_NAME", node_name)
        .env("MESH_DISCOVERY_SEED", discovery_seed)
        .env("MESH_CLUSTER_PORT", cluster_port.to_string())
        .env("MESH_CONTINUITY_ROLE", cluster_role)
        .env(
            "MESH_CONTINUITY_PROMOTION_EPOCH",
            promotion_epoch.to_string(),
        )
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr));

    let child = command.spawn().unwrap_or_else(|error| {
        panic!(
            "failed to start route-free runtime binary {} (node={}): {error}",
            binary_path.display(),
            node_name,
        )
    });

    SpawnedProcess {
        child,
        stdout_path,
        stderr_path,
    }
}

pub fn stop_process(mut spawned: SpawnedProcess) -> StoppedProcess {
    let _ = spawned.child.kill();
    let _ = spawned.child.wait();

    let stdout = fs::read_to_string(&spawned.stdout_path)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", spawned.stdout_path.display()));
    let stderr = fs::read_to_string(&spawned.stderr_path)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", spawned.stderr_path.display()));
    let combined = format!("{stdout}{stderr}");

    StoppedProcess {
        stdout,
        stderr,
        combined,
    }
}

pub fn run_meshc_cluster(artifacts: &Path, name: &str, args: &[&str], cookie: &str) -> Output {
    let output = Command::new(meshc_bin())
        .current_dir(repo_root())
        .env("MESH_CLUSTER_COOKIE", cookie)
        .args(args)
        .output()
        .unwrap_or_else(|error| panic!("failed to run meshc {:?}: {error}", args));
    write_artifact(
        &artifacts.join(format!("{name}.log")),
        command_output_text(&output),
    );
    output
}

pub fn parse_json_stdout(stdout: &[u8], context: &str) -> Result<Value, String> {
    serde_json::from_slice::<Value>(stdout)
        .map_err(|error| format!("{context} returned invalid JSON: {error}"))
}

pub fn parse_json_output(artifacts: &Path, name: &str, output: &Output, context: &str) -> Value {
    let json = parse_json_stdout(&output.stdout, context)
        .unwrap_or_else(|error| panic!("{error}\n{}", String::from_utf8_lossy(&output.stdout)));
    write_json_artifact(&artifacts.join(format!("{name}.json")), &json);
    json
}

pub fn required_str(json: &Value, field: &str) -> String {
    json[field]
        .as_str()
        .unwrap_or_else(|| panic!("missing string field `{field}` in {json}"))
        .to_string()
}

pub fn required_bool(json: &Value, field: &str) -> bool {
    json[field]
        .as_bool()
        .unwrap_or_else(|| panic!("missing bool field `{field}` in {json}"))
}

pub fn required_u64(json: &Value, field: &str) -> u64 {
    json[field]
        .as_u64()
        .unwrap_or_else(|| panic!("missing u64 field `{field}` in {json}"))
}

pub fn required_string_list(json: &Value, field: &str) -> Vec<String> {
    json[field]
        .as_array()
        .unwrap_or_else(|| panic!("missing array field `{field}` in {json}"))
        .iter()
        .map(|value| {
            value
                .as_str()
                .unwrap_or_else(|| panic!("non-string entry in `{field}`: {json}"))
                .to_string()
        })
        .collect()
}

pub fn sorted(values: &[String]) -> Vec<String> {
    let mut copy = values.to_vec();
    copy.sort();
    copy
}

pub fn find_record_for_runtime_name<'a>(
    list_json: &'a Value,
    runtime_name: &str,
) -> Option<&'a Value> {
    let records = list_json["records"]
        .as_array()
        .unwrap_or_else(|| panic!("missing continuity records array in {list_json}"));

    let mut matches = records.iter().filter(|record| {
        record["declared_handler_runtime_name"]
            .as_str()
            .unwrap_or_else(|| {
                panic!(
                    "continuity record missing string field `declared_handler_runtime_name` in {record}"
                )
            })
            == runtime_name
    });
    let first = matches.next();
    assert!(
        matches.next().is_none(),
        "duplicate continuity records for runtime name {runtime_name} in {list_json}"
    );
    first
}

pub fn record_for_runtime_name<'a>(list_json: &'a Value, runtime_name: &str) -> &'a Value {
    find_record_for_runtime_name(list_json, runtime_name)
        .unwrap_or_else(|| panic!("missing runtime name {runtime_name} in {list_json}"))
}

pub fn count_records_for_runtime_name(list_json: &Value, runtime_name: &str) -> usize {
    list_json["records"]
        .as_array()
        .unwrap_or_else(|| panic!("missing continuity records array in {list_json}"))
        .iter()
        .filter(|record| {
            record["declared_handler_runtime_name"]
                .as_str()
                .unwrap_or_else(|| {
                    panic!(
                        "continuity record missing string field `declared_handler_runtime_name` in {record}"
                    )
                })
                == runtime_name
        })
        .count()
}

pub fn find_record_for_request_key<'a>(
    list_json: &'a Value,
    request_key: &str,
) -> Option<&'a Value> {
    let records = list_json["records"]
        .as_array()
        .unwrap_or_else(|| panic!("missing continuity records array in {list_json}"));

    let mut matches = records
        .iter()
        .filter(|record| required_str(record, "request_key") == request_key);
    let first = matches.next();
    assert!(
        matches.next().is_none(),
        "duplicate continuity records for request key {request_key} in {list_json}"
    );
    first
}

pub fn record_for_request_key<'a>(list_json: &'a Value, request_key: &str) -> &'a Value {
    find_record_for_request_key(list_json, request_key)
        .unwrap_or_else(|| panic!("missing request key {request_key} in {list_json}"))
}

pub fn request_keys_for_runtime_name(list_json: &Value, runtime_name: &str) -> Vec<String> {
    list_json["records"]
        .as_array()
        .unwrap_or_else(|| panic!("missing continuity records array in {list_json}"))
        .iter()
        .filter(|record| required_str(record, "declared_handler_runtime_name") == runtime_name)
        .map(|record| required_str(record, "request_key"))
        .collect()
}

pub fn new_request_keys_for_runtime_name(
    before_list_json: &Value,
    after_list_json: &Value,
    runtime_name: &str,
) -> Vec<String> {
    let before: HashSet<String> = request_keys_for_runtime_name(before_list_json, runtime_name)
        .into_iter()
        .collect();
    let mut new_keys: Vec<String> = request_keys_for_runtime_name(after_list_json, runtime_name)
        .into_iter()
        .filter(|request_key| !before.contains(request_key))
        .collect();
    new_keys.sort();
    new_keys
}

pub fn request_keys_for_runtime_name_and_replication_count(
    list_json: &Value,
    runtime_name: &str,
    replication_count: u64,
) -> Vec<String> {
    list_json["records"]
        .as_array()
        .unwrap_or_else(|| panic!("missing continuity records array in {list_json}"))
        .iter()
        .filter_map(|record| {
            if required_str(record, "declared_handler_runtime_name") != runtime_name {
                return None;
            }
            if required_u64(record, "replication_count") != replication_count {
                return None;
            }
            let request_key = required_str(record, "request_key");
            assert!(
                !request_key.is_empty(),
                "continuity record for runtime {runtime_name} and replication_count={replication_count} is missing a request key in {record}"
            );
            Some(request_key)
        })
        .collect()
}

pub fn new_request_keys_for_runtime_name_and_replication_count(
    before_list_json: &Value,
    after_list_json: &Value,
    runtime_name: &str,
    replication_count: u64,
) -> Vec<String> {
    let before: HashSet<String> = request_keys_for_runtime_name_and_replication_count(
        before_list_json,
        runtime_name,
        replication_count,
    )
    .into_iter()
    .collect();
    let mut new_keys: Vec<String> = request_keys_for_runtime_name_and_replication_count(
        after_list_json,
        runtime_name,
        replication_count,
    )
    .into_iter()
    .filter(|request_key| !before.contains(request_key))
    .collect();
    new_keys.sort();
    new_keys
}

pub fn wait_for_new_request_key_for_runtime_name_and_replication_count(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    before_list_json: &Value,
    runtime_name: &str,
    replication_count: u64,
    cookie: &str,
) -> (Value, String) {
    let after_snapshot = wait_for_continuity_list_matching(
        artifacts,
        name,
        node_name,
        &format!(
            "a new continuity request key for {runtime_name} with replication_count={replication_count}"
        ),
        cookie,
        |json| {
            new_request_keys_for_runtime_name_and_replication_count(
                before_list_json,
                json,
                runtime_name,
                replication_count,
            )
            .len()
                == 1
        },
    );

    let new_keys = new_request_keys_for_runtime_name_and_replication_count(
        before_list_json,
        &after_snapshot,
        runtime_name,
        replication_count,
    );
    assert_eq!(
        new_keys.len(),
        1,
        "expected exactly one new request key for runtime {runtime_name} with replication_count={replication_count}, got {:?} in {}",
        new_keys,
        after_snapshot
    );

    let request_key = new_keys[0].clone();
    let record = record_for_request_key(&after_snapshot, &request_key);
    assert_eq!(
        required_str(record, "declared_handler_runtime_name"),
        runtime_name,
        "continuity diff matched the wrong runtime in {}",
        after_snapshot
    );
    assert_eq!(
        required_u64(record, "replication_count"),
        replication_count,
        "continuity diff matched the wrong replication count in {}",
        after_snapshot
    );

    (after_snapshot, request_key)
}

pub fn diagnostic_entries_for_request<'a>(
    snapshot: &'a Value,
    request_key: &str,
) -> Vec<&'a Value> {
    snapshot["entries"]
        .as_array()
        .unwrap_or_else(|| panic!("missing diagnostics entries array in {snapshot}"))
        .iter()
        .filter(|entry| entry["request_key"].as_str() == Some(request_key))
        .collect()
}

fn write_timeout_artifact(artifacts: &Path, name: &str, last_observation: &str) -> PathBuf {
    let timeout_path = artifacts.join(format!("{name}.timeout.txt"));
    write_artifact(&timeout_path, last_observation);
    timeout_path
}

pub fn wait_for_cluster_status_matching<F>(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    predicate_description: &str,
    cookie: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < STATUS_TIMEOUT {
        let output = run_meshc_cluster(
            artifacts,
            name,
            &["cluster", "status", node_name, "--json"],
            cookie,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json = parse_json_output(artifacts, name, &output, "cluster status");
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(150));
    }

    let timeout_path = write_timeout_artifact(artifacts, name, &last_observation);
    panic!(
        "meshc cluster status {node_name} never satisfied {predicate_description}; last observation archived at {}",
        timeout_path.display(),
    );
}

pub fn wait_for_continuity_list_matching<F>(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    predicate_description: &str,
    cookie: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < CONTINUITY_TIMEOUT {
        let output = run_meshc_cluster(
            artifacts,
            name,
            &["cluster", "continuity", node_name, "--json"],
            cookie,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json = parse_json_output(artifacts, name, &output, "cluster continuity list");
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(150));
    }

    let timeout_path = write_timeout_artifact(artifacts, name, &last_observation);
    panic!(
        "meshc cluster continuity {node_name} never satisfied {predicate_description}; last observation archived at {}",
        timeout_path.display(),
    );
}

pub fn wait_for_continuity_record_matching<F>(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    request_key: &str,
    predicate_description: &str,
    cookie: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < CONTINUITY_TIMEOUT {
        let output = run_meshc_cluster(
            artifacts,
            name,
            &["cluster", "continuity", node_name, request_key, "--json"],
            cookie,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json =
                parse_json_output(artifacts, name, &output, "cluster continuity single record");
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(125));
    }

    let timeout_path = write_timeout_artifact(artifacts, name, &last_observation);
    panic!(
        "meshc cluster continuity {node_name} {request_key} never satisfied {predicate_description}; last observation archived at {}",
        timeout_path.display(),
    );
}

pub fn wait_for_diagnostics_matching<F>(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    predicate_description: &str,
    cookie: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < DIAGNOSTIC_TIMEOUT {
        let output = run_meshc_cluster(
            artifacts,
            name,
            &["cluster", "diagnostics", node_name, "--json"],
            cookie,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json = parse_json_output(artifacts, name, &output, "cluster diagnostics");
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(125));
    }

    let timeout_path = write_timeout_artifact(artifacts, name, &last_observation);
    panic!(
        "meshc cluster diagnostics {node_name} never satisfied {predicate_description}; last observation archived at {}",
        timeout_path.display(),
    );
}

pub fn wait_for_cluster_status_membership(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    expected_peer_nodes: &[String],
    expected_nodes: &[String],
    expected_role: &str,
    expected_epoch: u64,
    allowed_health: &[&str],
    cookie: &str,
) -> Value {
    wait_for_cluster_status_matching(
        artifacts,
        name,
        node_name,
        "cluster membership convergence",
        cookie,
        |json| {
            let replication_health = required_str(&json["authority"], "replication_health");
            required_str(&json["membership"], "local_node") == node_name
                && sorted(&required_string_list(&json["membership"], "peer_nodes"))
                    == sorted(expected_peer_nodes)
                && sorted(&required_string_list(&json["membership"], "nodes"))
                    == sorted(expected_nodes)
                && required_str(&json["authority"], "cluster_role") == expected_role
                && required_u64(&json["authority"], "promotion_epoch") == expected_epoch
                && allowed_health.contains(&replication_health.as_str())
        },
    )
}

pub fn wait_for_runtime_name_discovered_with_label(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    runtime_name: &str,
    cookie: &str,
) -> Value {
    wait_for_continuity_list_matching(
        artifacts,
        name,
        node_name,
        &format!("runtime discovery for {runtime_name}"),
        cookie,
        |json| {
            let Some(record) = find_record_for_runtime_name(json, runtime_name) else {
                return false;
            };
            !required_str(record, "request_key").is_empty()
        },
    )
}

pub fn wait_for_continuity_record_completed(
    artifacts: &Path,
    name: &str,
    node_name: &str,
    request_key: &str,
    expected_runtime_name: &str,
    cookie: &str,
) -> Value {
    wait_for_continuity_record_matching(
        artifacts,
        name,
        node_name,
        request_key,
        &format!("completed continuity record for {expected_runtime_name}"),
        cookie,
        |json| {
            let record = &json["record"];
            required_str(record, "request_key") == request_key
                && required_str(record, "declared_handler_runtime_name") == expected_runtime_name
                && required_str(record, "phase") == "completed"
                && required_str(record, "result") == "succeeded"
        },
    )
}

pub fn wait_for_startup_diagnostics(
    artifacts: &Path,
    primary_node: &str,
    standby_node: &str,
    request_key: &str,
    cookie: &str,
) -> (Value, Value) {
    let start = Instant::now();
    let mut last_primary = String::new();
    let mut last_standby = String::new();

    while start.elapsed() < DIAGNOSTIC_TIMEOUT {
        let primary_output = run_meshc_cluster(
            artifacts,
            "cluster-diagnostics-primary",
            &["cluster", "diagnostics", primary_node, "--json"],
            cookie,
        );
        let standby_output = run_meshc_cluster(
            artifacts,
            "cluster-diagnostics-standby",
            &["cluster", "diagnostics", standby_node, "--json"],
            cookie,
        );
        last_primary = command_output_text(&primary_output);
        last_standby = command_output_text(&standby_output);
        if primary_output.status.success() && standby_output.status.success() {
            let primary_json = parse_json_output(
                artifacts,
                "cluster-diagnostics-primary",
                &primary_output,
                "cluster diagnostics",
            );
            let standby_json = parse_json_output(
                artifacts,
                "cluster-diagnostics-standby",
                &standby_output,
                "cluster diagnostics",
            );
            last_primary = serde_json::to_string_pretty(&primary_json).unwrap();
            last_standby = serde_json::to_string_pretty(&standby_json).unwrap();

            let primary_entries = diagnostic_entries_for_request(&primary_json, request_key);
            let standby_entries = diagnostic_entries_for_request(&standby_json, request_key);
            let combined_transitions: Vec<_> = primary_entries
                .iter()
                .chain(standby_entries.iter())
                .filter_map(|entry| entry["transition"].as_str())
                .collect();
            let has_trigger = combined_transitions.contains(&"startup_trigger");
            let has_dispatch_window = combined_transitions.contains(&"startup_dispatch_window");
            let has_completed = combined_transitions.contains(&"startup_completed");
            let has_failure = combined_transitions.contains(&"startup_rejected")
                || combined_transitions.contains(&"startup_convergence_timeout");
            if has_trigger && has_dispatch_window && has_completed && !has_failure {
                return (primary_json, standby_json);
            }
        }
        sleep(Duration::from_millis(200));
    }

    let timeout_path = artifacts.join("cluster-diagnostics.timeout.txt");
    write_artifact(
        &timeout_path,
        format!("last primary:\n{last_primary}\n\nlast standby:\n{last_standby}\n"),
    );
    panic!(
        "meshc cluster diagnostics did not surface startup truth for {request_key}; last observations archived at {}",
        timeout_path.display(),
    );
}

pub fn assert_log_contains(logs: &StoppedProcess, needle: &str) {
    assert!(
        logs.combined.contains(needle),
        "expected log `{needle}`\nstdout:\n{}\nstderr:\n{}",
        logs.stdout,
        logs.stderr,
    );
}

pub fn assert_log_absent(logs: &StoppedProcess, needle: &str) {
    assert!(
        !logs.combined.contains(needle),
        "did not expect log `{needle}`\nstdout:\n{}\nstderr:\n{}",
        logs.stdout,
        logs.stderr,
    );
}
