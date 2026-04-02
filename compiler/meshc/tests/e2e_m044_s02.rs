use mesh_codegen::mir::{MirExpr, MirFunction, MirModule, MirType};
use mesh_codegen::{
    prepare_declared_runtime_handlers, DeclaredHandlerKind, DeclaredHandlerPlanEntry,
};
use mesh_pkg::manifest::{
    validate_cluster_declarations, ClusterConfig, ClusteredDeclaration, ClusteredDeclarationKind,
    ClusteredDeclarationOrigin, ClusteredExecutableSurfaceInfo, ClusteredExecutionMetadata,
    ClusteredExportSurface, ClusteredReplicationCount,
};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

fn meshc_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_meshc"))
}

fn ensure_mesh_rt_staticlib() {
    static BUILD_ONCE: OnceLock<()> = OnceLock::new();
    BUILD_ONCE.get_or_init(|| {
        let output = Command::new("cargo")
            .current_dir(repo_root())
            .args(["build", "-p", "mesh-rt"])
            .output()
            .expect("failed to invoke cargo build -p mesh-rt");
        assert!(
            output.status.success(),
            "cargo build -p mesh-rt failed:\n{}",
            command_output_text(&output)
        );
    });
}

fn command_output_text(output: &Output) -> String {
    format!(
        "status: {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
}

fn service_project_main_source() -> &'static str {
    "from Services import Jobs\n\nfn main() do\n  let pid = Jobs.start(0)\n  let _ = Jobs.submit(pid, \"demo\")\n  let _ = Jobs.reset(pid)\nend\n"
}

fn service_project_services_source() -> &'static str {
    "service Jobs do\n  fn init(start :: Int) -> Int do\n    start\n  end\n\n  call Submit(payload :: String) :: String do |state|\n    (state, payload)\n  end\n\n  cast Reset() do |_state|\n    0\n  end\nend\n"
}

fn declared_work_project_main_source() -> &'static str {
    "from Work import handle_submit, local_only\n\nfn main() do\n  let _ = handle_submit(\"req-1\", \"attempt-1\")\n  let _ = local_only(\"demo\")\nend\n"
}

fn declared_work_project_work_source() -> &'static str {
    "pub fn handle_submit(request_key :: String, attempt_id :: String) -> Int do\n  if String.length(request_key) > 0 do\n    String.length(attempt_id)\n  else\n    0\n  end\nend\n\npub fn local_only(payload :: String) -> String do\n  payload\nend\n\nfn hidden_submit(payload :: String) -> String do\n  payload\nend\n"
}

fn write_project_sources(project_dir: &Path, manifest: Option<&str>, sources: &[(&str, &str)]) {
    fs::create_dir_all(project_dir).expect("failed to create temp project dir");
    if let Some(manifest) = manifest {
        fs::write(project_dir.join("mesh.toml"), manifest).expect("failed to write mesh.toml");
    }
    for (path, content) in sources {
        fs::write(project_dir.join(path), content)
            .unwrap_or_else(|err| panic!("failed to write {path}: {err}"));
    }
}

fn build_temp_project_with_sources(
    manifest: Option<&str>,
    sources: &[(&str, &str)],
    emit_llvm: bool,
) -> (Output, Option<String>) {
    ensure_mesh_rt_staticlib();
    let tmp = tempfile::tempdir().expect("failed to create temp dir");
    let project_dir = tmp.path().join("project");
    write_project_sources(&project_dir, manifest, sources);

    let mut command = Command::new(meshc_bin());
    command.current_dir(repo_root());
    command.arg("build").arg(project_dir.to_str().unwrap());
    if emit_llvm {
        command.arg("--emit-llvm");
    }

    let output = command.output().expect("failed to invoke meshc build");
    let llvm = if emit_llvm && output.status.success() {
        Some(
            fs::read_to_string(project_dir.join("project.ll"))
                .expect("expected emitted llvm alongside built temp project"),
        )
    } else {
        None
    };
    (output, llvm)
}

fn build_temp_project(manifest: Option<&str>) -> Output {
    let (output, _) = build_temp_project_with_sources(
        manifest,
        &[
            ("main.mpl", service_project_main_source()),
            ("services.mpl", service_project_services_source()),
            ("work.mpl", declared_work_project_work_source()),
        ],
        false,
    );
    output
}

fn artifact_dir(test_name: &str) -> PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = repo_root()
        .join(".tmp")
        .join("m044-s02")
        .join(format!("{test_name}-{stamp}"));
    fs::create_dir_all(&dir).expect("failed to create e2e artifact dir");
    dir
}

