import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({ default: vi.fn() }));

import request from "./request";
import { forumApi, solutionApi } from "./community";

describe("community API contract", () => {
  beforeEach(() => request.mockReset());

  it("lists forum posts through the v1 endpoint", () => {
    forumApi.listPosts({ page: 2, size: 12, keyword: "graph" });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/forum/posts",
      method: "get",
      params: { page: 2, size: 12, keyword: "graph" },
    });
  });

  it("creates comments below a forum post", () => {
    forumApi.createComment("post-7", { content: "Clear explanation" });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/forum/posts/post-7/comments",
      method: "post",
      data: { content: "Clear explanation" },
    });
  });

  it("publishes a solution below a problem", () => {
    solutionApi.create("1001", { title: "Two pointers", content: "..." });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/problems/1001/solutions",
      method: "post",
      data: { title: "Two pointers", content: "..." },
    });
  });
});
