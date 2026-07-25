import { fireEvent, render, screen, within } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  schedule: vi.fn(),
  publish: vi.fn(),
  withdraw: vi.fn(),
  archive: vi.fn(),
}));

vi.mock("@/api/announcement", () => ({
  adminAnnouncementApi: mocks,
  isAnnouncementConflict: (error) => error?.response?.status === 409,
  isAnnouncementForbidden: (error) => error?.response?.status === 403,
}));

import AnnouncementManagement from "./AnnouncementManagement.vue";

const draftItem = {
  id: 9,
  title: "维护草稿",
  contentMarkdown: "尚未发布",
  pinned: true,
  pinOrder: 2,
  status: "DRAFT",
  storedLifecycle: "DRAFT",
  publishAt: null,
  expiresAt: null,
  updatedAt: "2026-07-19T01:00:00Z",
  version: 7,
};

const page = (items = [draftItem]) => ({ data: { page: 1, size: 12, total: items.length, items } });

const renderSubject = () => render(AnnouncementManagement, {
  global: {
    stubs: {
      ElSkeleton: { template: "<div>管理公告加载中</div>" },
      ElPagination: true,
    },
  },
});

const openEditor = async () => {
  await screen.findByRole("heading", { name: "维护草稿" });
  await fireEvent.click(screen.getByRole("button", { name: "编辑 维护草稿" }));
};

