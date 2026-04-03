struct RegistryState do
  db_path :: String
  rate_limiter_pid :: Pid
  window_seconds :: Int
  max_requests :: Int
end

service TodoRegistry do
  fn init(db_path :: String, rate_limiter_pid :: Pid, window_seconds :: Int, max_requests :: Int) -> RegistryState do
    RegistryState {
      db_path : db_path,
      rate_limiter_pid : rate_limiter_pid,
      window_seconds : window_seconds,
      max_requests : max_requests
    }
  end

  call GetDbPath() :: String do|state|
    (state, state.db_path)
  end

  call GetRateLimiter() :: Pid do|state|
    (state, state.rate_limiter_pid)
  end

  call GetWindowSeconds() :: Int do|state|
    (state, state.window_seconds)
  end

  call GetMaxRequests() :: Int do|state|
    (state, state.max_requests)
  end
end

pub fn start_registry(db_path :: String, rate_limiter_pid :: Pid, window_seconds :: Int, max_requests :: Int) do
  let registry_pid = TodoRegistry.start(db_path, rate_limiter_pid, window_seconds, max_requests)
  Process.register("todo_api_registry", registry_pid)
  registry_pid
end

pub fn get_db_path() -> String do
  let registry_pid = Process.whereis("todo_api_registry")
  TodoRegistry.get_db_path(registry_pid)
end

pub fn get_rate_limiter() -> Pid do
  let registry_pid = Process.whereis("todo_api_registry")
  TodoRegistry.get_rate_limiter(registry_pid)
end

pub fn get_window_seconds() -> Int do
  let registry_pid = Process.whereis("todo_api_registry")
  TodoRegistry.get_window_seconds(registry_pid)
end

pub fn get_max_requests() -> Int do
  let registry_pid = Process.whereis("todo_api_registry")
  TodoRegistry.get_max_requests(registry_pid)
end
