use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
pub struct PackageRow {
    pub name: String,
    pub owner_login: String,
    pub description: String,
    pub latest_version: Option<String>,
    pub download_count: i64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct VersionRow {
    pub id: Uuid,
    pub package_name: String,
    pub version: String,
    pub sha256: String,
    pub size_bytes: i64,
    pub readme: Option<String>,
    pub published_at: DateTime<Utc>,
    pub download_count: i64,
}

#[derive(Debug, sqlx::FromRow)]
pub struct SearchResult {
    pub name: String,
    pub version: String,
    pub description: String,
}

/// Check whether a specific name+version already exists (for 409 duplicate detection).
pub async fn version_exists(pool: &PgPool, package_name: &str, version: &str) -> Result<bool, sqlx::Error> {
    let row = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM versions WHERE package_name = $1 AND version = $2"
    )
    .bind(package_name)
    .bind(version)
    .fetch_optional(pool)
    .await?;
    Ok(row.is_some())
}

/// Insert a new version. Creates the package row if it doesn't exist.
/// Returns Err if the UNIQUE(package_name, version) constraint fires (concurrent duplicate publish).
pub async fn insert_version(
    pool: &PgPool,
    package_name: &str,
    version: &str,
    sha256: &str,
    size_bytes: i64,
    readme: Option<String>,
    owner_login: &str,
    published_by: Uuid,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Upsert package row
    sqlx::query(
        r#"
        INSERT INTO packages (name, owner_login, description, latest_version, updated_at)
        VALUES ($1, $2, '', $3, now())
        ON CONFLICT (name) DO UPDATE
          SET latest_version = EXCLUDED.latest_version,
              updated_at = now()
        "#,
    )
    .bind(package_name)
    .bind(owner_login)
    .bind(version)
    .execute(&mut *tx)
    .await?;

    // Insert version (will fail with unique violation if duplicate)
    sqlx::query(
        r#"
        INSERT INTO versions (package_name, version, sha256, size_bytes, readme, published_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
    )
    .bind(package_name)
    .bind(version)
    .bind(sha256)
    .bind(size_bytes)
    .bind(readme)
    .bind(published_by)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

/// Get the latest package metadata.
pub async fn get_package(pool: &PgPool, name: &str) -> Result<Option<PackageRow>, sqlx::Error> {
    sqlx::query_as::<_, PackageRow>(
        "SELECT name, owner_login, description, latest_version, download_count, updated_at FROM packages WHERE name = $1"
    )
    .bind(name)
    .fetch_optional(pool)
    .await
}

/// Get version metadata (sha256, size, etc.).
pub async fn get_version(pool: &PgPool, package_name: &str, version: &str) -> Result<Option<VersionRow>, sqlx::Error> {
    sqlx::query_as::<_, VersionRow>(
        "SELECT id, package_name, version, sha256, size_bytes, readme, published_at, download_count FROM versions WHERE package_name = $1 AND version = $2"
    )
    .bind(package_name)
    .bind(version)
    .fetch_optional(pool)
    .await
}

/// Get all versions for a package, ordered newest first.
pub async fn list_versions(pool: &PgPool, package_name: &str) -> Result<Vec<VersionRow>, sqlx::Error> {
    sqlx::query_as::<_, VersionRow>(
        "SELECT id, package_name, version, sha256, size_bytes, readme, published_at, download_count FROM versions WHERE package_name = $1 ORDER BY published_at DESC"
    )
    .bind(package_name)
    .fetch_all(pool)
    .await
}

/// List all packages, ordered by download_count DESC then updated_at DESC.
pub async fn list_packages(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<PackageRow>, sqlx::Error> {
    sqlx::query_as::<_, PackageRow>(
        "SELECT name, owner_login, description, latest_version, download_count, updated_at FROM packages ORDER BY download_count DESC, updated_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

/// Search packages by name+description using PostgreSQL tsvector.
pub async fn search_packages(pool: &PgPool, query: &str) -> Result<Vec<SearchResult>, sqlx::Error> {
    sqlx::query_as::<_, SearchResult>(
        r#"
        SELECT p.name, COALESCE(p.latest_version, '') as version, p.description
        FROM packages p
        WHERE p.search_vec @@ plainto_tsquery('english', $1)
        ORDER BY ts_rank(p.search_vec, plainto_tsquery('english', $1)) DESC
        LIMIT 50
        "#,
    )
    .bind(query)
    .fetch_all(pool)
    .await
}

/// Atomically increment download counter for both version and package.
pub async fn increment_download(pool: &PgPool, package_name: &str, version: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE versions SET download_count = download_count + 1 WHERE package_name = $1 AND version = $2"
    )
    .bind(package_name)
    .bind(version)
    .execute(pool)
    .await?;
    sqlx::query(
        "UPDATE packages SET download_count = download_count + 1 WHERE name = $1"
    )
    .bind(package_name)
    .execute(pool)
    .await?;
    Ok(())
}
