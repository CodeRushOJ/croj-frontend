import request from "./request";

export const forumApi = {
  listPosts: (params) => request({ url: "/v1/forum/posts", method: "get", params }),
  getPost: (postId) => request({ url: `/v1/forum/posts/${postId}`, method: "get" }),
  createPost: (data) => request({ url: "/v1/forum/posts", method: "post", data }),
  listComments: (postId, params) => request({
    url: `/v1/forum/posts/${postId}/comments`,
    method: "get",
    params,
  }),
  createComment: (postId, data) => request({
    url: `/v1/forum/posts/${postId}/comments`,
    method: "post",
    data,
  }),
};

export const solutionApi = {
  list: (problemId, params) => request({
    url: `/v1/problems/${problemId}/solutions`,
    method: "get",
    params,
  }),
  get: (problemId, solutionId) => request({
    url: `/v1/problems/${problemId}/solutions/${solutionId}`,
    method: "get",
  }),
  create: (problemId, data) => request({
    url: `/v1/problems/${problemId}/solutions`,
    method: "post",
    data,
  }),
};