fn write_artifact(path: &Path, contents: impl AsRef<str>) {
    fs::write(path, contents.as_ref())
        .unwrap_or_else(|error| panic!("failed to write artifact {}: {error}", path.display()));
}

fn surface_with_execution_targets() -> ClusteredExportSurface {
    let mut surface = ClusteredExportSurface::default();
    surface.work_functions.insert(
        "Work.handle_submit".to_string(),
        ClusteredExecutableSurfaceInfo {
            runtime_registration_name: "Work.handle_submit".to_string(),
            executable_symbol: Some("handle_submit".to_string()),
        },
    );
    surface.work_functions.insert(
        "Work.local_only".to_string(),
        ClusteredExecutableSurfaceInfo {
            runtime_registration_name: "Work.local_only".to_string(),
            executable_symbol: Some("local_only".to_string()),
        },
    );
    surface
        .private_work_functions
        .insert("Work.hidden_submit".to_string());
    surface.service_call_handlers.insert(
        "Services.Jobs.submit".to_string(),
        ClusteredExecutableSurfaceInfo {
            runtime_registration_name: "Services.Jobs.submit".to_string(),
            executable_symbol: Some("__service_jobs_call_submit".to_string()),
        },
    );
    surface.service_cast_handlers.insert(
        "Services.Jobs.reset".to_string(),
        ClusteredExecutableSurfaceInfo {
            runtime_registration_name: "Services.Jobs.reset".to_string(),
            executable_symbol: Some("__service_jobs_cast_reset".to_string()),
        },
    );
    surface
        .service_start_helpers
        .insert("Services.Jobs.start".to_string());
    surface
}

fn service_cluster_manifest() -> &'static str {
    r#"[package]
name = "service-proof"
version = "0.1.0"

[cluster]
enabled = true
declarations = [
  { kind = "service_call", target = "Services.Jobs.submit" },
  { kind = "service_cast", target = "Services.Jobs.reset" },
]
"#
}

fn work_cluster_manifest() -> &'static str {
    r#"[package]
name = "work-proof"
version = "0.1.0"

[cluster]
enabled = true
declarations = [
  { kind = "work", target = "Work.handle_submit" },
]
"#
}

fn empty_mir_module() -> MirModule {
    MirModule {
        functions: Vec::new(),
        structs: Vec::new(),
        sum_types: Vec::new(),
        entry_function: None,
        service_dispatch: HashMap::new(),
    }
}

fn find_function<'a>(module: &'a MirModule, name: &str) -> &'a MirFunction {
    module
        .functions
        .iter()
        .find(|func| func.name == name)
        .unwrap_or_else(|| panic!("missing function {name}"))
}

fn segment_between<'a>(text: &'a str, start: &str, end: &str) -> &'a str {
    let start_idx = text
        .find(start)
        .unwrap_or_else(|| panic!("missing start marker {start:?}"));
    let end_idx = text[start_idx..]
        .find(end)
        .map(|offset| start_idx + offset)
        .unwrap_or_else(|| panic!("missing end marker {end:?}"));
    &text[start_idx..end_idx]
}

#[test]
fn m044_s02_metadata_manifestless_build_still_succeeds() {
    let output = build_temp_project(None);
    assert!(
        output.status.success(),
        "manifestless build should stay local and succeed:\n{}",
        command_output_text(&output)
    );
}

#[test]
fn m044_s02_metadata_declared_targets_validate_into_execution_metadata() {
    let cluster = ClusterConfig {
        enabled: true,
        declarations: vec![
            ClusteredDeclaration {
                kind: ClusteredDeclarationKind::ServiceCall,
                target: "Services.Jobs.submit".to_string(),
            },
            ClusteredDeclaration {
                kind: ClusteredDeclarationKind::ServiceCast,
                target: "Services.Jobs.reset".to_string(),
            },
            ClusteredDeclaration {
                kind: ClusteredDeclarationKind::Work,
                target: "Work.handle_submit".to_string(),
            },
        ],
    };

    let metadata = validate_cluster_declarations(&cluster, &surface_with_execution_targets())
        .expect("declared targets should validate into execution metadata");

    assert_eq!(
        metadata,
        vec![
            ClusteredExecutionMetadata {
                kind: ClusteredDeclarationKind::ServiceCall,
                manifest_target: "Services.Jobs.submit".to_string(),
                runtime_registration_name: "Services.Jobs.submit".to_string(),
                executable_symbol: "__service_jobs_call_submit".to_string(),
                replication_count: ClusteredReplicationCount::defaulted(),
                origin: ClusteredDeclarationOrigin::Manifest,
            },
            ClusteredExecutionMetadata {
                kind: ClusteredDeclarationKind::ServiceCast,
                manifest_target: "Services.Jobs.reset".to_string(),
                runtime_registration_name: "Services.Jobs.reset".to_string(),
                executable_symbol: "__service_jobs_cast_reset".to_string(),
                replication_count: ClusteredReplicationCount::defaulted(),
                origin: ClusteredDeclarationOrigin::Manifest,
            },
            ClusteredExecutionMetadata {
                kind: ClusteredDeclarationKind::Work,
                manifest_target: "Work.handle_submit".to_string(),
                runtime_registration_name: "Work.handle_submit".to_string(),
                executable_symbol: "handle_submit".to_string(),
                replication_count: ClusteredReplicationCount::defaulted(),
                origin: ClusteredDeclarationOrigin::Manifest,
            },
        ]
    );
}

