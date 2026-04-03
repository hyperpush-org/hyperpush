# Migration: create_todos
# Initial todo schema for the Postgres todo-api starter.

pub fn up(pool :: PoolHandle) -> Int ! String do
  Pg.create_extension(pool, "pgcrypto") ?
  Migration.create_table(pool,
  "todos",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "title:TEXT:NOT NULL", "completed:BOOLEAN:NOT NULL DEFAULT false", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()"]) ?
  Migration.create_index(pool, "todos", ["created_at:DESC"], "name:idx_todos_created_at") ?
  Ok(0)
end

pub fn down(pool :: PoolHandle) -> Int ! String do
  Migration.drop_table(pool, "todos") ?
  Ok(0)
end
