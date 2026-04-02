use super::m046_route_free as route_free;
use serde_json::Value;
use std::collections::BTreeSet;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Output, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant};

pub const TODO_STARTUP_HANDLER: &str = "@cluster pub fn sync_todos()";
pub const TODO_RUNTIME_HANDLER: &str = "Work.sync_todos";
pub const TODO_LIST_ROUTE_RUNTIME_HANDLER: &str = "Api.Todos.handle_list_todos";
pub const TODO_FIXTURE_ROOT_RELATIVE: &str = "scripts/fixtures/m047-s05-clustered-todo";
pub const TODO_FIXTURE_PACKAGE_NAME: &str = "todo-starter";
pub const TODO_FIXTURE_REQUIRED_FILES: &[&str] = &[
    ".dockerignore",
    "Dockerfile",
    "README.md",
    "api/health.mpl",
    "api/router.mpl",
    "api/todos.mpl",
    "main.mpl",
    "mesh.toml",
    "runtime/registry.mpl",
    "services/rate_limiter.mpl",
    "storage/todos.mpl",
    "types/todo.mpl",
    "work.mpl",
];
pub const DOCKER_BUILD_TIMEOUT: Duration = Duration::from_secs(1_800);
pub const DOCKER_PHASE_TIMEOUT: Duration = Duration::from_secs(45);
const TODO_CONTAINER_PORT: u16 = 8080;
const TODO_DOCKER_BUILDER_IMAGE_TAG: &str = "mesh-m047-s05-todo-output-builder:local";

#[derive(Debug, Clone)]
pub struct TodoAppConfig {
    pub http_port: u16,
    pub db_path: PathBuf,
    pub rate_limit_window_seconds: u64,
    pub rate_limit_max_requests: u64,
}

#[derive(Debug, Clone)]
pub struct TodoClusterRuntimeConfig {
    pub cookie: String,
    pub node_name: String,
    pub discovery_seed: String,
    pub cluster_port: u16,
    pub cluster_role: String,
    pub promotion_epoch: u64,
}

#[derive(Debug, Clone)]
pub struct HttpResponse {
    pub status_code: u16,
    pub body: String,
    pub raw: String,
}

#[derive(Debug, Clone)]
pub struct TodoDockerClusterConfig {
    pub runtime: TodoClusterRuntimeConfig,
    pub publish_cluster_port: bool,
}

#[derive(Debug, Clone)]
pub struct TodoDockerContainerConfig {
    pub container_name: String,
    pub host_data_dir: PathBuf,
    pub container_data_dir: PathBuf,
    pub db_path: PathBuf,
    pub rate_limit_window_seconds: u64,
    pub rate_limit_max_requests: u64,
    pub publish_http: bool,
    pub cluster: Option<TodoDockerClusterConfig>,
}

pub struct StartedTodoContainer {
    pub container_name: String,
    attach_child: Child,
    pub stdout_path: PathBuf,
    pub stderr_path: PathBuf,
}

pub struct StoppedTodoContainer {
    pub stdout: String,
    pub stderr: String,
    pub combined: String,
    pub stdout_path: PathBuf,
    pub stderr_path: PathBuf,
}

pub fn repo_root() -> PathBuf {
    route_free::repo_root()
}

pub fn meshc_bin() -> PathBuf {
    route_free::meshc_bin()
}

pub fn artifact_dir(test_name: &str) -> PathBuf {
    route_free::artifact_dir("m047-s05", test_name)
}

pub fn ensure_mesh_rt_staticlib() {
    route_free::ensure_mesh_rt_staticlib();
}

pub fn command_output_text(output: &Output) -> String {
    route_free::command_output_text(output)
}

pub fn write_artifact(path: &Path, contents: impl AsRef<str>) {
    route_free::write_artifact(path, contents.as_ref());
}

pub fn write_json_artifact(path: &Path, value: &impl serde::Serialize) {
    route_free::write_json_artifact(path, value);
}

pub fn read_and_archive(source_path: &Path, artifact_path: &Path) -> String {
    route_free::read_and_archive(source_path, artifact_path)
}

pub fn archive_directory_tree(source_dir: &Path, artifact_dir: &Path) {
    route_free::archive_directory_tree(source_dir, artifact_dir)
}

pub fn archive_file(source_path: &Path, artifact_path: &Path) {
    if let Some(parent) = artifact_path.parent() {
        fs::create_dir_all(parent).unwrap_or_else(|error| {
            panic!(
                "failed to create archive parent {}: {error}",
                parent.display()
            )
        });
    }
    fs::copy(source_path, artifact_path).unwrap_or_else(|error| {
        panic!(
            "failed to archive {} -> {}: {error}",
            source_path.display(),
            artifact_path.display()
        )
    });
}

pub fn assert_valid_cluster_runtime_config(config: &TodoClusterRuntimeConfig) {
    assert!(
        !config.cookie.trim().is_empty(),
        "MESH_CLUSTER_COOKIE is required for clustered todo runtime helpers"
    );
    assert!(
        !config.node_name.trim().is_empty(),
        "MESH_NODE_NAME is required for clustered todo runtime helpers"
    );
    assert!(
        !config.discovery_seed.trim().is_empty(),
        "MESH_DISCOVERY_SEED is required for clustered todo runtime helpers"
    );
    assert!(
        config.cluster_port > 0,
        "MESH_CLUSTER_PORT must be a positive port for clustered todo runtime helpers"
    );
    assert!(
        !config.cluster_role.trim().is_empty(),
        "MESH_CONTINUITY_ROLE is required for clustered todo runtime helpers"
    );
}

