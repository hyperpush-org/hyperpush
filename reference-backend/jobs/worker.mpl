from Types. Job import Job

from Storage. Jobs import claim_next_pending_job, reclaim_processing_jobs, mark_job_failed, mark_job_processed

from Runtime. Registry import get_poll_ms

struct WorkerState do
  poll_ms :: Int
  boot_id :: String
  started_at :: String
  last_tick_at :: String
  last_status :: String
  last_job_id :: String
  last_error :: String
  processed_jobs :: Int
  failed_jobs :: Int
  restart_count :: Int
  last_exit_reason :: String
  recovered_jobs :: Int
  last_recovery_at :: String
  last_recovery_job_id :: String
  last_recovery_count :: Int
end

service JobWorkerState do
  fn init(poll_ms :: Int) -> WorkerState do
    WorkerState { poll_ms : poll_ms, boot_id : "", started_at : "", last_tick_at : "", last_status : "starting", last_job_id : "", last_error : "", processed_jobs : 0, failed_jobs : 0, restart_count : 0, last_exit_reason : "", recovered_jobs : 0, last_recovery_at : "", last_recovery_job_id : "", last_recovery_count : 0 }
  end
  
  call GetPollMs() :: Int do|state|
    (state, state.poll_ms)
  end
  
  call GetBootId() :: String do|state|
    (state, state.boot_id)
  end
  
  call GetStartedAt() :: String do|state|
    (state, state.started_at)
  end
  
  call GetLastTickAt() :: String do|state|
    (state, state.last_tick_at)
  end
  
  call GetLastStatus() :: String do|state|
    (state, state.last_status)
  end
  
  call GetLastJobId() :: String do|state|
    (state, state.last_job_id)
  end
  
  call GetLastError() :: String do|state|
    (state, state.last_error)
  end
  
  call GetProcessedJobs() :: Int do|state|
    (state, state.processed_jobs)
  end
  
  call GetFailedJobs() :: Int do|state|
    (state, state.failed_jobs)
  end
  
  call GetRestartCount() :: Int do|state|
    (state, state.restart_count)
  end
  
  call GetLastExitReason() :: String do|state|
    (state, state.last_exit_reason)
  end
  
  call GetRecoveredJobs() :: Int do|state|
    (state, state.recovered_jobs)
  end
  
  call GetLastRecoveryAt() :: String do|state|
    (state, state.last_recovery_at)
  end
  
  call GetLastRecoveryJobId() :: String do|state|
    (state, state.last_recovery_job_id)
  end
  
  call GetLastRecoveryCount() :: Int do|state|
    (state, state.last_recovery_count)
  end
  
  call NoteBoot(ts :: String, boot_id :: String) :: Int do|state|
    let had_boot = String.length(state.started_at) > 0
    let next_status = if had_boot == true do
      "recovering"
    else
      "starting"
    end
    let next_restart_count = if had_boot == true do
      state.restart_count + 1
    else
      state.restart_count
    end
    let next_exit_reason = if had_boot == true do
      if state.last_status == "crashing" do
        if String.length(state.last_error) > 0 do
          state.last_error
        else
          "worker crashed unexpectedly"
        end
      else
        if state.last_status == "processing" do
          "worker exited while processing"
        else
          "worker restarted unexpectedly"
        end
      end
    else
      state.last_exit_reason
    end
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : boot_id, started_at : ts, last_tick_at : ts, last_status : next_status, last_job_id : state.last_job_id, last_error : "", processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs, restart_count : next_restart_count, last_exit_reason : next_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : 0 }
    (next_state, 0)
  end
  
  call NoteRecovery(ts :: String, recovery_count :: Int, last_job_id :: String) :: Int do|state|
    let next_status = if recovery_count > 0 do
      "recovering"
    else
      state.last_status
    end
    let next_recovery_at = if recovery_count > 0 do
      ts
    else
      state.last_recovery_at
    end
    let next_recovery_job_id = if recovery_count > 0 do
      last_job_id
    else
      state.last_recovery_job_id
    end
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : next_status, last_job_id : state.last_job_id, last_error : state.last_error, processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs + recovery_count, last_recovery_at : next_recovery_at, last_recovery_job_id : next_recovery_job_id, last_recovery_count : recovery_count }
    (next_state, 0)
  end
  
  call NoteTick(ts :: String) :: Int do|state|
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : state.last_status, last_job_id : state.last_job_id, last_error : state.last_error, processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : state.last_recovery_count }
    (next_state, 0)
  end
  
  call NoteIdle(ts :: String) :: Int do|state|
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : "idle", last_job_id : state.last_job_id, last_error : "", processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : state.last_recovery_count }
    (next_state, 0)
  end
  
  call NoteClaimed(ts :: String, job_id :: String) :: Int do|state|
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : "processing", last_job_id : job_id, last_error : "", processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : state.last_recovery_count }
    (next_state, 0)
  end
  
  call NoteProcessed(ts :: String, job_id :: String) :: Int do|state|
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : "processed", last_job_id : job_id, last_error : "", processed_jobs : state.processed_jobs + 1, failed_jobs : state.failed_jobs, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : state.last_recovery_count }
    (next_state, 0)
  end
  
  call NoteFailed(ts :: String, job_id :: String, error_message :: String) :: Int do|state|
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : "failed", last_job_id : job_id, last_error : error_message, processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs + 1, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : state.last_recovery_count }
    (next_state, 0)
  end
  
  call NoteCrashSoon(ts :: String, job_id :: String, error_message :: String) :: Int do|state|
    let next_state = WorkerState { poll_ms : state.poll_ms, boot_id : state.boot_id, started_at : state.started_at, last_tick_at : ts, last_status : "crashing", last_job_id : job_id, last_error : error_message, processed_jobs : state.processed_jobs, failed_jobs : state.failed_jobs, restart_count : state.restart_count, last_exit_reason : state.last_exit_reason, recovered_jobs : state.recovered_jobs, last_recovery_at : state.last_recovery_at, last_recovery_job_id : state.last_recovery_job_id, last_recovery_count : state.last_recovery_count }
    (next_state, 0)
  end
