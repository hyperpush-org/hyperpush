//! File discovery, import extraction, and module graph construction for Mesh projects.
//!
//! Provides utilities to recursively discover `.mpl` files in a project
//! directory, convert file paths to PascalCase module names, extract import
//! declarations from parsed ASTs, and build a complete module dependency graph.

use std::path::{Component, Path, PathBuf};

use mesh_common::module_graph::{self, CycleError, ModuleGraph, ModuleId};
use mesh_parser::ast::item::{Item, SourceFile};
use mesh_pkg::manifest::DEFAULT_ENTRYPOINT;

/// Convert a snake_case string to PascalCase.
///
/// Splits on `_`, capitalizes the first character of each non-empty part,
/// and joins them together.
///
/// # Examples
///
/// - `"vector"` -> `"Vector"`
/// - `"linear_algebra"` -> `"LinearAlgebra"`
/// - `"my_cool_lib"` -> `"MyCoolLib"`
pub fn to_pascal_case(s: &str) -> String {
    s.split('_')
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(c) => {
                    let upper: String = c.to_uppercase().collect();
                    upper + chars.as_str()
                }
                None => String::new(),
            }
        })
        .collect()
}

/// Convert a relative file path to a PascalCase module name.
///
/// Returns `None` for `main.mpl` in the project root (the entry point).
///
/// # Convention
///
/// - `math/vector.mpl` -> `Some("Math.Vector")`
/// - `utils.mpl` -> `Some("Utils")`
/// - `math/linear_algebra.mpl` -> `Some("Math.LinearAlgebra")`
/// - `a/b/c/d.mpl` -> `Some("A.B.C.D")`
/// - `main.mpl` -> `None`
pub fn path_to_module_name(relative_path: &Path) -> Option<String> {
    let stem = relative_path.file_stem()?.to_str()?;
    let parent = relative_path.parent();

    // Check if this is main.mpl at the project root
    let parent_is_empty = match parent {
        None => true,
        Some(p) => p.as_os_str().is_empty() || p == Path::new("."),
    };

    if stem == "main" && parent_is_empty {
        return None;
    }

    // Collect directory components
    let mut parts: Vec<String> = Vec::new();

    if let Some(parent_path) = parent {
        for component in parent_path.components() {
            if let Component::Normal(os_str) = component {
                if let Some(s) = os_str.to_str() {
                    parts.push(to_pascal_case(s));
                }
            }
        }
    }

    // Add the file stem
    parts.push(to_pascal_case(stem));

    Some(parts.join("."))
}

/// Recursively discover all `.mpl` files in a project directory.
///
/// Returns paths relative to `project_root`, sorted alphabetically for
/// determinism. Hidden directories (names starting with `.`) are skipped.
pub fn discover_mesh_files(project_root: &Path) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();
    discover_recursive(project_root, project_root, &mut files).map_err(|e| {
        format!(
            "Failed to walk directory '{}': {}",
            project_root.display(),
            e
        )
    })?;
    files.sort();
    Ok(files)
}

/// Internal recursive walker that collects `.mpl` files as relative paths.
fn discover_recursive(root: &Path, dir: &Path, files: &mut Vec<PathBuf>) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let entry_path = entry.path();
        let file_name = entry.file_name();
        let name_str = file_name.to_string_lossy();

        // Skip hidden directories and files
        if name_str.starts_with('.') {
            continue;
        }

        if entry_path.is_dir() {
            discover_recursive(root, &entry_path, files)?;
        } else if entry_path.extension().and_then(|e| e.to_str()) == Some("mpl") {
            // Skip *.test.mpl files — they use the test DSL and are only valid
            // when preprocessed by the test runner (`meshc test`), not regular builds.
            if name_str.ends_with(".test.mpl") {
                continue;
            }
            // Store path relative to root
            let relative = entry_path
                .strip_prefix(root)
                .unwrap_or(&entry_path)
                .to_path_buf();
            files.push(relative);
        }
    }
    Ok(())
}

