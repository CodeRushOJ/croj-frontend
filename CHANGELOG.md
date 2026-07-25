# Changelog

All notable frontend changes are recorded here.

## Unreleased

### Added

- Local-only preview administrator mode and documented one-click entry.
- Preview problem data so product review does not depend on a running backend.
- Contest API client, responsive contest discovery page, phase filters, and preview fixtures.
- Contest overview, registration toggle, problem roster, and ACM scoreboard preview.
- Digest-pinned Node 22 and nginx-unprivileged multi-stage production image with OCI metadata, port 8080 and dependency-free `/healthz`.
- Nginx SPA history fallback, immutable hashed-asset caching, no-cache HTML, security headers, and fail-closed `/api`/`/uploads` handling for Gateway-owned routes.
- Container contracts for UID/GID 101, image health metadata, read-only root operation, explicit tmp/cache/run mounts, SPA routing, headers, and preview-token exclusion.
- CI image scan, SPDX JSON SBOM artifact, provenance/SBOM attestations, and gated multi-architecture GHCR publishing.

### Changed

- Replaced the legacy fixed sidebar with a responsive top navigation and wider task-focused workspace.
- Redesigned the problem library around inline search, difficulty/status/tag filters, progress, and compact status feedback.
- Made the preview-mode compile flag statically removable so production bundles contain neither an enabled mock path nor the reusable preview authentication token.

## 0.1.0 - Initial implementation

- Established the Vue 3, Vite, Pinia, Element Plus, Vue Router, i18n, authentication, problem, administration, and Monaco editor foundations.