describe("AnnouncementManagement", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.list.mockResolvedValue(page());
    mocks.create.mockResolvedValue({ data: 10 });
    mocks.update.mockResolvedValue({});
    mocks.schedule.mockResolvedValue({});
    mocks.publish.mockResolvedValue({});
    mocks.withdraw.mockResolvedValue({});
    mocks.archive.mockResolvedValue({});
  });

  it("shows server lifecycle and pin order, and filters through the API", async () => {
    renderSubject();

    expect(await screen.findByRole("heading", { name: "维护草稿" })).toBeVisible();
    expect(screen.getByText("置顶 #2")).toBeVisible();
    expect(screen.getAllByText("草稿").some((node) => node.classList.contains("lifecycle-pill"))).toBe(true);
    expect(mocks.list).toHaveBeenCalledWith({ page: 1, size: 12 });

    await fireEvent.update(screen.getByLabelText("公告状态"), "PUBLISHED");
    expect(mocks.list).toHaveBeenLastCalledWith({ page: 1, size: 12, status: "PUBLISHED" });
  });

  it("creates a real draft with the backend DTO", async () => {
    renderSubject();
    await screen.findByRole("heading", { name: "维护草稿" });
    await fireEvent.click(screen.getByRole("button", { name: "新建公告" }));
    const editor = screen.getByRole("form", { name: "公告编辑" });
    await fireEvent.update(within(editor).getByLabelText("标题"), "新公告");
    await fireEvent.update(within(editor).getByLabelText("正文"), "真实内容");
    await fireEvent.click(within(editor).getByLabelText("置顶"));
    await fireEvent.update(within(editor).getByLabelText("置顶顺序"), "4");
    await fireEvent.click(within(editor).getByRole("button", { name: "保存草稿" }));

    expect(mocks.create).toHaveBeenCalledWith({
      title: "新公告",
      contentMarkdown: "真实内容",
      pinned: true,
      pinOrder: 4,
    });
  });

  it("updates with the exact list version", async () => {
    renderSubject();
    await openEditor();
    expect(screen.getByLabelText("标题")).toHaveFocus();
    await fireEvent.update(screen.getByLabelText("标题"), "维护草稿 v2");
    await fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    expect(mocks.update).toHaveBeenCalledWith(9, 7, {
      title: "维护草稿 v2",
      contentMarkdown: "尚未发布",
      pinned: true,
      pinOrder: 2,
    });
  });

  it("schedules with UTC instants and publishes permanently", async () => {
    renderSubject();
    await screen.findByRole("heading", { name: "维护草稿" });
    await fireEvent.click(screen.getByRole("button", { name: "排期 维护草稿" }));
    expect(screen.getByLabelText("发布时间")).toHaveFocus();
    await fireEvent.update(screen.getByLabelText("发布时间"), "2026-07-21T10:00");
    await fireEvent.update(screen.getByLabelText("结束时间"), "2026-07-22T10:00");
    await fireEvent.click(screen.getByRole("button", { name: "确认排期" }));

    expect(mocks.schedule).toHaveBeenCalledWith(9, 7, {
      publishAt: new Date("2026-07-21T10:00").toISOString(),
      expiresAt: new Date("2026-07-22T10:00").toISOString(),
    });

    await screen.findByRole("heading", { name: "维护草稿" });
    await fireEvent.click(screen.getByRole("button", { name: "立即发布 维护草稿" }));
    await fireEvent.click(screen.getByRole("button", { name: "确认立即发布" }));
    expect(mocks.publish).toHaveBeenCalledWith(9, 7, { expiresAt: null });
  });

  it("supports withdrawal and confirmed archival", async () => {
    const published = { ...draftItem, status: "PUBLISHED", storedLifecycle: "PUBLISHED", version: 11 };
    mocks.list.mockResolvedValue(page([published]));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSubject();
    await screen.findByRole("heading", { name: "维护草稿" });

    await fireEvent.click(screen.getByRole("button", { name: "撤回 维护草稿" }));
    expect(mocks.withdraw).toHaveBeenCalledWith(9, 11);
    await screen.findByRole("heading", { name: "维护草稿" });
    await fireEvent.click(screen.getByRole("button", { name: "归档 维护草稿" }));
    expect(mocks.archive).toHaveBeenCalledWith(9, 11);
  });

  it("prevents duplicate lifecycle writes while a mutation is pending", async () => {
    const published = { ...draftItem, status: "PUBLISHED", storedLifecycle: "PUBLISHED", version: 11 };
    mocks.list.mockResolvedValue(page([published]));
    let finishWithdraw;
    mocks.withdraw.mockReturnValue(new Promise((resolve) => { finishWithdraw = resolve; }));
    renderSubject();
    await screen.findByRole("heading", { name: "维护草稿" });
    const withdrawButton = screen.getByRole("button", { name: "撤回 维护草稿" });

    await fireEvent.click(withdrawButton);
    expect(withdrawButton).toBeDisabled();
    await fireEvent.click(withdrawButton);
    expect(mocks.withdraw).toHaveBeenCalledTimes(1);

    finishWithdraw({});
    await vi.waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });

  it("preserves edits on 409 and refreshes only after explicit confirmation", async () => {
    mocks.update.mockRejectedValue({ response: { status: 409 } });
    renderSubject();
    await openEditor();
    await fireEvent.update(screen.getByLabelText("标题"), "我未保存的修改");
    await fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("其他管理员已经修改了这条公告");
    expect(screen.getByLabelText("标题")).toHaveValue("我未保存的修改");

    mocks.list.mockResolvedValue(page([{ ...draftItem, title: "服务器最新版本", version: 8 }]));
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));
    await vi.waitFor(() => expect(screen.getByLabelText("标题")).toHaveValue("服务器最新版本"));
    expect(mocks.list).toHaveBeenLastCalledWith({ page: 1, size: 100 });
  });

  it("keeps the conflict and unsaved input when refreshing the server snapshot fails", async () => {
    mocks.update.mockRejectedValue({ response: { status: 409 } });
    renderSubject();
    await openEditor();
    await fireEvent.update(screen.getByLabelText("标题"), "不能丢失的输入");
    await fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await screen.findByText("其他管理员已经修改了这条公告");

    mocks.list.mockRejectedValueOnce(new Error("offline"));
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));

    await vi.waitFor(() => expect(screen.getByText("其他管理员已经修改了这条公告")).toBeVisible());
    expect(screen.getByLabelText("标题")).toHaveValue("不能丢失的输入");
    expect(screen.getByText("服务器版本刷新失败，请保留当前内容并稍后重试。")).toBeVisible();
  });

  it("turns a 403 conflict refresh into a read-only permission state", async () => {
    mocks.update.mockRejectedValue({ response: { status: 409 } });
    renderSubject();
    await openEditor();
    await fireEvent.update(screen.getByLabelText("标题"), "权限变化前的输入");
    await fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await screen.findByText("其他管理员已经修改了这条公告");

    mocks.list.mockRejectedValueOnce({ response: { status: 403 } });
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));

    expect(await screen.findByText("没有公告管理权限")).toBeVisible();
    expect(screen.getByLabelText("标题")).toHaveValue("权限变化前的输入");
    expect(screen.getByLabelText("标题")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "保存修改" })).toBeDisabled();
    expect(screen.queryByText("其他管理员已经修改了这条公告")).not.toBeInTheDocument();
  });

  it("uses the refreshed server version after a lifecycle conflict", async () => {
    mocks.schedule.mockRejectedValueOnce({ response: { status: 409 } }).mockResolvedValueOnce({});
    renderSubject();
    await screen.findByRole("heading", { name: "维护草稿" });
    await fireEvent.click(screen.getByRole("button", { name: "排期 维护草稿" }));
    await fireEvent.update(screen.getByLabelText("发布时间"), "2026-07-21T10:00");
    await fireEvent.click(screen.getByRole("button", { name: "确认排期" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("其他管理员已经修改了这条公告");

    mocks.list.mockResolvedValue(page([{ ...draftItem, version: 8 }]));
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));
    await vi.waitFor(() => expect(screen.queryByText("其他管理员已经修改了这条公告")).not.toBeInTheDocument());
    await fireEvent.click(screen.getByRole("button", { name: "确认排期" }));

    expect(mocks.schedule).toHaveBeenLastCalledWith(9, 8, {
      publishAt: new Date("2026-07-21T10:00").toISOString(),
      expiresAt: null,
    });
    expect(mocks.list).toHaveBeenCalledWith({ page: 1, size: 100 });
  });

  it("closes the editor when a conflicting announcement was archived", async () => {
    mocks.update.mockRejectedValue({ response: { status: 409 } });
    renderSubject();
    await openEditor();
    await fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await screen.findByText("其他管理员已经修改了这条公告");

    mocks.list.mockResolvedValue(page([{
      ...draftItem,
      status: "ARCHIVED",
      storedLifecycle: "ARCHIVED",
      version: 8,
    }]));
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));

    await vi.waitFor(() => expect(screen.queryByRole("form", { name: "公告编辑" })).not.toBeInTheDocument());
    expect(screen.getByText("已归档，只读")).toBeVisible();
    expect(screen.getByText("公告已被其他管理员归档，当前记录只能查看。")).toBeVisible();
  });

  it("closes lifecycle controls when a conflicting announcement was archived", async () => {
    mocks.schedule.mockRejectedValue({ response: { status: 409 } });
    renderSubject();
    await screen.findByRole("heading", { name: "维护草稿" });
    await fireEvent.click(screen.getByRole("button", { name: "排期 维护草稿" }));
    await fireEvent.update(screen.getByLabelText("发布时间"), "2026-07-21T10:00");
    await fireEvent.click(screen.getByRole("button", { name: "确认排期" }));
    await screen.findByText("其他管理员已经修改了这条公告");

    mocks.list.mockResolvedValue(page([{
      ...draftItem,
      status: "ARCHIVED",
      storedLifecycle: "ARCHIVED",
      version: 8,
    }]));
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));

    await vi.waitFor(() => expect(screen.queryByRole("form", { name: "公告排期" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "排期 维护草稿" })).not.toBeInTheDocument();
    expect(screen.getByText("公告已被其他管理员归档，当前记录只能查看。")).toBeVisible();
  });

  it("renders an in-page 403 state instead of an empty desk", async () => {
    mocks.list.mockRejectedValue({ response: { status: 403 } });
    renderSubject();
    expect(await screen.findByRole("alert")).toHaveTextContent("没有公告管理权限");
  });
});
