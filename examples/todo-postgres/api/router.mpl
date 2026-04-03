from Api.Health import handle_health
from Api.Todos import handle_create_todo, handle_delete_todo, handle_get_todo, handle_list_todos, handle_toggle_todo

pub fn build_router() do
  let router = HTTP.router()
    |> HTTP.on_get("/health", handle_health)
    |> HTTP.on_get("/todos", HTTP.clustered(1, handle_list_todos))
    |> HTTP.on_get("/todos/:id", HTTP.clustered(1, handle_get_todo))
    |> HTTP.on_post("/todos", handle_create_todo)
    |> HTTP.on_put("/todos/:id", handle_toggle_todo)
    |> HTTP.on_delete("/todos/:id", handle_delete_todo)
  router
end