#[test]
fn m044_s02_metadata_invalid_executable_target_reports_planning_reason() {
    let mut surface = surface_with_execution_targets();
    surface.service_call_handlers.insert(
        "Services.Jobs.submit".to_string(),
        ClusteredExecutableSurfaceInfo {
            runtime_registration_name: "Services.Jobs.submit".to_string(),
            executable_symbol: None,
        },
    );
    let cluster = ClusterConfig {
        enabled: true,
        declarations: vec![ClusteredDeclaration {
            kind: ClusteredDeclarationKind::ServiceCall,
            target: "Services.Jobs.submit".to_string(),
        }],
    };

    let issues = validate_cluster_declarations(&cluster, &surface)
        .expect_err("missing executable symbol should fail");
    assert_eq!(issues.len(), 1);
    assert!(
        issues[0].target.contains("Services.Jobs.submit")
            && issues[0]
                .reason
                .contains("runtime-executable symbol or wrapper"),
        "expected explicit planning failure, got: {}",
        issues[0]
    );
}

#[test]
fn m044_s02_metadata_undeclared_targets_stay_absent_from_execution_plan() {
    let cluster = ClusterConfig {
        enabled: true,
        declarations: vec![ClusteredDeclaration {
            kind: ClusteredDeclarationKind::Work,
            target: "Work.handle_submit".to_string(),
        }],
    };

    let metadata = validate_cluster_declarations(&cluster, &surface_with_execution_targets())
        .expect("declared target should validate");

    assert_eq!(metadata.len(), 1, "only declared targets should be planned");
    assert_eq!(metadata[0].manifest_target, "Work.handle_submit");
    assert!(
        metadata
            .iter()
            .all(|entry| entry.manifest_target != "Work.local_only"),
        "undeclared public helpers must stay absent from the execution plan: {:?}",
        metadata
    );
}

#[test]
fn m044_s02_declared_work_llvm_registers_manifest_declared_handler_only() {
    let (output, llvm) = build_temp_project_with_sources(
        Some(work_cluster_manifest()),
        &[
            ("main.mpl", declared_work_project_main_source()),
            ("work.mpl", declared_work_project_work_source()),
        ],
        true,
    );
    assert!(
        output.status.success(),
        "declared-work build should succeed:\n{}",
        command_output_text(&output)
    );
    let llvm = llvm.expect("declared-work build should emit llvm");

    assert!(
        llvm.contains("mesh_register_declared_handler"),
        "expected declared handler registration intrinsic in emitted llvm:\n{llvm}"
    );
    assert!(
        llvm.contains("Work.handle_submit")
            && llvm.contains("declared_exec_reg___declared_work_work_handle_submit"),
        "expected declared-work runtime name and executable symbol registration:\n{llvm}"
    );
    assert!(
        llvm.contains("fn_reg___declared_work_work_handle_submit"),
        "expected manifest-approved declared-work wrapper to stay remote-spawnable:\n{llvm}"
    );
    assert!(
        !llvm.contains("fn_reg___actor___declared_work_work_handle_submit_body"),
        "internal declared-work actor bodies must stay out of the remote spawn registry:\n{llvm}"
    );
    assert!(
        !llvm.contains("declared_exec_reg_local_only"),
        "undeclared local helpers must stay out of the declared runtime registry:\n{llvm}"
    );
}

