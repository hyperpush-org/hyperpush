use sqlx::PgPool;
use uuid::Uuid;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

/// Hash a raw token string using Argon2id. Returns the PHC string.
pub fn hash_token(raw_token: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(raw_token.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("Token hash error: {}", e))
}

/// Verify a raw token against a stored PHC hash.
pub fn verify_token_hash(raw_token: &str, phc_hash: &str) -> bool {
    let Ok(hash) = PasswordHash::new(phc_hash) else { return false; };
    Argon2::default().verify_password(raw_token.as_bytes(), &hash).is_ok()
}

#[derive(sqlx::FromRow)]
struct TokenRow {
    hash: String,
    github_login: String,
}

/// Look up the github_login for a Bearer token.
/// Fetches all token hashes for any user (inefficient but correct for v1 — limited token count).
/// Returns the github_login string if valid.
pub async fn validate_bearer_token(pool: &PgPool, raw_token: &str) -> Result<Option<String>, sqlx::Error> {
    let rows = sqlx::query_as::<_, TokenRow>(
        "SELECT t.hash, u.github_login FROM tokens t JOIN users u ON t.user_id = u.id"
    )
    .fetch_all(pool)
    .await?;

    for row in rows {
        if verify_token_hash(raw_token, &row.hash) {
            return Ok(Some(row.github_login));
        }
    }
    Ok(None)
}

/// Upsert a user from GitHub OAuth data. Returns the user UUID.
pub async fn upsert_user(pool: &PgPool, github_id: i64, github_login: &str, email: Option<&str>) -> Result<Uuid, sqlx::Error> {
    let row = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO users (github_id, github_login, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (github_id) DO UPDATE
          SET github_login = EXCLUDED.github_login,
              email = EXCLUDED.email
        RETURNING id
        "#,
    )
    .bind(github_id)
    .bind(github_login)
    .bind(email)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

/// Create a new publish token for a user. Returns (token_id, raw_token).
pub async fn create_token(pool: &PgPool, user_id: Uuid, token_name: &str) -> Result<(Uuid, String), sqlx::Error> {
    let raw_token = uuid::Uuid::new_v4().to_string().replace('-', "");
    let hash = hash_token(&raw_token).map_err(|_| sqlx::Error::RowNotFound)?;
    let token_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO tokens (user_id, name, hash) VALUES ($1, $2, $3) RETURNING id"
    )
    .bind(user_id)
    .bind(token_name)
    .bind(&hash)
    .fetch_one(pool)
    .await?;
    Ok((token_id, raw_token))
}

#[derive(sqlx::FromRow)]
struct TokenListRow {
    id: Uuid,
    name: String,
}

/// List all tokens for a user (returns names + ids, not hashes).
pub async fn list_tokens(pool: &PgPool, user_id: Uuid) -> Result<Vec<(Uuid, String)>, sqlx::Error> {
    let rows = sqlx::query_as::<_, TokenListRow>(
        "SELECT id, name FROM tokens WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|r| (r.id, r.name)).collect())
}

/// Delete a token by ID (only if it belongs to the user).
pub async fn delete_token(pool: &PgPool, token_id: Uuid, user_id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM tokens WHERE id = $1 AND user_id = $2"
    )
    .bind(token_id)
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}
