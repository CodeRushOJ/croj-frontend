# Changelog

All notable frontend changes are recorded here.

## Unreleased

### Added

- Public announcement navigation, current-announcement strip, visible announcement list, and safe announcement detail view backed by the real `/api/v1/announcements` contract.
- Administrator announcement publication desk for drafts, editing, pin ordering, scheduling, immediate publication, withdrawal, archival, and lifecycle filtering.
- Optimistic concurrency UX that sends quoted `If-Match` versions, preserves edits on HTTP 409, and requires explicit server-version refresh.
- Loading, empty, retryable error, permission, lifecycle-validation, and responsive states for announcement surfaces, with API and component contract tests.
- Contest API client, responsive contest discovery page, phase filters, contest overview, registration, problem roster, and ACM scoreboard.
- Real API failure and retry states for the problem library and problem details.
- Submission detail API normalization for stable polling of integer backend statuses.
- Component/API contract tests for real problem data, administrator navigation, and submission detail polling.

### Changed

- Replaced the legacy fixed sidebar with a responsive top navigation and wider task-focused workspace.
- Reworked the visual foundation to a restrained warm neutral palette with simpler surfaces and hierarchy.
- Moved the administrator workspace entry from primary navigation into the authenticated user menu.
- Corrected acceptance-rate rendering to match the backend percentage contract.

### Removed

- Removed preview administrator authentication and all preview problem/contest fixtures from product code. Local development now uses real backend APIs only.

## 0.1.0 - Initial implementation

- Established the Vue 3, Vite, Pinia, Element Plus, Vue Router, i18n, authentication, problem, administration, and Monaco editor foundations.