#[test]
fn m044_s02_service_prepare_declared_handlers_generate_distinct_wrappers() {
    let mut module = empty_mir_module();
    module.functions.push(MirFunction {
        name: "__service_jobs_call_submit".to_string(),
        params: vec![
            ("__pid".to_string(), MirType::Int),
            ("payload".to_string(), MirType::String),
        ],
        return_type: MirType::String,
        body: MirExpr::Var("payload".to_string(), MirType::String),
        is_closure_fn: false,
        captures: Vec::new(),
        has_tail_calls: false,
    });
    module.functions.push(MirFunction {
        name: "__service_jobs_cast_reset".to_string(),
        params: vec![("__pid".to_string(), MirType::Int)],
        return_type: MirType::Unit,
        body: MirExpr::Unit,
        is_closure_fn: false,
        captures: Vec::new(),
        has_tail_calls: false,
    });

    let registrations = prepare_declared_runtime_handlers(
        &mut module,
        &[
            DeclaredHandlerPlanEntry {
                kind: DeclaredHandlerKind::ServiceCall,
                runtime_registration_name: "Services.Jobs.submit".to_string(),
                executable_symbol: "__service_jobs_call_submit".to_string(),
                replication_count: ClusteredReplicationCount::defaulted().value.into(),
            },
            DeclaredHandlerPlanEntry {
                kind: DeclaredHandlerKind::ServiceCast,
                runtime_registration_name: "Services.Jobs.reset".to_string(),
                executable_symbol: "__service_jobs_cast_reset".to_string(),
                replication_count: ClusteredReplicationCount::defaulted().value.into(),
            },
        ],
    )
    .expect("declared service helpers should wrap cleanly");

    assert_eq!(
        registrations[0].executable_symbol,
        "__declared_service_call_services_jobs_submit"
    );
    assert_eq!(
        registrations[1].executable_symbol,
        "__declared_service_cast_services_jobs_reset"
    );

    let call_wrapper = find_function(&module, "__declared_service_call_services_jobs_submit");
    match &call_wrapper.body {
        MirExpr::Call { func, args, ty } => {
            assert_eq!(args.len(), 2, "call wrapper should forward pid + payload");
            assert_eq!(ty, &MirType::String);
            match func.as_ref() {
                MirExpr::Var(name, _) => {
                    assert_eq!(name, "__service_jobs_call_submit");
                }
                other => panic!("expected call wrapper to delegate to helper, got {other:?}"),
            }
        }
        other => panic!("expected call wrapper body to be a helper call, got {other:?}"),
    }

    let cast_wrapper = find_function(&module, "__declared_service_cast_services_jobs_reset");
    match &cast_wrapper.body {
        MirExpr::Call { func, args, ty } => {
            assert_eq!(args.len(), 1, "cast wrapper should forward only pid");
            assert_eq!(ty, &MirType::Unit);
            match func.as_ref() {
                MirExpr::Var(name, _) => {
                    assert_eq!(name, "__service_jobs_cast_reset");
                }
                other => panic!("expected cast wrapper to delegate to helper, got {other:?}"),
            }
        }
        other => panic!("expected cast wrapper body to be a helper call, got {other:?}"),
    }
}

#[test]
fn m044_s02_service_llvm_registers_declared_wrappers_without_widening_manifestless_builds() {
    let (declared_output, declared_llvm) = build_temp_project_with_sources(
        Some(service_cluster_manifest()),
        &[
            ("main.mpl", service_project_main_source()),
            ("services.mpl", service_project_services_source()),
        ],
        true,
    );
    assert!(
        declared_output.status.success(),
        "declared service build should succeed:\n{}",
        command_output_text(&declared_output)
    );
    let declared_llvm = declared_llvm.expect("declared service build should emit llvm");

    assert!(
        declared_llvm.contains("define ptr @__declared_service_call_services_jobs_submit")
            && declared_llvm.contains("define {} @__declared_service_cast_services_jobs_reset"),
        "expected emitted declared-service wrapper definitions:\n{declared_llvm}"
    );
    assert!(
        declared_llvm.contains("Services.Jobs.submit")
            && declared_llvm.contains("Services.Jobs.reset"),
        "expected declared runtime registration names in emitted llvm:\n{declared_llvm}"
    );
    assert!(
        declared_llvm.contains("declared_exec_reg___declared_service_call_services_jobs_submit")
            && declared_llvm
                .contains("declared_exec_reg___declared_service_cast_services_jobs_reset"),
        "expected declared runtime registry to point at wrapper symbols:\n{declared_llvm}"
    );
    assert!(
        declared_llvm.contains("fn_reg___declared_service_call_services_jobs_submit")
            && declared_llvm.contains("fn_reg___declared_service_cast_services_jobs_reset"),
        "expected manifest-approved declared-service wrappers to stay remote-spawnable:\n{declared_llvm}"
    );
    assert!(
        !declared_llvm.contains("declared_exec_reg___service_jobs_call_submit")
            && !declared_llvm.contains("declared_exec_reg___service_jobs_cast_reset"),
        "raw __service helpers must not be registered as declared runtime executables:\n{declared_llvm}"
    );
    assert!(
        !declared_llvm.contains("fn_reg___service_jobs_call_submit")
            && !declared_llvm.contains("fn_reg___service_jobs_cast_reset"),
        "raw __service helpers must stay out of the remote spawn registry:\n{declared_llvm}"
    );

    let (local_output, local_llvm) = build_temp_project_with_sources(
        None,
        &[
            ("main.mpl", service_project_main_source()),
            ("services.mpl", service_project_services_source()),
        ],
        true,
    );
    assert!(
        local_output.status.success(),
        "manifestless service build should stay local and succeed:\n{}",
        command_output_text(&local_output)
    );
    let local_llvm = local_llvm.expect("manifestless service build should emit llvm");
    assert!(
        !local_llvm.contains("__declared_service_call_services_jobs_submit")
            && !local_llvm.contains("__declared_service_cast_services_jobs_reset"),
        "undeclared service builds must not grow declared wrapper symbols:\n{local_llvm}"
    );
}

