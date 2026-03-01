use std::sync::Arc;
use axum::{
    body::to_bytes,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
};
use sha2::{Digest, Sha256};
use crate::{db, error::AppError, state::AppState};

pub async fn handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    request: Request,
) -> Result<StatusCode, AppError> {
    // 1. Extract Bearer token
    let token = extract_bearer(&headers)?;

    // 2. Validate token → get owner github_login
    let owner = db::tokens::validate_bearer_token(&state.pool, &token)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::Unauthorized("Invalid or expired token".to_string()))?;

    // 3. Extract package metadata from headers
    let name = header_str(&headers, "x-package-name")?;
    let version = header_str(&headers, "x-package-version")?;
    let expected_sha256 = header_str(&headers, "x-package-sha256")?;

    // 4. Namespace check: name must start with "{owner}/"
    if !name.starts_with(&format!("{}/", owner)) {
        return Err(AppError::Forbidden(format!(
            "Package name must be scoped to your GitHub login: {}/...", owner
        )));
    }

    // 5. Read body (50MB limit applied via layer in router)
    let body_bytes = to_bytes(request.into_body(), 50 * 1024 * 1024)
        .await
        .map_err(|e| AppError::BadRequest(format!("Failed to read body: {}", e)))?;

    // 6. Verify SHA-256
    let actual_sha256: String = Sha256::digest(&body_bytes)
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect();
    if actual_sha256 != expected_sha256 {
        return Err(AppError::BadRequest(format!(
            "SHA-256 mismatch: client sent {}, computed {}",
            expected_sha256, actual_sha256
        )));
    }

    // 7. Check for duplicate version first (before DB insert for fast 409)
    if db::packages::version_exists(&state.pool, &name, &version)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
    {
        return Err(AppError::Conflict(format!(
            "{}@{} already published. Versions are immutable.",
            name, version
        )));
    }

    // 8. Extract README.md from tarball (case-insensitive search)
    //    The tarball is a .tar.gz — decompress with flate2, walk entries with tar crate.
    let readme = extract_readme_from_tarball(&body_bytes);

    // 9. Look up user UUID for published_by
    #[derive(sqlx::FromRow)]
    struct UserIdRow { id: uuid::Uuid }
    let user_row = sqlx::query_as::<_, UserIdRow>(
        "SELECT id FROM users WHERE github_login = $1"
    )
    .bind(&owner)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| AppError::Internal("User not found in DB".to_string()))?;

    // 10. Insert into DB (UNIQUE constraint serializes concurrent duplicates)
    db::packages::insert_version(
        &state.pool,
        &name,
        &version,
        &actual_sha256,
        body_bytes.len() as i64,
        readme,
        &owner,
        user_row.id,
    )
    .await
    .map_err(|e| {
        // Unique violation = concurrent duplicate
        if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
            AppError::Conflict(format!("{}@{} already published.", name, version))
        } else {
            AppError::Internal(e.to_string())
        }
    })?;

    // 11. Upload to R2 (idempotent — skip if blob already exists by SHA-256)
    if !state.s3.object_exists(&actual_sha256)
        .await
        .map_err(|e| AppError::Internal(e))?
    {
        state.s3.put_object(&actual_sha256, &body_bytes)
            .await
            .map_err(|e| AppError::Internal(e))?;
    }

    Ok(StatusCode::CREATED)
}

/// Walk a .tar.gz byte slice and return the contents of README.md (case-insensitive).
/// Returns None if not found or if decompression fails.
fn extract_readme_from_tarball(gz_bytes: &[u8]) -> Option<String> {
    use flate2::read::GzDecoder;
    use tar::Archive;
    use std::io::Read;

    let decoder = GzDecoder::new(gz_bytes);
    let mut archive = Archive::new(decoder);

    let entries = archive.entries().ok()?;
    for entry in entries {
        let mut entry = entry.ok()?;
        let path = entry.path().ok()?;
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        // Case-insensitive match for README.md
        if file_name.to_lowercase() == "readme.md" {
            let mut contents = String::new();
            entry.read_to_string(&mut contents).ok()?;
            return Some(contents);
        }
    }
    None
}

fn extract_bearer(headers: &HeaderMap) -> Result<String, AppError> {
    let auth = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;
    auth.strip_prefix("Bearer ")
        .map(|t| t.to_string())
        .ok_or_else(|| AppError::Unauthorized("Authorization must be Bearer token".to_string()))
}

fn header_str(headers: &HeaderMap, name: &str) -> Result<String, AppError> {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::BadRequest(format!("Missing required header: {}", name)))
}
