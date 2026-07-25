import request from "./request";

export const forumApi = {
  listCategories: () => request({
    url: "/v1/forum/categories",
    method: "get",
    anonymousFallback: true,
  }),
  listPosts: (params) => request({
    url: "/v1/forum/posts",
    method: "get",
    params,
    anonymousFallback: true,
  }),
  listProblemPosts: (problemId, params) => request({
    url: "/v1/forum/posts",
    method: "get",
    params: { ...params, resourceType: "PROBLEM", resourceId: problemId },
    anonymousFallback: true,
  }),
  getPost: (postId) => request({
    url: `/v1/forum/posts/${postId}`,
    method: "get",
    anonymousFallback: true,
  }),
  createPost: ({ categoryId, resourceType = "GENERAL", resourceId, title, content }) => request({
    url: "/v1/forum/posts",
    method: "post",
    data: {
      categoryId,
      resourceType,
      ...(resourceId == null ? {} : { resourceId }),
      title,
      contentMarkdown: content,
    },
  }),
  listComments: (postId, params) => request({
    url: `/v1/forum/posts/${postId}/comments`,
    method: "get",
    params,
    anonymousFallback: true,
  }),
  createComment: (postId, { content, parentId }) => request({
    url: `/v1/forum/posts/${postId}/comments`,
    method: "post",
    data: {
      ...(parentId ? { parentId } : {}),
      contentMarkdown: content,
    },
  }),
};

export const solutionApi = {
  list: (problemId, params) => request({
    url: `/v1/problems/${problemId}/solutions`,
    method: "get",
    params,
    anonymousFallback: true,
  }),
  get: (problemId, solutionId) => request({
    url: `/v1/problems/${problemId}/solutions/${solutionId}`,
    method: "get",
    anonymousFallback: true,
  }),
  create: (problemId, { title, content }) => request({
    url: `/v1/problems/${problemId}/solutions`,
    method: "post",
    data: { title, contentMarkdown: content },
  }),
};
