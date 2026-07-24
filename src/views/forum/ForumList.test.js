import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/community", () => ({
  forumApi: { listCategories: vi.fn(), listPosts: vi.fn() },
}));

import { forumApi } from "@/api/community";
import ForumList from "./ForumList.vue";

const renderPage = () => render(ForumList, {
  global: {
    stubs: {
      RouterLink: { template: "<a><slot /></a>" },
    },
  },
});

describe("ForumList", () => {
  beforeEach(() => {
    forumApi.listPosts.mockReset();
    forumApi.listCategories.mockResolvedValue({ data: [{ id: 3, name: "算法讨论" }] });
  });

  it("renders forum posts returned by the API", async () => {
    forumApi.listPosts.mockResolvedValue({
      data: {
        records: [{
          id: 7,
          title: "如何证明 Dijkstra 的贪心选择？",
          contentMarkdown: "从不变式开始理解。",
          categoryId: 3,
          authorId: 2,
          authorName: "Ada",
          createdAt: "2026-07-18T08:00:00Z",
        }],
        total: 1,
      },
    });

    renderPage();

    expect(await screen.findByText("如何证明 Dijkstra 的贪心选择？")).toBeVisible();
    expect(screen.getByText("Ada")).toBeVisible();
  });

  it("offers a retry when loading fails", async () => {
    forumApi.listPosts
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ data: { items: [], total: 0 } });

    renderPage();

    await fireEvent.click(await screen.findByRole("button", { name: "重新加载" }));
    await waitFor(() => expect(forumApi.listPosts).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("还没有讨论，来发布第一篇吧")).toBeVisible();
  });
});
