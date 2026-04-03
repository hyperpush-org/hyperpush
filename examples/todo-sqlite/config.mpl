pub fn todo_db_path_key() -> String do
  "TODO_DB_PATH"
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

pub fn default_todo_db_path() -> String do
  "todo.sqlite3"
end

pub fn invalid_positive_int(name :: String) -> String do
  "Invalid #{name}: expected a positive integer"
end

pub fn invalid_db_path(name :: String) -> String do
  "Invalid #{name}: expected a non-empty path"
end

pub fn invalid_todo_id_message() -> String do
  "invalid todo id"
end

pub fn title_required_message() -> String do
  "title is required"
end

pub fn todo_not_found_message() -> String do
  "todo not found"
end
