use super::m046_route_free as route_free;
use serde_json::Value;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Output, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant};
use tempfile::NamedTempFile;

pub const PHASE_TIMEOUT: Duration = Duration::from_secs(120);
pub const STARTUP_TIMEOUT: Duration = Duration::from_secs(20);
pub const BINARY_EXIT_TIMEOUT: Duration = Duration::from_secs(5);
pub const DEFAULT_RATE_LIMIT_WINDOW_SECONDS: u64 = 60;
pub const DEFAULT_RATE_LIMIT_MAX_REQUESTS: u64 = 5;
pub const MISSING_TODO_ID: &str = "999999";
pub const MALFORMED_TODO_ID: &str = "abc";

#[derive(Debug, Clone)]
pub struct TodoRuntimeConfig {
    pub http_port: u16,
    pub db_path: String,
    pub rate_limit_window_seconds: u64,
    pub rate_limit_max_requests: u64,
}

pub struct CompletedCommand {
    pub status: ExitStatus,
    pub stdout: String,
    pub stderr: String,
    pub combined: String,
    pub stdout_path: PathBuf,
    pub stderr_path: PathBuf,
    pub meta_path: PathBuf,
    pub duration: Duration,
}

pub struct SpawnedTodoApp {
    child: Child,
    stdout_capture: NamedTempFile,
    stderr_capture: NamedTempFile,
    pub stdout_path: PathBuf,
    pub stderr_path: PathBuf,
}

pub struct StoppedTodoApp {
    pub stdout: String,
    pub stderr: String,
    pub combined: String,
    pub stdout_path: PathBuf,
    pub stderr_path: PathBuf,
}

#[derive(Debug, Clone)]
pub struct HttpResponse {
    pub status_code: u16,
    pub body: String,
    pub raw: String,
}

pub fn repo_root() -> PathBuf {
    route_free::repo_root()
}

pub fn meshc_bin() -> PathBuf {
    route_free::meshc_bin()
}

pub fn artifact_dir(test_name: &str) -> PathBuf {
    route_free::artifact_dir("m049-s02", test_name)
}

pub fn ensure_mesh_rt_staticlib() {
    route_free::ensure_mesh_rt_staticlib();
}

pub fn write_artifact(path: &Path, contents: impl AsRef<str>) {
    route_free::write_artifact(path, contents.as_ref());
}

pub fn write_json_artifact(path: &Path, value: &impl serde::Serialize) {
    route_free::write_json_artifact(path, value);
}

pub fn archive_directory_tree(source_dir: &Path, artifact_dir: &Path) {
    route_free::archive_directory_tree(source_dir, artifact_dir);
}

pub fn command_output_text(output: &Output) -> String {
    route_free::command_output_text(output)
}

pub fn default_runtime_config(db_path: &Path) -> TodoRuntimeConfig {
    TodoRuntimeConfig {
        http_port: unused_port(),
        db_path: db_path.display().to_string(),
        rate_limit_window_seconds: DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
        rate_limit_max_requests: DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    }
}

pub fn read_file(path: &Path) -> String {
    fs::read_to_string(path)
        .unwrap_or_else(|error| panic!("failed to read {}: {error}", path.display()))
}

pub fn unused_port() -> u16 {
    TcpListener::bind(("127.0.0.1", 0))
        .expect("failed to bind ephemeral port")
        .local_addr()
        .expect("failed to read ephemeral port")
        .port()
}

pub fn init_sqlite_todo_project(
    workspace_dir: &Path,
    project_name: &str,
    artifacts: &Path,
) -> PathBuf {
    let output = Command::new(meshc_bin())
        .current_dir(workspace_dir)
        .args([
            "init",
            "--template",
            "todo-api",
            "--db",
            "sqlite",
            project_name,
        ])
        .output()
        .unwrap_or_else(|error| {
            panic!(
                "failed to run meshc init --template todo-api --db sqlite in {}: {error}",
                workspace_dir.display()
            )
        });
    write_artifact(&artifacts.join("init.log"), command_output_text(&output));
    assert!(
        output.status.success(),
        "meshc init --template todo-api --db sqlite {} should succeed:\n{}",
        project_name,
        command_output_text(&output)
    );

    let project_dir = workspace_dir.join(project_name);
    assert!(
        project_dir.is_dir(),
        "meshc init reported success but {} is missing",
        project_dir.display()
    );

    archive_directory_tree(&project_dir, &artifacts.join("generated-project"));
    assert_generated_project_shape(&project_dir);
    project_dir
}

