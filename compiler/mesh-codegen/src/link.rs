//! Object file linking via system `cc`.
//!
//! Links compiled object files with the Mesh runtime library (`libmesh_rt.a`)
//! to produce native executables. Uses the system C compiler (`cc`) as the
//! linker driver, which handles platform-specific details (CRT objects, libc,
//! macOS vs Linux linker flags) automatically.

use std::path::{Path, PathBuf};
use std::process::Command;

/// Link an object file with the Mesh runtime to produce a native executable.
///
/// # Arguments
///
/// * `object_path` - Path to the compiled `.o` file
/// * `output_path` - Path for the output executable
/// * `rt_lib_path` - Optional path to `libmesh_rt.a`; if None, attempts to
///   locate it in the workspace target directory
///
/// # Errors
///
/// Returns an error string if the linker cannot be found or linking fails.
pub fn link(
    object_path: &Path,
    output_path: &Path,
    rt_lib_path: Option<&Path>,
) -> Result<(), String> {
    // Find the runtime library
    let rt_path = match rt_lib_path {
        Some(p) => p.to_path_buf(),
        None => find_mesh_rt()?,
    };

    if !rt_path.exists() {
        return Err(format!(
            "Mesh runtime library not found at '{}'. Run `cargo build -p mesh-rt` first.",
            rt_path.display()
        ));
    }

    let rt_dir = rt_path
        .parent()
        .ok_or_else(|| "Cannot determine runtime library directory".to_string())?;

    // Invoke system cc as linker driver
    let mut cmd = Command::new("cc");
    cmd.arg(object_path)
        .arg("-L")
        .arg(rt_dir)
        .arg("-lmesh_rt")
        .arg("-lm")
        .arg("-o")
        .arg(output_path);

    // On macOS, we may need to link against system frameworks
    #[cfg(target_os = "macos")]
    {
        cmd.arg("-framework").arg("Security");
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to invoke linker (cc): {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Linking failed:\n{}", stderr));
    }

    // Clean up the object file
    std::fs::remove_file(object_path).ok();

    Ok(())
}

/// Locate the Mesh runtime static library (`libmesh_rt.a`).
///
/// Searches in the workspace target directory under both `debug` and `release`
/// profiles. Prefers the profile matching the compiler's own build: a release
/// `meshc` links the release runtime, a debug `meshc` links the debug runtime.
/// This prevents stale cross-profile linking (e.g., linking a debug runtime
/// with outdated stack sizes when the release runtime has been updated).
fn find_mesh_rt() -> Result<PathBuf, String> {
    // Walk up from the current executable's directory to find the workspace root,
    // or use the CARGO_MANIFEST_DIR-based heuristic.
    let candidates = [
        // When running from cargo: workspace target dir
        find_workspace_target_dir(),
    ];

    // Prefer the runtime that matches meshc's own build profile.
    let profiles: &[&str] = if cfg!(debug_assertions) {
        &["debug", "release"]
    } else {
        &["release", "debug"]
    };

    for candidate in candidates.iter().flatten() {
        for profile in profiles {
            let path = candidate.join(profile).join("libmesh_rt.a");
            if path.exists() {
                return Ok(path);
            }
        }
    }

    Err(
        "Could not locate libmesh_rt.a. Ensure `cargo build -p mesh-rt` has been run."
            .to_string(),
    )
}

/// Attempt to find the workspace target directory.
///
/// Uses the `CARGO_TARGET_DIR` env var if set, otherwise walks up from the
/// current executable to find a `target/` directory.
fn find_workspace_target_dir() -> Option<PathBuf> {
    // Check env var first
    if let Ok(dir) = std::env::var("CARGO_TARGET_DIR") {
        return Some(PathBuf::from(dir));
    }

    // Try to find workspace root by walking up from current exe
    if let Ok(exe) = std::env::current_exe() {
        let mut dir = exe.parent().map(|p| p.to_path_buf());
        while let Some(d) = dir {
            if d.file_name().map_or(false, |n| n == "target") {
                return Some(d);
            }
            // Check if parent has a target/ directory
            let target_dir = d.join("target");
            if target_dir.exists() {
                return Some(target_dir);
            }
            dir = d.parent().map(|p| p.to_path_buf());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_workspace_target_dir() {
        // This should find the workspace target dir when running under cargo test
        let result = find_workspace_target_dir();
        // In a cargo test context, we should find the target dir
        assert!(
            result.is_some(),
            "Should find workspace target dir during cargo test"
        );
    }
}
