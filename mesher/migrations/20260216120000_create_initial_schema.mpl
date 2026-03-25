# Initial migration: creates all Mesher tables, indexes, and extensions.
# Replaces the imperative storage/schema.mpl create_schema function.
# Tables created in FK dependency order.

pub fn up(pool :: PoolHandle) -> Int ! String do
  # Extensions
  Pg.create_extension(pool, "pgcrypto") ?
  # 1. organizations (no FKs)
  Migration.create_table(pool,
  "organizations",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "name:TEXT:NOT NULL", "slug:TEXT:NOT NULL UNIQUE", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()"]) ?
  # 2. users (no FKs)
  Migration.create_table(pool,
  "users",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "email:TEXT:NOT NULL UNIQUE", "password_hash:TEXT:NOT NULL", "display_name:TEXT:NOT NULL", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()"]) ?
  # 3. org_memberships (FKs: users, organizations)
  Migration.create_table(pool,
  "org_memberships",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "user_id:UUID:NOT NULL REFERENCES users(id) ON DELETE CASCADE", "org_id:UUID:NOT NULL REFERENCES organizations(id) ON DELETE CASCADE", "role:TEXT:NOT NULL DEFAULT 'member'", "joined_at:TIMESTAMPTZ:NOT NULL DEFAULT now()", "UNIQUE(user_id, org_id)"]) ?
  # 4. sessions (FK: users) -- token is PK, not UUID
  Migration.create_table(pool,
  "sessions",
  ["token:TEXT:PRIMARY KEY", "user_id:UUID:NOT NULL REFERENCES users(id) ON DELETE CASCADE", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()", "expires_at:TIMESTAMPTZ:NOT NULL DEFAULT now() + interval '7 days'"]) ?
  # 5. projects (FK: organizations) -- includes slug, retention_days, sample_rate
  Migration.create_table(pool,
  "projects",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "org_id:UUID:NOT NULL REFERENCES organizations(id) ON DELETE CASCADE", "name:TEXT:NOT NULL", "platform:TEXT", "slug:TEXT", "retention_days:INTEGER:NOT NULL DEFAULT 90", "sample_rate:REAL:NOT NULL DEFAULT 1.0", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()"]) ?
  # 6. api_keys (FK: projects)
  Migration.create_table(pool,
  "api_keys",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "project_id:UUID:NOT NULL REFERENCES projects(id) ON DELETE CASCADE", "key_value:TEXT:NOT NULL UNIQUE", "label:TEXT:NOT NULL DEFAULT 'default'", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()", "revoked_at:TIMESTAMPTZ"]) ?
  # 7. issues (FK: users for assigned_to)
  Migration.create_table(pool,
  "issues",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "project_id:UUID:NOT NULL", "fingerprint:TEXT:NOT NULL", "title:TEXT:NOT NULL", "level:TEXT:NOT NULL", "status:TEXT:NOT NULL DEFAULT 'unresolved'", "event_count:INTEGER:NOT NULL DEFAULT 0", "first_seen:TIMESTAMPTZ:NOT NULL DEFAULT now()", "last_seen:TIMESTAMPTZ:NOT NULL DEFAULT now()", "assigned_to:UUID REFERENCES users(id)", "UNIQUE(project_id, fingerprint)"]) ?
  # 8. events (partitioned table)
  Pg.create_range_partitioned_table(pool,
  "events",
  ["id:UUID:NOT NULL DEFAULT gen_random_uuid()", "project_id:UUID:NOT NULL", "issue_id:UUID:NOT NULL", "level:TEXT:NOT NULL", "message:TEXT:NOT NULL", "fingerprint:TEXT:NOT NULL", "exception:JSONB", "stacktrace:JSONB", "breadcrumbs:JSONB", "tags:JSONB:NOT NULL DEFAULT '{}'", "extra:JSONB:NOT NULL DEFAULT '{}'", "user_context:JSONB", "sdk_name:TEXT", "sdk_version:TEXT", "received_at:TIMESTAMPTZ:NOT NULL DEFAULT now()", "PRIMARY KEY (id, received_at)"],
  "received_at") ?
  # 9. alert_rules (FK: projects) -- includes cooldown_minutes, last_fired_at
  Migration.create_table(pool,
  "alert_rules",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "project_id:UUID:NOT NULL REFERENCES projects(id) ON DELETE CASCADE", "name:TEXT:NOT NULL", "condition_json:JSONB:NOT NULL", "action_json:JSONB:NOT NULL", "enabled:BOOLEAN:NOT NULL DEFAULT true", "cooldown_minutes:INTEGER:NOT NULL DEFAULT 60", "last_fired_at:TIMESTAMPTZ", "created_at:TIMESTAMPTZ:NOT NULL DEFAULT now()"]) ?
  # 10. alerts (FKs: alert_rules, projects)
  Migration.create_table(pool,
  "alerts",
  ["id:UUID:PRIMARY KEY DEFAULT gen_random_uuid()", "rule_id:UUID:NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE", "project_id:UUID:NOT NULL REFERENCES projects(id) ON DELETE CASCADE", "status:TEXT:NOT NULL DEFAULT 'active'", "message:TEXT:NOT NULL", "condition_snapshot:JSONB:NOT NULL", "triggered_at:TIMESTAMPTZ:NOT NULL DEFAULT now()", "acknowledged_at:TIMESTAMPTZ", "resolved_at:TIMESTAMPTZ"]) ?
  # ── Indexes ──────────────────────────────────────────────────────────
  Migration.create_index(pool,
  "projects",
  ["slug"],
  "unique:true name:idx_projects_slug where:slug IS NOT NULL") ?
  Migration.create_index(pool, "org_memberships", ["user_id"], "name:idx_org_memberships_user") ?
  Migration.create_index(pool, "org_memberships", ["org_id"], "name:idx_org_memberships_org") ?
  Migration.create_index(pool, "sessions", ["user_id"], "name:idx_sessions_user") ?
  Migration.create_index(pool, "sessions", ["expires_at"], "name:idx_sessions_expires") ?
  Migration.create_index(pool, "projects", ["org_id"], "name:idx_projects_org") ?
  Migration.create_index(pool, "api_keys", ["project_id"], "name:idx_api_keys_project") ?
  Migration.create_index(pool,
  "api_keys",
  ["key_value"],
  "name:idx_api_keys_value where:revoked_at IS NULL") ?
  Migration.create_index(pool, "issues", ["project_id", "status"], "name:idx_issues_project_status") ?
  Migration.create_index(pool,
  "issues",
  ["project_id", "last_seen:DESC"],
  "name:idx_issues_project_last_seen") ?
  Migration.create_index(pool,
  "events",
  ["project_id", "received_at:DESC"],
  "name:idx_events_project_received") ?
  Migration.create_index(pool,
  "events",
  ["issue_id", "received_at:DESC"],
  "name:idx_events_issue_received") ?
  Migration.create_index(pool, "events", ["level", "received_at:DESC"], "name:idx_events_level") ?
  Migration.create_index(pool, "events", ["fingerprint"], "name:idx_events_fingerprint") ?
  Pg.create_gin_index(pool, "events", "idx_events_tags", "tags", "jsonb_path_ops") ?
  Migration.create_index(pool,
  "alert_rules",
  ["project_id"],
  "name:idx_alert_rules_project where:enabled = true") ?
  Migration.create_index(pool, "alerts", ["project_id", "status"], "name:idx_alerts_project_status") ?
  Migration.create_index(pool, "alerts", ["rule_id"], "name:idx_alerts_rule") ?
  Migration.create_index(pool, "alerts", ["triggered_at:DESC"], "name:idx_alerts_triggered") ?
  Ok(0)
end

pub fn down(pool :: PoolHandle) -> Int ! String do
  Migration.drop_table(pool, "alerts") ?
  Migration.drop_table(pool, "alert_rules") ?
  Migration.drop_table(pool, "events") ?
  Migration.drop_table(pool, "issues") ?
  Migration.drop_table(pool, "api_keys") ?
  Migration.drop_table(pool, "projects") ?
  Migration.drop_table(pool, "sessions") ?
  Migration.drop_table(pool, "org_memberships") ?
  Migration.drop_table(pool, "users") ?
  Migration.drop_table(pool, "organizations") ?
  Ok(0)
end