#[test]
fn m044_s02_cluster_proof_build_and_tests_pass_on_runtime_owned_submit_surface() {
    let artifacts = artifact_dir("cluster-proof-runtime-owned-submit");

    let build = Command::new(meshc_bin())
        .current_dir(repo_root())
        .args(["build", "cluster-proof"])
        .output()
        .expect("failed to invoke meshc build cluster-proof");
    write_artifact(
        &artifacts.join("cluster-proof-build.log"),
        command_output_text(&build),
    );
    assert!(
        build.status.success(),
        "cluster-proof build should succeed:\n{}\nartifacts: {}",
        command_output_text(&build),
        artifacts.display()
    );

    let tests = Command::new(meshc_bin())
        .current_dir(repo_root())
        .args(["test", "cluster-proof/tests"])
        .output()
        .expect("failed to invoke meshc test cluster-proof/tests");
    write_artifact(
        &artifacts.join("cluster-proof-tests.log"),
        command_output_text(&tests),
    );
    assert!(
        tests.status.success(),
        "cluster-proof package tests should succeed:\n{}\nartifacts: {}",
        command_output_text(&tests),
        artifacts.display()
    );

    let continuity_source =
        fs::read_to_string(repo_root().join("cluster-proof/work_continuity.mpl"))
            .expect("failed to read cluster-proof/work_continuity.mpl");
    write_artifact(&artifacts.join("work_continuity.mpl"), continuity_source);
    write_artifact(
        &artifacts.join("scenario-meta.json"),
        concat!(
            "{\n",
            "  \"test\": \"m044_s02_cluster_proof_build_and_tests_pass_on_runtime_owned_submit_surface\",\n",
            "  \"build_command\": \"meshc build cluster-proof\",\n",
            "  \"test_command\": \"meshc test cluster-proof/tests\",\n",
            "  \"source_snapshot\": \"cluster-proof/work_continuity.mpl\"\n",
            "}\n"
        ),
    );
}

#[test]
fn m044_s02_cluster_proof_submit_status_hot_path_omits_legacy_selection_and_dispatch_helpers() {
    let source = fs::read_to_string(repo_root().join("cluster-proof/work_continuity.mpl"))
        .expect("failed to read cluster-proof/work_continuity.mpl");

    let submit_segment = segment_between(
        &source,
        "fn handle_valid_submit(submit :: WorkSubmitBody) do",
        "fn status_response_from_record(record :: ContinuityRecord, source_node :: String) do",
    );
    for forbidden in [
        "current_target_selection(",
        "submit_from_selection(",
        "dispatch_work(",
        "spawn_remote_work(",
        "spawn_local_work(",
        "Node.spawn(",
    ] {
        assert!(
            !submit_segment.contains(forbidden),
            "declared submit hot path must not retain `{forbidden}`:\n{submit_segment}"
        );
    }

    let status_segment = segment_between(
        &source,
        "fn handle_valid_status(request_key :: String) do",
        "fn invalid_request_response(request_key :: String, reason :: String) do",
    );
    for forbidden in ["current_target_selection(", "dispatch_work(", "Node.spawn("] {
        assert!(
            !status_segment.contains(forbidden),
            "declared status hot path must not retain `{forbidden}`:\n{status_segment}"
        );
    }
}
