# Frontend Judge Configuration v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an administrator-only ACM/OI and exact/token/special configuration workflow with a server-validated immutable TestBundle v2 preview.

**Architecture:** A small runtime-typed domain module separates backend DTOs from Vue components. The existing problem form writes configuration only by creating a new draft, while the TestBundle page reads and publishes the server's validated immutable manifest; session-scoped draft storage preserves failed edits without exposing source to public adapters.

**Tech Stack:** Vue 3, JavaScript with JSDoc/runtime contracts, Axios, sessionStorage, Vitest, Vue Testing Library.

---

### Task 1: Typed judge configuration domain

**Files:**
- Create: `src/domain/judgeConfiguration.js`
- Create: `src/domain/judgeConfiguration.test.js`

- [x] Write failing tests for ACM/OI payloads, exact/token/special constraints,
  OI total score, canonical checker languages, v1/v2 manifest normalization,
  case-weight sums, and special-judge metadata.
- [x] Run `pnpm test:run src/domain/judgeConfiguration.test.js` and confirm the
  missing module is the failure.
- [x] Implement immutable constants, JSDoc DTOs, payload mapping, validation,
  and fail-closed preview normalization.
- [x] Re-run the focused test and confirm all domain cases pass.

### Task 2: Recoverable administrator draft

**Files:**
- Create: `src/services/judgeConfigurationDraft.js`
- Create: `src/services/judgeConfigurationDraft.test.js`

- [x] Write failing tests for per-problem session keys, corrupt/unknown draft
  rejection, successful round-trip, and explicit clearing.
- [x] Run the focused test and verify RED.
- [x] Implement session-only versioned serialization through the domain
  normalizer.
- [x] Re-run the focused test and verify GREEN.

### Task 3: Focused configuration fields

**Files:**
- Create: `src/components/admin/JudgeConfigurationFields.vue`
- Create: `src/components/admin/JudgeConfigurationFields.test.js`
- Modify: `src/views/admin/ProblemManagement.vue`

- [x] Write failing component tests proving ACM/OI is independent from checker,
  OI score is visible only for OI, source/language are visible only for
  `special`, and emitted values clear stale secret fields.
- [x] Run the component test and verify RED.
- [x] Implement the restrained fields component and integrate it into the
  create/update form.
- [x] Add integration tests proving the real problem API receives the exact
  normalized payload, failed writes retain the session draft, and successful
  writes clear it.
- [x] Run the focused component/integration tests and verify GREEN.

### Task 4: Immutable manifest preview

**Files:**
- Modify: `src/api/testBundle.js`
- Modify: `src/api/testBundle.test.js`
- Modify: `src/views/admin/TestBundleManagement.vue`
- Modify: `src/views/admin/TestBundleManagement.test.js`

- [x] Write failing API tests for normalization of object/string manifests and
  rejection of malformed previews without fabricating success.
- [x] Write failing UI tests for ACM/OI summaries, ordered case weights, SPJ
  source path/digest/limits, absence of source text, and publish gating.
- [x] Run focused tests and verify RED.
- [x] Normalize responses at the adapter, render the compact preview, and keep
  all existing ETag/cancellation/stale behavior.
- [x] Re-run focused tests and verify GREEN.

### Task 5: Documentation and release gates

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [x] Document the create-draft/upload/preview/publish flow, DTO names,
  manifest v2 semantics, session draft boundary, and checker-source privacy.
- [x] Record the release change without claiming backend behavior the frontend
  cannot enforce.
- [x] Run `pnpm test:run`, `pnpm lint`, `pnpm build`,
  `pnpm audit --audit-level high`, `./tests/container-contract.sh`, and
  `git diff --check`.
- [x] Request independent code review, fix every Critical/Important issue, and
  re-run affected gates.
- [x] Verify `HeZephyr <unique.hzf@gmail.com>`, commit intentionally, push the
  feature branch, open a draft PR, and verify the commit identity.
