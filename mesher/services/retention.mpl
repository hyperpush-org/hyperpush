# Retention cleaner actor for periodic data cleanup.
# Runs daily to delete expired events per-project based on retention_days setting,
# then drops any event partitions older than the maximum retention period (90 days).
# Follows Timer.sleep + recursive call pattern (established in pipeline.mpl).

from Storage.Queries import delete_expired_events, get_all_project_retention, get_expired_partitions, drop_partition

# Log helpers (extracted for single-expression case arms, decision [88-02]).

fn log_cleanup_result(deleted :: Int) do
  println("[Mesher] Retention cleanup: deleted #{deleted} expired events")
  0
end

fn log_cleanup_error(e :: String) do
  println("[Mesher] Retention cleanup error: #{e}")
  0
end

fn log_partition_drop(name :: String) do
  println("[Mesher] Dropped expired partition: #{name}")
  0
end

# Loop through projects list by index, deleting expired events for each.
# Accumulates total deleted count across all projects.

fn cleanup_projects_loop(pool :: PoolHandle, projects, i :: Int, total :: Int, deleted :: Int) -> Int ! String do
  if i < total do
    let row = List.get(projects, i)
    let id = Map.get(row, "id")
    let retention_days_str = Map.get(row, "retention_days")
    let count = delete_expired_events(pool, id, retention_days_str) ?
    cleanup_projects_loop(pool, projects, i + 1, total, deleted + count)
  else
    Ok(deleted)
  end
end

# Loop through expired partitions, dropping each one.

fn drop_partitions_loop(pool :: PoolHandle, partitions, i :: Int, total :: Int) -> Int ! String do
  if i < total do
    let row = List.get(partitions, i)
    let partition_name = Map.get(row, "partition_name")
    drop_partition(pool, partition_name) ?
    log_partition_drop(partition_name)
    drop_partitions_loop(pool, partitions, i + 1, total)
  else
    Ok(total)
  end
end

# Orchestration: run per-project deletion then global partition cleanup.

fn run_retention_cleanup(pool :: PoolHandle) -> Int ! String do
  let projects = get_all_project_retention(pool) ?
  let deleted = cleanup_projects_loop(pool, projects, 0, List.length(projects), 0) ?
  let partitions = get_expired_partitions(pool, "90") ?
  drop_partitions_loop(pool, partitions, 0, List.length(partitions)) ?
  Ok(deleted)
end

# Retention cleaner actor -- runs every 24 hours (86400000ms).
# Iterates all projects to delete expired events per their retention_days setting,
# then drops any partitions older than 90 days (the maximum retention period).

actor retention_cleaner(pool :: PoolHandle) do
  Timer.sleep(86400000)
  
  let result = run_retention_cleanup(pool)
  
  case result do
    Ok( n) -> log_cleanup_result(n)
    Err( e) -> log_cleanup_error(e)
  end
  
  retention_cleaner(pool)
end