fn discover_installed_package_roots(packages_dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut package_roots = Vec::new();
    discover_installed_package_roots_recursive(packages_dir, &mut package_roots).map_err(|e| {
        format!(
            "Failed to walk installed packages under '{}': {}",
            packages_dir.display(),
            e
        )
    })?;
    package_roots.sort();
    Ok(package_roots)
}

fn discover_installed_package_roots_recursive(
    dir: &Path,
    package_roots: &mut Vec<PathBuf>,
) -> std::io::Result<()> {
    let mut child_dirs = Vec::new();
    let mut has_manifest = false;

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name();
        let name = name.to_string_lossy();

        if name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            child_dirs.push(path);
        } else if name == "mesh.toml" {
            has_manifest = true;
        }
    }

    if has_manifest {
        package_roots.push(dir.to_path_buf());
        return Ok(());
    }

    child_dirs.sort();
    for child_dir in child_dirs {
        discover_installed_package_roots_recursive(&child_dir, package_roots)?;
    }

    Ok(())
}

/// Extract import module paths from a parsed source file.
///
/// Walks the top-level items and collects module paths from both
/// `import Foo.Bar` and `from Foo.Bar import { ... }` declarations.
/// Returns PascalCase dot-separated module names.
pub fn extract_imports(source_file: &SourceFile) -> Vec<String> {
    let mut imports = Vec::new();
    for item in source_file.items() {
        match item {
            Item::ImportDecl(decl) => {
                if let Some(path) = decl.module_path() {
                    let segments = path.segments();
                    if !segments.is_empty() {
                        imports.push(segments.join("."));
                    }
                }
            }
            Item::FromImportDecl(decl) => {
                if let Some(path) = decl.module_path() {
                    let segments = path.segments();
                    if !segments.is_empty() {
                        imports.push(segments.join("."));
                    }
                }
            }
            _ => {}
        }
    }
    imports
}

/// Complete project data after discovery, parsing, and graph construction.
///
/// All Vecs are indexed by ModuleId.0 -- the i-th entry corresponds to
/// the module with ModuleId(i).
pub struct ProjectData {
    /// The module dependency graph.
    pub graph: ModuleGraph,
    /// Modules in compilation order (dependencies before dependents).
    pub compilation_order: Vec<ModuleId>,
    /// Source code for each module (indexed by ModuleId.0).
    pub module_sources: Vec<String>,
    /// Parsed AST for each module (indexed by ModuleId.0).
    pub module_parses: Vec<mesh_parser::Parse>,
}