fn apply_cluster_runtime_env(command: &mut Command, config: &TodoClusterRuntimeConfig) {
    assert_valid_cluster_runtime_config(config);
    command
        .env("MESH_CLUSTER_COOKIE", &config.cookie)
        .env("MESH_NODE_NAME", &config.node_name)
        .env("MESH_DISCOVERY_SEED", &config.discovery_seed)
        .env("MESH_CLUSTER_PORT", config.cluster_port.to_string())
        .env("MESH_CONTINUITY_ROLE", &config.cluster_role)
        .env(
            "MESH_CONTINUITY_PROMOTION_EPOCH",
            config.promotion_epoch.to_string(),
        );
}

fn apply_cluster_runtime_docker_env_args(command: &mut Command, config: &TodoClusterRuntimeConfig) {
    assert_valid_cluster_runtime_config(config);
    command
        .arg("-e")
        .arg(format!("MESH_CLUSTER_COOKIE={}", config.cookie))
        .arg("-e")
        .arg(format!("MESH_NODE_NAME={}", config.node_name))
        .arg("-e")
        .arg(format!("MESH_DISCOVERY_SEED={}", config.discovery_seed))
        .arg("-e")
        .arg(format!("MESH_CLUSTER_PORT={}", config.cluster_port))
        .arg("-e")
        .arg(format!("MESH_CONTINUITY_ROLE={}", config.cluster_role))
        .arg("-e")
        .arg(format!(
            "MESH_CONTINUITY_PROMOTION_EPOCH={}",
            config.promotion_epoch
        ));
}

pub fn unused_port() -> u16 {
    TcpListener::bind((route_free::LOOPBACK_V4, 0))
        .expect("failed to bind ephemeral port")
        .local_addr()
        .expect("failed to read ephemeral port")
        .port()
}

pub fn todo_fixture_root() -> PathBuf {
    repo_root().join(TODO_FIXTURE_ROOT_RELATIVE)
}

fn normalize_relative_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn fail_fixture_init(artifacts: &Path, message: impl Into<String>) -> ! {
    let message = message.into();
    write_artifact(&artifacts.join("init.error.txt"), &message);
    panic!("{message}");
}

fn collect_relative_file_set(
    root: &Path,
    current_dir: &Path,
    files: &mut BTreeSet<String>,
) -> Result<(), String> {
    let entries = fs::read_dir(current_dir).map_err(|error| {
        format!(
            "failed to read fixture directory {}: {error}",
            current_dir.display()
        )
    })?;

    for entry in entries {
        let entry = entry.map_err(|error| {
            format!(
                "failed to iterate fixture directory {}: {error}",
                current_dir.display()
            )
        })?;
        let path = entry.path();
        if path.is_dir() {
            collect_relative_file_set(root, &path, files)?;
        } else if path.is_file() {
            let relative = path.strip_prefix(root).map_err(|error| {
                format!(
                    "failed to strip fixture root {} from {}: {error}",
                    root.display(),
                    path.display()
                )
            })?;
            files.insert(normalize_relative_path(relative));
        } else {
            return Err(format!(
                "fixture path {} is neither a file nor a directory",
                path.display()
            ));
        }
    }

    Ok(())
}

fn fixture_file_set(root: &Path) -> Result<BTreeSet<String>, String> {
    if !root.is_dir() {
        return Err(format!(
            "todo scaffold fixture root {} is missing",
            root.display()
        ));
    }

    let mut files = BTreeSet::new();
    collect_relative_file_set(root, root, &mut files)?;
    Ok(files)
}

fn validate_todo_fixture_tree(root: &Path) -> Result<BTreeSet<String>, String> {
    let actual_files = fixture_file_set(root)?;
    let expected_files = TODO_FIXTURE_REQUIRED_FILES
        .iter()
        .map(|path| (*path).to_string())
        .collect::<BTreeSet<_>>();
    let missing_files = expected_files
        .difference(&actual_files)
        .cloned()
        .collect::<Vec<_>>();
    if !missing_files.is_empty() {
        return Err(format!(
            "todo scaffold fixture {} is missing required files: {}",
            root.display(),
            missing_files.join(", ")
        ));
    }
    Ok(actual_files)
}

fn copy_directory_tree(source_dir: &Path, dest_dir: &Path) -> Result<(), String> {
    fs::create_dir_all(dest_dir).map_err(|error| {
        format!(
            "failed to create fixture destination {}: {error}",
            dest_dir.display()
        )
    })?;

    let entries = fs::read_dir(source_dir).map_err(|error| {
        format!(
            "failed to read fixture source {}: {error}",
            source_dir.display()
        )
    })?;
    for entry in entries {
        let entry = entry.map_err(|error| {
            format!(
                "failed to iterate fixture source {}: {error}",
                source_dir.display()
            )
        })?;
        let source_path = entry.path();
        let dest_path = dest_dir.join(entry.file_name());
        if source_path.is_dir() {
            copy_directory_tree(&source_path, &dest_path)?;
        } else if source_path.is_file() {
            fs::copy(&source_path, &dest_path).map_err(|error| {
                format!(
                    "failed to copy fixture file {} -> {}: {error}",
                    source_path.display(),
                    dest_path.display()
                )
            })?;
        } else {
            return Err(format!(
                "fixture source path {} is neither a file nor a directory",
                source_path.display()
            ));
        }
    }

    Ok(())
}

