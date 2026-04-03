from Types.Todo import Todo

fn todos_table() -> String do
  "todos"
end

fn row_to_todo(row) -> Todo do
  Todo {
    id : Map.get(row, "id"),
    title : Map.get(row, "title"),
    completed : Map.get(row, "completed") == "true",
    created_at : Map.get(row, "created_at")
  }
end

fn rows_to_json_loop(rows, index :: Int, total :: Int, acc :: List < String >) -> List < String > do
  if index >= total do
    acc
  else
    let encoded = Json.encode(row_to_todo(List.get(rows, index)))
    rows_to_json_loop(rows, index + 1, total, List.append(acc, encoded))
  end
end

fn todo_select_query() do
  Query.from(todos_table())
    |> Query.select_exprs([Expr.label(Pg.text(Expr.column("id")), "id"), Expr.label(Expr.column("title"), "title"), Expr.label(Pg.text(Expr.column("completed")), "completed"), Expr.label(Pg.text(Expr.column("created_at")), "created_at")])
end

fn todo_query_by_id(id :: String) do
  todo_select_query()
    |> Query.where_expr(Expr.eq(Expr.column("id"), Pg.uuid(Expr.value(id))))
end

fn find_single_todo(rows, missing_message :: String) -> Todo ! String do
  if List.length(rows) > 0 do
    Ok(row_to_todo(List.head(rows)))
  else
    Err(missing_message)
  end
end

fn bool_expr(value :: Bool) do
  if value do
    Pg.cast(Expr.value("true"), "boolean")
  else
    Pg.cast(Expr.value("false"), "boolean")
  end
end

fn update_completed_value(pool :: PoolHandle, id :: String, next_completed) -> Todo ! String do
  let q = Query.from(todos_table())
    |> Query.where_expr(Expr.eq(Expr.column("id"), Pg.uuid(Expr.value(id))))
  let updated_result = Repo.update_where_expr(pool, todos_table(), %{"completed" => next_completed}, q)
  case updated_result do
    Ok( _row) -> get_todo(pool, id)
    Err( reason) -> if String.contains(reason, "no rows matched") do
      Err("todo not found")
    else
      Err(reason)
    end
  end
end

fn continue_toggle_todo(pool :: PoolHandle, id :: String, current :: Todo) -> Todo ! String do
  let next_completed = if current.completed do
    bool_expr(false)
  else
    bool_expr(true)
  end
  update_completed_value(pool, id, next_completed)
end

fn delete_todo_with_current(pool :: PoolHandle, id :: String, current :: Todo) -> String ! String do
  let q = Query.from(todos_table())
    |> Query.where_expr(Expr.eq(Expr.column("id"), Pg.uuid(Expr.value(id))))
  let deleted = Repo.delete_where(pool, todos_table(), q) ?
  if deleted == 0 do
    Err("todo not found")
  else
    Ok(current.id)
  end
end

pub fn list_todos(pool :: PoolHandle) -> String ! String do
  let q = todo_select_query()
    |> Query.order_by(:created_at, :desc)
  let rows = Repo.all(pool, q) ?
  let encoded = rows_to_json_loop(rows, 0, List.length(rows), List.new())
  Ok("[#{String.join(encoded, ",")}]")
end

pub fn get_todo(pool :: PoolHandle, id :: String) -> Todo ! String do
  let rows = Repo.all(pool, todo_query_by_id(id)) ?
  find_single_todo(rows, "todo not found")
end

pub fn create_todo(pool :: PoolHandle, title :: String) -> Todo ! String do
  let row = Repo.insert_expr(pool,
  todos_table(),
  %{"title" => Expr.value(title), "completed" => bool_expr(false)}) ?
  let todo_id = Map.get(row, "id")
  get_todo(pool, todo_id)
end

pub fn toggle_todo(pool :: PoolHandle, id :: String) -> Todo ! String do
  let current_result = get_todo(pool, id)
  case current_result do
    Ok( current) -> continue_toggle_todo(pool, id, current)
    Err( reason) -> Err(reason)
  end
end

pub fn delete_todo(pool :: PoolHandle, id :: String) -> String ! String do
  let current_result = get_todo(pool, id)
  case current_result do
    Ok( current) -> delete_todo_with_current(pool, id, current)
    Err( reason) -> Err(reason)
  end
end
