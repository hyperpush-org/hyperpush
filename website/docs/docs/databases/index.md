---
title: Databases
description: SQLite, PostgreSQL, connection pooling, and struct mapping in Mesh
---

# Databases

Mesh has built-in support for SQLite and PostgreSQL databases. You can run queries, manage transactions, pool connections, and map database rows directly to structs -- all without external dependencies.

> **Production backend proof:** This guide covers the database APIs themselves. For the repo-backed proof that wires Postgres migrations, runtime health, deploy artifacts, and supervised job processing together, use [Production Backend Proof](/docs/production-backend-proof/) and `reference-backend/README.md`.

## SQLite

SQLite is an embedded database that stores data in a single file (or in memory). Use the `Sqlite` module for all SQLite operations.

### Opening a Database

Use `Sqlite.open` with a file path or `":memory:"` for an in-memory database:

```mesh
fn main() do
  let db = Sqlite.open(":memory:")?
  println("database opened")
  Sqlite.close(db)
end
```

`Sqlite.open` returns a `Result` -- use the `?` operator to propagate errors, or pattern match with `case` to handle them explicitly.

### Creating Tables

Use `Sqlite.execute` for DDL statements (CREATE TABLE, ALTER TABLE, etc.) and DML statements (INSERT, UPDATE, DELETE):

```mesh
fn run_db() -> Int!String do
  let db = Sqlite.open(":memory:")?

  let _ = Sqlite.execute(db, "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age TEXT NOT NULL)", [])?

  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

The third argument is a list of parameters for parameterized queries. Pass an empty list `[]` when there are no parameters.

### Inserting Data

Use `Sqlite.execute` with parameterized queries to insert data safely. Parameters use `?` placeholders:

```mesh
fn run_db() -> Int!String do
  let db = Sqlite.open(":memory:")?

  let _ = Sqlite.execute(db, "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age TEXT NOT NULL)", [])?

  let inserted1 = Sqlite.execute(db, "INSERT INTO users (name, age) VALUES (?, ?)", ["Alice", "30"])?
  println("${inserted1}")

  let inserted2 = Sqlite.execute(db, "INSERT INTO users (name, age) VALUES (?, ?)", ["Bob", "25"])?
  println("${inserted2}")

  Sqlite.close(db)
  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

`Sqlite.execute` returns the number of rows affected as an `Int!String` result.

### Querying Data

Use `Sqlite.query` to run SELECT statements. Results are returned as a list of maps, where each map represents a row with column names as keys:

```mesh
fn run_db() -> Int!String do
  let db = Sqlite.open(":memory:")?

  let _ = Sqlite.execute(db, "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age TEXT NOT NULL)", [])?
  let _ = Sqlite.execute(db, "INSERT INTO users (name, age) VALUES (?, ?)", ["Alice", "30"])?
  let _ = Sqlite.execute(db, "INSERT INTO users (name, age) VALUES (?, ?)", ["Bob", "25"])?

  let rows = Sqlite.query(db, "SELECT name, age FROM users ORDER BY name", [])?

  List.map(rows, fn(row) do
    let name = Map.get(row, "name")
    let age = Map.get(row, "age")
    println(name <> ":" <> age)
  end)

  # Parameterized WHERE clause
  let filtered = Sqlite.query(db, "SELECT name FROM users WHERE age = ?", ["30"])?
  List.map(filtered, fn(row) do
    let name = Map.get(row, "name")
    println("filtered:" <> name)
  end)

  Sqlite.close(db)
  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

Each row is a `Map<String, String>` -- all values are returned as strings regardless of the column type. Use `Map.get(row, "column_name")` to access individual fields.

### Closing

Always close the database when done:

```mesh
Sqlite.close(db)
```

### SQLite API Reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `Sqlite.open(path)` | `String -> Db!String` | Open a database file or `":memory:"` |
| `Sqlite.execute(db, sql, params)` | `Db, String, List -> Int!String` | Run INSERT/UPDATE/DELETE, returns rows affected |
| `Sqlite.query(db, sql, params)` | `Db, String, List -> List!String` | Run SELECT, returns list of row maps |
| `Sqlite.close(db)` | `Db -> ()` | Close the database connection |

## PostgreSQL

Use the `Pg` module to connect to a PostgreSQL database. The API is similar to SQLite but uses connection strings and `$N` parameter placeholders.

### Connecting

Use `Pg.connect` with a PostgreSQL connection string:

```mesh
fn run_db() -> Int!String do
  let conn = Pg.connect("postgres://user:pass@localhost:5432/mydb")?
  println("connected")
  Pg.close(conn)
  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

The connection string format is `postgres://user:password@host:port/database`.

### Creating Tables and Inserting Data