pub fn init_todo_project_from_fixture_root(
    fixture_root: &Path,
    workspace_dir: &Path,
    project_name: &str,
    artifacts: &Path,
) -> PathBuf {
    if project_name != TODO_FIXTURE_PACKAGE_NAME {
        fail_fixture_init(
            artifacts,
            format!(
                "historical M047 todo fixture only supports project name {TODO_FIXTURE_PACKAGE_NAME:?}; requested {project_name:?}"
            ),
        );
    }

    let fixture_files = validate_todo_fixture_tree(fixture_root)
        .unwrap_or_else(|message| fail_fixture_init(artifacts, message));

    let project_dir = workspace_dir.join(project_name);
    if project_dir.exists() {
        fail_fixture_init(
            artifacts,
            format!(
                "fixture-backed todo init target {} already exists",
                project_dir.display()
            ),
        );
    }

    if let Err(message) = copy_directory_tree(fixture_root, &project_dir) {
        let _ = fs::remove_dir_all(&project_dir);
        fail_fixture_init(artifacts, message);
    }

    let copied_files = fixture_file_set(&project_dir).unwrap_or_else(|message| {
        let _ = fs::remove_dir_all(&project_dir);
        fail_fixture_init(artifacts, message)
    });
    if copied_files != fixture_files {
        let missing_files = fixture_files
            .difference(&copied_files)
            .cloned()
            .collect::<Vec<_>>();
        let extra_files = copied_files
            .difference(&fixture_files)
            .cloned()
            .collect::<Vec<_>>();
        let _ = fs::remove_dir_all(&project_dir);
        fail_fixture_init(
            artifacts,
            format!(
                "fixture-backed todo copy into {} was malformed; missing: [{}] extra: [{}]",
                project_dir.display(),
                missing_files.join(", "),
                extra_files.join(", "),
            ),
        );
    }

    let init_log = format!(
        "source=fixture-copy\nfixture_root_relative={TODO_FIXTURE_ROOT_RELATIVE}\nfixture_root={}\nproject_name={project_name}\nproject_dir={}\nfile_count={}\nfiles:\n{}\n",
        fixture_root.display(),
        project_dir.display(),
        copied_files.len(),
        copied_files
            .iter()
            .map(|path| format!("- {path}"))
            .collect::<Vec<_>>()
            .join("\n")
    );
    write_artifact(&artifacts.join("init.log"), init_log);
    archive_directory_tree(&project_dir, &artifacts.join("generated-project"));
    project_dir
}

pub fn init_todo_project(workspace_dir: &Path, project_name: &str, artifacts: &Path) -> PathBuf {
    init_todo_project_from_fixture_root(
        &todo_fixture_root(),
        workspace_dir,
        project_name,
        artifacts,
    )
}

pub fn build_todo_binary(project_dir: &Path, artifacts: &Path) -> PathBuf {
    ensure_mesh_rt_staticlib();
    let binary_dir = artifacts.join("bin");
    fs::create_dir_all(&binary_dir)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", binary_dir.display()));
    let binary_path = binary_dir.join(
        project_dir
            .file_name()
            .unwrap_or_else(|| panic!("missing package dir name for {}", project_dir.display())),
    );
    route_free::build_package_binary_to_output(project_dir, &binary_path, artifacts);
    binary_path
}

fn spawn_todo_app_with_optional_cluster(
    binary_path: &Path,
    current_dir: &Path,
    artifacts: &Path,
    log_label: &str,
    config: &TodoAppConfig,
    cluster: Option<&TodoClusterRuntimeConfig>,
) -> route_free::SpawnedProcess {
    let stdout_path = artifacts.join(format!("{log_label}.stdout.log"));
    let stderr_path = artifacts.join(format!("{log_label}.stderr.log"));
    let stdout = File::create(&stdout_path).expect("failed to create todo stdout log");
    let stderr = File::create(&stderr_path).expect("failed to create todo stderr log");

    let mut command = Command::new(binary_path);
    command
        .current_dir(current_dir)
        .env("PORT", config.http_port.to_string())
        .env("TODO_DB_PATH", &config.db_path)
        .env(
            "TODO_RATE_LIMIT_WINDOW_SECONDS",
            config.rate_limit_window_seconds.to_string(),
        )
        .env(
            "TODO_RATE_LIMIT_MAX_REQUESTS",
            config.rate_limit_max_requests.to_string(),
        )
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr));

    if let Some(cluster) = cluster {
        apply_cluster_runtime_env(&mut command, cluster);
    }

    let child = command.spawn().unwrap_or_else(|error| {
        panic!(
            "failed to start todo scaffold binary {}: {error}",
            binary_path.display()
        )
    });

    route_free::SpawnedProcess {
        child,
        stdout_path,
        stderr_path,
    }
}

pub fn spawn_todo_app(
    binary_path: &Path,
    current_dir: &Path,
    artifacts: &Path,
    log_label: &str,
    config: &TodoAppConfig,
) -> route_free::SpawnedProcess {
    spawn_todo_app_with_optional_cluster(
        binary_path,
        current_dir,
        artifacts,
        log_label,
        config,
        None,
    )
}

pub fn spawn_todo_app_clustered(
    binary_path: &Path,
    current_dir: &Path,
    artifacts: &Path,
    log_label: &str,
    config: &TodoAppConfig,
    cluster: &TodoClusterRuntimeConfig,
) -> route_free::SpawnedProcess {
    spawn_todo_app_with_optional_cluster(
        binary_path,
        current_dir,
        artifacts,
        log_label,
        config,
        Some(cluster),
    )
}

pub fn stop_todo_app(spawned: route_free::SpawnedProcess) -> route_free::StoppedProcess {
    route_free::stop_process(spawned)
}

