# Contest Admin and Public Problems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a backend-aligned contest administration workflow and anonymous published-problem discovery with login-time code-draft restoration.

**Architecture:** Keep backend transport in focused API adapters and pure validation/draft helpers. The admin page operates only on a created or explicitly opened contest ID. Public problem reads opt into one anonymous 401 retry; ProblemDetail owns the authentication gate while CodeEditor only receives restored initial content.

**Tech Stack:** Vue 3, Vue Router, Pinia, Axios, Element Plus, Vitest, Vue Testing Library, sessionStorage.

---

### Task 1: Administrator contest API and pure workflow rules

**Files:**
- Modify: `src/api/contest.js`
- Modify: `src/api/index.js`
- Create: `src/api/contest.admin.test.js`
- Create: `src/views/admin/contestWorkflow.js`
- Create: `src/views/admin/contestWorkflow.test.js`

- [ ] **Step 1: Write failing API contract tests**

```js
it("maps the available administrator lifecycle endpoints", () => {
  adminContestApi.create({ title: "Weekly" });
  adminContestApi.update(12, { title: "Weekly 2" });
  adminContestApi.arrangeProblems(12, [{ problemId: 4, problemVersionId: 9, label: "A", score: 100 }]);
  adminContestApi.publish(12);
  adminContestApi.cancel(12);
  expect(request.mock.calls).toEqual(expect.arrayContaining([
    [{ url: "/v1/admin/contests", method: "post", data: { title: "Weekly" } }],
    [{ url: "/v1/admin/contests/12/publish", method: "post" }],
  ]));
});
```

- [ ] **Step 2: Run the focused tests and observe missing exports**

Run: `pnpm test:run src/api/contest.admin.test.js src/views/admin/contestWorkflow.test.js`

Expected: FAIL because `adminContestApi` and workflow helpers do not exist.

- [ ] **Step 3: Implement the minimal adapters and rules**

```js
export const adminContestApi = {
  create: data => request({ url: "/v1/admin/contests", method: "post", data }),
  update: (id, data) => request({ url: `/v1/admin/contests/${id}`, method: "put", data }),
  arrangeProblems: (id, problems) => request({
    url: `/v1/admin/contests/${id}/problems`,
    method: "put",
    data: { problems },
  }),
  publish: id => request({ url: `/v1/admin/contests/${id}/publish`, method: "post" }),
  cancel: id => request({ url: `/v1/admin/contests/${id}`, method: "delete" }),
};
```

Pure helpers validate ordered timestamps, ACM/OI, PUBLIC/PRIVATE, duplicate problem IDs and normalized labels, and map datetime-local values to ISO-8601 Instants.

- [ ] **Step 4: Re-run focused tests**

Expected: PASS.

### Task 2: Administrator contest route and workspace

**Files:**
- Modify: `src/constants/routes.js`
- Modify: `src/router/routes.js`
- Modify: `src/router/routes.test.js`
- Modify: `src/views/admin/AdminLayout.vue`
- Create: `src/views/admin/ContestManagement.vue`
- Create: `src/views/admin/ContestManagement.test.js`

- [ ] **Step 1: Write route and interaction tests**

```js
it("creates a draft through the real DTO and retains its returned id", async () => {
  adminContestApi.create.mockResolvedValue({ data: 42 });
  renderWorkspace();
  await fillValidContestForm();
  await fireEvent.click(screen.getByTestId("contest-save"));
  expect(adminContestApi.create).toHaveBeenCalledWith(expect.objectContaining({
    title: "Weekly 42",
    ruleType: "ACM",
    visibility: "PUBLIC",
  }), expect.anything());
  expect(await screen.findByText("比赛 #42")).toBeVisible();
});
```

Add tests for opening a draft by ID, ignoring stale loads, filtering version discovery to `PUBLISHED`, duplicate labels/problems, arrangement payload, 409 preservation, publish confirmation and cancel confirmation.

- [ ] **Step 2: Run the focused tests**

Run: `pnpm test:run src/router/routes.test.js src/views/admin/ContestManagement.test.js`

Expected: FAIL because route, menu and component are absent.

- [ ] **Step 3: Implement the minimal backend-aligned workspace**

The page exposes stable IDs `contest-open-id`, `contest-open`, `contest-save`, `contest-problem-id`, `contest-add-problem`, `contest-save-roster`, `contest-publish`, and `contest-cancel`. It never creates a browser-side contest list. `DRAFT` enables edit/roster/publish/cancel; `PUBLISHED` only enables cancel and read-only inspection.

- [ ] **Step 4: Re-run focused tests**

Expected: PASS.

### Task 3: Anonymous API fallback and public routes