pub fn run_meshc_tests(project_dir: &Path, artifacts: &Path) -> CompletedCommand {
    let mut command = Command::new(meshc_bin());
    command
        .current_dir(repo_root())
        .args(["test", project_dir.to_str().unwrap()]);
    run_command_capture(
        &mut command,
        artifacts,
        "meshc-test",
        "meshc test <project>",
        PHASE_TIMEOUT,
    )
}

pub fn run_meshc_build(project_dir: &Path, artifacts: &Path) -> (CompletedCommand, PathBuf) {
    ensure_mesh_rt_staticlib();

    let binary_dir = artifacts.join("bin");
    fs::create_dir_all(&binary_dir)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", binary_dir.display()));
    let binary_path = binary_dir.join(
        project_dir
            .file_name()
            .unwrap_or_else(|| panic!("missing project dir name for {}", project_dir.display())),
    );

    let mut command = Command::new(meshc_bin());
    command
        .current_dir(repo_root())
        .arg("build")
        .arg(project_dir)
        .arg("--output")
        .arg(&binary_path);
    let run = run_command_capture(
        &mut command,
        artifacts,
        "build",
        "meshc build <project>",
        PHASE_TIMEOUT,
    );
    if run.status.success() {
        assert!(
            binary_path.exists(),
            "meshc build reported success but binary is missing at {}",
            binary_path.display()
        );
        write_json_artifact(
            &artifacts.join("build-meta.json"),
            &serde_json::json!({
                "source_package_dir": project_dir,
                "binary_path": binary_path,
            }),
        );
    }
    (run, binary_path)
}

pub fn spawn_todo_app(
    binary_path: &Path,
    current_dir: &Path,
    artifacts: &Path,
    label: &str,
    config: &TodoRuntimeConfig,
) -> SpawnedTodoApp {
    let stdout_capture = NamedTempFile::new().expect("failed to create temp stdout capture");
    let stderr_capture = NamedTempFile::new().expect("failed to create temp stderr capture");
    let stdout_path = artifacts.join(format!("{label}.stdout.log"));
    let stderr_path = artifacts.join(format!("{label}.stderr.log"));

    let stdout = stdout_capture
        .reopen()
        .expect("failed to reopen temp stdout capture");
    let stderr = stderr_capture
        .reopen()
        .expect("failed to reopen temp stderr capture");

    let mut command = Command::new(binary_path);
    command
        .current_dir(current_dir)
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr));
    apply_runtime_env(&mut command, config);

    let child = command.spawn().unwrap_or_else(|error| {
        panic!(
            "failed to start generated sqlite todo runtime {}: {error}",
            binary_path.display()
        )
    });

    write_artifact(
        &artifacts.join(format!("{label}.meta.txt")),
        format!(
            "description: generated sqlite todo runtime\ncwd: {}\ncommand: {}\nPORT={}\nTODO_DB_PATH={}\nTODO_RATE_LIMIT_WINDOW_SECONDS={}\nTODO_RATE_LIMIT_MAX_REQUESTS={}\ncluster_env: omitted\n",
            current_dir.display(),
            binary_path.display(),
            config.http_port,
            config.db_path,
            config.rate_limit_window_seconds,
            config.rate_limit_max_requests,
        ),
    );

    SpawnedTodoApp {
        child,
        stdout_capture,
        stderr_capture,
        stdout_path,
        stderr_path,
    }
}