pub fn send_http_request(
    config: &TodoAppConfig,
    method: &str,
    path: &str,
    body: Option<&str>,
) -> std::io::Result<HttpResponse> {
    let mut stream = TcpStream::connect((route_free::LOOPBACK_V4, config.http_port))?;
    stream.set_read_timeout(Some(Duration::from_secs(10)))?;

    let request = match body {
        Some(body) => format!(
            "{method} {path} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.as_bytes().len(),
            body
        ),
        None => format!(
            "{method} {path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n"
        ),
    };

    stream.write_all(request.as_bytes())?;
    let mut raw = String::new();
    stream.read_to_string(&mut raw)?;

    let mut parts = raw.splitn(2, "\r\n\r\n");
    let headers = parts.next().unwrap_or("");
    let body = parts.next().unwrap_or("").to_string();
    let status_code = headers
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|code| code.parse::<u16>().ok())
        .unwrap_or(0);

    Ok(HttpResponse {
        status_code,
        body,
        raw,
    })
}

pub fn archive_raw_response(artifacts: &Path, name: &str, response: &HttpResponse) -> PathBuf {
    let path = artifacts.join(format!("{name}.http"));
    write_artifact(&path, &response.raw);
    path
}

pub fn parse_json_snapshot(
    artifacts: &Path,
    name: &str,
    response: &HttpResponse,
    context: &str,
) -> Value {
    let raw_path = archive_raw_response(artifacts, name, response);
    match serde_json::from_str::<Value>(&response.body) {
        Ok(json) => {
            let json_path = artifacts.join(format!("{name}.json"));
            write_json_artifact(&json_path, &json);
            json
        }
        Err(error) => {
            let body_path = artifacts.join(format!("{name}.body.txt"));
            write_artifact(&body_path, &response.body);
            panic!(
                "expected JSON body for {context}, got {error}. raw response: {} body artifact: {}",
                raw_path.display(),
                body_path.display()
            );
        }
    }
}

pub fn json_response_snapshot(
    artifacts: &Path,
    name: &str,
    response: &HttpResponse,
    expected_status: u16,
    context: &str,
) -> Value {
    if response.status_code != expected_status {
        let raw_path = archive_raw_response(artifacts, name, response);
        panic!(
            "expected HTTP {expected_status} for {context}, got raw response in {}:\n{}",
            raw_path.display(),
            response.raw
        );
    }
    parse_json_snapshot(artifacts, name, response, context)
}

pub fn assert_json_response(
    response: HttpResponse,
    expected_status: u16,
    description: &str,
) -> Value {
    assert!(
        response.status_code == expected_status,
        "expected HTTP {expected_status} for {description}, got raw response:\n{}",
        response.raw
    );
    serde_json::from_str(&response.body).unwrap_or_else(|error| {
        panic!(
            "expected JSON body for {description}, got parse error {error}: {}",
            response.body
        )
    })
}

pub fn get_json(config: &TodoAppConfig, path: &str, expected_status: u16) -> Value {
    let response = send_http_request(config, "GET", path, None)
        .unwrap_or_else(|error| panic!("GET {path} failed on {}: {error}", config.http_port));
    assert_json_response(response, expected_status, path)
}

pub fn get_json_snapshot(
    config: &TodoAppConfig,
    path: &str,
    expected_status: u16,
    artifacts: &Path,
    name: &str,
) -> Value {
    let response = send_http_request(config, "GET", path, None)
        .unwrap_or_else(|error| panic!("GET {path} failed on {}: {error}", config.http_port));
    json_response_snapshot(artifacts, name, &response, expected_status, path)
}

pub fn post_json(config: &TodoAppConfig, path: &str, body: &str, expected_status: u16) -> Value {
    let response = send_http_request(config, "POST", path, Some(body))
        .unwrap_or_else(|error| panic!("POST {path} failed on {}: {error}", config.http_port));
    assert_json_response(response, expected_status, path)
}

pub fn post_json_snapshot(
    config: &TodoAppConfig,
    path: &str,
    body: &str,
    expected_status: u16,
    artifacts: &Path,
    name: &str,
) -> Value {
    let response = send_http_request(config, "POST", path, Some(body))
        .unwrap_or_else(|error| panic!("POST {path} failed on {}: {error}", config.http_port));
    json_response_snapshot(artifacts, name, &response, expected_status, path)
}

pub fn put_json(config: &TodoAppConfig, path: &str, body: &str, expected_status: u16) -> Value {
    let response = send_http_request(config, "PUT", path, Some(body))
        .unwrap_or_else(|error| panic!("PUT {path} failed on {}: {error}", config.http_port));
    assert_json_response(response, expected_status, path)
}

pub fn put_json_snapshot(
    config: &TodoAppConfig,
    path: &str,
    body: &str,
    expected_status: u16,
    artifacts: &Path,
    name: &str,
) -> Value {
    let response = send_http_request(config, "PUT", path, Some(body))
        .unwrap_or_else(|error| panic!("PUT {path} failed on {}: {error}", config.http_port));
    json_response_snapshot(artifacts, name, &response, expected_status, path)
}

pub fn delete_json(config: &TodoAppConfig, path: &str, expected_status: u16) -> Value {
    let response = send_http_request(config, "DELETE", path, None)
        .unwrap_or_else(|error| panic!("DELETE {path} failed on {}: {error}", config.http_port));
    assert_json_response(response, expected_status, path)
}

pub fn delete_json_snapshot(
    config: &TodoAppConfig,
    path: &str,
    expected_status: u16,
    artifacts: &Path,
    name: &str,
) -> Value {
    let response = send_http_request(config, "DELETE", path, None)
        .unwrap_or_else(|error| panic!("DELETE {path} failed on {}: {error}", config.http_port));
    json_response_snapshot(artifacts, name, &response, expected_status, path)
}

