fn log_bootstrap(status :: BootstrapStatus) do
  println(
    "[cluster-proof] runtime bootstrap mode=#{status.mode} node=#{status.node_name} cluster_port=#{status.cluster_port} discovery_seed=#{status.discovery_seed}"
  )
end

fn log_bootstrap_failure(reason :: String) do
  println("[cluster-proof] runtime bootstrap failed reason=#{reason}")
end

fn main() do
  case Node.start_from_env() do
    Ok(status) -> log_bootstrap(status)
    Err(reason) -> log_bootstrap_failure(reason)
  end
end
