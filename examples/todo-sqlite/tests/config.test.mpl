from Config import default_todo_db_path, invalid_db_path, invalid_positive_int, invalid_todo_id_message, port_key, title_required_message, todo_db_path_key, todo_not_found_message, todo_rate_limit_max_requests_key, todo_rate_limit_window_seconds_key

describe("SQLite todo-api config") do
  test("exposes local environment keys and defaults") do
    assert_eq(port_key(), "PORT")
    assert_eq(todo_db_path_key(), "TODO_DB_PATH")
    assert_eq(default_todo_db_path(), "todo.sqlite3")
    assert_eq(todo_rate_limit_window_seconds_key(), "TODO_RATE_LIMIT_WINDOW_SECONDS")
    assert_eq(todo_rate_limit_max_requests_key(), "TODO_RATE_LIMIT_MAX_REQUESTS")
  end

  test("formats local validation messages") do
    assert_eq(invalid_positive_int(port_key()), "Invalid PORT: expected a positive integer")
    assert_eq(invalid_positive_int(todo_rate_limit_window_seconds_key()), "Invalid TODO_RATE_LIMIT_WINDOW_SECONDS: expected a positive integer")
    assert_eq(invalid_positive_int(todo_rate_limit_max_requests_key()), "Invalid TODO_RATE_LIMIT_MAX_REQUESTS: expected a positive integer")
    assert_eq(invalid_db_path(todo_db_path_key()), "Invalid TODO_DB_PATH: expected a non-empty path")
    assert_eq(invalid_todo_id_message(), "invalid todo id")
    assert_eq(title_required_message(), "title is required")
    assert_eq(todo_not_found_message(), "todo not found")
  end
end
