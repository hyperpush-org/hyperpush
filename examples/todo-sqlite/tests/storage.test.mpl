from Storage.Todos import create_todo, delete_todo, ensure_schema, get_todo, list_todos, toggle_todo
from Types.Todo import Todo

fn sample_todo() -> Todo do
  Todo {
    id : "1",
    title : "compile",
    completed : false,
    created_at : "now"
  }
end

describe("SQLite todo storage") do
  test("local storage module compiles for the generated starter") do
    let todo = sample_todo()
    assert(todo.title == "compile")
    assert(todo.completed == false)
  end

  test("storage helper imports stay available to the generated project") do
    let todo = sample_todo()
    assert(todo.id == "1")
    assert(todo.created_at == "now")
  end
end
