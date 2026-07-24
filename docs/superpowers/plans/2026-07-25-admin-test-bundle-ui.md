# Admin TestBundle UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the real AdminTestBundle upload/publication workflow and repair the release-blocking frontend regressions found during PR #15 review.

**Architecture:** A focused API module returns backend data plus the strong ETag, while a dedicated guarded admin view owns identifiers, selected ZIP, cancellation, status mapping, stale refresh, upload, and publication state. Existing forum, authentication, routing, and visual issues are fixed with narrow regression tests.

**Tech Stack:** Vue 3, Vue Router, Axios, Element Plus, Vitest, Vue Testing Library, ESLint, Vite.

---

### Task 1: AdminTestBundle API

**Files:**
- Create: `src/api/testBundle.js`
- Create: `src/api/testBundle.test.js`

- [ ] Write failing tests for version discovery, GET metadata, PUT multipart with `If-Match`,
  AbortSignal and five-minute timeout, and POST publish with the new ETag.
- [ ] Run `pnpm vitest run src/api/testBundle.test.js` and verify the missing
  module is the failure.
- [ ] Implement encoded path helpers, response ETag extraction and the four
  request functions.
- [ ] Re-run the focused test and verify it passes.

### Task 2: AdminTestBundle workspace

**Files:**
- Create: `src/views/admin/TestBundleManagement.vue`
- Create: `src/views/admin/TestBundleManagement.test.js`
- Modify: `src/router/routes.js`
- Modify: `src/constants/routes.js`
- Modify: `src/views/admin/AdminLayout.vue`
- Modify: `src/router/routes.test.js`

- [ ] Write failing component and route tests for the guarded entry, problem-row
  query link, DRAFT version discovery/selection, metadata
  load, ETag upload/publish progression, cancellation, preserved file and IDs,
  explicit stale refresh, and status-specific messages for
  400/403/404/409/412/413/422/428.
- [ ] Run the focused tests and confirm the missing view/route behavior fails.
- [ ] Implement the page with one active AbortController, a five-minute upload
  budget, strict positive IDs, ZIP selection, metadata summary and explicit
  stale refresh.
- [ ] Add the guarded route and sidebar link, and remove the dead admin contest
  menu entry.
- [ ] Re-run the focused tests and keep them green.

### Task 3: Review regressions

**Files:**
- Modify: `src/views/forum/ForumList.vue`
- Modify: `src/views/forum/ForumList.test.js`
- Modify: `src/api/request.js`
- Modify: `src/api/request.test.js`
- Modify: `src/store/modules/auth.js`
- Modify: `src/views/forum/ForumList.vue`
- Modify: `src/views/contest/ContestDetail.vue`

- [ ] Add failing tests proving the category selector sends `categoryId` and a
  confirmed 401 logout receives the router.
- [ ] Implement the minimal field and router fixes.
- [ ] Replace blue/purple gradient hero declarations with existing warm-neutral
  tokens and restrained borders/shadows.
- [ ] Run the focused regression tests.

### Task 4: Documentation and release gates

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] Document the TestBundle GET/upload/publish flow, ETag rules, cancellation,
  status states and absence of product mocks.
- [ ] Run `pnpm audit --audit-level high`, `pnpm lint`, `pnpm test:run`, and
  `pnpm build`.
- [ ] Inspect `git diff --check` and the final diff.
- [ ] Commit the intentional files, push `codex/frontend-v1-release`, and verify
  PR #15 checks.
