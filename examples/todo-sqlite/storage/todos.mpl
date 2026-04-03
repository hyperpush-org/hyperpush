from Config import invalid_todo_id_message, title_required_message, todo_not_found_message
from Types.Todo import Todo

fn todo_from_row(row) -> Todo ! String do
  Todo.from_row(row)
end

fn rows_to_json_loop(rows, index :: Int, total :: Int, acc :: List < String >) -> List < String > ! String do
  if index >= total do
    Ok(acc)
  else
    let todo = todo_from_row(List.get(rows, index))?
    let encoded = Json.encode(todo)
    rows_to_json_loop(rows, index + 1, total, List.append(acc, encoded))
  end
end

fn normalized_title(title :: String) -> String ! String do
  let trimmed = String.trim(title)
  if String.length(trimmed) == 0 do
    Err(title_required_message())
  else
    Ok(trimmed)
  end
end

fn normalized_todo_id(id :: String) -> String ! String do
  let trimmed = String.trim(id)
  case String.to_int(trimmed) do
    Some( value) -> if value > 0 do
      Ok(String.from(value))
    else
      Err(invalid_todo_id_message())
    end
    None -> Err(invalid_todo_id_message())
  end
end

fn first_todo(rows) -> Todo ! String do
  if List.length(rows) == 0 do
    Err(todo_not_found_message())
  else
    todo_from_row(List.get(rows, 0))
  end
end

pub fn ensure_schema(db_path :: String) -> Int ! String do
  let db = Sqlite.open(db_path)?
  let applied = Sqlite.execute(
    db,
    "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)",
    []
  )?
  Sqlite.close(db)
  Ok(applied)
end

pub fn list_todos(db_path :: String) -> String ! String do
  let db = Sqlite.open(db_path)?
  let rows = Sqlite.query(db, "SELECT id, title, completed, created_at FROM todos ORDER BY id", [])?
  Sqlite.close(db)
  let encoded = rows_to_json_loop(rows, 0, List.length(rows), List.new())?
  Ok("[#{String.join(encoded, ",")}]")
end

pub fn get_todo(db_path :: String, id :: String) -> Todo ! String do
  let todo_id = normalized_todo_id(id)?
  let db = Sqlite.open(db_path)?
  let rows = Sqlite.query(db, "SELECT id, title, completed, created_at FROM todos WHERE id = ?", [todo_id])?
  Sqlite.close(db)
  first_todo(rows)
end

pub fn create_todo(db_path :: String, title :: String) -> Todo ! String do
  let normalized = normalized_title(title)?
  let db = Sqlite.open(db_path)?
  let created_at = DateTime.to_iso8601(DateTime.utc_now())
  let _ = Sqlite.execute(db, "INSERT INTO todos (title, completed, created_at) VALUES (?, ?, ?)", [normalized, "0", created_at])?
  let rows = Sqlite.query(db, "SELECT id, title, completed, created_at FROM todos WHERE id = last_insert_rowid()", [])?
  Sqlite.close(db)
  if List.length(rows) == 0 do
    Err("todo insert did not return a row")
  else
    todo_from_row(List.get(rows, 0))
  end
end

pub fn toggle_todo(db_path :: String, id :: String) -> Todo ! String do
  let current = get_todo(db_path, id)?
  let db = Sqlite.open(db_path)?
  let next_completed = if current.completed do
    "0"
  else
    "1"
  end
  let updated = Sqlite.execute(db, "UPDATE todos SET completed = ? WHERE id = ?", [next_completed, current.id])?
  let rows = Sqlite.query(db, "SELECT id, title, completed, created_at FROM todos WHERE id = ?", [current.id])?
  Sqlite.close(db)
  if updated == 0 do
    Err(todo_not_found_message())
  else
    first_todo(rows)
  end
end

pub fn delete_todo(db_path :: String, id :: String) -> String ! String do
  let current = get_todo(db_path, id)?
  let db = Sqlite.open(db_path)?
  let deleted = Sqlite.execute(db, "DELETE FROM todos WHERE id = ?", [current.id])?
  Sqlite.close(db)
  if deleted == 0 do
    Err(todo_not_found_message())
  else
    Ok(current.id)
  end
end
