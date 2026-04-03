mod support;

use std::fs;
use std::path::{Path, PathBuf};
use support::m046_route_free as route_free;

const SHARED_COOKIE: &str = "mesh-m045-s02-cookie";
const DISCOVERY_SEED: &str = "localhost";
const STARTUP_RUNTIME_NAME: &str = route_free::STARTUP_RUNTIME_NAME;
const STARTUP_SOURCE_DECLARATION: &str = route_free::STARTUP_SOURCE_DECLARATION;
const STARTUP_RUNTIME_NAME_GUIDANCE: &str = route_free::STARTUP_RUNTIME_NAME_GUIDANCE;
const STARTUP_AUTOSTART_GUIDANCE: &str = route_free::STARTUP_AUTOSTART_GUIDANCE;

fn artifact_dir(test_name: &str) -> PathBuf {
    route_free::artifact_dir("m045-s02", test_name)
}

fn assert_contains(path_label: &str, source: &str, needle: &str) {
    assert!(
        source.contains(needle),
        "expected {path_label} to contain {needle:?}, got:\n{source}"
    );
}

fn assert_omits(path_label: &str, source: &str, needle: &str) {
    assert!(
        !source.contains(needle),
        "expected {path_label} to omit {needle:?}, got:\n{source}"
    );
}

fn load_scaffold_sources(project_dir: &Path, artifacts: &Path) -> (String, String, String, String) {
    let package_artifacts = artifacts.join("package");
    (
        route_free::read_and_archive(
            &project_dir.join("mesh.toml"),
            &package_artifacts.join("mesh.toml"),
        ),
        route_free::read_and_archive(
            &project_dir.join("main.mpl"),
            &package_artifacts.join("main.mpl"),
        ),
        route_free::read_and_archive(
            &project_dir.join("work.mpl"),
            &package_artifacts.join("work.mpl"),
        ),
        route_free::read_and_archive(
            &project_dir.join("README.md"),
            &package_artifacts.join("README.md"),
        ),
    )
}

fn assert_scaffold_contract(manifest: &str, main: &str, work: &str, readme: &str) {
    assert_contains("generated mesh.toml", manifest, "[package]");
    assert_omits("generated mesh.toml", manifest, "[cluster]");

    assert_contains("generated main.mpl", main, "Node.start_from_env()");
    assert_contains("generated main.mpl", main, "BootstrapStatus");
    assert_contains("generated main.mpl", main, "runtime bootstrap");
    assert_omits(
        "generated main.mpl",
        main,
        "Continuity.submit_declared_work",
    );
    assert_omits("generated main.mpl", main, "Continuity.mark_completed");
    assert_omits("generated main.mpl", main, "HTTP.serve");
    assert_omits("generated main.mpl", main, "/health");
    assert_omits("generated main.mpl", main, "/work");
    assert_omits("generated main.mpl", main, "Node.start(");

    assert_contains("generated work.mpl", work, STARTUP_SOURCE_DECLARATION);
    assert_contains("generated work.mpl", work, "1 + 1");
    assert_omits("generated work.mpl", work, "declared_work_runtime_name");
    assert_omits("generated work.mpl", work, "clustered(work)");
    assert_omits(
        "generated work.mpl",
        work,
        "Continuity.submit_declared_work",
    );
    assert_omits("generated work.mpl", work, "Continuity.mark_completed");
    assert_omits("generated work.mpl", work, "Timer.sleep");
    assert_omits("generated work.mpl", work, "owner_node");
    assert_omits("generated work.mpl", work, "replica_node");

    assert_contains("generated README.md", readme, "Node.start_from_env()");
    assert_contains("generated README.md", readme, "meshc cluster status");
    assert_contains("generated README.md", readme, "meshc cluster continuity");
    assert_contains("generated README.md", readme, "meshc cluster diagnostics");
    assert_contains(
        "generated README.md",
        readme,
        "meshc cluster continuity <node-name@host:port> <request-key> --json",
    );
    assert_contains("generated README.md", readme, "MESH_CLUSTER_COOKIE");
    assert_contains("generated README.md", readme, "MESH_NODE_NAME");
    assert_contains("generated README.md", readme, "MESH_DISCOVERY_SEED");
    assert_contains("generated README.md", readme, "MESH_CONTINUITY_ROLE");
    assert_contains(
        "generated README.md",
        readme,
        "MESH_CONTINUITY_PROMOTION_EPOCH",
    );
    assert_contains("generated README.md", readme, "`@cluster`");
    assert_contains("generated README.md", readme, STARTUP_RUNTIME_NAME_GUIDANCE);
    assert_contains("generated README.md", readme, STARTUP_AUTOSTART_GUIDANCE);
    assert_omits(
        "generated README.md",
        readme,
        "declared_work_runtime_name()",
    );
    assert_omits("generated README.md", readme, "clustered(work)");
    assert_omits(
        "generated README.md",
        readme,
        "Continuity.submit_declared_work",
    );
    assert_omits("generated README.md", readme, "Continuity.mark_completed");
    assert_omits("generated README.md", readme, "HTTP.serve");
    assert_omits("generated README.md", readme, "/health");
    assert_omits("generated README.md", readme, "/work");
    assert_omits("generated README.md", readme, "Timer.sleep");
}

