import { fireEvent, render, screen } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { detail } = vi.hoisted(() => ({ detail: vi.fn() }));
vi.mock("@/api/announcement", () => ({ announcementApi: { detail } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { announcementId: "42" } }) }));

import AnnouncementDetail from "./AnnouncementDetail.vue";

const renderSubject = () => render(AnnouncementDetail, {
  global: {
    stubs: {
      RouterLink: { props: ["to"], template: "<a><slot /></a>" },
      ElSkeleton: { template: "<div>公告加载中</div>" },
    },
  },
});

describe("AnnouncementDetail", () => {
  beforeEach(() => detail.mockReset());

  it("announces its loading state", async () => {
    let finishLoading;
    detail.mockReturnValue(new Promise((resolve) => { finishLoading = resolve; }));
    renderSubject();
    expect(screen.getByText("公告加载中")).toBeVisible();
    finishLoading({ data: null });
    expect(await screen.findByText("公告不存在或已结束展示")).toBeVisible();
  });

  it("loads the route announcement and presents Markdown source safely", async () => {
    detail.mockResolvedValue({ data: {
      id: 42,
      title: "升级完成",
      contentMarkdown: "## 状态\n\n所有队列已恢复。",
      pinned: false,
      publishAt: "2026-07-19T01:00:00Z",
    } });
    const { container } = renderSubject();

    expect(await screen.findByRole("heading", { name: "升级完成" })).toBeVisible();
    expect(screen.getByText(/所有队列已恢复/)).toBeVisible();
    expect(container.querySelector("h2")).toBeNull();
    expect(detail).toHaveBeenCalledWith("42");
  });

  it("explains a hidden detail and lets the reader retry", async () => {
    detail.mockRejectedValueOnce({ response: { status: 404 } }).mockResolvedValueOnce({
      data: {
        id: 42,
        title: "重新可见",
        contentMarkdown: "内容",
        publishAt: "2026-07-19T01:00:00Z",
      },
    });
    renderSubject();

    expect(await screen.findByText("这条公告不存在，或已经不在公开展示窗口内。")).toBeVisible();
    await fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    expect(await screen.findByRole("heading", { name: "重新可见" })).toBeVisible();
    expect(detail).toHaveBeenCalledTimes(2);
  });
});