pub fn wait_for_health(config: &TodoAppConfig, artifacts: &Path, label: &str) -> Value {
    wait_for_health_with_timeout(config, artifacts, label, Duration::from_secs(15))
}

pub fn wait_for_health_with_timeout(
    config: &TodoAppConfig,
    artifacts: &Path,
    label: &str,
    timeout: Duration,
) -> Value {
    let start = Instant::now();
    let mut last_response = String::new();

    while start.elapsed() < timeout {
        match send_http_request(config, "GET", "/health", None) {
            Ok(response) if response.status_code == 200 => {
                let json = json_response_snapshot(artifacts, label, &response, 200, "/health");
                if json["status"].as_str() == Some("ok") {
                    return json;
                }
                last_response = serde_json::to_string_pretty(&json).unwrap();
            }
            Ok(response) => last_response = response.raw,
            Err(error) => last_response = format!("connect error: {error}"),
        }

        sleep(Duration::from_millis(250));
    }

    let timeout_path = artifacts.join(format!("{label}.timeout.txt"));
    write_artifact(&timeout_path, &last_response);
    panic!(
        "todo scaffold never reached /health ready state on :{} within {:?}; last observation archived at {}",
        config.http_port,
        timeout,
        timeout_path.display()
    );
}

fn write_cluster_query_timeout_artifact(
    artifacts: &Path,
    label: &str,
    last_observation: &str,
) -> PathBuf {
    let timeout_path = artifacts.join(format!("{label}.timeout.txt"));
    write_artifact(&timeout_path, last_observation);
    timeout_path
}

fn ensure_docker_query_helper_image(artifacts: &Path) {
    let inspect_log = artifacts.join("docker-output-builder-image.inspect.log");
    let inspect = docker_output(
        &["image", "inspect", TODO_DOCKER_BUILDER_IMAGE_TAG],
        "docker image inspect for the todo output builder image",
    );
    write_artifact(&inspect_log, command_output_text(&inspect));
    if inspect.status.success() {
        return;
    }

    let builder_log = artifacts.join("docker-output-builder-image.log");
    let mut builder = Command::new("docker");
    builder.current_dir(repo_root()).args([
        "build",
        "--progress=plain",
        "--target",
        "builder",
        "-f",
        "cluster-proof/Dockerfile",
        "-t",
        TODO_DOCKER_BUILDER_IMAGE_TAG,
        ".",
    ]);
    let builder_status = run_command_with_timeout(
        &mut builder,
        &builder_log,
        DOCKER_BUILD_TIMEOUT,
        "docker build for the linux todo output builder image",
    );
    assert!(
        builder_status.success(),
        "linux todo output builder image should build successfully; inspect {}",
        builder_log.display()
    );
}

fn run_meshc_cluster_query_output(
    artifacts: &Path,
    label: &str,
    args: &[&str],
    cookie: &str,
    operator_container_name: Option<&str>,
) -> Output {
    if let Some(container_name) = operator_container_name {
        ensure_docker_query_helper_image(artifacts);
        let output = Command::new("docker")
            .current_dir(repo_root())
            .arg("run")
            .arg("--rm")
            .arg("--network")
            .arg(format!("container:{container_name}"))
            .arg("-e")
            .arg(format!("MESH_CLUSTER_COOKIE={cookie}"))
            .arg("--entrypoint")
            .arg("/app/target/debug/meshc")
            .arg(TODO_DOCKER_BUILDER_IMAGE_TAG)
            .args(args)
            .output()
            .unwrap_or_else(|error| {
                panic!(
                    "failed to run dockerized meshc {:?} for {}: {error}",
                    args, container_name
                )
            });
        write_artifact(
            &artifacts.join(format!("{label}.log")),
            command_output_text(&output),
        );
        output
    } else {
        route_free::run_meshc_cluster(artifacts, label, args, cookie)
    }
}

fn wait_for_cluster_status_matching<F>(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    operator_container_name: Option<&str>,
    predicate_description: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < route_free::STATUS_TIMEOUT {
        let output = run_meshc_cluster_query_output(
            artifacts,
            label,
            &["cluster", "status", &config.node_name, "--json"],
            &config.cookie,
            operator_container_name,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json = route_free::parse_json_output(artifacts, label, &output, "cluster status");
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(150));
    }

    let timeout_path = write_cluster_query_timeout_artifact(artifacts, label, &last_observation);
    panic!(
        "meshc cluster status {} never satisfied {}; last observation archived at {}",
        config.node_name,
        predicate_description,
        timeout_path.display(),
    );
}

fn wait_for_continuity_list_matching<F>(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    operator_container_name: Option<&str>,
    predicate_description: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < route_free::CONTINUITY_TIMEOUT {
        let output = run_meshc_cluster_query_output(
            artifacts,
            label,
            &["cluster", "continuity", &config.node_name, "--json"],
            &config.cookie,
            operator_container_name,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json =
                route_free::parse_json_output(artifacts, label, &output, "cluster continuity list");
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(150));
    }

    let timeout_path = write_cluster_query_timeout_artifact(artifacts, label, &last_observation);
    panic!(
        "meshc cluster continuity {} never satisfied {}; last observation archived at {}",
        config.node_name,
        predicate_description,
        timeout_path.display(),
    );
}