#[test]
fn m045_s02_scaffold_runtime_completion_contract_stays_tiny() {
    let artifacts = artifact_dir("scaffold-runtime-completion-contract");
    let temp = tempfile::tempdir().expect("create scaffold tempdir");
    let project_dir =
        route_free::init_clustered_project(temp.path(), "clustered-runtime-completion", &artifacts);
    let (manifest, main, work, readme) = load_scaffold_sources(&project_dir, &artifacts);

    assert_scaffold_contract(&manifest, &main, &work, &readme);

    let binary_dir = artifacts.join("bin");
    fs::create_dir_all(&binary_dir).expect("failed to create scaffold binary dir");
    let output_path = binary_dir.join("clustered-runtime-completion");
    let metadata =
        route_free::build_package_binary_to_output(&project_dir, &output_path, &artifacts);
    assert_eq!(metadata.binary_path, output_path);
    assert!(metadata.binary_path.exists());
}

#[test]
fn m045_s02_scaffold_runtime_completion_reaches_completed_without_app_glue() {
    let artifacts = artifact_dir("scaffold-runtime-completion-local");
    let temp = tempfile::tempdir().expect("create scaffold tempdir");
    let project_dir =
        route_free::init_clustered_project(temp.path(), "clustered-runtime-completion", &artifacts);
    let (manifest, main, work, readme) = load_scaffold_sources(&project_dir, &artifacts);
    assert_scaffold_contract(&manifest, &main, &work, &readme);

    let binary_dir = artifacts.join("bin");
    fs::create_dir_all(&binary_dir).expect("failed to create scaffold binary dir");
    let output_path = binary_dir.join("clustered-runtime-completion");
    let build_metadata =
        route_free::build_package_binary_to_output(&project_dir, &output_path, &artifacts);

    let cluster_port = route_free::dual_stack_cluster_port();
    let node_name = format!("scaffold@{}:{cluster_port}", route_free::LOOPBACK_V4);
    let expected_nodes = vec![node_name.clone()];

    let spawned = route_free::spawn_route_free_runtime(
        &build_metadata.binary_path,
        &project_dir,
        &artifacts,
        "scaffold",
        &node_name,
        cluster_port,
        "primary",
        0,
        SHARED_COOKIE,
        DISCOVERY_SEED,
    );

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        route_free::wait_for_cluster_status_membership(
            &artifacts,
            "cluster-status",
            &node_name,
            &[],
            &expected_nodes,
            "primary",
            0,
            &["local_only"],
            SHARED_COOKIE,
        );

        let continuity_list = route_free::wait_for_runtime_name_discovered_with_label(
            &artifacts,
            "cluster-continuity-list",
            &node_name,
            STARTUP_RUNTIME_NAME,
            SHARED_COOKIE,
        );
        assert_eq!(
            route_free::required_u64(&continuity_list, "total_records"),
            1
        );
        assert!(!route_free::required_bool(&continuity_list, "truncated"));
        let request_key = route_free::required_str(
            route_free::record_for_runtime_name(&continuity_list, STARTUP_RUNTIME_NAME),
            "request_key",
        );
        assert_eq!(request_key, format!("startup::{STARTUP_RUNTIME_NAME}"));

        let continuity = route_free::wait_for_continuity_record_completed(
            &artifacts,
            "cluster-continuity-completed",
            &node_name,
            &request_key,
            STARTUP_RUNTIME_NAME,
            SHARED_COOKIE,
        );
        let record = &continuity["record"];
        assert_eq!(route_free::required_str(record, "owner_node"), node_name);
        assert_eq!(route_free::required_str(record, "replica_node"), "");
        assert_eq!(
            route_free::required_str(record, "execution_node"),
            node_name
        );
        assert_eq!(
            route_free::required_str(record, "replica_status"),
            "unassigned"
        );
        assert_eq!(route_free::required_str(record, "phase"), "completed");
        assert_eq!(route_free::required_str(record, "result"), "succeeded");
        assert_eq!(route_free::required_str(record, "error"), "");

        let diagnostics = route_free::wait_for_diagnostics_matching(
            &artifacts,
            "cluster-diagnostics",
            &node_name,
            "single-node startup diagnostics truth",
            SHARED_COOKIE,
            |snapshot| {
                let entries = route_free::diagnostic_entries_for_request(snapshot, &request_key);
                let transitions: Vec<_> = entries
                    .iter()
                    .filter_map(|entry| entry["transition"].as_str())
                    .collect();
                transitions.contains(&"startup_trigger")
                    && transitions.contains(&"startup_completed")
                    && !transitions.contains(&"startup_rejected")
                    && !transitions.contains(&"startup_convergence_timeout")
            },
        );
        let entries = route_free::diagnostic_entries_for_request(&diagnostics, &request_key);
        let transitions: Vec<_> = entries
            .iter()
            .filter_map(|entry| entry["transition"].as_str())
            .collect();
        assert!(
            transitions.contains(&"startup_dispatch_window")
                || route_free::required_str(record, "replica_status") == "unassigned"
        );
    }));

    let logs = route_free::stop_process(spawned);
    route_free::write_artifact(&artifacts.join("scaffold.combined.log"), &logs.combined);
    if let Err(payload) = result {
        panic!(
            "{}\nartifacts: {}\nstdout:\n{}\nstderr:\n{}",
            route_free::panic_payload_to_string(payload),
            artifacts.display(),
            logs.stdout,
            logs.stderr,
        );
    }

    for required in [
        "generated-project/mesh.toml",
        "generated-project/main.mpl",
        "generated-project/work.mpl",
        "generated-project/README.md",
        "build.log",
        "build-meta.json",
        "cluster-status.json",
        "cluster-continuity-list.json",
        "cluster-continuity-completed.json",
        "cluster-diagnostics.json",
        "scaffold.stdout.log",
        "scaffold.stderr.log",
        "scaffold.combined.log",
    ] {
        assert!(
            artifacts.join(required).exists(),
            "missing retained scaffold runtime-completion artifact {} in {}",
            required,
            artifacts.display()
        );
    }

    route_free::assert_log_absent(&logs, SHARED_COOKIE);
    route_free::assert_log_contains(
        &logs,
        &format!("[clustered-app] runtime bootstrap mode=cluster node={node_name}"),
    );
    route_free::assert_log_contains(
        &logs,
        &format!(
            "[mesh-rt continuity] transition=completed request_key=startup::{STARTUP_RUNTIME_NAME}"
        ),
    );
}

