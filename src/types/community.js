/**
 * @typedef {Object} CommunityAuthor
 * @property {string|number} id
 * @property {string} username
 * @property {string=} avatar
 */

/**
 * @typedef {Object} ForumPost
 * @property {string|number} id
 * @property {string} title
 * @property {string} content
 * @property {string=} summary
 * @property {string=} category
 * @property {CommunityAuthor} author
 * @property {number=} commentCount
 * @property {number=} viewCount
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ProblemSolution
 * @property {string|number} id
 * @property {string|number} problemId
 * @property {string} title
 * @property {string} content
 * @property {CommunityAuthor} author
 * @property {number=} likeCount
 * @property {string} createdAt
 */

/**
 * Accept both the backend's historical `records` page and the v1 `items` page.
 * @template T
 * @param {{ records?: T[], items?: T[], total?: number, current?: number, page?: number } | undefined} page
 * @returns {{ items: T[], total: number, page: number }}
 */
export function normalizeCommunityPage(page) {
  return {
    items: Array.isArray(page) ? page : page?.items ?? page?.records ?? [],
    total: Number(Array.isArray(page) ? page.length : page?.total ?? 0),
    page: Number(page?.page ?? page?.current ?? 1),
  };
}

const normalizeAuthor = (source) => ({
  id: source?.authorId,
  username: source?.authorName || "匿名用户",
  avatar: source?.authorAvatar,
});

/** @param {Record<string, unknown>} source */
export const normalizeForumPost = (source) => ({
  ...source,
  content: source?.contentMarkdown || "",
  summary: source?.summary || source?.contentMarkdown || "",
  author: normalizeAuthor(source),
});

/** @param {Record<string, unknown>} source */
export const normalizeForumComment = (source) => ({
  ...source,
  content: source?.contentMarkdown || "",
  author: normalizeAuthor(source),
});

/** @param {Record<string, unknown>} source */
export const normalizeSolution = (source) => ({
  ...source,
  content: source?.contentMarkdown || "",
  author: normalizeAuthor(source),
  createdAt: source?.publishedAt || source?.createdAt,
});
