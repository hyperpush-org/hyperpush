use std::sync::Arc;
use axum::{
    extract::{Query, State},
    response::{Html, IntoResponse, Redirect},
    Json as AxumJson,
};
use oauth2::{
    AuthorizationCode, CsrfToken, Scope, TokenResponse,
    reqwest::async_http_client,
};
use serde::{Deserialize, Serialize};
use tower_sessions::Session;
use uuid::Uuid;
use crate::{db, error::AppError, state::AppState};

const SESSION_USER_ID: &str = "user_id";
const SESSION_GITHUB_LOGIN: &str = "github_login";
const SESSION_CSRF: &str = "csrf_state";

// ===== GitHub Login =====

pub async fn github_login(
    State(state): State<Arc<AppState>>,
    session: Session,
) -> impl IntoResponse {
    let (auth_url, csrf_token) = state.oauth_client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("read:user".to_string()))
        .add_scope(Scope::new("user:email".to_string()))
        .url();

    session.insert(SESSION_CSRF, csrf_token.secret().clone()).await.ok();

    Redirect::to(auth_url.as_str())
}

// ===== GitHub Callback =====

#[derive(Deserialize)]
pub struct CallbackParams {
    code: String,
    state: String,
}

pub async fn github_callback(
    State(state): State<Arc<AppState>>,
    session: Session,
    Query(params): Query<CallbackParams>,
) -> Result<Redirect, AppError> {
    // Verify CSRF state
    let stored_state: Option<String> = session.get(SESSION_CSRF).await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    session.remove::<String>(SESSION_CSRF).await.ok();

    let stored_state = stored_state
        .ok_or_else(|| AppError::BadRequest("Missing CSRF state in session".to_string()))?;
    if stored_state != params.state {
        return Err(AppError::BadRequest("CSRF state mismatch".to_string()));
    }

    // Exchange authorization code for access token
    let token_result = state.oauth_client
        .exchange_code(AuthorizationCode::new(params.code))
        .request_async(async_http_client)
        .await
        .map_err(|e| AppError::Internal(format!("OAuth token exchange failed: {}", e)))?;

    let access_token = token_result.access_token().secret().clone();

    // Fetch GitHub user info
    let (github_id, github_login, email) = fetch_github_user(&access_token).await?;

    // Upsert user in DB
    let user_id = db::tokens::upsert_user(
        &state.pool,
        github_id,
        &github_login,
        email.as_deref(),
    )
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    // Store user info in session
    session.insert(SESSION_USER_ID, user_id.to_string()).await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    session.insert(SESSION_GITHUB_LOGIN, github_login.clone()).await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    // Auto-create a publish token and hand it off to the frontend
    let (_token_id, raw_token) = db::tokens::create_token(&state.pool, user_id, "default")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let redirect = format!(
        "{}/token?value={}&login={}",
        state.config.frontend_url, raw_token, github_login
    );
    Ok(Redirect::to(&redirect))
}

async fn fetch_github_user(access_token: &str) -> Result<(i64, String, Option<String>), AppError> {
    let client = reqwest::Client::new();
    let user: serde_json::Value = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("User-Agent", "mesh-registry/0.1")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("GitHub API error: {}", e)))?
        .json()
        .await
        .map_err(|e| AppError::Internal(format!("GitHub API JSON parse error: {}", e)))?;

    let github_id = user["id"].as_i64()
        .ok_or_else(|| AppError::Internal("GitHub user missing id".to_string()))?;
    let github_login = user["login"].as_str()
        .ok_or_else(|| AppError::Internal("GitHub user missing login".to_string()))?
        .to_string();
    let email = user["email"].as_str().map(|s| s.to_string());

    Ok((github_id, github_login, email))
}

// ===== Session helper =====

async fn require_session(session: &Session) -> Result<(Uuid, String), AppError> {
    let user_id_str: Option<String> = session.get(SESSION_USER_ID).await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let github_login: Option<String> = session.get(SESSION_GITHUB_LOGIN).await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    match (user_id_str, github_login) {
        (Some(id_str), Some(login)) => {
            let id = Uuid::parse_str(&id_str)
                .map_err(|_| AppError::Internal("Invalid user_id in session".to_string()))?;
            Ok((id, login))
        }
        _ => Err(AppError::Unauthorized("Not logged in".to_string())),
    }
}

// ===== Dashboard =====

pub async fn dashboard(session: Session) -> impl IntoResponse {
    match session.get::<String>(SESSION_GITHUB_LOGIN).await {
        Ok(Some(login)) => Html(format!(
            r#"<!DOCTYPE html>
<html>
<head><title>Mesh Registry Dashboard</title></head>
<body>
<h1>Mesh Registry</h1>
<p>Logged in as <strong>{}</strong></p>
<h2>Publish Tokens</h2>
<p>Create tokens via the API: <code>POST /dashboard/tokens</code> with JSON body <code>{{"name":"my-token"}}</code></p>
<p><a href="/auth/github">Re-authenticate</a></p>
</body>
</html>"#,
            login
        )).into_response(),
        _ => Redirect::to("/auth/github").into_response(),
    }
}

// ===== Token Management =====

#[derive(Deserialize)]
pub struct CreateTokenRequest {
    pub name: String,
}

#[derive(Serialize)]
pub struct CreateTokenResponse {
    pub id: String,
    pub name: String,
    pub token: String,  // Raw token — shown ONCE, not stored
}

#[derive(Serialize)]
pub struct TokenListItem {
    pub id: String,
    pub name: String,
}

pub async fn create_token_handler(
    State(state): State<Arc<AppState>>,
    session: Session,
    AxumJson(body): AxumJson<CreateTokenRequest>,
) -> Result<AxumJson<CreateTokenResponse>, AppError> {
    let (user_id, _login) = require_session(&session).await?;

    let (token_id, raw_token) = db::tokens::create_token(&state.pool, user_id, &body.name)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(AxumJson(CreateTokenResponse {
        id: token_id.to_string(),
        name: body.name,
        token: raw_token,  // Raw token shown once here; only argon2 hash stored in DB
    }))
}

pub async fn list_tokens_handler(
    State(state): State<Arc<AppState>>,
    session: Session,
) -> Result<AxumJson<Vec<TokenListItem>>, AppError> {
    let (user_id, _login) = require_session(&session).await?;

    let tokens = db::tokens::list_tokens(&state.pool, user_id)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(AxumJson(tokens.into_iter().map(|(id, name)| TokenListItem {
        id: id.to_string(),
        name,
    }).collect()))
}