pub fn run_todo_app_once(
    binary_path: &Path,
    current_dir: &Path,
    artifacts: &Path,
    label: &str,
    config: &TodoRuntimeConfig,
    timeout: Duration,
) -> CompletedCommand {
    let mut command = Command::new(binary_path);
    command.current_dir(current_dir);
    apply_runtime_env(&mut command, config);
    run_command_capture(
        &mut command,
        artifacts,
        label,
        "generated sqlite todo runtime",
        timeout,
    )
}

pub fn stop_todo_app(mut spawned: SpawnedTodoApp) -> StoppedTodoApp {
    let _ = spawned.child.kill();
    let _ = spawned.child.wait();

    let stdout = read_capture_file(spawned.stdout_capture.path());
    let stderr = read_capture_file(spawned.stderr_capture.path());
    let combined = format!("{stdout}{stderr}");

    write_artifact(&spawned.stdout_path, &stdout);
    write_artifact(&spawned.stderr_path, &stderr);

    StoppedTodoApp {
        stdout,
        stderr,
        combined,
        stdout_path: spawned.stdout_path,
        stderr_path: spawned.stderr_path,
    }
}

pub fn wait_for_health(config: &TodoRuntimeConfig, artifacts: &Path, label: &str) -> Value {
    wait_for_health_with_timeout(config, artifacts, label, STARTUP_TIMEOUT)
}

pub fn wait_for_health_with_timeout(
    config: &TodoRuntimeConfig,
    artifacts: &Path,
    label: &str,
    timeout: Duration,
) -> Value {
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < timeout {
        match send_http_request(config.http_port, "GET", "/health", None) {
            Ok(response) if response.status_code == 200 => {
                let json = json_response_snapshot(artifacts, label, &response, 200, "/health");
                if json["status"].as_str() == Some("ok") {
                    return json;
                }
                last_observation =
                    serde_json::to_string_pretty(&json).unwrap_or_else(|_| json.to_string());
            }
            Ok(response) => last_observation = response.raw,
            Err(error) => last_observation = format!("connect error: {error}"),
        }
        sleep(Duration::from_millis(250));
    }

    let timeout_path = artifacts.join(format!("{label}.timeout.txt"));
    write_artifact(&timeout_path, &last_observation);
    panic!(
        "generated sqlite todo runtime never reached /health ready state on :{} within {:?}; last observation archived at {}",
        config.http_port,
        timeout,
        timeout_path.display()
    );
}

pub fn assert_health_is_local(health: &Value, config: &TodoRuntimeConfig) {
    assert_eq!(health["status"].as_str(), Some("ok"));
    assert_eq!(health["mode"].as_str(), Some("local"));
    assert_eq!(health["db_backend"].as_str(), Some("sqlite"));
    assert_eq!(health["storage_mode"].as_str(), Some("single-node"));
    assert_eq!(health["db_path"].as_str(), Some(config.db_path.as_str()));
    assert_eq!(
        health["rate_limit_window_seconds"].as_i64(),
        Some(config.rate_limit_window_seconds as i64)
    );
    assert_eq!(
        health["rate_limit_max_requests"].as_i64(),
        Some(config.rate_limit_max_requests as i64)
    );
    assert!(
        health.get("clustered_handler").is_none(),
        "local /health must not expose clustered_handler: {health}"
    );
    assert!(
        health.get("migration_strategy").is_none(),
        "local /health must not expose migration_strategy: {health}"
    );
    assert!(
        health.get("node_name").is_none(),
        "local /health must not expose node_name: {health}"
    );
}

pub fn assert_health_unreachable(config: &TodoRuntimeConfig, artifacts: &Path, label: &str) {
    match send_http_request(config.http_port, "GET", "/health", None) {
        Ok(response) => {
            let raw_path = archive_raw_response(artifacts, label, &response);
            panic!(
                "expected /health to stay unreachable on :{}, but received HTTP {}; raw response archived at {}",
                config.http_port,
                response.status_code,
                raw_path.display()
            );
        }
        Err(error) => {
            write_artifact(
                &artifacts.join(format!("{label}.connect-error.txt")),
                error.to_string(),
            );
        }
    }
}

