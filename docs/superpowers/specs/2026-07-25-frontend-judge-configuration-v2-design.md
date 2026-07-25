# Frontend Judge Configuration v2 Design

## Goal

Give administrators one restrained, real-API workflow for creating ACM/OI
problem drafts, choosing exact/token/special checking, uploading an immutable
TestBundle v2, reviewing its server-validated case weights and special-judge
limits, and publishing it. No public page or public API adapter may depend on
checker source.

## Immutable boundary

Problem create/update remains the only writable judge-configuration boundary.
It sends `judgeMode` (`0` ACM, `1` OI), `checker`
(`exact|token|special`), `totalScore`, `isSpecialJudge`,
`specialJudgeLanguage`, and `specialJudgeCode`. A successful write creates a
new server-side DRAFT version. The browser never mutates a selected immutable
version.

The TestBundle workspace continues to use:

- `GET /v1/admin/problems/{problemId}/versions`
- `GET|PUT /v1/admin/problems/{problemId}/versions/{versionId}/test-bundle`
- `POST /v1/admin/problems/{problemId}/versions/{versionId}/test-bundle/publish`

PUT is multipart `file` plus the strong `If-Match` from GET. Describe/upload
responses expose an administrator-only validated manifest preview. The adapter
accepts a JSON object or the legacy JSON string during the coordinated backend
rollout, but normalizes both into one fail-closed model.

## Components and data flow

`src/domain/judgeConfiguration.js` is the typed domain boundary. It owns
canonical modes/checkers/languages, defaults, payload normalization, validation,
and strict manifest preview normalization. Unknown enums, invalid limits,
invalid case weights, score mismatches, malformed special-judge metadata, and
unsafe shapes fail closed.

`JudgeConfigurationFields.vue` renders the focused form section. ACM/OI is
independent from the checker. OI requires a positive total score. Special
checking alone reveals the language and source controls. SPJ time/memory are
not editable here because the validated TestBundle manifest is their sole
authority.

`ProblemManagement.vue` maps the form through the domain boundary before
calling the existing real create/update API. Judge drafts are stored only in
the current tab's `sessionStorage`, scoped by new/existing problem ID. Failed
validation or HTTP writes retain the draft; a successful write clears it.

`TestBundleManagement.vue` renders the normalized immutable preview: schema,
mode, checker, limits, OI score, ordered case IDs and weights, plus SPJ
language/source path/source digest/time/memory. It never renders SPJ source
text. Publish stays disabled until the server reports an attached, valid
manifest and a strong ETag.

## Failure and authorization behavior

The existing route requires authentication and an administrator role. API 403,
404, 409, 412, 413, 422 and 428 retain their explicit states. Boundary
normalization errors are presented as an invalid server contract and never
converted into a fake success or publishable preview. Upload cancellation and
stale-request protection remain intact.

## Visual direction

The existing warm-neutral palette is retained. Judge configuration uses simple
segmented choices, compact help copy, low-contrast borders, and a dense case
table. There are no gradients, oversized dashboard cards, decorative metrics,
or generated marketing copy.

## Verification

Vitest covers domain invariants, session draft lifecycle, component
conditional fields, create/update payloads, manifest preview, SPJ-source
redaction, publish gating, HTTP errors, and stale state. Release gates are full
Vitest, zero-warning ESLint, production build, high-severity audit, container
contract, and diff hygiene.
