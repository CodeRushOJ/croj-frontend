import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/api/community", () => ({
  forumApi: { listCategories: vi.fn(), createPost: vi.fn() },
}));

import { forumApi } from "@/api/community";
import ForumPostCreate from "./ForumPostCreate.vue";

const renderPage = () => render(ForumPostCreate, {
  global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
});

describe("ForumPostCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forumApi.listCategories.mockResolvedValue({ data: [{ id: 3, name: "算法讨论" }] });
    forumApi.createPost.mockResolvedValue({ data: { id: 18 } });
  });

  it("validates content and publishes a complete discussion", async () => {
    const { container } = renderPage();

    await waitFor(() => expect(forumApi.listCategories).toHaveBeenCalled());
    await fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent("标题至少需要 5 个字符");

    await fireEvent.update(screen.getByLabelText("标题"), "关于拓扑排序唯一性的讨论");
    await fireEvent.update(screen.getByLabelText("正文"), "我尝试从入度为零的节点数量证明唯一性，希望讨论反例与完整证明。" );
    await fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(forumApi.createPost).toHaveBeenCalledWith({
      title: "关于拓扑排序唯一性的讨论",
      categoryId: 3,
      resourceType: "GENERAL",
      content: "我尝试从入度为零的节点数量证明唯一性，希望讨论反例与完整证明。",
    }));
    expect(push).toHaveBeenCalledWith({ name: "ForumPostDetail", params: { postId: 18 } });
  });
});