pub fn send_http_request(
    port: u16,
    method: &str,
    path: &str,
    body: Option<&str>,
) -> std::io::Result<HttpResponse> {
    let mut stream = TcpStream::connect(("127.0.0.1", port))?;
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

pub fn assert_phase_success(run: &CompletedCommand, description: &str) {
    assert!(
        run.status.success(),
        "{description} failed after {:?}; stdout={} stderr={} meta={}\n{}",
        run.duration,
        run.stdout_path.display(),
        run.stderr_path.display(),
        run.meta_path.display(),
        run.combined
    );
}

pub fn assert_runtime_logs(logs: &StoppedTodoApp, config: &TodoRuntimeConfig) {
    assert!(
        logs.combined.contains(&format!(
            "[todo-api] local config loaded port={} db_path={} write_limit_window_seconds={} write_limit_max={}",
            config.http_port, config.db_path, config.rate_limit_window_seconds, config.rate_limit_max_requests
        )),
        "expected local config-loaded log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains(&format!(
            "[todo-api] SQLite schema ready path={}",
            config.db_path
        )),
        "expected SQLite schema-ready log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains(&format!(
            "[todo-api] local runtime ready port={} db_backend=sqlite storage_mode=single-node db_path={} write_limit_window_seconds={} write_limit_max={}",
            config.http_port, config.db_path, config.rate_limit_window_seconds, config.rate_limit_max_requests
        )),
        "expected local runtime-ready log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains(&format!(
            "[todo-api] HTTP server starting on :{}",
            config.http_port
        )),
        "expected HTTP-start log line, got:\n{}",
        logs.combined
    );
    assert!(
        !logs.combined.contains("runtime bootstrap"),
        "local sqlite runtime must not log clustered bootstrap markers:\n{}",
        logs.combined
    );
    assert!(
        !logs.combined.contains("cluster_port="),
        "local sqlite runtime must not log cluster_port markers:\n{}",
        logs.combined
    );
    assert!(
        !logs.combined.contains("db_backend=postgres"),
        "local sqlite runtime must not claim postgres readiness:\n{}",
        logs.combined
    );
}

pub fn run_command_capture(
    command: &mut Command,
    artifacts: &Path,
    label: &str,
    description: &str,
    timeout: Duration,
) -> CompletedCommand {
    let stdout_path = artifacts.join(format!("{label}.stdout.log"));
    let stderr_path = artifacts.join(format!("{label}.stderr.log"));
    let meta_path = artifacts.join(format!("{label}.meta.txt"));
    let timeout_path = artifacts.join(format!("{label}.timeout.txt"));

    let stdout_capture = NamedTempFile::new().expect("failed to create temp stdout capture");
    let stderr_capture = NamedTempFile::new().expect("failed to create temp stderr capture");
    let stdout = stdout_capture
        .reopen()
        .expect("failed to reopen temp stdout capture");
    let stderr = stderr_capture
        .reopen()
        .expect("failed to reopen temp stderr capture");

    write_artifact(
        &meta_path,
        format!(
            "description: {description}\ncwd: {}\ncommand: {}\nstatus: running\n",
            command
                .get_current_dir()
                .map(|path| path.display().to_string())
                .unwrap_or_else(|| "<inherit>".to_string()),
            format_command(command)
        ),
    );

    command
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr));
    let mut child = command
        .spawn()
        .unwrap_or_else(|error| panic!("failed to spawn {description}: {error}"));
    let start = Instant::now();

    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let duration = start.elapsed();
                let stdout = read_capture_file(stdout_capture.path());
                let stderr = read_capture_file(stderr_capture.path());
                let combined = format!("{stdout}{stderr}");
                write_artifact(&stdout_path, &stdout);
                write_artifact(&stderr_path, &stderr);
                write_artifact(
                    &meta_path,
                    format!(
                        "description: {description}\ncwd: {}\ncommand: {}\nstatus: {:?}\nduration_ms: {}\n",
                        command
                            .get_current_dir()
                            .map(|path| path.display().to_string())
                            .unwrap_or_else(|| "<inherit>".to_string()),
                        format_command(command),
                        status.code(),
                        duration.as_millis()
                    ),
                );
                return CompletedCommand {
                    status,
                    stdout,
                    stderr,
                    combined,
                    stdout_path,
                    stderr_path,
                    meta_path,
                    duration,
                };
            }
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    let stdout = read_capture_file(stdout_capture.path());
                    let stderr = read_capture_file(stderr_capture.path());
                    write_artifact(&stdout_path, &stdout);
                    write_artifact(&stderr_path, &stderr);
                    write_artifact(
                        &timeout_path,
                        format!(
                            "description: {description}\nduration_ms: {}\nstdout: {}\nstderr: {}\n",
                            timeout.as_millis(),
                            stdout_path.display(),
                            stderr_path.display()
                        ),
                    );
                    panic!(
                        "{description} timed out after {:?}; partial logs: stdout={} stderr={} timeout={}",
                        timeout,
                        stdout_path.display(),
                        stderr_path.display(),
                        timeout_path.display()
                    );
                }
                sleep(Duration::from_millis(100));
            }
            Err(error) => panic!("failed to wait on {description}: {error}"),
        }
    }
}

