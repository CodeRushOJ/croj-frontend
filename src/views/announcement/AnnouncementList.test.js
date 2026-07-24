import { fireEvent, render, screen } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/api/announcement", () => ({ announcementApi: { list } }));

import AnnouncementList from "./AnnouncementList.vue";

const renderSubject = () => render(AnnouncementList, {
  global: {
    stubs: {
      RouterLink: { props: ["to"], template: "<a><slot /></a>" },
      ElSkeleton: { template: "<div>公告加载中</div>" },
      ElPagination: true,
    },
  },
});

describe("AnnouncementList", () => {
  beforeEach(() => list.mockReset());

  it("announces its loading state", async () => {
    let finishLoading;
    list.mockReturnValue(new Promise((resolve) => { finishLoading = resolve; }));
    renderSubject();
    expect(screen.getByText("公告加载中")).toBeVisible();
    finishLoading({ data: { page: 1, size: 20, total: 0, items: [] } });
    expect(await screen.findByText("暂时没有公告")).toBeVisible();
  });

  it("renders pinned announcements in the server-provided order", async () => {
    list.mockResolvedValue({
      data: {
        page: 1,
        size: 20,
        total: 2,
        items: [
          { id: 8, title: "比赛维护", contentMarkdown: "今晚更新", pinned: true, pinOrder: 1, publishAt: "2026-07-19T01:00:00Z" },
          { id: 7, title: "新题上线", contentMarkdown: "题库已更新", pinned: false, pinOrder: 0, publishAt: "2026-07-18T01:00:00Z" },
        ],
      },
    });

    renderSubject();

    expect(await screen.findByRole("heading", { name: "比赛维护" })).toBeVisible();
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["比赛维护", "新题上线"]);
    expect(screen.getByText("置顶")).toBeVisible();
  });

  it("has a useful empty state", async () => {
    list.mockResolvedValue({ data: { page: 1, size: 20, total: 0, items: [] } });
    renderSubject();
    expect(await screen.findByText("暂时没有公告")).toBeVisible();
  });

  it("lets readers retry a failed request", async () => {
    list.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({
      data: { page: 1, size: 20, total: 0, items: [] },
    });
    renderSubject();

    await fireEvent.click(await screen.findByRole("button", { name: "重新加载" }));
    expect(list).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("暂时没有公告")).toBeVisible();
  });
});