/// Build a complete project: discover files, parse all, build dependency graph.
///
/// This is the main entry point for the multi-file build pipeline.
/// Unlike [`build_module_graph`], this function retains the per-file
/// Parse results and source strings for downstream compilation phases.
///
/// Pipeline:
/// 1. Discover all `.mpl` files in the project.
/// 2. Register each file as a module, read and parse source.
/// 3. Extract imports from parsed ASTs to build dependency edges.
/// 4. Run topological sort to get compilation order.
///
/// Unknown imports (stdlib, typos) are silently skipped.
/// Self-imports produce a specific error.
/// Circular dependencies produce an error with the cycle path.
pub fn build_project_with_entrypoint(
    project_root: &Path,
    entry_relative_path: &Path,
) -> Result<ProjectData, String> {
    // Phase 1: Discover files, register modules, read and parse source.
    let files = discover_mesh_files(project_root)?;
    if !files
        .iter()
        .any(|relative_path| relative_path == entry_relative_path)
    {
        return Err(format!(
            "Resolved entrypoint '{}' was not found under project '{}'",
            entry_relative_path.display(),
            project_root.display()
        ));
    }
    let mut graph = ModuleGraph::new();
    let mut module_sources = Vec::new();
    let mut module_parses = Vec::new();

    for relative_path in &files {
        let full_path = project_root.join(relative_path);
        let source = std::fs::read_to_string(&full_path)
            .map_err(|e| format!("Failed to read '{}': {}", full_path.display(), e))?;

        let is_entry = relative_path == entry_relative_path;
        let name = if relative_path == Path::new(DEFAULT_ENTRYPOINT) {
            "Main".to_string()
        } else {
            path_to_module_name(relative_path).ok_or_else(|| {
                format!(
                    "Cannot determine module name for '{}'",
                    relative_path.display()
                )
            })?
        };

        let parse = mesh_parser::parse(&source);
        let _id = graph.add_module(name, relative_path.clone(), is_entry);

        module_sources.push(source);
        module_parses.push(parse);
    }

    // Phase 1b: Discover installed package modules from leaf package roots under
    // .mesh/packages, including scoped layouts like <owner>/<package>@<version>.
    let packages_dir = project_root.join(".mesh").join("packages");
    if packages_dir.exists() {
        for package_root in discover_installed_package_roots(&packages_dir)? {
            let pkg_files = discover_mesh_files(&package_root)?;
            for relative_path in &pkg_files {
                let name = match path_to_module_name(relative_path) {
                    Some(n) => n,
                    None => continue, // skip package-root main.mpl
                };
                let full_path = package_root.join(relative_path);
                let source = std::fs::read_to_string(&full_path)
                    .map_err(|e| format!("Failed to read '{}': {}", full_path.display(), e))?;
                let parse = mesh_parser::parse(&source);
                let _id = graph.add_module(name, relative_path.clone(), false);
                module_sources.push(source);
                module_parses.push(parse);
            }
        }
    }

    // Phase 2: Build dependency edges from import declarations.
    for id_val in 0..graph.module_count() {
        let id = ModuleId(id_val as u32);
        let tree = module_parses[id_val].tree();
        let imports = extract_imports(&tree);
        let module_name = graph.get(id).name.clone();

        for import_name in imports {
            match graph.resolve(&import_name) {
                None => {
                    // Unknown import (stdlib or typo) -- skip silently.
                }
                Some(dep_id) if dep_id == id => {
                    return Err(format!("Module '{}' cannot import itself", module_name));
                }
                Some(dep_id) => {
                    graph.add_dependency(id, dep_id);
                }
            }
        }
    }

    // Phase 3: Topological sort.
    let compilation_order = module_graph::topological_sort(&graph)
        .map_err(|e: CycleError| format!("Circular dependency: {}", e))?;

    Ok(ProjectData {
        graph,
        compilation_order,
        module_sources,
        module_parses,
    })
}

pub fn build_project(project_root: &Path) -> Result<ProjectData, String> {
    build_project_with_entrypoint(project_root, Path::new(DEFAULT_ENTRYPOINT))
}

