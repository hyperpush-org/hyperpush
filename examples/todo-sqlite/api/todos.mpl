from Config import invalid_todo_id_message, title_required_message, todo_not_found_message
from Runtime.Registry import get_db_path, get_rate_limiter
from Services.RateLimiter import allow_write
from Storage.Todos import create_todo, delete_todo, get_todo, list_todos, toggle_todo
from Types.Todo import Todo

fn todo_to_json(todo :: Todo) -> String do
  Json.encode(todo)
end

fn require_param(request, name :: String) -> String do
  let value = Request.param(request, name)
  case value do
    Some( param) -> param
    None -> ""
  end
end

fn title_from_body(body :: String) -> String do
  String.trim(Json.get(body, "title"))
end

fn not_found_response() do
  HTTP.response(404, json { error : todo_not_found_message() })
end

fn bad_request_response(message :: String) do
  HTTP.response(400, json { error : message })
end

fn rate_limited_response() do
  HTTP.response(429, json { error : "rate limited" })
end

fn internal_error_response(reason :: String) do
  HTTP.response(500, json { error : reason })
end

fn todo_error_response(reason :: String) do
  if reason == todo_not_found_message() do
    not_found_response()
  else if reason == invalid_todo_id_message() do
    bad_request_response(reason)
  else if reason == title_required_message() do
    bad_request_response(reason)
  else
    internal_error_response(reason)
  end
end

fn allow_mutation() -> Bool do
  let limiter_pid = get_rate_limiter()
  allow_write(limiter_pid, "todo-write")
end

fn create_todo_with_title(db_path :: String, title :: String) do
  let result = create_todo(db_path, title)
  case result do
    Ok( todo) -> HTTP.response(201, todo_to_json(todo))
    Err( reason) -> todo_error_response(reason)
  end
end

fn create_todo_with_body(db_path :: String, body :: String) do
  let title = title_from_body(body)
  create_todo_with_title(db_path, title)
end

fn get_todo_response(db_path :: String, id :: String) do
  let result = get_todo(db_path, id)
  case result do
    Ok( todo) -> HTTP.response(200, todo_to_json(todo))
    Err( reason) -> todo_error_response(reason)
  end
end

fn toggle_todo_response(db_path :: String, id :: String) do
  let result = toggle_todo(db_path, id)
  case result do
    Ok( todo) -> HTTP.response(200, todo_to_json(todo))
    Err( reason) -> todo_error_response(reason)
  end
end

fn delete_todo_response(db_path :: String, id :: String) do
  let result = delete_todo(db_path, id)
  case result do
    Ok( deleted_id) -> HTTP.response(200, json { status : "deleted", id : deleted_id })
    Err( reason) -> todo_error_response(reason)
  end
end

pub fn handle_list_todos(_request :: Request) -> Response do
  case list_todos(get_db_path()) do
    Ok( todos_json) -> HTTP.response(200, todos_json)
    Err( reason) -> internal_error_response(reason)
  end
end

pub fn handle_get_todo(request :: Request) -> Response do
  let id = require_param(request, "id")
  get_todo_response(get_db_path(), id)
end

pub fn handle_create_todo(request) do
  if allow_mutation() do
    create_todo_with_body(get_db_path(), Request.body(request))
  else
    rate_limited_response()
  end
end

pub fn handle_toggle_todo(request) do
  if allow_mutation() do
    let id = require_param(request, "id")
    toggle_todo_response(get_db_path(), id)
  else
    rate_limited_response()
  end
end

pub fn handle_delete_todo(request) do
  if allow_mutation() do
    let id = require_param(request, "id")
    delete_todo_response(get_db_path(), id)
  else
    rate_limited_response()
  end
end