#[test]
fn m045_s02_declared_work_remote_spawn_reaches_completed_on_owner_and_ingress() {
    let artifacts = artifact_dir("declared-work-remote-spawn");
    let temp = tempfile::tempdir().expect("create scaffold tempdir");
    let project_dir =
        route_free::init_clustered_project(temp.path(), "clustered-runtime-completion", &artifacts);
    let (_, _, scaffold_work, scaffold_readme) = load_scaffold_sources(&project_dir, &artifacts);

    let cluster_proof_dir = route_free::cluster_proof_fixture_root();
    let cluster_proof_work = route_free::read_and_archive(
        &cluster_proof_dir.join("work.mpl"),
        &artifacts.join("references").join("cluster-proof.work.mpl"),
    );
    let cluster_proof_main = route_free::read_and_archive(
        &cluster_proof_dir.join("main.mpl"),
        &artifacts.join("references").join("cluster-proof.main.mpl"),
    );
    let cluster_proof_readme = route_free::read_and_archive(
        &cluster_proof_dir.join("README.md"),
        &artifacts.join("references").join("cluster-proof.README.md"),
    );
    let cluster_proof_work_test = route_free::read_and_archive(
        &cluster_proof_dir.join("tests").join("work.test.mpl"),
        &artifacts
            .join("references")
            .join("cluster-proof.work.test.mpl"),
    );

    assert_eq!(
        scaffold_work, cluster_proof_work,
        "generated scaffold work.mpl must stay aligned with cluster-proof/work.mpl"
    );
    assert_contains(
        "cluster-proof/main.mpl",
        &cluster_proof_main,
        "Node.start_from_env()",
    );
    assert_contains(
        "cluster-proof/main.mpl",
        &cluster_proof_main,
        "[cluster-proof] runtime bootstrap",
    );
    assert_omits("cluster-proof/main.mpl", &cluster_proof_main, "HTTP.serve");
    assert_omits(
        "cluster-proof/main.mpl",
        &cluster_proof_main,
        "Continuity.submit_declared_work",
    );
    assert_omits("cluster-proof/main.mpl", &cluster_proof_main, "/work");
    assert_omits("cluster-proof/main.mpl", &cluster_proof_main, "/membership");

    assert_contains(
        "cluster-proof/README.md",
        &cluster_proof_readme,
        "meshc cluster status",
    );
    assert_contains(
        "cluster-proof/README.md",
        &cluster_proof_readme,
        "meshc cluster continuity",
    );
    assert_contains(
        "cluster-proof/README.md",
        &cluster_proof_readme,
        "meshc cluster diagnostics",
    );
    assert_contains(
        "cluster-proof/README.md",
        &cluster_proof_readme,
        "route-free",
    );
    assert_omits("cluster-proof/README.md", &cluster_proof_readme, "/work");
    assert_omits(
        "cluster-proof/README.md",
        &cluster_proof_readme,
        "/membership",
    );
    assert_omits(
        "cluster-proof/README.md",
        &cluster_proof_readme,
        "mesh-cluster-proof.fly.dev",
    );

    assert_contains(
        "cluster-proof/tests/work.test.mpl",
        &cluster_proof_work_test,
        "manifest and source stay source-first and route-free",
    );
    assert_contains(
        "cluster-proof/tests/work.test.mpl",
        &cluster_proof_work_test,
        "assert_not_contains(main_source, \"/work\")",
    );
    assert_contains(
        "cluster-proof/tests/work.test.mpl",
        &cluster_proof_work_test,
        "assert_not_contains(work_source, \"Timer.sleep\")",
    );

    assert_contains(
        "generated README.md",
        &scaffold_readme,
        "meshc cluster continuity",
    );
    assert_contains(
        "generated README.md",
        &scaffold_readme,
        "meshc cluster continuity <node-name@host:port> <request-key> --json",
    );
    assert_omits("generated README.md", &scaffold_readme, "/work");
    assert_omits("generated README.md", &scaffold_readme, "/health");
}
