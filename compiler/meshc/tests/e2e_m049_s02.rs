mod support;

use serde_json::json;
use std::fs;
use std::panic::{catch_unwind, AssertUnwindSafe};

use support::m046_route_free as route_free;
use support::m049_todo_sqlite_scaffold as todo;

#[test]
fn m049_s02_sqlite_todo_api_runtime_truth_proves_meshc_test_build_local_crud_restart_persistence_and_rate_limit(
) {
    let artifacts = todo::artifact_dir("todo-api-sqlite-runtime-truth");
    let workspace_dir = artifacts.join("workspace");
    fs::create_dir_all(&workspace_dir)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", workspace_dir.display()));

    let project_dir = todo::init_sqlite_todo_project(&workspace_dir, "todo-starter", &artifacts);
    let db_path = artifacts.join("todo.sqlite3");
    todo::write_json_artifact(
        &artifacts.join("scenario-meta.json"),
        &json!({
            "project_dir": project_dir,
            "db_path": db_path,
            "checks": [
                "meshc test <project> succeeds on generated SQLite package tests",
                "meshc build <project> emits a runnable local binary",
                "live runtime exposes local /health and empty-list truth without cluster metadata",
                "CRUD operations work against the on-disk SQLite database",
                "local rate limiting returns 429 after the configured write budget is exhausted",
                "todo state persists across process restart when TODO_DB_PATH is reused"
            ]
        }),
    );

    let meshc_test = todo::run_meshc_tests(&project_dir, &artifacts);
    todo::assert_phase_success(&meshc_test, "meshc test <project> should succeed");
    assert!(
        meshc_test.stdout.contains("2 passed"),
        "expected generated SQLite package tests to report 2 passed, got:\n{}",
        meshc_test.combined
    );
    assert!(
        !meshc_test.combined.contains("COMPILE ERROR"),
        "generated SQLite package tests must compile cleanly:\n{}",
        meshc_test.combined
    );

    let (build, binary_path) = todo::run_meshc_build(&project_dir, &artifacts);
    todo::assert_phase_success(&build, "meshc build <project> should succeed");

    let mut runtime_config = todo::default_runtime_config(&db_path);
    runtime_config.rate_limit_max_requests = 3;

    let spawned = todo::spawn_todo_app(
        &binary_path,
        &project_dir,
        &artifacts,
        "runtime",
        &runtime_config,
    );

    let first_run = catch_unwind(AssertUnwindSafe(|| -> String {
        let health = todo::wait_for_health(&runtime_config, &artifacts, "health");
        todo::assert_health_is_local(&health, &runtime_config);

        let empty_list = todo::json_response_snapshot(
            &artifacts,
            "todos-empty",
            &todo::send_http_request(runtime_config.http_port, "GET", "/todos", None)
                .unwrap_or_else(|error| {
                    panic!("GET /todos failed on {}: {error}", runtime_config.http_port)
                }),
            200,
            "GET /todos before first create",
        );
        assert!(
            empty_list.as_array().is_some_and(|items| items.is_empty()),
            "expected an empty todo list before the first create, got: {empty_list}"
        );

        let malformed_get = todo::json_response_snapshot(
            &artifacts,
            "todos-malformed-get",
            &todo::send_http_request(
                runtime_config.http_port,
                "GET",
                &format!("/todos/{}", todo::MALFORMED_TODO_ID),
                None,
            )
            .unwrap_or_else(|error| {
                panic!(
                    "GET malformed todo id failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            400,
            "GET /todos/:id malformed id",
        );
        assert_eq!(malformed_get["error"].as_str(), Some("invalid todo id"));

        let missing_get = todo::json_response_snapshot(
            &artifacts,
            "todos-missing-get",
            &todo::send_http_request(
                runtime_config.http_port,
                "GET",
                &format!("/todos/{}", todo::MISSING_TODO_ID),
                None,
            )
            .unwrap_or_else(|error| {
                panic!(
                    "GET missing todo failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            404,
            "GET /todos/:id missing",
        );
        assert_eq!(missing_get["error"].as_str(), Some("todo not found"));

        let empty_title = todo::json_response_snapshot(
            &artifacts,
            "todos-empty-title",
            &todo::send_http_request(
                runtime_config.http_port,
                "POST",
                "/todos",
                Some(r#"{"title":"   "}"#),
            )
            .unwrap_or_else(|error| {
                panic!(
                    "POST empty-title todo failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            400,
            "POST /todos empty title",
        );
        assert_eq!(empty_title["error"].as_str(), Some("title is required"));

        let created = todo::json_response_snapshot(
            &artifacts,
            "todos-created",
            &todo::send_http_request(
                runtime_config.http_port,
                "POST",
                "/todos",
                Some(r#"{"title":"buy milk"}"#),
            )
            .unwrap_or_else(|error| {
                panic!(
                    "POST create todo failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            201,
            "POST /todos create",
        );
        let todo_id = created["id"]
            .as_str()
            .expect("created todo id should be a string")
            .to_string();
        assert_eq!(created["title"].as_str(), Some("buy milk"));
        assert_eq!(created["completed"].as_bool(), Some(false));
        assert!(
            created["created_at"]
                .as_str()
                .is_some_and(|value| !value.is_empty()),
            "created todo should expose created_at, got: {created}"
        );

        let fetched = todo::json_response_snapshot(
            &artifacts,
            "todos-fetched",
            &todo::send_http_request(
                runtime_config.http_port,
                "GET",
                &format!("/todos/{todo_id}"),
                None,
            )
            .unwrap_or_else(|error| {
                panic!(
                    "GET created todo failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            200,
            "GET /todos/:id created",
        );
        assert_eq!(fetched["id"].as_str(), Some(todo_id.as_str()));
        assert_eq!(fetched["title"].as_str(), Some("buy milk"));
        assert_eq!(fetched["completed"].as_bool(), Some(false));

        let toggled = todo::json_response_snapshot(
            &artifacts,
            "todos-toggled",
            &todo::send_http_request(
                runtime_config.http_port,
                "PUT",
                &format!("/todos/{todo_id}"),
                Some("{}"),
            )
            .unwrap_or_else(|error| {
                panic!(
                    "PUT toggle todo failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            200,
            "PUT /todos/:id toggle",
        );
        assert_eq!(toggled["id"].as_str(), Some(todo_id.as_str()));
        assert_eq!(toggled["title"].as_str(), Some("buy milk"));
        assert_eq!(toggled["completed"].as_bool(), Some(true));

        let rate_limited = todo::json_response_snapshot(
            &artifacts,
            "todos-rate-limited",
            &todo::send_http_request(
                runtime_config.http_port,
                "POST",
                "/todos",
                Some(r#"{"title":"should fail"}"#),
            )
            .unwrap_or_else(|error| {
                panic!(
                    "POST rate-limit todo failed on {}: {error}",
                    runtime_config.http_port
                )
            }),
            429,
            "POST /todos rate limit",
        );
        assert_eq!(rate_limited["error"].as_str(), Some("rate limited"));

        let list_after_rate_limit = todo::json_response_snapshot(
            &artifacts,
            "todos-after-rate-limit",
            &todo::send_http_request(runtime_config.http_port, "GET", "/todos", None)
                .unwrap_or_else(|error| {
                    panic!(
                        "GET /todos after rate limit failed on {}: {error}",
                        runtime_config.http_port
                    )
                }),
            200,
            "GET /todos after rate limit",
        );
        let items = list_after_rate_limit
            .as_array()
            .expect("todo list JSON should be an array");
        assert_eq!(
            items.len(),
            1,
            "rate-limited create must not add a second row: {list_after_rate_limit}"
        );
        assert_eq!(items[0]["id"].as_str(), Some(todo_id.as_str()));
        assert_eq!(items[0]["completed"].as_bool(), Some(true));

        todo_id
    }));

    let logs = todo::stop_todo_app(spawned);
    let todo_id = match first_run {
        Ok(todo_id) => {
            todo::assert_runtime_logs(&logs, &runtime_config);
            todo_id
        }
        Err(payload) => panic!(
            "generated SQLite todo runtime assertions failed: {}\nartifacts: {}\nstdout: {}\nstderr: {}\nstdout_log: {}\nstderr_log: {}",
            route_free::panic_payload_to_string(payload),
            artifacts.display(),
            logs.stdout,
            logs.stderr,
            logs.stdout_path.display(),
            logs.stderr_path.display()
        ),
    };

    assert!(
        db_path.exists(),
        "expected on-disk SQLite database at {} after first runtime launch",
        db_path.display()
    );

    let mut restart_config = runtime_config.clone();
    restart_config.http_port = todo::unused_port();

    let restarted = todo::spawn_todo_app(
        &binary_path,
        &project_dir,
        &artifacts,
        "restart-runtime",
        &restart_config,
    );

    let restart_run = catch_unwind(AssertUnwindSafe(|| {
        let restart_health = todo::wait_for_health(&restart_config, &artifacts, "restart-health");
        todo::assert_health_is_local(&restart_health, &restart_config);

        let persisted_list = todo::json_response_snapshot(
            &artifacts,
            "todos-persisted",
            &todo::send_http_request(restart_config.http_port, "GET", "/todos", None)
                .unwrap_or_else(|error| {
                    panic!(
                        "GET /todos after restart failed on {}: {error}",
                        restart_config.http_port
                    )
                }),
            200,
            "GET /todos after restart",
        );
        let items = persisted_list
            .as_array()
            .expect("persisted todo list JSON should be an array");
        assert_eq!(
            items.len(),
            1,
            "restart should preserve exactly one todo: {persisted_list}"
        );
        assert_eq!(items[0]["id"].as_str(), Some(todo_id.as_str()));
        assert_eq!(items[0]["title"].as_str(), Some("buy milk"));
        assert_eq!(items[0]["completed"].as_bool(), Some(true));

        let persisted = todo::json_response_snapshot(
            &artifacts,
            "todo-persisted-get",
            &todo::send_http_request(
                restart_config.http_port,
                "GET",
                &format!("/todos/{todo_id}"),
                None,
            )
            .unwrap_or_else(|error| {
                panic!(
                    "GET persisted todo failed on {}: {error}",
                    restart_config.http_port
                )
            }),
            200,
            "GET /todos/:id after restart",
        );
        assert_eq!(persisted["id"].as_str(), Some(todo_id.as_str()));
        assert_eq!(persisted["completed"].as_bool(), Some(true));

        let deleted = todo::json_response_snapshot(
            &artifacts,
            "todos-deleted",
            &todo::send_http_request(
                restart_config.http_port,
                "DELETE",
                &format!("/todos/{todo_id}"),
                None,
            )
            .unwrap_or_else(|error| {
                panic!(
                    "DELETE persisted todo failed on {}: {error}",
                    restart_config.http_port
                )
            }),
            200,
            "DELETE /todos/:id after restart",
        );
        assert_eq!(deleted["status"].as_str(), Some("deleted"));
        assert_eq!(deleted["id"].as_str(), Some(todo_id.as_str()));

        let empty_after_delete = todo::json_response_snapshot(
            &artifacts,
            "todos-empty-after-delete",
            &todo::send_http_request(restart_config.http_port, "GET", "/todos", None)
                .unwrap_or_else(|error| {
                    panic!(
                        "GET /todos after delete failed on {}: {error}",
                        restart_config.http_port
                    )
                }),
            200,
            "GET /todos after delete",
        );
        assert!(
            empty_after_delete
                .as_array()
                .is_some_and(|items| items.is_empty()),
            "expected an empty todo list after delete, got: {empty_after_delete}"
        );
    }));

    let restart_logs = todo::stop_todo_app(restarted);
    match restart_run {
        Ok(()) => todo::assert_runtime_logs(&restart_logs, &restart_config),
        Err(payload) => panic!(
            "generated SQLite todo restart assertions failed: {}\nartifacts: {}\nstdout: {}\nstderr: {}\nstdout_log: {}\nstderr_log: {}",
            route_free::panic_payload_to_string(payload),
            artifacts.display(),
            restart_logs.stdout,
            restart_logs.stderr,
            restart_logs.stdout_path.display(),
            restart_logs.stderr_path.display()
        ),
    }
}

#[test]
fn m049_s02_sqlite_todo_api_bad_db_path_fails_closed_before_http_ready() {
    let artifacts = todo::artifact_dir("todo-api-sqlite-bad-db-path");
    let workspace_dir = artifacts.join("workspace");
    fs::create_dir_all(&workspace_dir)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", workspace_dir.display()));

    let project_dir = todo::init_sqlite_todo_project(&workspace_dir, "todo-starter", &artifacts);
    let bad_db_path = artifacts.join("db-path-is-directory");
    fs::create_dir_all(&bad_db_path)
        .unwrap_or_else(|error| panic!("failed to create {}: {error}", bad_db_path.display()));

    todo::write_json_artifact(
        &artifacts.join("scenario-meta.json"),
        &json!({
            "project_dir": project_dir,
            "bad_db_path": bad_db_path,
            "checks": [
                "meshc test <project> succeeds before the negative runtime rail",
                "meshc build <project> succeeds before the negative runtime rail",
                "the runtime logs a bad-db-path startup failure without claiming readiness",
                "no /health endpoint is reachable on the configured port"
            ]
        }),
    );

    let meshc_test = todo::run_meshc_tests(&project_dir, &artifacts);
    todo::assert_phase_success(
        &meshc_test,
        "meshc test <project> should succeed before bad-db-path rail",
    );
    assert!(
        meshc_test.stdout.contains("2 passed"),
        "expected generated SQLite package tests to report 2 passed, got:\n{}",
        meshc_test.combined
    );

    let (build, binary_path) = todo::run_meshc_build(&project_dir, &artifacts);
    todo::assert_phase_success(
        &build,
        "meshc build <project> should succeed before bad-db-path rail",
    );

    let runtime_config = todo::default_runtime_config(&bad_db_path);
    let run = todo::run_todo_app_once(
        &binary_path,
        &project_dir,
        &artifacts,
        "bad-db-path-runtime",
        &runtime_config,
        todo::BINARY_EXIT_TIMEOUT,
    );

    assert!(
        run.combined.contains(&format!(
            "[todo-api] local config loaded port={} db_path={} write_limit_window_seconds={} write_limit_max={}",
            runtime_config.http_port,
            runtime_config.db_path,
            runtime_config.rate_limit_window_seconds,
            runtime_config.rate_limit_max_requests,
        )),
        "expected local config log before the bad-db-path failure, got:\n{}",
        run.combined
    );
    assert!(
        run.combined.contains("[todo-api] Database init failed:"),
        "expected explicit bad-db-path startup failure, got:\n{}",
        run.combined
    );
    assert!(
        !run.combined.contains("[todo-api] SQLite schema ready"),
        "bad-db-path rail must not claim schema readiness:\n{}",
        run.combined
    );
    assert!(
        !run.combined.contains("[todo-api] local runtime ready"),
        "bad-db-path rail must not claim runtime readiness:\n{}",
        run.combined
    );
    assert!(
        !run.combined
            .contains("[todo-api] HTTP server starting on :"),
        "bad-db-path rail must fail before HTTP starts:\n{}",
        run.combined
    );
    assert!(
        !run.combined.contains("runtime bootstrap"),
        "local SQLite negative rail must stay cluster-free:\n{}",
        run.combined
    );

    todo::assert_health_unreachable(&runtime_config, &artifacts, "bad-db-path-health");
}
