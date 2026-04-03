from Config import database_url_key, port_key, todo_rate_limit_window_seconds_key, todo_rate_limit_max_requests_key, missing_required_env, invalid_positive_int

describe("Config helpers") do
  test("exposes the canonical environment variable keys") do
    assert_eq(database_url_key(), "DATABASE_URL")
    assert_eq(port_key(), "PORT")
    assert_eq(todo_rate_limit_window_seconds_key(), "TODO_RATE_LIMIT_WINDOW_SECONDS")
    assert_eq(todo_rate_limit_max_requests_key(), "TODO_RATE_LIMIT_MAX_REQUESTS")
  end

  test("formats missing-env and invalid-int messages") do
    assert_eq(missing_required_env(database_url_key()), "Missing required environment variable DATABASE_URL")
    assert_eq(invalid_positive_int(todo_rate_limit_window_seconds_key()), "Invalid TODO_RATE_LIMIT_WINDOW_SECONDS: expected a positive integer")
    assert_eq(invalid_positive_int(todo_rate_limit_max_requests_key()), "Invalid TODO_RATE_LIMIT_MAX_REQUESTS: expected a positive integer")
  end
end
