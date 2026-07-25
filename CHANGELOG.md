# Changelog

All notable frontend changes are recorded here.

## Unreleased

### Added

- Administrator judge-configuration fields that model ACM/OI scoring independently from exact/token/special output checking and submit the real backend draft DTO.
- User/problem/base-version-scoped judge configuration recovery, strict runtime DTO contracts, OI total-score validation, logout cleanup, best-effort storage, and automatic stale SPJ secret clearing.
- Administrator-only immutable-version SPJ source loading for lossless edits, with strict problem/version response matching and no public ProblemVO source dependency.
- Server-validated TestBundle v2 previews for ordered OI case weights and sandboxed SPJ language, source path, digest, time, and memory limits, without rendering checker source text.
- Rule-aware contest scoreboards that preserve legacy ACM solved/penalty rows and render OI total plus per-problem scores.
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
- Administrator TestBundle workspace with problem-scoped version discovery, DRAFT selection, strong-ETag upload/publish concurrency, explicit stale refresh, long-upload cancellation, and contract-specific error states.
- Digest-pinned Node 22 and nginx-unprivileged multi-stage production image with strict lockfile installation, OCI metadata, UID/GID 101, port 8080, and dependency-free `/healthz`.
- Nginx SPA history fallback, immutable hashed-asset caching, no-cache HTML, security headers, and fail-closed `/api`, WebSocket, and `/uploads` handling for Gateway-owned paths.
- Container contracts that build and inspect the image, then use one non-root read-only container to verify health, homepage, deep links, caching, headers, and API routing boundaries.
- CI production-image builds and linux/amd64 plus linux/arm64 OCI validation.
- Administrator contest workspace backed only by real create, open-by-ID, draft update, immutable published-version arrangement, publish, and cancel APIs, with UTC-safe schedule editing, schedule/roster validation, stale-load protection, unsaved-change publication gates, confirmed lifecycle writes, stable test IDs, and HTTP 409 edit preservation.
- Anonymous published-problem list and detail routes, including one-shot expired-token fallback for public problem/community reads while contest problem routes remain protected.
- Session-scoped editor draft handoff through login, isolated by ordinary or contest problem context and cleared only after the backend accepts a submission.
- Authentication-only submission history, code submission, solution publication, and problem-discussion creation controls while public reading remains available.
- Signed annotated `vX.Y.Z` release-tag publishing to GHCR for `linux/amd64` and `linux/arm64`, with commit-addressed tags, maximum provenance, SBOM attestations, and secret-free digest metadata artifacts.
- Release workflow contract tests covering event isolation, tag verification, package permissions, image names, platforms, attestations, and artifact fields.
- End-to-end `OUTPUT_LIMIT_EXCEEDED` support for backend status code 8, including OLE labels, resource-limit warning styling, and terminal submission polling.

### Changed

- Accepted all server-valid safe relative TestBundle paths instead of imposing frontend-only `cases/` and `checker/` directory prefixes, while rejecting duplicate archive references.
- TestBundle publication now fails closed when an attached archive has no valid immutable manifest preview.
- Contest rule copy and scoreboard columns now follow the backend `ruleType` instead of always describing ACM.
- Replaced the legacy fixed sidebar with a responsive top navigation and wider task-focused workspace.
- Reworked the visual foundation to a restrained warm neutral palette with simpler surfaces and hierarchy.
- Moved the administrator workspace entry from primary navigation into the authenticated user menu.
- Corrected acceptance-rate rendering to match the backend percentage contract.
- Decoupled contest detail loading from protected problem/scoreboard requests so a single 403 no longer replaces the whole page with a fetch failure.
- Contest submissions now use the roster-validated `contestId + problemId` pair so the backend selects the arranged immutable `problemVersionId`; route reuse cancels all stale statement and judging requests.
- Imported statement HTML is sanitized through one strict allowlist for both contest and public problem routes, and intentional Axios cancellations no longer surface as network failures.
- Frontend CI now rejects every ESLint warning; duplicate locale keys and unused imports from the original implementation were removed.
- Removed global Element Plus/plugin icon registration in favor of compile-time component imports; the initial application JavaScript dropped from roughly 404 KiB to 130 KiB gzip while Monaco remains lazy-loaded on the editor path.
- Upgraded the application and quality toolchains to patched Axios, Vue, Element Plus, Vite 8, Vitest 4, jsdom, Sass, and ESLint 10 releases; the complete production and development dependency tree now passes `pnpm audit`.
- Bounded Vitest to four workers so jsdom component suites remain deterministic on both developer workstations and shared CI runners.
- Added a high-severity dependency audit gate to frontend CI and migrated linting to ESLint flat config.
- Fixed forum category filtering to send `categoryId`, and made confirmed 401 session-expiry logout redirect through the application router.
- Replaced the former dead administrator contests navigation entry with a real backend-aligned workspace and retained the warm-neutral visual system.
- Added long deadlines and cancellation to administrator problem-import uploads.
- Isolated administrator TestBundle state by problem/version target, aborting uploads on problem changes and ignoring stale list, metadata, upload, and publish responses.
- Locked TestBundle targets and route departure during non-cancellable publication, and made version refreshes revalidate preserved drafts without accepting stale metadata.

### Removed

- Removed preview administrator authentication and all preview problem/contest fixtures from product code. Local development now uses real backend APIs only.
- Removed the simulated editor submit/run timers; the editor now emits directly into the real backend submission workflow, and no fake run action is exposed.

## 0.1.0 - Initial implementation

- Established the Vue 3, Vite, Pinia, Element Plus, Vue Router, i18n, authentication, problem, administration, and Monaco editor foundations.