/// Build a complete module dependency graph from a Mesh project directory.
///
/// Convenience wrapper around [`build_project`] that returns only the graph
/// and compilation order (no parse data). Preserves the Phase 37 API for
/// existing tests and callers that don't need per-file parse results.
#[allow(dead_code)]
pub fn build_module_graph(project_root: &Path) -> Result<(ModuleGraph, Vec<ModuleId>), String> {
    let project = build_project(project_root)?;
    Ok((project.graph, project.compilation_order))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_to_pascal_case() {
        assert_eq!(to_pascal_case("vector"), "Vector");
        assert_eq!(to_pascal_case("linear_algebra"), "LinearAlgebra");
        assert_eq!(to_pascal_case("a"), "A");
        assert_eq!(to_pascal_case("already_long_name"), "AlreadyLongName");
    }

    #[test]
    fn test_path_to_module_name_simple() {
        let path = Path::new("utils.mpl");
        assert_eq!(path_to_module_name(path), Some("Utils".to_string()));
    }

    #[test]
    fn test_path_to_module_name_nested() {
        let path = Path::new("math/vector.mpl");
        assert_eq!(path_to_module_name(path), Some("Math.Vector".to_string()));
    }

    #[test]
    fn test_path_to_module_name_snake_case() {
        let path = Path::new("math/linear_algebra.mpl");
        assert_eq!(
            path_to_module_name(path),
            Some("Math.LinearAlgebra".to_string())
        );
    }

    #[test]
    fn test_path_to_module_name_deeply_nested() {
        let path = Path::new("a/b/c/d.mpl");
        assert_eq!(path_to_module_name(path), Some("A.B.C.D".to_string()));
    }

    #[test]
    fn test_path_to_module_name_main() {
        let path = Path::new("main.mpl");
        assert_eq!(path_to_module_name(path), None);
    }

    #[test]
    fn test_discover_mesh_files() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        // Create test files
        fs::write(root.join("main.mpl"), "").unwrap();
        fs::create_dir_all(root.join("math")).unwrap();
        fs::write(root.join("math/vector.mpl"), "").unwrap();
        fs::write(root.join("utils.mpl"), "").unwrap();
        fs::create_dir_all(root.join(".hidden")).unwrap();
        fs::write(root.join(".hidden/secret.mpl"), "").unwrap();

        let files = discover_mesh_files(root).unwrap();
        let file_strs: Vec<&str> = files.iter().map(|p| p.to_str().unwrap()).collect();

        assert_eq!(file_strs, vec!["main.mpl", "math/vector.mpl", "utils.mpl"]);
    }

    #[test]
    fn test_discover_installed_package_roots_scoped_and_flat() {
        let tmp = tempfile::tempdir().unwrap();
        let packages_dir = tmp.path().join(".mesh/packages");

        fs::create_dir_all(packages_dir.join("acme/greeter@1.0.0")).unwrap();
        fs::write(
            packages_dir.join("acme/greeter@1.0.0/mesh.toml"),
            "[package]\nname = \"acme/greeter\"\nversion = \"1.0.0\"\n\n[dependencies]\n",
        )
        .unwrap();
        fs::write(packages_dir.join("acme/greeter@1.0.0/main.mpl"), "").unwrap();

        fs::create_dir_all(packages_dir.join("flat@1.0.0")).unwrap();
        fs::write(
            packages_dir.join("flat@1.0.0/mesh.toml"),
            "[package]\nname = \"flat\"\nversion = \"1.0.0\"\n\n[dependencies]\n",
        )
        .unwrap();

        fs::create_dir_all(packages_dir.join("owner-only")).unwrap();
        fs::write(packages_dir.join("owner-only/main.mpl"), "").unwrap();

        fs::create_dir_all(packages_dir.join(".hidden/ignored@1.0.0")).unwrap();
        fs::write(
            packages_dir.join(".hidden/ignored@1.0.0/mesh.toml"),
            "[package]\nname = \"ignored\"\nversion = \"1.0.0\"\n\n[dependencies]\n",
        )
        .unwrap();

        let roots = discover_installed_package_roots(&packages_dir).unwrap();
        let relative_roots: Vec<String> = roots
            .iter()
            .map(|path| {
                path.strip_prefix(&packages_dir)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/")
            })
            .collect();

        assert_eq!(relative_roots, vec!["acme/greeter@1.0.0", "flat@1.0.0"]);
    }

    #[test]
    fn test_build_project_discovers_scoped_installed_package_modules() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();
        let package_root = root.join(".mesh/packages/acme/greeter@1.0.0");

        fs::write(
            root.join("main.mpl"),
            "from Support.Message import message\n\nfn main() do\n  println(message())\nend\n",
        )
        .unwrap();
        fs::create_dir_all(package_root.join("support")).unwrap();
        fs::write(
            package_root.join("mesh.toml"),
            "[package]\nname = \"acme/greeter\"\nversion = \"1.0.0\"\n\n[dependencies]\n",
        )
        .unwrap();
        fs::write(package_root.join("main.mpl"), "fn main() do\n  0\nend\n").unwrap();
        fs::write(
            package_root.join("support/message.mpl"),
            "fn message() -> String do\n  \"hello from package\"\nend\n",
        )
        .unwrap();

        let project = build_project(root).unwrap();

        assert!(project.graph.resolve("Support.Message").is_some());
        assert!(project
            .graph
            .resolve("Greeter@1.0.0.Support.Message")
            .is_none());
    }

    // ── Import extraction tests ─────────────────────────────────────────

    #[test]
    fn test_extract_imports_both_forms() {
        let source = r#"
import Foo.Bar
from Baz.Qux import { name1, name2 }
"#;
        let parse = mesh_parser::parse(source);
        let tree = parse.tree();
        let imports = extract_imports(&tree);
        assert_eq!(imports, vec!["Foo.Bar".to_string(), "Baz.Qux".to_string()]);
    }

    // ── build_module_graph integration tests ────────────────────────────

    #[test]
    fn test_build_module_graph_simple() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "import Utils\n").unwrap();
        fs::write(root.join("utils.mpl"), "fn helper() do\n  1\nend\n").unwrap();

        let (graph, order) = build_module_graph(root).unwrap();
        assert_eq!(graph.module_count(), 2);

        let names: Vec<&str> = order
            .iter()
            .map(|id| graph.get(*id).name.as_str())
            .collect();
        assert_eq!(names, vec!["Utils", "Main"]);
    }

    #[test]
    fn test_build_module_graph_cycle() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "fn main() do\n  1\nend\n").unwrap();
        fs::write(root.join("a.mpl"), "import B\n").unwrap();
        fs::write(root.join("b.mpl"), "import A\n").unwrap();

        let result = build_module_graph(root);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("Circular dependency"),
            "Expected cycle error, got: {}",
            err
        );
    }

    #[test]
    fn test_build_module_graph_diamond() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "import A\nimport B\n").unwrap();
        fs::write(root.join("a.mpl"), "import C\n").unwrap();
        fs::write(root.join("b.mpl"), "import C\n").unwrap();
        fs::write(root.join("c.mpl"), "fn base() do\n  1\nend\n").unwrap();

        let (graph, order) = build_module_graph(root).unwrap();
        let names: Vec<&str> = order
            .iter()
            .map(|id| graph.get(*id).name.as_str())
            .collect();

        // C first (no deps), then A and B (alphabetical), then Main last.
        assert_eq!(names, vec!["C", "A", "B", "Main"]);
    }

    #[test]
    fn test_build_module_graph_unknown_import_skipped() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "import NonExistent\nimport IO\n").unwrap();

        let (graph, order) = build_module_graph(root).unwrap();
        assert_eq!(graph.module_count(), 1);

        let names: Vec<&str> = order
            .iter()
            .map(|id| graph.get(*id).name.as_str())
            .collect();
        assert_eq!(names, vec!["Main"]);
    }

    #[test]
    fn test_build_module_graph_self_import() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "fn main() do\n  1\nend\n").unwrap();
        fs::write(root.join("utils.mpl"), "import Utils\n").unwrap();

        let result = build_module_graph(root);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("cannot import itself"),
            "Expected self-import error, got: {}",
            err
        );
    }

    // ── build_project tests ──────────────────────────────────────────────

    #[test]
    fn test_build_project_simple() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(
            root.join("main.mpl"),
            "import Utils\nfn main() do\n  1\nend\n",
        )
        .unwrap();
        fs::write(root.join("utils.mpl"), "fn helper() do\n  1\nend\n").unwrap();

        let project = build_project(root).unwrap();

        // Graph has 2 modules
        assert_eq!(project.graph.module_count(), 2);

        // Sources and parses are indexed in parallel
        assert_eq!(project.module_sources.len(), 2);
        assert_eq!(project.module_parses.len(), 2);

        // Compilation order: Utils before Main (Main imports Utils)
        let names: Vec<&str> = project
            .compilation_order
            .iter()
            .map(|id| project.graph.get(*id).name.as_str())
            .collect();
        assert_eq!(names, vec!["Utils", "Main"]);

        // Parse results have no errors
        for parse in &project.module_parses {
            assert!(parse.errors().is_empty(), "Expected no parse errors");
        }

        // Sources contain expected text
        let main_id = project.graph.resolve("Main").unwrap();
        let utils_id = project.graph.resolve("Utils").unwrap();
        assert!(project.module_sources[main_id.0 as usize].contains("import Utils"));
        assert!(project.module_sources[utils_id.0 as usize].contains("fn helper()"));
    }

    #[test]
    fn test_build_project_with_entrypoint_override_marks_non_root_entry_without_renaming() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::create_dir_all(root.join("lib")).unwrap();
        fs::write(root.join("main.mpl"), "fn main() do\n  0\nend\n").unwrap();
        fs::write(
            root.join("lib/start.mpl"),
            "from Lib.Support import answer\n\nfn main() do\n  answer()\nend\n",
        )
        .unwrap();
        fs::write(
            root.join("lib/support.mpl"),
            "pub fn answer() -> Int do\n  42\nend\n",
        )
        .unwrap();

        let project = build_project_with_entrypoint(root, Path::new("lib/start.mpl")).unwrap();

        let root_main = project
            .graph
            .resolve("Main")
            .expect("root main should still exist");
        let override_entry = project
            .graph
            .resolve("Lib.Start")
            .expect("override entry should keep its path-derived module name");
        let support = project
            .graph
            .resolve("Lib.Support")
            .expect("support module should be discovered");

        assert!(!project.graph.get(root_main).is_entry);
        assert!(project.graph.get(override_entry).is_entry);
        assert_eq!(
            project.graph.get(override_entry).path,
            PathBuf::from("lib/start.mpl")
        );
        assert_eq!(
            project.graph.get(support).path,
            PathBuf::from("lib/support.mpl")
        );
    }

    #[test]
    fn test_build_project_with_entrypoint_override_wins_when_both_entry_files_exist() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::create_dir_all(root.join("lib")).unwrap();
        fs::write(root.join("main.mpl"), "fn main() do\n  0\nend\n").unwrap();
        fs::write(root.join("lib/start.mpl"), "fn main() do\n  1\nend\n").unwrap();

        let project = build_project_with_entrypoint(root, Path::new("lib/start.mpl")).unwrap();

        let entry_modules: Vec<&str> = project
            .graph
            .modules
            .iter()
            .filter(|module| module.is_entry)
            .map(|module| module.name.as_str())
            .collect();
        assert_eq!(entry_modules, vec!["Lib.Start"]);
    }

    #[test]
    fn test_build_project_with_entrypoint_missing_override_reports_resolved_path() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "fn main() do\n  0\nend\n").unwrap();

        let err = match build_project_with_entrypoint(root, Path::new("lib/start.mpl")) {
            Ok(project) => panic!(
                "expected missing override entrypoint to fail, discovered {} modules",
                project.graph.module_count()
            ),
            Err(err) => err,
        };

        assert!(err.contains("lib/start.mpl"), "unexpected error: {err}");
    }

    #[test]
    fn test_build_project_single_file() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "fn main() do\n  42\nend\n").unwrap();

        let project = build_project(root).unwrap();

        assert_eq!(project.graph.module_count(), 1);
        assert_eq!(project.module_sources.len(), 1);
        assert_eq!(project.module_parses.len(), 1);

        // Single entry in compilation order, marked as entry
        assert_eq!(project.compilation_order.len(), 1);
        let entry_id = project.compilation_order[0];
        assert!(project.graph.get(entry_id).is_entry);

        // Parse has no errors
        assert!(project.module_parses[0].errors().is_empty());
    }

    #[test]
    fn test_build_project_parse_error_retained() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::write(root.join("main.mpl"), "fn main() do\n  1\nend\n").unwrap();
        fs::write(root.join("broken.mpl"), "fn incomplete(\n").unwrap();

        let project = build_project(root).unwrap();

        // build_project succeeds even with parse errors (that is build()'s job to check)
        assert_eq!(project.graph.module_count(), 2);

        let main_id = project.graph.resolve("Main").unwrap();
        let broken_id = project.graph.resolve("Broken").unwrap();

        // Broken module has parse errors
        assert!(
            !project.module_parses[broken_id.0 as usize]
                .errors()
                .is_empty(),
            "Expected parse errors in broken module"
        );

        // Main module has no parse errors
        assert!(
            project.module_parses[main_id.0 as usize]
                .errors()
                .is_empty(),
            "Expected no parse errors in main module"
        );
    }
}
