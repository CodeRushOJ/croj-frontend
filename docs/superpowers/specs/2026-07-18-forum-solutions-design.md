# Forum and Problem Solutions Design

## Scope

CodeRushOJ will gain a forum MVP and first-class problem solutions without introducing payment, moderation administration, real-time updates, or a rich-text editor. The existing Vue 3, Vue Router, Element Plus, Pinia, and theme variables remain the design foundation.

## Experience

- `/forum` presents searchable, filterable post cards with category, author, reply, and view context.
- `/forum/new` provides a focused title/category/content composer with client-side validation.
- `/forum/:postId` presents the post, comments, an empty state, and a comment composer.
- A problem's “题解” tab loads solution cards and opens a publish drawer.
- `/problems/:problemId/solutions/:solutionId` presents a readable solution detail and links back to the problem.
- Every remote view owns explicit loading, empty, and retryable error states and collapses to one column on narrow screens.

## Boundaries and data flow

`src/api/community.js` is the only community REST boundary. It exposes forum and solution clients using `/api/v1/forum/posts`, nested comments, and `/api/v1/problems/{problemId}/solutions`. `src/types/community.js` documents normalized response shapes with JSDoc typedefs. Route pages own fetch/mutation orchestration; focused presentational components render cards and state feedback.

The existing Axios response interceptor unwraps the server envelope, so pages consume `response.data`. Pagination accepts either `{ records, total }` or `{ items, total }` to tolerate the backend's established page conventions while keeping API paths strict.

## Testing

Vitest, jsdom, Vue Testing Library, and jest-dom provide component tests. Contract tests assert exact request methods, paths, query/body placement. Component tests cover loading-to-content, empty/error UI, publish validation, and successful comment/solution interactions. ESLint, the complete test suite, and the Vite production build are release gates.
