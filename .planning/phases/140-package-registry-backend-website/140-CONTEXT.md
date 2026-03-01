# Phase 140: Package Registry Backend & Website - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

A hosted Axum+PostgreSQL registry server that accepts authenticated package publishes with SHA-256 content addressing, exposes search/download API, and presents a VitePress website for browsing, searching, and viewing per-package pages. User auth (GitHub OAuth), token management web UI, and publish workflow are all in scope. Package creation/maintenance tooling (meshpkg CLI) is a previous phase.

</domain>

<decisions>
## Implementation Decisions

### Auth & token model
- Authentication via **GitHub OAuth only** — no email/password or magic links
- Web dashboard where logged-in developers create and manage their own publish tokens
- Tokens are **account-scoped**: one token can publish any package under the holder's GitHub namespace
- Package names are **namespaced by GitHub user/org**: `username/package-name` (e.g., `sn0w/mesh-json`)
- Namespace ownership enforced by GitHub identity — no name squatting across accounts

### Tarball storage
- Store tarballs in **Cloudflare R2** (S3-compatible object storage)
- **No local filesystem fallback** — always use R2/S3-compatible API; dev environment uses MinIO
- SHA-256 content addressing: hash is the R2 object key
- **Content deduplication**: if SHA-256 already exists in R2, skip the upload; DB records still created per name+version but blobs are shared
- **Registry API proxies downloads**: `GET /packages/{name}/{version}/download` streams from R2 — no direct R2 URL exposure to clients

### Website browse & search
- **Featured + list hybrid** landing/browse page: top section shows highest-download-count packages as featured cards, remainder shown as a list below
- Search is **server-side API, same page**: search box on browse page calls `GET /search?q=...`, results replace current listing without page reload
- Search matches against **package name + description** (PostgreSQL full-text search via tsvector)

### Per-package page
- **Metadata card at top, README below**: structured metadata card dominates the header, README content scrolls below
- Metadata card contains (all four):
  - Install command (prominent, copy-to-clipboard): `meshpkg install name@version`
  - Latest version badge + download count (total)
  - Version history link/summary
  - Author / GitHub username linking to their GitHub profile
- **Version history**: expandable list section on the same page — all versions with publish date and size; clicking a version shows its install command
- **README rendering**: standard markdown via VitePress/markdown-it — no custom extensions needed for v1

### Claude's Discretion
- Exact PostgreSQL schema design and index strategy for full-text search
- R2 bucket structure and key naming convention
- Token hashing/storage approach (bcrypt vs SHA-256 of raw token)
- VitePress theme/layout component structure
- Download count tracking granularity (per-version vs total only in DB)
- Error page designs and empty state illustrations
- Pagination strategy for the package list (cursor vs offset)

</decisions>

<specifics>
## Specific Ideas

- The registry model mirrors crates.io / npm scoped packages: `owner/package` namespace prevents squatting
- Always require MinIO for local dev (no filesystem fallback) — keeps dev/prod parity
- SHA-256 deduplication means two packages with identical content share one R2 blob — important for stdlib packages that may be re-published across versions with small diffs
- Featured packages on the landing page are purely algorithmic (top by download count) — no manual editorial curation needed

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 140-package-registry-backend-website*
*Context gathered: 2026-02-28*
