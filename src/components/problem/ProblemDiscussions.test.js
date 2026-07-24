import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/community", () => ({
  forumApi: {
    listCategories: vi.fn(),
    listProblemPosts: vi.fn(),
    createPost: vi.fn(),
  },
}));

import { forumApi } from "@/api/community";
import ProblemDiscussions from "./ProblemDiscussions.vue";

describe("ProblemDiscussions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forumApi.listCategories.mockResolvedValue({ data: [{ id: 3, name: "题目讨论" }] });
    forumApi.listProblemPosts.mockResolvedValue({ data: { records: [], total: 0 } });
    forumApi.createPost.mockResolvedValue({ data: 42 });
  });

  it("loads only discussions associated with the current problem", async () => {
    render(ProblemDiscussions, {
      props: { problemId: 1001 },
      global: { stubs: { PostCard: { template: "<div />" } } },
    });

    await screen.findByText("暂无讨论，来提出第一个问题吧");
    expect(forumApi.listProblemPosts).toHaveBeenCalledWith(1001, { current: 1, size: 20 });
  });

  it("publishes a post with an explicit PROBLEM association and preserves input on failure", async () => {
    forumApi.createPost.mockRejectedValueOnce(new Error("offline"));
    render(ProblemDiscussions, {
      props: { problemId: 1001 },
      global: { stubs: { PostCard: { template: "<div />" } } },
    });

    await screen.findByText("暂无讨论，来提出第一个问题吧");
    await fireEvent.click(screen.getByRole("button", { name: "发起讨论" }));
    await fireEvent.update(screen.getByLabelText("讨论标题"), "为什么贪心策略是正确的？");
    await fireEvent.update(
      screen.getByLabelText("讨论正文"),
      "我已经尝试用交换论证，但不确定边界情况应该怎么处理。",
    );
    await fireEvent.click(screen.getByRole("button", { name: "确认发布" }));

    await waitFor(() => expect(forumApi.createPost).toHaveBeenCalledWith({
      categoryId: 3,
      resourceType: "PROBLEM",
      resourceId: 1001,
      title: "为什么贪心策略是正确的？",
      content: "我已经尝试用交换论证，但不确定边界情况应该怎么处理。",
    }));
    expect(screen.getByLabelText("讨论正文")).toHaveValue(
      "我已经尝试用交换论证，但不确定边界情况应该怎么处理。",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("发布失败");
  });
});
