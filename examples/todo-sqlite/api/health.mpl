from Runtime.Registry import get_db_path, get_max_requests, get_window_seconds

pub fn handle_health(_request) do
  HTTP.response(200,
  json {
    status : "ok",
    mode : "local",
    db_backend : "sqlite",
    db_path : get_db_path(),
    storage_mode : "single-node",
    rate_limit_window_seconds : get_window_seconds(),
    rate_limit_max_requests : get_max_requests()
  })
end