**Files:**
- Modify: `src/api/request.js`
- Modify: `src/api/request.test.js`
- Modify: `src/api/problem.js`
- Modify: `src/api/problem.test.js`
- Modify: `src/store/modules/auth.js`
- Modify: `src/router/routes.js`
- Modify: `src/router/routes.test.js`

- [ ] **Step 1: Write failing retry and route tests**

```js
it("retries an opted-in public read once without an expired token", async () => {
  const error = {
    response: { status: 401 },
    config: { anonymousFallback: true, headers: { Authorization: "Bearer expired" } },
  };
  mocks.request.mockResolvedValue({ success: true, data: { records: [] } });
  await expect(mocks.responseError(error)).resolves.toEqual(
    expect.objectContaining({ success: true }),
  );
  expect(mocks.clearSession).toHaveBeenCalled();
  expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({
    skipAuth: true,
    anonymousFallbackRetried: true,
  }));
});
```

Route tests require ordinary problem list/detail `requiresAuth: false`, while contest problem resources remain authenticated.

- [ ] **Step 2: Run focused tests and observe RED**

Run: `pnpm test:run src/api/request.test.js src/api/problem.test.js src/router/routes.test.js`

Expected: FAIL because fallback flags/session clearing/public route metadata are absent.

- [ ] **Step 3: Implement one-shot fallback**

Only `problemApi.getProblemList`, `getProblemById`, and `getProblemByNo` set `anonymousFallback: true`. A 401 clears the expired session, removes Authorization, sets `skipAuth`, and calls `service.request` once. Other 401 responses retain the existing login dialog.

- [ ] **Step 4: Re-run focused tests**

Expected: PASS.

### Task 4: Submission draft and authentication-only writes

**Files:**
- Create: `src/services/submissionDraft.js`
- Create: `src/services/submissionDraft.test.js`
- Modify: `src/components/problem/CodeEditor.vue`
- Modify: `src/components/problem/CodeEditor.test.js`
- Modify: `src/views/problem/ProblemDetail.vue`
- Modify: `src/views/problem/ProblemDetail.test.js`
- Modify: `src/components/problem/ProblemSolutions.vue`
- Modify: `src/components/problem/ProblemSolutions.test.js`
- Modify: `src/components/problem/ProblemDiscussions.vue`
- Modify: `src/components/problem/ProblemDiscussions.test.js`

- [ ] **Step 1: Write failing draft/gate tests**

```js
it("stores an anonymous submission and redirects without calling the submission API", async () => {
  renderPageAsAnonymous();
  await fireEvent.click(await screen.findByRole("button", { name: "submit from editor" }));
  expect(loadSubmissionDraft("problem:1000")).toEqual({
    language: "cpp",
    code: "int main() {}",
  });
  expect(submissionApi.submitCode).not.toHaveBeenCalled();
  expect(routerPush).toHaveBeenCalledWith({
    name: ROUTE_NAMES.LOGIN,
    query: { redirect: "/problem/P1000?tab=submit" },
  });
});
```

Add restore and successful-clear tests. Add solution/discussion tests asserting anonymous create buttons request login and never call write APIs.

- [ ] **Step 2: Run focused tests and observe RED**

Run: `pnpm test:run src/services/submissionDraft.test.js src/components/problem/CodeEditor.test.js src/views/problem/ProblemDetail.test.js src/components/problem/ProblemSolutions.test.js src/components/problem/ProblemDiscussions.test.js`

- [ ] **Step 3: Implement session-scoped drafts and gates**

```js
export const saveSubmissionDraft = (key, draft) => {
  sessionStorage.setItem(`croj-submission:${key}`, JSON.stringify({
    language: draft.language,
    code: draft.code,
  }));
};
```

ProblemDetail derives the key after a real problem load, saves before login, passes restored content to CodeEditor and clears only after the submission POST succeeds. Anonymous submission history renders a login action without requesting history. Solution/discussion create controls emit `request-auth`.

- [ ] **Step 4: Re-run focused tests**

Expected: PASS.

### Task 5: Documentation and complete verification

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Document shipped workflows and backend gaps**

README names the real administrator endpoints, the “open by ID” boundary, anonymous published reads, sessionStorage draft behavior, and authentication-only writes. CHANGELOG records both issues.

- [ ] **Step 2: Run complete checks**

```bash
pnpm test:run
pnpm lint
pnpm build
pnpm audit --audit-level high
./tests/container-contract.sh coderushoj/croj-frontend:contract
actionlint .github/workflows/ci.yml
git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Verify identity, commit and push**

```bash
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
git add src README.md CHANGELOG.md docs
git commit -m "feat(frontend): close contest and public problem gaps"
git push origin codex/frontend-v1-release
```

Expected author and committer: `HeZephyr <unique.hzf@gmail.com>`.
