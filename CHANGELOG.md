# Changelog

All notable frontend changes are recorded here.

## Unreleased

### Added

- Public announcement navigation, current-announcement strip, visible announcement list, and safe announcement detail view backed by the real `/api/v1/announcements` contract.
- Administrator announcement publication desk for drafts, editing, pin ordering, scheduling, immediate publication, withdrawal, archival, and lifecycle filtering.
- Optimistic concurrency UX that sends quoted `If-Match` versions, preserves edits on HTTP 409, and requires explicit server-version refresh.
- Loading, empty, retryable error, permission, lifecycle-validation, and responsive states for announcement surfaces, with API and component contract tests.
- Added an administrator problem-import workspace for real `.xml`/`.zip` multipart preflight and explicit commit operations.
- Added detected-format, SHA-256, problem/test counts, global diagnostics, and per-problem validation previews.
- Added API and component contract tests covering multipart uploads, commit gating, unsupported files, and retryable failures.
- Added problem-scoped discussions that filter and publish explicit `PROBLEM/resourceId` forum associations through the real backend contract.
- Contest API client, responsive contest discovery page, phase filters, contest overview, registration, problem roster, and ACM scoreboard.
- Real API failure and retry states for the problem library and problem details.
- Submission detail API normalization for stable polling of integer backend statuses.
- Real problem and contest submission flow with ID-based contest routes, immutable roster statement/limit snapshots, bounded exponential-backoff polling, terminal result metrics, strict workflow deadlines, and navigation cancellation.
- Component/API contract tests for real problem data, administrator navigation, and submission detail polling.

### Changed

- Replaced the legacy fixed sidebar with a responsive top navigation and wider task-focused workspace.
- Reworked the visual foundation to a restrained warm neutral palette with simpler surfaces and hierarchy.
- Moved the administrator workspace entry from primary navigation into the authenticated user menu.
- Corrected acceptance-rate rendering to match the backend percentage contract.
- Decoupled contest detail loading from protected problem/scoreboard requests so a single 403 no longer replaces the whole page with a fetch failure.
- Contest submissions now use the roster-validated `contestId + problemId` pair so the backend selects the arranged immutable `problemVersionId`; route reuse cancels all stale statement and judging requests.
- Imported statement HTML is sanitized through one strict allowlist for both contest and public problem routes, and intentional Axios cancellations no longer surface as network failures.
- Frontend CI now rejects every ESLint warning; duplicate locale keys and unused imports from the original implementation were removed.
- Removed global Element Plus/plugin icon registration in favor of compile-time component imports; the initial application JavaScript dropped from roughly 404 KiB to 130 KiB gzip while Monaco remains lazy-loaded on the editor path.

### Removed

- Removed preview administrator authentication and all preview problem/contest fixtures from product code. Local development now uses real backend APIs only.
- Removed the simulated editor submit/run timers; the editor now emits directly into the real backend submission workflow, and no fake run action is exposed.

## 0.1.0 - Initial implementation

- Established the Vue 3, Vite, Pinia, Element Plus, Vue Router, i18n, authentication, problem, administration, and Monaco editor foundations.
