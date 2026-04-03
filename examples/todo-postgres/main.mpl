from Config import database_url_key, port_key, todo_rate_limit_max_requests_key, todo_rate_limit_window_seconds_key, invalid_positive_int, missing_required_env
from Api.Router import build_router
from Runtime.Registry import start_registry
from Services.RateLimiter import start_rate_limiter

fn log_bootstrap(status :: BootstrapStatus) do
  println(
    "[todo-api] runtime bootstrap mode=#{status.mode} node=#{status.node_name} cluster_port=#{status.cluster_port} discovery_seed=#{status.discovery_seed}"
  )
end

fn log_bootstrap_failure(reason :: String) do
  println("[todo-api] runtime bootstrap failed reason=#{reason}")
end

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

fn start_runtime(port :: Int, window_seconds :: Int, max_requests :: Int) do
  println(
    "[todo-api] Runtime ready port=#{port} db_backend=postgres write_limit_window_seconds=#{window_seconds} write_limit_max=#{max_requests}"
  )
  let router = build_router()
  println("[todo-api] HTTP server starting on :#{port}")
  HTTP.serve(router, port)
end

fn on_pool_ready(port :: Int, window_seconds :: Int, max_requests :: Int, pool :: PoolHandle) do
  println("[todo-api] PostgreSQL pool ready")
  let limiter_pid = start_rate_limiter(window_seconds, max_requests)
  start_registry(pool, limiter_pid, window_seconds, max_requests)
  println("[todo-api] Runtime registry ready")
  start_runtime(port, window_seconds, max_requests)
end

fn maybe_boot_with_pool(port :: Int, window_seconds :: Int, max_requests :: Int, pool :: PoolHandle) do
  case Node.start_from_env() do
    Ok( status) -> do
      log_bootstrap(status)
      on_pool_ready(port, window_seconds, max_requests, pool)
    end
    Err( reason) -> log_bootstrap_failure(reason)
  end
end

fn start_with_values(database_url :: String, port :: Int, window_seconds :: Int, max_requests :: Int) do
  println(
    "[todo-api] Config loaded port=#{port} write_limit_window_seconds=#{window_seconds} write_limit_max=#{max_requests}"
  )
  println("[todo-api] Connecting to PostgreSQL pool...")
  let pool_result = Pool.open(database_url, 1, 4, 5000)
  case pool_result do
    Ok( pool) -> maybe_boot_with_pool(port, window_seconds, max_requests, pool)
    Err( e) -> println("[todo-api] PostgreSQL connect failed: #{e}")
  end
end

fn maybe_start_with_max_requests(database_url :: String, port :: Int, window_seconds :: Int) do
  let max_requests_env = todo_rate_limit_max_requests_key()
  case optional_positive_env_int(max_requests_env, 5) do
    Ok( max_requests) -> start_with_values(database_url, port, window_seconds, max_requests)
    Err( message) -> log_config_error(message)
  end
end

fn maybe_start_with_window_seconds(database_url :: String, port :: Int) do
  let window_seconds_env = todo_rate_limit_window_seconds_key()
  case optional_positive_env_int(window_seconds_env, 60) do
    Ok( window_seconds) -> maybe_start_with_max_requests(database_url, port, window_seconds)
    Err( message) -> log_config_error(message)
  end
end

fn maybe_start_with_port(database_url :: String) do
  let port_env = port_key()
  case optional_positive_env_int(port_env, 8080) do
    Ok( port) -> maybe_start_with_window_seconds(database_url, port)
    Err( message) -> log_config_error(message)
  end
end

fn main() do
  let database_url_env = database_url_key()
  let database_url = Env.get(database_url_env, "")
  if database_url == "" do
    log_config_error(missing_required_env(database_url_env))
  else
    maybe_start_with_port(database_url)
  end
end
