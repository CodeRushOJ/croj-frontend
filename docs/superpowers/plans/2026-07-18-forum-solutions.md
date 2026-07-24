# Forum and Problem Solutions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, tested forum and problem-solutions frontend MVP.

**Architecture:** Route pages orchestrate requests through one typed community API boundary, while reusable cards and async-state components keep presentation focused. Problem solutions integrate into the existing detail tab and retain a separate readable detail route.

**Tech Stack:** Vue 3, Vue Router, Element Plus, Axios, Vitest, Vue Testing Library, jsdom.

---

### Task 1: Test foundation and API contract

**Files:** `package.json`, `vite.config.js`, `src/api/community.js`, `src/types/community.js`, `src/api/community.test.js`, `src/test/setup.js`

- [ ] Add Vitest/jsdom/Testing Library dependencies and scripts.
- [ ] Write failing contract tests for forum posts, comments, and problem solutions.
- [ ] Run the focused tests and verify missing exports fail.
- [ ] Implement the strict `/api/v1/...` request boundary and documented types.
- [ ] Re-run focused tests until green.

### Task 2: Forum routes and pages

**Files:** `src/views/forum/ForumList.vue`, `src/views/forum/ForumPostDetail.vue`, `src/views/forum/ForumPostCreate.vue`, `src/components/community/AsyncState.vue`, `src/components/community/PostCard.vue`, `src/router/routes.js`, `src/constants/routes.js`, `src/views/layout/MainLayout.vue`

- [ ] Write component tests for list loading/content/empty/error, post comments, and composer validation.
- [ ] Run them and verify they fail for missing components.
- [ ] Implement responsive pages and focused reusable components.
- [ ] Register named routes and sidebar navigation.
- [ ] Re-run the component tests until green.

### Task 3: Problem solutions

**Files:** `src/components/community/SolutionCard.vue`, `src/components/problem/ProblemSolutions.vue`, `src/views/solution/SolutionDetail.vue`, `src/views/problem/ProblemDetail.vue`, `src/router/routes.js`

- [ ] Write component tests for solution loading, empty/error, and publish flows.
- [ ] Verify the tests fail before implementation.
- [ ] Implement the problem tab, publish drawer, solution cards, and detail route.
- [ ] Re-run focused tests until green.

### Task 4: Quality and handoff

**Files:** `README.md`, locale files, all changed frontend files.

- [ ] Document routes, API contracts, and test commands.
- [ ] Run `pnpm lint`, `pnpm test --run`, and `pnpm build`.
- [ ] Update Issue #3 with evidence, commit, push, and open a draft PR based on `codex/readme-foundation`.