fn wait_for_continuity_record_matching<F>(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    request_key: &str,
    operator_container_name: Option<&str>,
    predicate_description: &str,
    predicate: F,
) -> Value
where
    F: Fn(&Value) -> bool,
{
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < route_free::CONTINUITY_TIMEOUT {
        let output = run_meshc_cluster_query_output(
            artifacts,
            label,
            &[
                "cluster",
                "continuity",
                &config.node_name,
                request_key,
                "--json",
            ],
            &config.cookie,
            operator_container_name,
        );
        last_observation = command_output_text(&output);
        if output.status.success() {
            let json = route_free::parse_json_output(
                artifacts,
                label,
                &output,
                "cluster continuity single record",
            );
            last_observation = serde_json::to_string_pretty(&json).unwrap();
            if predicate(&json) {
                return json;
            }
        }
        sleep(Duration::from_millis(125));
    }

    let timeout_path = write_cluster_query_timeout_artifact(artifacts, label, &last_observation);
    panic!(
        "meshc cluster continuity {} {} never satisfied {}; last observation archived at {}",
        config.node_name,
        request_key,
        predicate_description,
        timeout_path.display(),
    );
}

pub fn wait_for_single_node_cluster_status(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    operator_container_name: Option<&str>,
) -> Value {
    assert_valid_cluster_runtime_config(config);
    wait_for_cluster_status_matching(
        artifacts,
        label,
        config,
        operator_container_name,
        "cluster membership convergence",
        |json| {
            let replication_health =
                route_free::required_str(&json["authority"], "replication_health");
            route_free::required_str(&json["membership"], "local_node") == config.node_name
                && route_free::sorted(&route_free::required_string_list(
                    &json["membership"],
                    "peer_nodes",
                ))
                .is_empty()
                && route_free::sorted(&route_free::required_string_list(
                    &json["membership"],
                    "nodes",
                )) == route_free::sorted(std::slice::from_ref(&config.node_name))
                && route_free::required_str(&json["authority"], "cluster_role")
                    == config.cluster_role
                && route_free::required_u64(&json["authority"], "promotion_epoch")
                    == config.promotion_epoch
                && replication_health == "local_only"
        },
    )
}

pub fn continuity_list_snapshot(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    operator_container_name: Option<&str>,
) -> Value {
    assert_valid_cluster_runtime_config(config);
    let output = run_meshc_cluster_query_output(
        artifacts,
        label,
        &["cluster", "continuity", &config.node_name, "--json"],
        &config.cookie,
        operator_container_name,
    );
    assert!(
        output.status.success(),
        "cluster continuity list should succeed for {}:\n{}",
        config.node_name,
        command_output_text(&output)
    );
    route_free::parse_json_output(artifacts, label, &output, "cluster continuity list")
}

pub fn wait_for_new_request_key_for_runtime_name(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    before_list_json: &Value,
    runtime_name: &str,
    replication_count: u64,
    operator_container_name: Option<&str>,
) -> (Value, String) {
    assert_valid_cluster_runtime_config(config);
    let after_snapshot = wait_for_continuity_list_matching(
        artifacts,
        label,
        config,
        operator_container_name,
        &format!(
            "a new continuity request key for {runtime_name} with replication_count={replication_count}"
        ),
        |json| {
            route_free::new_request_keys_for_runtime_name_and_replication_count(
                before_list_json,
                json,
                runtime_name,
                replication_count,
            )
            .len()
                == 1
        },
    );

    let new_keys = route_free::new_request_keys_for_runtime_name_and_replication_count(
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
    let record = route_free::record_for_request_key(&after_snapshot, &request_key);
    assert_eq!(
        route_free::required_str(record, "declared_handler_runtime_name"),
        runtime_name,
        "continuity diff matched the wrong runtime in {}",
        after_snapshot
    );
    assert_eq!(
        route_free::required_u64(record, "replication_count"),
        replication_count,
        "continuity diff matched the wrong replication count in {}",
        after_snapshot
    );

    (after_snapshot, request_key)
}

pub fn wait_for_continuity_record_completed(
    artifacts: &Path,
    label: &str,
    config: &TodoClusterRuntimeConfig,
    request_key: &str,
    runtime_name: &str,
    operator_container_name: Option<&str>,
) -> Value {
    assert_valid_cluster_runtime_config(config);
    wait_for_continuity_record_matching(
        artifacts,
        label,
        config,
        request_key,
        operator_container_name,
        &format!("completed continuity record for {runtime_name}"),
        |json| {
            let record = &json["record"];
            route_free::required_str(record, "request_key") == request_key
                && route_free::required_str(record, "declared_handler_runtime_name") == runtime_name
                && route_free::required_str(record, "phase") == "completed"
                && route_free::required_str(record, "result") == "succeeded"
        },
    )
}

fn run_command_with_timeout(
    command: &mut Command,
    log_path: &Path,
    timeout: Duration,
    description: &str,
) -> ExitStatus {
    if let Some(parent) = log_path.parent() {
        fs::create_dir_all(parent)
            .unwrap_or_else(|error| panic!("failed to create {}: {error}", parent.display()));
    }

    let mut log = File::create(log_path)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", log_path.display()));
    writeln!(log, "description: {description}")
        .unwrap_or_else(|error| panic!("failed to write {}: {error}", log_path.display()));
    let stderr_log = log
        .try_clone()
        .unwrap_or_else(|error| panic!("failed to clone {}: {error}", log_path.display()));

    command.stdout(Stdio::from(log));
    command.stderr(Stdio::from(stderr_log));

    let mut child = command
        .spawn()
        .unwrap_or_else(|error| panic!("failed to spawn {description}: {error}"));

    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => return status,
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    panic!(
                        "{description} timed out after {:?}; partial log: {}",
                        timeout,
                        log_path.display()
                    );
                }
                sleep(Duration::from_millis(250));
            }
            Err(error) => panic!("failed to wait on {description}: {error}"),
        }
    }
}

