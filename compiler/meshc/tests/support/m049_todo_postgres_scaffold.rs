use super::m046_route_free as route_free;
use mesh_rt::db::pg::{native_pg_close, native_pg_connect, native_pg_execute};
use serde_json::Value;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Output, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tempfile::NamedTempFile;

pub const PHASE_TIMEOUT: Duration = Duration::from_secs(120);
pub const STARTUP_TIMEOUT: Duration = Duration::from_secs(20);
pub const BINARY_EXIT_TIMEOUT: Duration = Duration::from_secs(5);
pub const DEFAULT_RATE_LIMIT_WINDOW_SECONDS: u64 = 60;
pub const DEFAULT_RATE_LIMIT_MAX_REQUESTS: u64 = 20;
pub const MISSING_TODO_ID: &str = "00000000-0000-0000-0000-000000000042";
pub const MALFORMED_TODO_ID: &str = "not-a-uuid";

#[derive(Debug, Clone)]
pub struct TodoRuntimeConfig {
    pub http_port: u16,
    pub database_url: String,
    pub rate_limit_window_seconds: u64,
    pub rate_limit_max_requests: u64,
    pub cluster_cookie: String,
    pub node_name: String,
    pub discovery_seed: String,
    pub cluster_port: u16,
    pub cluster_role: String,
    pub promotion_epoch: u64,
}

#[derive(Debug, Clone)]
pub struct IsolatedPostgresDatabase {
    admin_database_url: String,
    pub database_url: String,
    pub database_name: String,
}

