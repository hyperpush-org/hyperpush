from Config import default_todo_db_path, invalid_db_path, invalid_positive_int, port_key, todo_db_path_key, todo_rate_limit_max_requests_key, todo_rate_limit_window_seconds_key
from Api.Router import build_router
from Runtime.Registry import start_registry
from Services.RateLimiter import start_rate_limiter
from Storage.Todos import ensure_schema

fn log_config_error(message :: String) do
  println("[todo-api] Config error: #{message}")
end

fn optional_positive_env_int(name :: String, default_value :: Int) -> Int ! String do
  let raw = Env.get(name, "")
  if raw == "" do
    Ok(default_value)
  else
    let value = Env.get_int(name, -1)
    if value > 0 do
      Ok(value)
    else
      Err(invalid_positive_int(name))
    end
  end
end

fn resolve_db_path() -> String ! String do
  let key = todo_db_path_key()
  let raw = Env.get(key, default_todo_db_path())
  let trimmed = String.trim(raw)
  if trimmed == "" do
    Err(invalid_db_path(key))
  else
    Ok(trimmed)
  end
end

fn start_runtime(port :: Int, db_path :: String, window_seconds :: Int, max_requests :: Int) do
  let limiter_pid = start_rate_limiter(window_seconds, max_requests)
  start_registry(db_path, limiter_pid, window_seconds, max_requests)
  println(
    "[todo-api] local runtime ready port=#{port} db_backend=sqlite storage_mode=single-node db_path=#{db_path} write_limit_window_seconds=#{window_seconds} write_limit_max=#{max_requests}"
  )
  let router = build_router()
  println("[todo-api] HTTP server starting on :#{port}")
  HTTP.serve(router, port)
end

fn start_with_values(port :: Int, db_path :: String, window_seconds :: Int, max_requests :: Int) do
  println(
    "[todo-api] local config loaded port=#{port} db_path=#{db_path} write_limit_window_seconds=#{window_seconds} write_limit_max=#{max_requests}"
  )
  case ensure_schema(db_path) do
    Ok( _) -> do
      println("[todo-api] SQLite schema ready path=#{db_path}")
      start_runtime(port, db_path, window_seconds, max_requests)
    end
    Err( reason) -> println("[todo-api] Database init failed: #{reason}")
  end
end

fn maybe_start_with_max_requests(port :: Int, db_path :: String, window_seconds :: Int) do
  let max_requests_env = todo_rate_limit_max_requests_key()
  case optional_positive_env_int(max_requests_env, 5) do
    Ok( max_requests) -> start_with_values(port, db_path, window_seconds, max_requests)
    Err( message) -> log_config_error(message)
  end
end

fn maybe_start_with_window_seconds(port :: Int, db_path :: String) do
  let window_seconds_env = todo_rate_limit_window_seconds_key()
  case optional_positive_env_int(window_seconds_env, 60) do
    Ok( window_seconds) -> maybe_start_with_max_requests(port, db_path, window_seconds)
    Err( message) -> log_config_error(message)
  end
end

fn maybe_start_with_port(db_path :: String) do
  let port_env = port_key()
  case optional_positive_env_int(port_env, 8080) do
    Ok( port) -> maybe_start_with_window_seconds(port, db_path)
    Err( message) -> log_config_error(message)
  end
end

fn main() do
  case resolve_db_path() do
    Ok( db_path) -> maybe_start_with_port(db_path)
    Err( message) -> log_config_error(message)
  end
end