fn docker_output(args: &[&str], description: &str) -> Output {
    Command::new("docker")
        .current_dir(repo_root())
        .args(args)
        .output()
        .unwrap_or_else(|error| panic!("failed to run docker for {description}: {error}"))
}

fn build_linux_output_for_docker(project_dir: &Path, artifacts: &Path) {
    let output_path = project_dir.join("output");
    if output_path.exists() {
        fs::remove_file(&output_path)
            .unwrap_or_else(|error| panic!("failed to remove {}: {error}", output_path.display()));
    }

    if cfg!(target_os = "linux") {
        ensure_mesh_rt_staticlib();
        let build = Command::new(meshc_bin())
            .current_dir(project_dir)
            .args(["build", ".", "--no-color"])
            .output()
            .unwrap_or_else(|error| {
                panic!(
                    "failed to invoke meshc build . for docker packaging in {}: {error}",
                    project_dir.display()
                )
            });
        write_artifact(
            &artifacts.join("docker-package-build.log"),
            command_output_text(&build),
        );
        assert!(
            build.status.success(),
            "meshc build . should succeed before docker packaging {}:\n{}",
            project_dir.display(),
            command_output_text(&build)
        );
    } else {
        ensure_docker_query_helper_image(artifacts);

        let docker_build_log = artifacts.join("docker-package-build.log");
        let mount = format!("{}:/work/project", project_dir.display());
        let mut package_build = Command::new("docker");
        package_build
            .current_dir(repo_root())
            .arg("run")
            .arg("--rm")
            .arg("-v")
            .arg(&mount)
            .arg("-w")
            .arg("/work/project")
            .arg(TODO_DOCKER_BUILDER_IMAGE_TAG)
            .arg("bash")
            .arg("-lc")
            .arg("/app/target/debug/meshc build . --no-color && test -x ./output");
        let package_status = run_command_with_timeout(
            &mut package_build,
            &docker_build_log,
            DOCKER_BUILD_TIMEOUT,
            "dockerized meshc build for the todo scaffold output artifact",
        );
        assert!(
            package_status.success(),
            "dockerized meshc build should produce ./output for docker packaging; inspect {}",
            docker_build_log.display()
        );
    }

    assert!(
        output_path.exists(),
        "meshc build . should produce {} before docker packaging",
        output_path.display()
    );
    let file_output = Command::new("file")
        .arg(&output_path)
        .output()
        .unwrap_or_else(|error| {
            panic!(
                "failed to inspect {} with file(1): {error}",
                output_path.display()
            )
        });
    write_artifact(
        &artifacts.join("docker-output.file.txt"),
        command_output_text(&file_output),
    );
}

pub fn docker_build(project_dir: &Path, artifacts: &Path, image_tag: &str) {
    build_linux_output_for_docker(project_dir, artifacts);

    let log_path = artifacts.join("docker-build.log");
    let mut command = Command::new("docker");
    command
        .current_dir(project_dir)
        .args(["build", "--progress=plain", "-t", image_tag, "."]);
    let status = run_command_with_timeout(
        &mut command,
        &log_path,
        DOCKER_BUILD_TIMEOUT,
        "docker build for the generated todo runtime image",
    );
    assert!(
        status.success(),
        "docker build for todo scaffold should succeed; inspect {}",
        log_path.display()
    );
}

pub fn docker_spawn_todo_container(
    config: &TodoDockerContainerConfig,
    artifacts: &Path,
    label: &str,
    image_tag: &str,
) -> StartedTodoContainer {
    fs::create_dir_all(&config.host_data_dir).unwrap_or_else(|error| {
        panic!(
            "failed to create host data dir {}: {error}",
            config.host_data_dir.display()
        )
    });

    let create_log = artifacts.join(format!("{label}.create.log"));
    let mount = format!(
        "{}:{}",
        config.host_data_dir.display(),
        config.container_data_dir.display()
    );
    let mut create = Command::new("docker");
    create
        .current_dir(repo_root())
        .arg("create")
        .arg("--name")
        .arg(&config.container_name);
    if config.publish_http {
        create.arg("-p").arg("127.0.0.1::8080");
    }
    if let Some(cluster) = &config.cluster {
        assert_valid_cluster_runtime_config(&cluster.runtime);
        if cluster.publish_cluster_port {
            create.arg("-p").arg(format!(
                "127.0.0.1:{}:{}",
                cluster.runtime.cluster_port, cluster.runtime.cluster_port
            ));
        }
        apply_cluster_runtime_docker_env_args(&mut create, &cluster.runtime);
    }
    create
        .arg("-e")
        .arg(format!("PORT={TODO_CONTAINER_PORT}"))
        .arg("-e")
        .arg(format!("TODO_DB_PATH={}", config.db_path.display()))
        .arg("-e")
        .arg(format!(
            "TODO_RATE_LIMIT_WINDOW_SECONDS={}",
            config.rate_limit_window_seconds
        ))
        .arg("-e")
        .arg(format!(
            "TODO_RATE_LIMIT_MAX_REQUESTS={}",
            config.rate_limit_max_requests
        ))
        .arg("-v")
        .arg(&mount)
        .arg(image_tag);
    let create_status = run_command_with_timeout(
        &mut create,
        &create_log,
        DOCKER_PHASE_TIMEOUT,
        &format!("docker create {}", config.container_name),
    );
    assert!(
        create_status.success(),
        "docker create failed for {}; inspect {}",
        config.container_name,
        create_log.display()
    );

    let stdout_path = artifacts.join(format!("{label}.stdout.log"));
    let stderr_path = artifacts.join(format!("{label}.stderr.log"));
    let stdout = File::create(&stdout_path)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", stdout_path.display()));
    let stderr = File::create(&stderr_path)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", stderr_path.display()));

    let attach_child = Command::new("docker")
        .current_dir(repo_root())
        .args(["start", "-a", &config.container_name])
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr))
        .spawn()
        .unwrap_or_else(|error| {
            panic!(
                "failed to start attached {}: {error}",
                config.container_name
            )
        });

    StartedTodoContainer {
        container_name: config.container_name.clone(),
        attach_child,
        stdout_path,
        stderr_path,
    }
}

