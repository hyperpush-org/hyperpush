pub fn database_url_key() -> String do
  "DATABASE_URL"
end

pub fn port_key() -> String do
  "PORT"
end

pub fn todo_rate_limit_window_seconds_key() -> String do
  "TODO_RATE_LIMIT_WINDOW_SECONDS"
end

pub fn todo_rate_limit_max_requests_key() -> String do
  "TODO_RATE_LIMIT_MAX_REQUESTS"
end

pub fn missing_required_env(name :: String) -> String do
  "Missing required environment variable #{name}"
end

pub fn invalid_positive_int(name :: String) -> String do
  "Invalid #{name}: expected a positive integer"
end
