# Changelog

All notable frontend changes are recorded here.

## Unreleased

### Added

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