impl Drop for IsolatedPostgresDatabase {
    fn drop(&mut self) {
        let _ = drop_database_if_exists(&self.admin_database_url, &self.database_name);
    }
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
    stdout_path: PathBuf,
    stderr_path: PathBuf,
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
    route_free::artifact_dir("m049-s01", test_name)
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
    format!(
        "status: {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
}

pub fn run_meshc_init(current_dir: &Path, args: &[&str]) -> Output {
    Command::new(meshc_bin())
        .current_dir(current_dir)
        .args(args)
        .output()
        .unwrap_or_else(|error| {
            panic!(
                "failed to run meshc init in {} with args {:?}: {error}",
                current_dir.display(),
                args
            )
        })
}

pub fn init_postgres_todo_project(
    workspace_dir: &Path,
    project_name: &str,
    artifacts: &Path,
) -> PathBuf {
    let output = run_meshc_init(
        workspace_dir,
        &[
            "init",
            "--template",
            "todo-api",
            "--db",
            "postgres",
            project_name,
        ],
    );
    write_artifact(&artifacts.join("init.log"), command_output_text(&output));
    assert!(
        output.status.success(),
        "meshc init --template todo-api --db postgres {} should succeed:\n{}",
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
    project_dir
}

pub fn default_runtime_config(project_name: &str, database_url: &str) -> TodoRuntimeConfig {
    let cluster_port = unused_port();
    TodoRuntimeConfig {
        http_port: unused_port(),
        database_url: database_url.to_string(),
        rate_limit_window_seconds: DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
        rate_limit_max_requests: DEFAULT_RATE_LIMIT_MAX_REQUESTS,
        cluster_cookie: format!("m049-s01-cookie-{}", unique_stamp()),
        node_name: format!("{project_name}@127.0.0.1:{cluster_port}"),
        discovery_seed: "localhost".to_string(),
        cluster_port,
        cluster_role: "primary".to_string(),
        promotion_epoch: 0,
    }
}

pub fn create_isolated_database(
    base_database_url: &str,
    artifacts: &Path,
    label: &str,
) -> IsolatedPostgresDatabase {
    let database_name = format!("m049_s01_{}_{}", sanitize_label(label), unique_stamp());
    let database_url = database_url_with_database_name(base_database_url, &database_name)
        .unwrap_or_else(|error| panic!("failed to derive isolated database url: {error}"));

    drop_database_if_exists(base_database_url, &database_name).unwrap_or_else(|error| {
        panic!("failed to clear stale isolated database {database_name}: {error}")
    });
    create_database(base_database_url, &database_name).unwrap_or_else(|error| {
        panic!("failed to create isolated database {database_name}: {error}")
    });

    write_json_artifact(
        &artifacts.join("database.json"),
        &serde_json::json!({
            "database_name": database_name,
            "database_url": "<redacted:DATABASE_URL>",
        }),
    );

    IsolatedPostgresDatabase {
        admin_database_url: base_database_url.to_string(),
        database_url,
        database_name,
    }
}

pub fn run_meshc_migrate_up(
    project_dir: &Path,
    database_url: &str,
    artifacts: &Path,
) -> CompletedCommand {
    let mut command = Command::new(meshc_bin());
    command
        .current_dir(repo_root())
        .env("DATABASE_URL", database_url)
        .args(["migrate", project_dir.to_str().unwrap(), "up"]);
    run_command_capture(
        &mut command,
        artifacts,
        "migrate-up",
        "meshc migrate <project> up",
        PHASE_TIMEOUT,
        &[database_url],
    )
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
        &[],
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
        &[],
    );
    if run.status.success() {
        assert!(
            binary_path.exists(),
            "meshc build reported success but binary is missing at {}",
            binary_path.display()
        );
        write_json_artifact(
            &artifacts.join("build-output.json"),
            &serde_json::json!({
                "binary_path": binary_path,
                "source_package_dir": project_dir,
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
            "failed to start generated todo runtime {}: {error}",
            binary_path.display()
        )
    });

    write_artifact(
        &artifacts.join(format!("{label}.meta.txt")),
        format!(
            "description: generated todo runtime\ncwd: {}\ncommand: {}\n",
            current_dir.display(),
            binary_path.display()
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

pub fn stop_todo_app(mut spawned: SpawnedTodoApp, secret_values: &[&str]) -> StoppedTodoApp {
    let _ = spawned.child.kill();
    let _ = spawned.child.wait();

    let stdout = read_capture_file(spawned.stdout_capture.path(), secret_values);
    let stderr = read_capture_file(spawned.stderr_capture.path(), secret_values);
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

pub fn wait_for_health(
    config: &TodoRuntimeConfig,
    artifacts: &Path,
    label: &str,
    secret_values: &[&str],
) -> Value {
    wait_for_health_with_timeout(config, artifacts, label, STARTUP_TIMEOUT, secret_values)
}

pub fn wait_for_health_with_timeout(
    config: &TodoRuntimeConfig,
    artifacts: &Path,
    label: &str,
    timeout: Duration,
    secret_values: &[&str],
) -> Value {
    let start = Instant::now();
    let mut last_observation = String::new();

    while start.elapsed() < timeout {
        match send_http_request(config.http_port, "GET", "/health", None) {
            Ok(response) if response.status_code == 200 => {
                let json = json_response_snapshot(
                    artifacts,
                    label,
                    &response,
                    200,
                    "/health",
                    secret_values,
                );
                if json["status"].as_str() == Some("ok") {
                    return json;
                }
                last_observation =
                    redact_text(&serde_json::to_string_pretty(&json).unwrap(), secret_values);
            }
            Ok(response) => last_observation = redact_text(&response.raw, secret_values),
            Err(error) => last_observation = format!("connect error: {error}"),
        }
        sleep(Duration::from_millis(250));
    }

    let timeout_path = artifacts.join(format!("{label}.timeout.txt"));
    write_artifact(&timeout_path, &last_observation);
    panic!(
        "generated todo runtime never reached /health ready state on :{} within {:?}; last observation archived at {}",
        config.http_port,
        timeout,
        timeout_path.display()
    );
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
    secret_values: &[&str],
) -> Value {
    if response.status_code != expected_status {
        let raw_path = archive_raw_response(artifacts, name, response, secret_values);
        panic!(
            "expected HTTP {expected_status} for {context}, got raw response in {}:\n{}",
            raw_path.display(),
            redact_text(&response.raw, secret_values)
        );
    }
    parse_json_snapshot(artifacts, name, response, context, secret_values)
}

pub fn archive_raw_response(
    artifacts: &Path,
    name: &str,
    response: &HttpResponse,
    secret_values: &[&str],
) -> PathBuf {
    let path = artifacts.join(format!("{name}.http"));
    write_artifact(&path, redact_text(&response.raw, secret_values));
    path
}

pub fn parse_json_snapshot(
    artifacts: &Path,
    name: &str,
    response: &HttpResponse,
    context: &str,
    secret_values: &[&str],
) -> Value {
    let raw_path = archive_raw_response(artifacts, name, response, secret_values);
    match serde_json::from_str::<Value>(&response.body) {
        Ok(json) => {
            let json_path = artifacts.join(format!("{name}.json"));
            write_json_artifact(&json_path, &json);
            json
        }
        Err(error) => {
            let body_path = artifacts.join(format!("{name}.body.txt"));
            write_artifact(&body_path, redact_text(&response.body, secret_values));
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
        logs.combined.contains("[todo-api] runtime bootstrap mode="),
        "expected runtime bootstrap log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains(&format!(
            "[todo-api] Config loaded port={} write_limit_window_seconds={} write_limit_max={}",
            config.http_port, config.rate_limit_window_seconds, config.rate_limit_max_requests
        )),
        "expected config-loaded log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined
            .contains("[todo-api] Connecting to PostgreSQL pool..."),
        "expected connect log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains("[todo-api] PostgreSQL pool ready"),
        "expected pool-ready log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains("[todo-api] Runtime registry ready"),
        "expected registry-ready log line, got:\n{}",
        logs.combined
    );
    assert!(
        logs.combined.contains(&format!(
            "[todo-api] Runtime ready port={} db_backend=postgres write_limit_window_seconds={} write_limit_max={}",
            config.http_port, config.rate_limit_window_seconds, config.rate_limit_max_requests
        )),
        "expected runtime-ready log line, got:\n{}",
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
        !logs.combined.contains(&config.database_url),
        "runtime logs must not echo DATABASE_URL\nlogs:\n{}",
        logs.combined
    );
}

pub fn assert_artifacts_redacted(artifacts: &Path, secret_values: &[&str]) {
    assert_artifacts_redacted_recursive(artifacts, secret_values);
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

pub fn redact_text(text: &str, secret_values: &[&str]) -> String {
    let mut redacted = text.to_string();
    for secret in secret_values {
        if !secret.is_empty() {
            redacted = redacted.replace(secret, "<redacted:DATABASE_URL>");
        }
    }
    redacted
}

pub fn run_command_capture(
    command: &mut Command,
    artifacts: &Path,
    label: &str,
    description: &str,
    timeout: Duration,
    secret_values: &[&str],
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
                let stdout = read_capture_file(stdout_capture.path(), secret_values);
                let stderr = read_capture_file(stderr_capture.path(), secret_values);
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
                    let stdout = read_capture_file(stdout_capture.path(), secret_values);
                    let stderr = read_capture_file(stderr_capture.path(), secret_values);
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

fn sanitize_label(label: &str) -> String {
    let sanitized: String = label
        .chars()
        .map(|ch| {
            if ch.is_ascii_lowercase() || ch.is_ascii_digit() {
                ch
            } else {
                '_'
            }
        })
        .collect();
    let trimmed = sanitized.trim_matches('_');
    if trimmed.is_empty() {
        "db".to_string()
    } else {
        trimmed.to_string()
    }
}

fn unique_stamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock before unix epoch")
        .as_nanos()
}

fn database_url_with_database_name(
    base_database_url: &str,
    database_name: &str,
) -> Result<String, String> {
    let scheme_pos = base_database_url
        .find("://")
        .ok_or_else(|| "DATABASE_URL must include a scheme".to_string())?;
    let authority_start = scheme_pos + 3;
    let Some(path_offset) = base_database_url[authority_start..].find('/') else {
        return Err("DATABASE_URL must include a database path".to_string());
    };
    let path_start = authority_start + path_offset;
    let query_start = base_database_url[path_start + 1..]
        .find('?')
        .map(|offset| path_start + 1 + offset)
        .unwrap_or(base_database_url.len());
    if query_start == path_start + 1 {
        return Err("DATABASE_URL must include a database name".to_string());
    }
    let prefix = &base_database_url[..path_start + 1];
    let suffix = &base_database_url[query_start..];
    Ok(format!("{prefix}{database_name}{suffix}"))
}

fn create_database(admin_database_url: &str, database_name: &str) -> Result<(), String> {
    let mut conn = native_pg_connect(admin_database_url)
        .map_err(|error| format!("failed to connect to admin database: {error}"))?;
    let statement = format!("CREATE DATABASE \"{database_name}\"");
    let result = native_pg_execute(&mut conn, &statement, &[])
        .map(|_| ())
        .map_err(|error| format!("CREATE DATABASE failed: {error}"));
    native_pg_close(conn);
    result
}

fn drop_database_if_exists(admin_database_url: &str, database_name: &str) -> Result<(), String> {
    let mut conn = native_pg_connect(admin_database_url)
        .map_err(|error| format!("failed to connect to admin database: {error}"))?;

    let force_drop = format!("DROP DATABASE IF EXISTS \"{database_name}\" WITH (FORCE)");
    let result = match native_pg_execute(&mut conn, &force_drop, &[]) {
        Ok(_) => Ok(()),
        Err(force_error) => {
            let terminate = format!(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{}' AND pid <> pg_backend_pid()",
                database_name
            );
            let _ = native_pg_execute(&mut conn, &terminate, &[]);
            let plain_drop = format!("DROP DATABASE IF EXISTS \"{database_name}\"");
            native_pg_execute(&mut conn, &plain_drop, &[])
                .map(|_| ())
                .map_err(|plain_error| {
                    format!(
                        "DROP DATABASE failed (force error: {force_error}; plain error: {plain_error})"
                    )
                })
        }
    };

    native_pg_close(conn);
    result
}

fn apply_runtime_env(command: &mut Command, config: &TodoRuntimeConfig) {
    command
        .env("DATABASE_URL", &config.database_url)
        .env("PORT", config.http_port.to_string())
        .env(
            "TODO_RATE_LIMIT_WINDOW_SECONDS",
            config.rate_limit_window_seconds.to_string(),
        )
        .env(
            "TODO_RATE_LIMIT_MAX_REQUESTS",
            config.rate_limit_max_requests.to_string(),
        )
        .env("MESH_CLUSTER_COOKIE", &config.cluster_cookie)
        .env("MESH_NODE_NAME", &config.node_name)
        .env("MESH_DISCOVERY_SEED", &config.discovery_seed)
        .env("MESH_CLUSTER_PORT", config.cluster_port.to_string())
        .env("MESH_CONTINUITY_ROLE", &config.cluster_role)
        .env(
            "MESH_CONTINUITY_PROMOTION_EPOCH",
            config.promotion_epoch.to_string(),
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

fn read_capture_file(path: &Path, secret_values: &[&str]) -> String {
    let raw = fs::read_to_string(path)
        .unwrap_or_else(|error| panic!("failed to read capture {}: {error}", path.display()));
    redact_text(&raw, secret_values)
}

fn assert_artifacts_redacted_recursive(path: &Path, secret_values: &[&str]) {
    if path.is_dir() {
        for entry in fs::read_dir(path)
            .unwrap_or_else(|error| panic!("failed to read {}: {error}", path.display()))
        {
            let entry = entry
                .unwrap_or_else(|error| panic!("failed to iterate {}: {error}", path.display()));
            assert_artifacts_redacted_recursive(&entry.path(), secret_values);
        }
        return;
    }

    let bytes =
        fs::read(path).unwrap_or_else(|error| panic!("failed to read {}: {error}", path.display()));
    let content = String::from_utf8_lossy(&bytes);
    for secret in secret_values {
        if !secret.is_empty() {
            assert!(
                !content.contains(secret),
                "artifact {} leaked a raw DATABASE_URL",
                path.display()
            );
        }
    }
}
