# Admin TestBundle UI Design

## Goal

Close Issue #16 by giving administrators a real UI for attaching and publishing
an immutable TestBundle v1 ZIP for one draft problem version. The UI must use the
existing backend contract without fixtures or browser-side substitutes.

## API boundary

`src/api/testBundle.js` owns the four backend operations:

- `GET /v1/admin/problems/{problemId}/versions`
- `GET /v1/admin/problems/{problemId}/versions/{versionId}/test-bundle`
- `PUT /v1/admin/problems/{problemId}/versions/{versionId}/test-bundle`
- `POST /v1/admin/problems/{problemId}/versions/{versionId}/test-bundle/publish`

The GET response supplies both metadata and the strong response ETag. PUT sends
the selected ZIP as multipart `file` with that ETag in `If-Match`. Publish sends
the ETag returned after upload. IDs are encoded as path segments. Uploads receive
an AbortSignal and a five-minute Axios timeout instead of the global 15-second
request timeout.

## User flow

The guarded administration sidebar links to a dedicated TestBundle workspace,
and every row in problem management links there with `problemId` in the query.
The page loads real version summaries and exposes only `DRAFT` versions in its
selector, so the administrator never has to guess a version ID. Selecting a
draft loads server metadata, including state, attachment, checksum and ETag. A
`.zip` file can then be uploaded and a successfully attached bundle published.

The selected file and identifiers survive all server failures. A stale ETag
response offers an explicit metadata refresh and never silently retries a write.
The page distinguishes bad input (400), forbidden (403), missing version (404),
conflict (409), stale precondition (412), oversized payload (413), invalid bundle
(422), and missing precondition (428). Manual cancellation and route unmount
abort the active upload without displaying a network failure.

## Related fixes

The forum category selector uses one `categoryId` field from control to request.
The global 401 flow passes the router to logout. The administration menu no
longer links to the unimplemented contest workspace. Forum and contest hero
styles use the same warm-neutral, restrained visual language as announcements
and the main layout.

## Testing

API contract tests assert methods, encoded paths, multipart data, ETags, signal,
and timeout. Component tests cover metadata loading, upload/publish ETag
progression, every required HTTP status, stale refresh, cancellation, and
preserved input. Focused regression tests cover forum filtering and 401 logout.
The release gates remain frozen install, audit, lint, full Vitest, and build.