fn assert_generated_project_shape(project_dir: &Path) {
    let required_paths = [
        project_dir.join("mesh.toml"),
        project_dir.join("main.mpl"),
        project_dir.join("config.mpl"),
        project_dir.join("README.md"),
        project_dir.join("Dockerfile"),
        project_dir.join("api/health.mpl"),
        project_dir.join("api/router.mpl"),
        project_dir.join("api/todos.mpl"),
        project_dir.join("runtime/registry.mpl"),
        project_dir.join("services/rate_limiter.mpl"),
        project_dir.join("storage/todos.mpl"),
        project_dir.join("types/todo.mpl"),
        project_dir.join("tests/config.test.mpl"),
        project_dir.join("tests/storage.test.mpl"),
    ];
    for path in required_paths {
        assert!(
            path.exists(),
            "generated sqlite todo scaffold is missing {}",
            path.display()
        );
    }
    assert!(
        !project_dir.join("work.mpl").exists(),
        "generated sqlite todo scaffold must not include work.mpl at {}",
        project_dir.join("work.mpl").display()
    );

    let health = read_file(&project_dir.join("api/health.mpl"));
    assert!(health.contains("mode : \"local\""));
    assert!(health.contains("db_backend : \"sqlite\""));
    assert!(!health.contains("clustered_handler"));

    let main = read_file(&project_dir.join("main.mpl"));
    assert!(main.contains("[todo-api] local runtime ready"));
    assert!(!main.contains("Node.start_from_env()"));
    assert!(!main.contains("runtime bootstrap"));

    let storage_test = read_file(&project_dir.join("tests/storage.test.mpl"));
    assert!(storage_test.contains("describe(\"SQLite todo storage\")"));
}

fn apply_runtime_env(command: &mut Command, config: &TodoRuntimeConfig) {
    command
        .env("PORT", config.http_port.to_string())
        .env("TODO_DB_PATH", &config.db_path)
        .env(
            "TODO_RATE_LIMIT_WINDOW_SECONDS",
            config.rate_limit_window_seconds.to_string(),
        )
        .env(
            "TODO_RATE_LIMIT_MAX_REQUESTS",
            config.rate_limit_max_requests.to_string(),
        );
}

fn format_command(command: &Command) -> String {
    let program = command.get_program().to_string_lossy().to_string();
    let args = command
        .get_args()
        .map(|arg| arg.to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join(" ");
    if args.is_empty() {
        program
    } else {
        format!("{program} {args}")
    }
}

fn read_capture_file(path: &Path) -> String {
    fs::read_to_string(path)
        .unwrap_or_else(|error| panic!("failed to read capture {}: {error}", path.display()))
}
