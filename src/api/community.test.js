import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({ default: vi.fn() }));

import request from "./request";
import { forumApi, solutionApi } from "./community";

describe("community API contract", () => {
  beforeEach(() => request.mockReset());

  it("lists forum posts through the v1 endpoint", () => {
    forumApi.listPosts({ current: 2, size: 12, categoryId: 3 });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/forum/posts",
      method: "get",
      params: { current: 2, size: 12, categoryId: 3 },
    });
  });

  it("loads server-defined forum categories", () => {
    forumApi.listCategories();

    expect(request).toHaveBeenCalledWith({
      url: "/v1/forum/categories",
      method: "get",
    });
  });

  it("creates comments below a forum post", () => {
    forumApi.createComment("post-7", { content: "Clear explanation" });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/forum/posts/post-7/comments",
      method: "post",
      data: { contentMarkdown: "Clear explanation" },
    });
  });

  it("publishes a solution below a problem", () => {
    solutionApi.create("1001", { title: "Two pointers", content: "..." });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/problems/1001/solutions",
      method: "post",
      data: { title: "Two pointers", contentMarkdown: "..." },
    });
  });

  it("maps the post composer model to the backend DTO", () => {
    forumApi.createPost({ categoryId: 3, title: "Graph proof", content: "Details" });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/forum/posts",
      method: "post",
      data: { categoryId: 3, title: "Graph proof", contentMarkdown: "Details" },
    });
  });
});
