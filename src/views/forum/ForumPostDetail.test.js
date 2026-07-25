import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const authState = { isAuthenticated: true };

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { postId: "7" }, fullPath: "/forum/posts/7?from=problem" }),
  useRouter: () => ({ push }),
}));
vi.mock("@/store/modules/auth", () => ({
  useAuthStore: () => authState,
}));
vi.mock("@/api/community", () => ({
  forumApi: {
    listCategories: vi.fn(),
    getPost: vi.fn(),
    listComments: vi.fn(),
    createComment: vi.fn(),
  },
}));

import { forumApi } from "@/api/community";
import ForumPostDetail from "./ForumPostDetail.vue";

describe("ForumPostDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = true;
    forumApi.getPost.mockResolvedValue({ data: {
      id: 7,
      categoryId: 3,
      title: "线段树讨论",
      contentMarkdown: "这里记录复杂度分析。",
      authorId: 2,
      authorName: "Grace",
      createdAt: "2026-07-18T08:00:00Z",
    } });
    forumApi.listCategories.mockResolvedValue({
      data: [{ id: 3, name: "算法讨论" }],
    });
    forumApi.listComments.mockResolvedValue({ data: { items: [], total: 0 } });
    forumApi.createComment.mockResolvedValue({ data: { id: 9 } });
  });

  it("publishes a comment and refreshes the conversation", async () => {
    render(ForumPostDetail, {
      global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
    });

    expect(await screen.findByText("线段树讨论")).toBeVisible();
    await fireEvent.update(screen.getByLabelText("评论内容"), "这个证明很清晰");
    await fireEvent.click(screen.getByRole("button", { name: "发表评论" }));

    await waitFor(() => expect(forumApi.createComment).toHaveBeenCalledWith("7", {
      content: "这个证明很清晰",
    }));
    expect(forumApi.listComments).toHaveBeenCalledTimes(2);
  });

  it("resolves the real category name from the post categoryId", async () => {
    render(ForumPostDetail, {
      global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
    });

    expect(await screen.findByText("算法讨论")).toBeVisible();
    expect(forumApi.listCategories).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("综合讨论")).not.toBeInTheDocument();
  });

  it("redirects anonymous comment writes to login without calling the write API", async () => {
    authState.isAuthenticated = false;
    render(ForumPostDetail, {
      global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
    });

    expect(await screen.findByText("线段树讨论")).toBeVisible();
    await fireEvent.update(screen.getByLabelText("评论内容"), "登录后再参与讨论");
    await fireEvent.click(screen.getByRole("button", { name: "登录后发表评论" }));

    expect(forumApi.createComment).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({
      name: "Login",
      query: { redirect: "/forum/posts/7?from=problem" },
    });
  });
});
