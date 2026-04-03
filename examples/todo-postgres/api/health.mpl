from Runtime.Registry import get_max_requests, get_window_seconds

pub fn handle_health(_request) do
  HTTP.response(200,
  json {
    status : "ok",
    db_backend : "postgres",
    migration_strategy : "meshc migrate",
    clustered_handler : "Work.sync_todos",
    rate_limit_window_seconds : get_window_seconds(),
    rate_limit_max_requests : get_max_requests()
  })
end
