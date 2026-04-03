import File
from Work import add

fn read_required_file(repo_relative :: String, package_relative :: String, tests_relative :: String) -> String do
  case File.read(repo_relative) do
    Ok(contents) -> contents
    Err( _) -> do
      case File.read(package_relative) do
        Ok(contents) -> contents
        Err( _) -> do
          case File.read(tests_relative) do
            Ok(contents) -> contents
            Err(message) -> do
              assert(false)
              message
            end
          end
        end
      end
    end
  end
end

fn assert_contains(haystack :: String, needle :: String) do
  assert(String.contains(haystack, needle))
end

fn assert_not_contains(haystack :: String, needle :: String) do
  assert(String.contains(haystack, needle) == false)
end

fn file_missing(repo_relative :: String, package_relative :: String, tests_relative :: String) -> Bool do
  let repo_missing = case File.read(repo_relative) do
    Ok( _) -> false
    Err( _) -> true
  end
  let package_missing = case File.read(package_relative) do
    Ok( _) -> false
    Err( _) -> true
  end
  let tests_missing = case File.read(tests_relative) do
    Ok( _) -> false
    Err( _) -> true
  end
  if repo_missing do
    if package_missing do
      tests_missing
    else
      false
    end
  else
    false
  end
end

describe("cluster-proof package smoke") do
  test("declared work stays tiny under the source-first contract") do
    assert(add() == 2)
  end

  test("manifest and source stay source-first and route-free") do
    let manifest = read_required_file("scripts/fixtures/clustered/cluster-proof/mesh.toml", "mesh.toml", "../mesh.toml")
    let main_source = read_required_file("scripts/fixtures/clustered/cluster-proof/main.mpl", "main.mpl", "../main.mpl")
    let work_source = read_required_file("scripts/fixtures/clustered/cluster-proof/work.mpl", "work.mpl", "../work.mpl")

    assert_not_contains(manifest, "[cluster]")
    assert_not_contains(manifest, "declarations")

    assert_contains(main_source, "Node.start_from_env()")
    assert_contains(main_source, "[cluster-proof] runtime bootstrap")
    assert_not_contains(main_source, "HTTP.serve")
    assert_not_contains(main_source, "/work")
    assert_not_contains(main_source, "/membership")
    assert_not_contains(main_source, "Continuity.")
    assert_not_contains(main_source, "from Cluster")
    assert_not_contains(main_source, "from Config")
    assert_not_contains(main_source, "from WorkContinuity")

    assert_contains(work_source, "@cluster pub fn add()")
    assert_contains(work_source, "1 + 1")
    assert_not_contains(work_source, "declared_work_runtime_name")
    assert_not_contains(work_source, "clustered(work)")
    assert_not_contains(work_source, "declared_work_target")
    assert_not_contains(work_source, "HTTP.serve")
    assert_not_contains(work_source, "/work")
    assert_not_contains(work_source, "/membership")
    assert_not_contains(work_source, "Continuity.")
    assert_not_contains(work_source, "Env.get_int")
    assert_not_contains(work_source, "Timer.sleep")
    assert_not_contains(work_source, "CLUSTER_PROOF_WORK_DELAY_MS")
    assert_not_contains(work_source, "from Cluster")
  end

  test("readme points operators to mesh-owned cli inspection") do
    let readme = read_required_file("scripts/fixtures/clustered/cluster-proof/README.md", "README.md", "../README.md")

    assert_contains(readme, "@cluster pub fn add()")
    assert_contains(readme, "Work.add")
    assert_contains(readme, "Node.start_from_env()")
    assert_contains(readme, "meshc cluster status")
    assert_contains(readme, "meshc cluster continuity")
    assert_contains(readme, "meshc cluster diagnostics")
    assert_contains(readme, "cargo run -q -p meshc -- build scripts/fixtures/clustered/cluster-proof")
    assert_contains(readme, "cargo run -q -p meshc -- test scripts/fixtures/clustered/cluster-proof/tests")
    assert_contains(readme, "docker build -f scripts/fixtures/clustered/cluster-proof/Dockerfile -t mesh-cluster-proof .")
    assert_contains(readme, "route-free")
    assert_contains(readme, "automatically starts the source-declared `@cluster` function")
    assert_contains(readme, "scripts/fixtures/clustered/cluster-proof/Dockerfile")
    assert_contains(readme, "scripts/fixtures/clustered/cluster-proof/fly.toml")
    assert_not_contains(readme, "declared_work_runtime_name()")
    assert_not_contains(readme, "clustered(work)")
    assert_not_contains(readme, "[cluster]")
    assert_not_contains(readme, "/work")
    assert_not_contains(readme, "/membership")
    assert_not_contains(readme, "mesh-cluster-proof.fly.dev")
    assert_not_contains(readme, "CLUSTER_PROOF_WORK_DELAY_MS")
    assert_not_contains(readme, "docker-entrypoint.sh")
    assert_not_contains(readme, "`PORT`")
    assert_not_contains(readme, "http_service")
    assert_not_contains(readme, "cargo run -q -p meshc -- build cluster-proof")
    assert_not_contains(readme, "cargo run -q -p meshc -- test cluster-proof/tests")
    assert_not_contains(readme, "docker build -f cluster-proof/Dockerfile -t mesh-cluster-proof .")
  end

  test("packaging files stay honest about the route-free binary") do
    let dockerfile = read_required_file("scripts/fixtures/clustered/cluster-proof/Dockerfile", "Dockerfile", "../Dockerfile")
    let fly_config = read_required_file("scripts/fixtures/clustered/cluster-proof/fly.toml", "fly.toml", "../fly.toml")

    assert_contains(dockerfile, "COPY --from=builder /tmp/cluster-proof /usr/local/bin/cluster-proof")
    assert_contains(dockerfile, "./target/debug/meshc build scripts/fixtures/clustered/cluster-proof --output /tmp/cluster-proof --no-color")
    assert_contains(dockerfile, "ENTRYPOINT [\"/usr/local/bin/cluster-proof\"]")
    assert_contains(dockerfile, "EXPOSE 4370")
    assert_not_contains(dockerfile, "docker-entrypoint.sh")
    assert_not_contains(dockerfile, "EXPOSE 8080")
    assert_not_contains(dockerfile, "meshc build cluster-proof --output /tmp/cluster-proof --no-color")

    assert_contains(fly_config, "dockerfile = 'scripts/fixtures/clustered/cluster-proof/Dockerfile'")
    assert_contains(fly_config, "MESH_CLUSTER_PORT = '4370'")
    assert_contains(fly_config, "MESH_DISCOVERY_SEED = 'mesh-cluster-proof.internal'")
    assert_not_contains(fly_config, "http_service")
    assert_not_contains(fly_config, "\n  PORT =")
    assert_not_contains(fly_config, "\nPORT =")
    assert_not_contains(fly_config, "dockerfile = 'cluster-proof/Dockerfile'")
  end

  test("obsolete helper files stay deleted") do
    assert(file_missing("scripts/fixtures/clustered/cluster-proof/tests/config.test.mpl", "tests/config.test.mpl", "config.test.mpl"))
    assert(file_missing("scripts/fixtures/clustered/cluster-proof/docker-entrypoint.sh", "docker-entrypoint.sh", "../docker-entrypoint.sh"))
    assert(file_missing("scripts/fixtures/clustered/cluster-proof/cluster.mpl", "cluster.mpl", "../cluster.mpl"))
    assert(file_missing(
      "scripts/fixtures/clustered/cluster-proof/config.mpl",
      "config.mpl",
      "../config.mpl"
    ))
    assert(file_missing(
      "scripts/fixtures/clustered/cluster-proof/work_continuity.mpl",
      "work_continuity.mpl",
      "../work_continuity.mpl"
    ))
  end
end
