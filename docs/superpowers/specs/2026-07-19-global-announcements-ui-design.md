# Global Announcements UI Design

## Goal

Deliver the real global-announcement frontend loop for anonymous readers and administrators, using the backend announcement contract without fixtures or preview fallbacks.

## Product surfaces

The primary navigation adds a restrained `公告` entry. Every page can show one compact current-announcement strip loaded from `GET /v1/announcements/current?limit=1`; it links to the announcement detail and disappears cleanly when the feed is empty. `/announcements` lists every currently visible announcement with pin, publication, expiry, loading, empty, and retry states. `/announcements/:announcementId` renders the visible detail with safe pre-wrapped Markdown source, dates, and a return action. The application does not interpret untrusted HTML.

Administrators continue entering administration from the authenticated user menu. `/admin/announcements` is a focused publication desk with status filtering, pagination, create/edit form, scheduling, immediate publication, withdrawal, and terminal archival. Actions shown for a row are derived from `storedLifecycle`; effective `status` is displayed separately when it differs (for example `EXPIRED`). Archived records are read-only.

## API boundary

`src/api/announcement.js` is the only announcement HTTP boundary. Public calls use `/v1/announcements`; administrator calls use `/v1/admin/announcements`. Every update or lifecycle call emits `If-Match: "<version>"` from the exact list item being edited. Request payloads preserve backend names: `contentMarkdown`, `publishAt`, `expiresAt`, `pinned`, and `pinOrder`.

The API layer exposes helpers to identify HTTP 403 and 409 without mutating global Axios behavior. A 409 leaves the user's editor content intact, shows a clear conflict panel, and offers an explicit refresh. Refreshing replaces the editor snapshot with the server version; the client never silently retries a stale write. A 403 becomes an in-page permission state. Other failures become retryable in-page errors.

## Interaction and accessibility

The visual language uses the existing warm-neutral tokens: quiet borders, one terracotta accent, compact status pills, and no gradient hero. All forms have programmatic labels, dialog headings, button text that names the action, keyboard-reachable controls, visible focus, and disabled/loading state during mutations. Destructive archive requires confirmation. Scheduling uses local `datetime-local` inputs converted to ISO-8601 UTC at the API boundary; displayed timestamps use the browser locale.

Responsive behavior converts the desktop split workspace into a single column, keeps action groups wrapping, and uses semantic cards instead of a horizontally overflowing data table.

## Testing

Vitest contract tests prove every endpoint, payload, and quoted `If-Match` header. Component tests cover current-feed empty behavior, public list loading/error/empty/content, detail loading, admin creation, lifecycle requests, 403, and the 409 refresh workflow. Router and main-layout tests prove anonymous navigation and the administration location. The feature is complete only when the full test suite, lint, and production build pass.