end

supervisor JobWorkerSupervisor do
  strategy : one_for_one
  
  max_restarts : 20
  
  max_seconds : 60
  
  child worker do
    start: fn->spawn(supervised_job_worker)end
    restart: permanent
    shutdown: 5000
  end
end

fn worker_state_pid() do
  Process.whereis("reference_backend_worker_state")
end

fn current_timestamp() -> String do
  DateTime.to_iso8601(DateTime.utc_now())
end

fn parse_attempts(value :: String) -> Int do
  let parsed = String.to_int(value)
  case parsed do
    Some( n) -> n
    None -> 0
  end
end

fn recovery_hint(restart_count :: Int) -> String do
  if restart_count > 0 do
    "requeued after worker restart"
  else
    "requeued abandoned processing job during boot recovery"
  end
end

fn log_worker_boot(boot_id :: String, restart_count :: Int) do
  let _ = println("[reference-backend] Job worker boot id=#{boot_id} restart_count=#{restart_count}")
  0
end

fn log_worker_recovery(recovery_count :: Int, last_job_id :: String) do
  if recovery_count > 0 do
    let _ = println("[reference-backend] Job worker recovered jobs=#{recovery_count} last_job_id=#{last_job_id}")
    0
  else
    0
  end
end

fn log_worker_idle() do
  let _ = println("[reference-backend] Job worker idle")
  0
end

fn log_worker_claim_miss(error_message :: String) do
  let _ = println("[reference-backend] Job worker contention miss treated as idle: #{error_message}")
  0
end

fn log_worker_claimed(job :: Job) do
  let _ = println("[reference-backend] Job worker claimed id=#{job.id} attempts=#{job.attempts}")
  0
end

fn log_worker_processed(job :: Job) do
  let _ = println("[reference-backend] Job worker processed id=#{job.id} status=#{job.status} attempts=#{job.attempts}")
  0
end

fn log_worker_failure(job_id :: String, error_message :: String) do
  if String.length(job_id) > 0 do
    let _ = println("[reference-backend] Job worker failed id=#{job_id}: #{error_message}")
    0
  else
    let _ = println("[reference-backend] Job worker failed: #{error_message}")
    0
  end
end

fn record_idle(worker_state, ts :: String) do
  let _ = JobWorkerState.note_idle(worker_state, ts)
  let _ = log_worker_idle()
  0
end

fn record_idle_claim_miss(worker_state, ts :: String, error_message :: String) do
  let _ = JobWorkerState.note_idle(worker_state, ts)
  let _ = log_worker_claim_miss(error_message)
  0
end

fn record_failure(worker_state, job_id :: String, error_message :: String) do
  let ts = current_timestamp()
  let _ = JobWorkerState.note_failed(worker_state, ts, job_id, error_message)
  let _ = log_worker_failure(job_id, error_message)
  0
end

fn record_processed(worker_state, job :: Job) do
  let ts = current_timestamp()
  let _ = JobWorkerState.note_processed(worker_state, ts, job.id)
  let _ = log_worker_processed(job)
  0
end

fn mark_failed_after_processing(pool :: PoolHandle,
worker_state,
job :: Job,
error_message :: String) do
  let failed_result = mark_job_failed(pool, job.id, error_message)
  case failed_result do
    Ok( failed_job) -> record_failure(worker_state, failed_job.id, error_message)
    Err( mark_failed_error) -> record_failure(worker_state, job.id, mark_failed_error)
  end
end

fn handle_process_claim_error(pool :: PoolHandle, worker_state, job :: Job, error_message :: String) do
  if String.contains(error_message, "no rows matched") == true do
    record_idle_claim_miss(worker_state, current_timestamp(), error_message)
  else
    mark_failed_after_processing(pool, worker_state, job, error_message)
  end
end

fn should_crash_after_claim(job :: Job) -> Bool do
  if String.contains(job.payload, "crash_after_claim_once") == true do
    parse_attempts(job.attempts) == 1
  else
    false
  end
end

fn finish_crash_recovery_success(worker_state, result) -> Bool do
  let _ = record_recovery_result(worker_state, result)
  true
end

fn finish_crash_recovery_failure(worker_state, job :: Job, error_message :: String) -> Bool do
  let _ = record_failure(worker_state, job.id, error_message)
  true
end

fn crash_after_claim(pool :: PoolHandle, worker_state, job :: Job) -> Bool do
  let crash_ts = current_timestamp()
  let reason = "worker_crash_after_claim"
  let _ = JobWorkerState.note_crash_soon(worker_state, crash_ts, job.id, reason)
  let _ = println("[reference-backend] Job worker crash injected id=#{job.id} attempts=#{job.attempts}")
  let reboot_ts = current_timestamp()
  let _ = JobWorkerState.note_boot(worker_state, reboot_ts, reboot_ts)
  let restart_count = JobWorkerState.get_restart_count(worker_state)
  let _ = log_worker_boot(reboot_ts, restart_count)
  let recovery_result = reclaim_processing_jobs(pool, recovery_hint(restart_count))
  case recovery_result do
    Ok( result) -> finish_crash_recovery_success(worker_state, result)
    Err( error_message) -> finish_crash_recovery_failure(worker_state, job, error_message)
  end
end
