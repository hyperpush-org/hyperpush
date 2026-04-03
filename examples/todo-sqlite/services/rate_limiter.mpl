struct RateLimiterState do
  counts :: Map < String, Int >
  window_seconds :: Int
  max_requests :: Int
end

fn check_limit_impl(state :: RateLimiterState, key :: String) ->( RateLimiterState, Bool) do
  let count = Map.get(state.counts, key)
  let allowed = count < state.max_requests
  let next_counts = if allowed do
    Map.put(state.counts, key, count + 1)
  else
    state.counts
  end
  let next_state = RateLimiterState {
    counts : next_counts,
    window_seconds : state.window_seconds,
    max_requests : state.max_requests
  }
  (next_state, allowed)
end

fn reset_window_impl(state :: RateLimiterState) -> RateLimiterState do
  RateLimiterState {
    counts : Map.new(),
    window_seconds : state.window_seconds,
    max_requests : state.max_requests
  }
end

service TodoWriteRateLimiter do
  fn init(window_seconds :: Int, max_requests :: Int) -> RateLimiterState do
    RateLimiterState {
      counts : Map.new(),
      window_seconds : window_seconds,
      max_requests : max_requests
    }
  end

  call Check(key :: String) :: Bool do|state|
    check_limit_impl(state, key)
  end

  cast Reset() do|state|
    reset_window_impl(state)
  end
end

actor rate_window_ticker(limiter_pid, interval_ms :: Int) do
  Timer.sleep(interval_ms)
  TodoWriteRateLimiter.reset(limiter_pid)
  rate_window_ticker(limiter_pid, interval_ms)
end

pub fn start_rate_limiter(window_seconds :: Int, max_requests :: Int) do
  let limiter_pid = TodoWriteRateLimiter.start(window_seconds, max_requests)
  spawn(rate_window_ticker, limiter_pid, window_seconds * 1000)
  limiter_pid
end

pub fn allow_write(limiter_pid :: Pid, key :: String) -> Bool do
  TodoWriteRateLimiter.check(limiter_pid, key)
end
