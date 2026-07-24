# Global Announcements UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build anonymous announcement discovery and a complete administrator publication lifecycle against the real backend API.

**Architecture:** A focused API client preserves the backend DTO and optimistic-lock contract. Small public components own current/list/detail reads, while one administrator workspace coordinates editing and lifecycle transitions without silent conflict retries.

**Tech Stack:** Vue 3 Composition API, Vue Router, Axios, Element Plus, Vitest, Vue Testing Library.

---

### Task 1: Announcement API contract

**Files:**
- Create: `src/api/announcement.js`
- Create: `src/api/announcement.test.js`

- [ ] Write failing contract tests for public list/current/detail and every administrator endpoint, including `If-Match: "7"`.
- [ ] Run `pnpm test:run src/api/announcement.test.js` and verify failure because the client is absent.
- [ ] Implement the minimal public/admin API functions and HTTP status helpers.
- [ ] Re-run the focused test and verify it passes.

### Task 2: Public announcement experience

**Files:**
- Create: `src/components/announcement/CurrentAnnouncement.vue`
- Create: `src/components/announcement/CurrentAnnouncement.test.js`
- Create: `src/views/announcement/AnnouncementList.vue`
- Create: `src/views/announcement/AnnouncementList.test.js`
- Create: `src/views/announcement/AnnouncementDetail.vue`
- Create: `src/views/announcement/AnnouncementDetail.test.js`
- Modify: `src/views/layout/MainLayout.vue`
- Modify: `src/views/layout/MainLayout.test.js`
- Modify: `src/router/routes.js`
- Modify: `src/constants/routes.js`

- [ ] Write failing tests for empty/current feed, list loading/error/empty/content, detail, and the public navigation route.
- [ ] Run focused tests and verify each fails for the missing surface.
- [ ] Implement compact warm-neutral pages, safe pre-wrapped content, locale dates, retry controls, semantic labels, and responsive styles.
- [ ] Re-run focused tests and verify they pass.

### Task 3: Administrator publication desk

**Files:**
- Create: `src/views/admin/AnnouncementManagement.vue`
- Create: `src/views/admin/AnnouncementManagement.test.js`
- Modify: `src/views/admin/AdminLayout.vue`
- Modify: `src/router/routes.js`
- Modify: `src/constants/routes.js`

- [ ] Write failing tests for listing/filtering, creating, editing, scheduling, publishing, withdrawing, archiving, 403, and 409 refresh behavior.
- [ ] Run the focused test and verify the missing component failure.
- [ ] Implement labeled forms, state-derived actions, confirmations, ISO conversion, quoted-version mutations via the API client, and mutation loading states.
- [ ] Re-run the focused test and verify it passes.

### Task 4: Documentation and release verification

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] Document public/admin announcement behavior, error semantics, UTC conversion, and real API paths.
- [ ] Record the feature under `Unreleased` without claiming a production release.
- [ ] Run `pnpm test:run`, `pnpm lint`, and `pnpm build`; fix every new error.
- [ ] Request independent review, fix all Critical and Important findings, then repeat the full gates.
- [ ] Commit intentionally, push `codex/announcements-ui`, and open a Draft PR based on `codex/real-api-frontend`.
