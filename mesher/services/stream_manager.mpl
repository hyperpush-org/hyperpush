# StreamManager service -- per-connection subscription state for WebSocket streaming clients.
# Tracks which connections are streaming clients, their project association,
# and filter preferences (level, environment) for targeted event delivery.
# Buffer fields (buffer, buffer_len, max_buffer) support backpressure;
# BufferMessage/DrainBuffers handlers queue and flush buffered messages (STREAM-05).

struct ConnectionState do
  project_id :: String
  level_filter :: String
  # "" means no filter (accept all)
  env_filter :: String
  # "" means no filter (accept all)
  buffer :: List < String >
  # pending messages for slow client
  buffer_len :: Int
  max_buffer :: Int
  # drop oldest when exceeded (default 100)
end

struct StreamState do
  connections :: Map < Int, ConnectionState >
  # conn_handle -> state
end

# --- Helper functions (outside service block per established pattern) ---

fn register_client(state :: StreamState,
conn :: Int,
project_id :: String,
level_filter :: String,
env_filter :: String) -> StreamState do
  let cs = ConnectionState {
    project_id : project_id,
    level_filter : level_filter,
    env_filter : env_filter,
    buffer : List.new(),
    buffer_len : 0,
    max_buffer : 100
  }
  let new_conns = Map.put(state.connections, conn, cs)
  StreamState { connections : new_conns }
end

fn remove_client(state :: StreamState, conn :: Int) -> StreamState do
  let new_conns = Map.delete(state.connections, conn)
  StreamState { connections : new_conns }
end

fn is_stream_client(state :: StreamState, conn :: Int) -> Bool do
  Map.has_key(state.connections, conn)
end

fn get_project_id(state :: StreamState, conn :: Int) -> String do
  let has = Map.has_key(state.connections, conn)
  if has do
    let cs = Map.get(state.connections, conn)
    cs.project_id
  else
    ""
  end
end

# AND helper for filter matching -- avoids && codegen issue inside nested if blocks.

fn both_match(a :: Bool, b :: Bool) -> Bool do
  if a do
    b
  else
    false
  end
end

fn matches_filter(state :: StreamState, conn :: Int, level :: String, environment :: String) -> Bool do
  let has = Map.has_key(state.connections, conn)
  if has do
    let cs = Map.get(state.connections, conn)
    let level_ok = if cs.level_filter == "" do
      true
    else
      cs.level_filter == level
    end
    let env_ok = if cs.env_filter == "" do
      true
    else
      cs.env_filter == environment
    end
    both_match(level_ok, env_ok)
  else
    false
  end
end

# --- Buffer management helpers (STREAM-05 backpressure) ---
# Queue a message for a connection with drop-oldest when max_buffer exceeded.
# Same drop-oldest pattern as StorageWriter (writer.mpl).

fn buffer_message_for_conn(state :: StreamState, conn :: Int, msg :: String) -> StreamState do
  let cs = Map.get(state.connections, conn)
  let appended = List.append(cs.buffer, msg)
  let new_len = cs.buffer_len + 1
  # Drop oldest if over capacity (same pattern as StorageWriter)
  let buf = if new_len > cs.max_buffer do
    List.drop(appended, new_len - cs.max_buffer)
  else
    appended
  end
  let blen = if new_len > cs.max_buffer do
    cs.max_buffer
  else
    new_len
  end
  let new_cs = ConnectionState {
    project_id : cs.project_id,
    level_filter : cs.level_filter,
    env_filter : cs.env_filter,
    buffer : buf,
    buffer_len : blen,
    max_buffer : cs.max_buffer
  }
  let new_conns = Map.put(state.connections, conn, new_cs)
  StreamState { connections : new_conns }
end

# buffer_if_client: Guards BufferMessage cast -- only buffers if conn is a registered streaming client.
# Extracted from cast body to avoid parser limitation with if/else in cast handlers.