pub fn docker_container_inspect(container_name: &str, path: &Path) {
    let output = docker_output(&["inspect", container_name], "docker inspect container");
    assert!(
        output.status.success(),
        "docker inspect container {} failed:\n{}",
        container_name,
        command_output_text(&output)
    );
    let json: Value = serde_json::from_slice(&output.stdout)
        .unwrap_or_else(|error| panic!("failed to parse docker inspect JSON: {error}"));
    write_json_artifact(path, &json);
}

fn wait_for_published_port(
    container_name: &str,
    container_port: u16,
    artifacts: &Path,
    label: &str,
    port_label: &str,
    timeout: Duration,
) -> u16 {
    let start = Instant::now();
    let mut last_observation = String::new();
    let port_snapshot_path = artifacts.join(format!("{label}.ports.txt"));
    let host_port_path = artifacts.join(format!("{label}.host-port.log"));
    let port_key = format!("{container_port}/tcp");
    let template =
        format!("{{{{(index (index .NetworkSettings.Ports \"{port_key}\") 0).HostPort}}}}");

    while start.elapsed() < timeout {
        let inspect_output = docker_output(
            &["inspect", "-f", &template, container_name],
            "docker inspect host port",
        );
        let inspect_text = command_output_text(&inspect_output);
        write_artifact(&host_port_path, &inspect_text);

        let ports_output = docker_output(&["port", container_name], "docker port snapshot");
        let ports_text = command_output_text(&ports_output);
        write_artifact(&port_snapshot_path, &ports_text);

        last_observation = format!(
            "docker inspect -f {}\n\n{}\n\ndocker port {}\n\n{}",
            template, inspect_text, container_name, ports_text,
        );
        if inspect_output.status.success() {
            let text = String::from_utf8_lossy(&inspect_output.stdout)
                .trim()
                .to_string();
            if let Ok(port) = text.parse::<u16>() {
                docker_container_inspect(
                    container_name,
                    &artifacts.join(format!("{label}.inspect.json")),
                );
                return port;
            }
        }
        sleep(Duration::from_millis(250));
    }

    let timeout_path = artifacts.join(format!("{label}.timeout.txt"));
    write_artifact(&timeout_path, &last_observation);
    let inspect_path = artifacts.join(format!("{label}.inspect.json"));
    let inspect_output = docker_output(&["inspect", container_name], "docker inspect on timeout");
    if inspect_output.status.success() {
        if let Ok(json) = serde_json::from_slice::<Value>(&inspect_output.stdout) {
            write_json_artifact(&inspect_path, &json);
        }
    }
    panic!(
        "container {container_name} never published a {port_label} port for container port {container_port} within {:?}; last observation archived at {}",
        timeout,
        timeout_path.display()
    );
}

pub fn wait_for_published_http_port(
    container_name: &str,
    artifacts: &Path,
    label: &str,
    timeout: Duration,
) -> u16 {
    wait_for_published_port(
        container_name,
        TODO_CONTAINER_PORT,
        artifacts,
        label,
        "HTTP",
        timeout,
    )
}

pub fn wait_for_published_cluster_port(
    container_name: &str,
    cluster_port: u16,
    artifacts: &Path,
    label: &str,
    timeout: Duration,
) -> u16 {
    wait_for_published_port(
        container_name,
        cluster_port,
        artifacts,
        label,
        "cluster",
        timeout,
    )
}

pub fn docker_stop_todo_container(
    started: StartedTodoContainer,
    artifacts: &Path,
    label: &str,
) -> StoppedTodoContainer {
    let log_path = artifacts.join(format!("{label}.stop.log"));
    let output = docker_output(
        &["stop", "-t", "2", &started.container_name],
        &format!("docker stop {}", started.container_name),
    );
    write_artifact(&log_path, command_output_text(&output));

    let mut attach_child = started.attach_child;
    let _ = attach_child.wait();

    let stdout = fs::read_to_string(&started.stdout_path).unwrap_or_else(|error| {
        panic!("failed to read {}: {error}", started.stdout_path.display())
    });
    let stderr = fs::read_to_string(&started.stderr_path).unwrap_or_else(|error| {
        panic!("failed to read {}: {error}", started.stderr_path.display())
    });
    let combined = format!("{stdout}{stderr}");

    StoppedTodoContainer {
        stdout,
        stderr,
        combined,
        stdout_path: started.stdout_path,
        stderr_path: started.stderr_path,
    }
}

pub fn docker_remove_container(container_name: &str, artifacts: &Path, label: &str) {
    let output = docker_output(
        &["rm", "-f", container_name],
        &format!("docker rm -f {container_name}"),
    );
    write_artifact(
        &artifacts.join(format!("{label}.remove.log")),
        command_output_text(&output),
    );
}

pub fn docker_remove(image_tag: &str) {
    let _ = Command::new("docker")
        .args(["image", "rm", "-f", image_tag])
        .output();
}