PostgreSQL uses `$1`, `$2`, etc. for parameterized queries (instead of SQLite's `?` placeholders):

```mesh
fn run_db() -> Int!String do
  let conn = Pg.connect("postgres://user:pass@localhost:5432/mydb")?

  let _ = Pg.execute(conn, "DROP TABLE IF EXISTS users", [])?

  let created = Pg.execute(conn, "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, age INTEGER NOT NULL)", [])?
  println("created: ${created}")

  let ins1 = Pg.execute(conn, "INSERT INTO users (name, age) VALUES ($1, $2)", ["Alice", "30"])?
  println("inserted: ${ins1}")

  let ins2 = Pg.execute(conn, "INSERT INTO users (name, age) VALUES ($1, $2)", ["Bob", "25"])?
  println("inserted: ${ins2}")

  Pg.close(conn)
  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

### Querying Data

Use `Pg.query` to run SELECT statements. Like SQLite, results are returned as a list of maps:

```mesh
fn run_db() -> Int!String do
  let conn = Pg.connect("postgres://user:pass@localhost:5432/mydb")?

  let rows = Pg.query(conn, "SELECT id, name, age FROM users ORDER BY name", [])?
  List.map(rows, fn(row) do
    let name = Map.get(row, "name")
    let age = Map.get(row, "age")
    println(name <> " is " <> age)
  end)

  # Query with parameter
  let filtered = Pg.query(conn, "SELECT name FROM users WHERE age > $1", ["26"])?
  List.map(filtered, fn(row) do
    let name = Map.get(row, "name")
    println("older: " <> name)
  end)

  Pg.close(conn)
  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

### PostgreSQL API Reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `Pg.connect(url)` | `String -> Conn!String` | Connect to a PostgreSQL server |
| `Pg.execute(conn, sql, params)` | `Conn, String, List -> Int!String` | Run INSERT/UPDATE/DELETE, returns rows affected |
| `Pg.query(conn, sql, params)` | `Conn, String, List -> List!String` | Run SELECT, returns list of row maps |
| `Pg.close(conn)` | `Conn -> ()` | Close the connection |

## Transactions

### SQLite Transactions

Use `Sqlite.begin`, `Sqlite.commit`, and `Sqlite.rollback` for explicit transaction control:

```mesh
# Derived from runtime API
fn run_db() -> Int!String do
  let db = Sqlite.open(":memory:")?
  let _ = Sqlite.execute(db, "CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance INTEGER)", [])?
  let _ = Sqlite.execute(db, "INSERT INTO accounts (balance) VALUES (?)", ["100"])?

  let _ = Sqlite.begin(db)?
  let _ = Sqlite.execute(db, "UPDATE accounts SET balance = balance - 50 WHERE id = 1", [])?
  let _ = Sqlite.execute(db, "UPDATE accounts SET balance = balance + 50 WHERE id = 2", [])?
  let _ = Sqlite.commit(db)?

  Sqlite.close(db)
  Ok(0)
end
```

If any statement between `begin` and `commit` fails, call `Sqlite.rollback(db)` to undo the changes.

### PostgreSQL Transactions

PostgreSQL supports the same `begin`/`commit`/`rollback` pattern:

```mesh
# Derived from runtime API
fn transfer(conn, from_id, to_id, amount) -> Int!String do
  let _ = Pg.begin(conn)?
  let _ = Pg.execute(conn, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, from_id])?
  let _ = Pg.execute(conn, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, to_id])?
  let _ = Pg.commit(conn)?
  Ok(0)
end
```

PostgreSQL also provides `Pg.transaction` for callback-based transactions that automatically commit on success and rollback on failure:

```mesh
# Derived from runtime API
fn main() do
  let conn = Pg.connect("postgres://user:pass@localhost:5432/mydb")?
  let result = Pg.transaction(conn, fn(tx) do
    let _ = Pg.execute(tx, "INSERT INTO logs (msg) VALUES ($1)", ["hello"])?
    Ok(42)
  end)
  case result do
    Ok(val) -> println("committed: ${val}")
    Err(msg) -> println("rolled back: ${msg}")
  end
end
```

### Transaction API Reference

| Function | Description |
|----------|-------------|
| `Sqlite.begin(db)` | Start a SQLite transaction |
| `Sqlite.commit(db)` | Commit the current SQLite transaction |
| `Sqlite.rollback(db)` | Rollback the current SQLite transaction |
| `Pg.begin(conn)` | Start a PostgreSQL transaction |
| `Pg.commit(conn)` | Commit the current PostgreSQL transaction |
| `Pg.rollback(conn)` | Rollback the current PostgreSQL transaction |
| `Pg.transaction(conn, fn)` | Run a function inside a transaction (auto commit/rollback) |

## Connection Pooling

For production applications, use connection pooling to share a fixed set of database connections across multiple concurrent actors. The `Pool` module manages a pool of PostgreSQL connections:

```mesh
# Derived from runtime API
fn main() do
  let pool = Pool.open("postgres://user:pass@localhost:5432/mydb", 2, 10, 5000)?

  let rows = Pool.query(pool, "SELECT * FROM users", [])?
  List.map(rows, fn(row) do
    let name = Map.get(row, "name")
    println(name)
  end)

  let _ = Pool.execute(pool, "INSERT INTO users (name) VALUES ($1)", ["Charlie"])?

  Pool.close(pool)
end
```

### Pool.open Parameters

`Pool.open(url, min, max, timeout_ms)` creates a pool with:

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `String` | PostgreSQL connection string |
| `min` | `Int` | Minimum connections to pre-create |
| `max` | `Int` | Maximum connections allowed |
| `timeout_ms` | `Int` | How long to wait (ms) if all connections are busy |

The pool pre-creates `min` connections at startup. When a query runs and no idle connections are available, the pool creates new connections up to `max`. If all connections are busy, the caller blocks until one becomes available or the timeout expires.

### Automatic Connection Management

`Pool.query` and `Pool.execute` handle connection checkout and return automatically. You do not need to manually manage individual connections:

1. A connection is checked out from the pool
2. The query or statement is executed
3. The connection is returned to the pool (even on error)

If a connection has a pending transaction when returned, it is automatically rolled back.

### Manual Checkout

For advanced use cases (multiple queries on the same connection), use `Pool.checkout` and `Pool.checkin`:

```mesh
# Derived from runtime API
fn main() do
  let pool = Pool.open("postgres://...", 2, 10, 5000)?
  let conn = Pool.checkout(pool)?

  # Use the connection directly with Pg functions
  let _ = Pg.execute(conn, "INSERT INTO users (name) VALUES ($1)", ["Alice"])?
  let rows = Pg.query(conn, "SELECT * FROM users", [])?

  Pool.checkin(pool, conn)
  Pool.close(pool)
end
```

### Pool API Reference

| Function | Description |
|----------|-------------|
| `Pool.open(url, min, max, timeout_ms)` | Create a connection pool |
| `Pool.query(pool, sql, params)` | Auto checkout, query, checkin |
| `Pool.execute(pool, sql, params)` | Auto checkout, execute, checkin |
| `Pool.checkout(pool)` | Manually borrow a connection |
| `Pool.checkin(pool, conn)` | Return a connection to the pool |
| `Pool.close(pool)` | Drain all connections and close the pool |

## Struct Mapping

Use `deriving(Row)` to automatically map database rows to structs. This generates a `from_row` function that converts a `Map<String, String>` (as returned by `Sqlite.query` and `Pg.query`) into your struct:

```mesh
struct User do
  name :: String
  age :: Int
  score :: Float
  active :: Bool
end deriving(Row)

fn main() do
  let row = Map.new()
  let row = Map.put(row, "name", "Alice")
  let row = Map.put(row, "age", "30")
  let row = Map.put(row, "score", "95.5")
  let row = Map.put(row, "active", "t")

  let result = User.from_row(row)
  case result do
    Ok(u) -> println("${u.name} ${u.age} ${u.score} ${u.active}")
    Err(e) -> println("Error: ${e}")
  end
end
```

### Supported Field Types

The `from_row` function automatically converts string values from the database to the struct's field types:

| Struct Field Type | Conversion |
|-------------------|------------|
| `String` | Used as-is |
| `Int` | Parsed from string (e.g., `"30"` -> `30`) |
| `Float` | Parsed from string (e.g., `"95.5"` -> `95.5`) |
| `Bool` | Parsed from string (`"t"`, `"true"`, `"1"` -> `true`) |

### Using with Queries

Combine struct mapping with database queries to get typed results:

```mesh
struct User do
  name :: String
  age :: Int
end deriving(Row)

fn run_db() -> Int!String do
  let db = Sqlite.open(":memory:")?
  let _ = Sqlite.execute(db, "CREATE TABLE users (name TEXT, age INTEGER)", [])?
  let _ = Sqlite.execute(db, "INSERT INTO users VALUES (?, ?)", ["Alice", "30"])?

  let rows = Sqlite.query(db, "SELECT name, age FROM users", [])?

  List.map(rows, fn(row) do
    let result = User.from_row(row)
    case result do
      Ok(u) -> println("${u.name} is ${u.age}")
      Err(e) -> println("Error: ${e}")
    end
  end)

  Sqlite.close(db)
  Ok(0)
end

fn main() do
  let r = run_db()
  case r do
    Ok(_) -> println("done")
    Err(msg) -> println("error: " <> msg)
  end
end
```

## What's Next?

- [Web](/docs/web/) -- HTTP servers, routing, middleware, WebSocket, and TLS
- [Concurrency](/docs/concurrency/) -- actors, message passing, and supervision trees
- [Type System](/docs/type-system/) -- structs, sum types, generics, and deriving