fn buffer_if_client(state :: StreamState, conn :: Int, msg :: String) -> StreamState do
  let has = is_stream_client(state, conn)
  if has do
    buffer_message_for_conn(state, conn, msg)
  else
    state
  end
end

# --- Buffer drain helpers (STREAM-05 backpressure) ---
# Drain all connection buffers by iterating connections and sending buffered messages via Ws.send.
# On send failure (Ws.send returns -1), the connection is removed.
# Functions ordered bottom-up: leaf functions first, then callers (Mesh requires define-before-use).

fn send_buffer_loop(conn :: Int, buffer, i :: Int, total :: Int) -> Int do
  if i < total do
    let msg = List.get(buffer, i)
    let result = Ws.send(conn, msg)
    if result == -1 do
      -1
    else
      send_buffer_loop(conn, buffer, i + 1, total)
    end
  else
    0
  end
end

fn drain_single_connection(state :: StreamState, conn :: Int) -> StreamState do
  let cs = Map.get(state.connections, conn)
  if cs.buffer_len > 0 do
    let send_ok = send_buffer_loop(conn, cs.buffer, 0, cs.buffer_len)
    if send_ok == 0 do
      # All sends succeeded -- clear buffer
      let cleared_cs = ConnectionState {
        project_id : cs.project_id,
        level_filter : cs.level_filter,
        env_filter : cs.env_filter,
        buffer : List.new(),
        buffer_len : 0,
        max_buffer : cs.max_buffer
      }
      let new_conns = Map.put(state.connections, conn, cleared_cs)
      StreamState { connections : new_conns }
    else
      # Ws.send returned -1 (connection error) -- remove this connection
      remove_client(state, conn)
    end
  else
    state
  end
end

fn drain_connections_loop(state :: StreamState, conns, i :: Int, total :: Int) -> StreamState do
  if i < total do
    let conn = List.get(conns, i)
    let new_state = drain_single_connection(state, conn)
    drain_connections_loop(new_state, conns, i + 1, total)
  else
    state
  end
end

fn drain_all_buffers(state :: StreamState) -> StreamState do
  let conns = Map.keys(state.connections)
  drain_connections_loop(state, conns, 0, List.length(conns))
end

# --- StreamManager Service ---
# Per-connection subscription state for WebSocket streaming clients.
# RegisterClient/RemoveClient are casts (fire-and-forget state updates).
# IsStreamClient/GetProjectId/MatchesFilter are calls (synchronous queries).

service StreamManager do
  fn init() -> StreamState do
    StreamState { connections : Map.new() }
  end
  
  # Register a streaming client connection with project and filter preferences
  
  cast RegisterClient(conn :: Int,
  project_id :: String,
  level_filter :: String,
  env_filter :: String) do|state|
    register_client(state, conn, project_id, level_filter, env_filter)
  end
  
  # Remove a connection (called on disconnect)
  
  cast RemoveClient(conn :: Int) do|state|
    remove_client(state, conn)
  end
  
  # Check if a connection is a streaming client (vs ingestion client)
  
  call IsStreamClient(conn :: Int) :: Bool do|state|
    (state, is_stream_client(state, conn))
  end
  
  # Get the project_id for a streaming client
  
  call GetProjectId(conn :: Int) :: String do|state|
    (state, get_project_id(state, conn))
  end
  
  # Check if an event matches a connection's filters
  
  call MatchesFilter(conn :: Int, level :: String, environment :: String) :: Bool do|state|
    (state, matches_filter(state, conn, level, environment))
  end
  
  # Buffer a message for a slow client with drop-oldest backpressure (STREAM-05)
  
  cast BufferMessage(conn :: Int, msg :: String) do|state|
    buffer_if_client(state, conn, msg)
  end
  
  # Drain all connection buffers -- called by stream_drain_ticker periodically
  
  cast DrainBuffers() do|state|
    drain_all_buffers(state)
  end
end
