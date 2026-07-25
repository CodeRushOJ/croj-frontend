import { fireEvent, render, screen, waitFor, within } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
  problems: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  arrangeProblems: vi.fn(),
  publish: vi.fn(),
  cancel: vi.fn(),
  getProblemById: vi.fn(),
  listVersions: vi.fn(),
}));

vi.mock("@/api/contest", () => ({
  contestApi: {
    detail: mocks.detail,
    problems: mocks.problems,
  },
  adminContestApi: {
    create: mocks.create,
    update: mocks.update,
    arrangeProblems: mocks.arrangeProblems,
    publish: mocks.publish,
    cancel: mocks.cancel,
  },
}));
vi.mock("@/api/problem", () => ({
  problemApi: { getProblemById: mocks.getProblemById },
}));
vi.mock("@/api/testBundle", () => ({
  adminTestBundleApi: { listVersions: mocks.listVersions },
}));

import ContestManagement from "./ContestManagement.vue";

const contest = {
  id: 12,
  title: "Weekly 42",
  descriptionMarkdown: "Real contest",
  ruleType: "ACM",
  visibility: "PUBLIC",
  lifecycle: "DRAFT",
  registrationOpensAt: "2026-08-01T00:00:00Z",
  registrationClosesAt: "2026-08-01T01:00:00Z",
  startsAt: "2026-08-01T02:00:00Z",
  freezeAt: "2026-08-01T03:00:00Z",
  endsAt: "2026-08-01T04:00:00Z",
};

const fillDraft = async () => {
  await fireEvent.update(screen.getByLabelText("比赛标题"), " Weekly 42 ");
  await fireEvent.update(screen.getByLabelText("比赛说明"), "Real contest");
  await fireEvent.update(screen.getByLabelText("开放报名"), "2026-08-01T08:00");
  await fireEvent.update(screen.getByLabelText("关闭报名"), "2026-08-01T09:00");
  await fireEvent.update(screen.getByLabelText("比赛开始"), "2026-08-01T10:00");
  await fireEvent.update(screen.getByLabelText("封榜时间"), "2026-08-01T11:00");
  await fireEvent.update(screen.getByLabelText("比赛结束"), "2026-08-01T12:00");
};

const openContest = async () => {
  await fireEvent.update(screen.getByLabelText("比赛 ID"), "12");
  await fireEvent.click(screen.getByRole("button", { name: "打开比赛" }));
  await screen.findByDisplayValue("Weekly 42");
};

describe("ContestManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.detail.mockResolvedValue({ data: { contest, phase: "DRAFT" } });
    mocks.problems.mockResolvedValue({
      data: [{ problemId: 4, problemVersionId: 9, label: "A", score: 100 }],
    });
    mocks.create.mockResolvedValue({ data: 12 });
    mocks.update.mockResolvedValue({});
    mocks.arrangeProblems.mockResolvedValue({});
    mocks.publish.mockResolvedValue({});
    mocks.cancel.mockResolvedValue({});
    mocks.getProblemById.mockResolvedValue({
      data: { id: 5, problemNo: "P1005", title: "Two Sum" },
    });
    mocks.listVersions.mockResolvedValue({
      data: [
        { versionId: 10, versionNo: 1, state: "DRAFT" },
        { versionId: 11, versionNo: 2, state: "PUBLISHED" },
      ],
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("states the backend capability boundary and creates a real draft", async () => {
    render(ContestManagement);

    expect(screen.getByTestId("contest-capability-note")).toHaveTextContent(
      "当前后端暂不提供比赛列表",
    );
    await fillDraft();
    await fireEvent.click(screen.getByRole("button", { name: "创建比赛草稿" }));

    expect(mocks.create).toHaveBeenCalledWith({
      title: "Weekly 42",
      descriptionMarkdown: "Real contest",
      ruleType: "ACM",
      visibility: "PUBLIC",
      registrationOpensAt: new Date("2026-08-01T08:00").toISOString(),
      registrationClosesAt: new Date("2026-08-01T09:00").toISOString(),
      startsAt: new Date("2026-08-01T10:00").toISOString(),
      freezeAt: new Date("2026-08-01T11:00").toISOString(),
      endsAt: new Date("2026-08-01T12:00").toISOString(),
    });
    expect(await screen.findByTestId("contest-current-id")).toHaveTextContent("12");
    expect(screen.getByTestId("contest-lifecycle")).toHaveTextContent("DRAFT");
  });

  it("opens a server contest by ID and saves edits without a fake list", async () => {
    render(ContestManagement);
    await openContest();

    expect(mocks.detail).toHaveBeenCalledWith(12, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.problems).toHaveBeenCalledWith(12, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
    expect(screen.getByTestId("contest-problem-row-4")).toHaveTextContent("A");

    await fireEvent.update(screen.getByLabelText("比赛标题"), "Weekly 42 revised");
    await fireEvent.click(screen.getByRole("button", { name: "保存比赛设置" }));
    expect(mocks.update).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ title: "Weekly 42 revised" }),
    );
  });

  it("starts a clean server-backed draft without retaining the previously opened id", async () => {
    render(ContestManagement);
    await openContest();

    await fireEvent.click(screen.getByRole("button", { name: "新建空白草稿" }));

    expect(screen.getByLabelText("比赛 ID")).toHaveValue("");
    expect(screen.getByLabelText("比赛标题")).toHaveValue("");
    expect(screen.queryByTestId("contest-current-id")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contest-problem-row-4")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建比赛草稿" })).toBeVisible();
  });

  it("discovers only published immutable versions and persists the arrangement", async () => {
    render(ContestManagement);
    await openContest();

    await fireEvent.update(screen.getByLabelText("待添加题目 ID"), "5");
    await fireEvent.click(screen.getByRole("button", { name: "查询已发布版本" }));

    expect(await screen.findByRole("option", { name: "版本 2 · PUBLISHED" })).toBeVisible();
    expect(screen.queryByRole("option", { name: /DRAFT/ })).not.toBeInTheDocument();
    await fireEvent.update(screen.getByLabelText("不可变题目版本"), "11");
    await fireEvent.update(screen.getByLabelText("题目标签"), " b ");
    await fireEvent.update(screen.getByLabelText("题目分值"), "200");
    await fireEvent.click(screen.getByRole("button", { name: "加入比赛" }));
    expect(screen.getByTestId("contest-problem-row-5")).toHaveTextContent("Two Sum");

    await fireEvent.click(screen.getByRole("button", { name: "保存题目编排" }));
    expect(mocks.arrangeProblems).toHaveBeenCalledWith(12, [
      { problemId: 4, problemVersionId: 9, label: "A", score: 100 },
      { problemId: 5, problemVersionId: 11, label: "B", score: 200 },
    ]);
  });

  it("clears stale version candidates before a failed lookup", async () => {
    render(ContestManagement);
    await openContest();

    await fireEvent.update(screen.getByLabelText("待添加题目 ID"), "5");
    await fireEvent.click(screen.getByRole("button", { name: "查询已发布版本" }));
    await fireEvent.update(screen.getByLabelText("不可变题目版本"), "11");

    mocks.listVersions.mockRejectedValueOnce(new Error("offline"));
    await fireEvent.update(screen.getByLabelText("待添加题目 ID"), "6");
    await fireEvent.click(screen.getByRole("button", { name: "查询已发布版本" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("题目版本查询失败");
    expect(screen.queryByRole("option", { name: "版本 2 · PUBLISHED" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "加入比赛" })).toBeDisabled();
  });

  it("invalidates discovered versions when the administrator edits the problem id", async () => {
    render(ContestManagement);
    await openContest();

    await fireEvent.update(screen.getByLabelText("待添加题目 ID"), "5");
    await fireEvent.click(screen.getByRole("button", { name: "查询已发布版本" }));
    await screen.findByRole("option", { name: "版本 2 · PUBLISHED" });
    await fireEvent.update(screen.getByLabelText("不可变题目版本"), "11");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "加入比赛" })).toBeEnabled();
    });

    await fireEvent.update(screen.getByLabelText("待添加题目 ID"), "6");

    expect(screen.queryByRole("option", { name: "版本 2 · PUBLISHED" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "加入比赛" })).toBeDisabled();
  });

  it("edits labels and scores because label order is the current backend ordering contract", async () => {
    render(ContestManagement);
    await openContest();

    await fireEvent.update(screen.getByLabelText("题目 A 分值"), "250");
    await fireEvent.update(screen.getByLabelText("题目 A 标签"), " c ");
    await fireEvent.click(screen.getByRole("button", { name: "保存题目编排" }));

    expect(mocks.arrangeProblems).toHaveBeenCalledWith(12, [
      { problemId: 4, problemVersionId: 9, label: "C", score: 250 },
    ]);
    expect(screen.getByLabelText("题目 C 标签")).toHaveValue("C");
    expect(screen.getByLabelText("题目 C 分值")).toHaveValue(250);
  });

  it("keeps unsaved edits when switching workspaces is cancelled", async () => {
    window.confirm.mockReturnValue(false);
    render(ContestManagement);
    await openContest();
    await fireEvent.update(screen.getByLabelText("比赛标题"), "尚未保存");

    await fireEvent.update(screen.getByLabelText("比赛 ID"), "13");
    await fireEvent.click(screen.getByRole("button", { name: "打开比赛" }));
    expect(mocks.detail).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("比赛标题")).toHaveValue("尚未保存");

    await fireEvent.click(screen.getByRole("button", { name: "新建空白草稿" }));
    expect(screen.getByLabelText("比赛标题")).toHaveValue("尚未保存");
    expect(screen.getByTestId("contest-current-id")).toHaveTextContent("12");
  });

  it("publishes and cancels through confirmed lifecycle mutations", async () => {
    render(ContestManagement);
    await openContest();

    await fireEvent.click(screen.getByRole("button", { name: "发布比赛" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mocks.publish).toHaveBeenCalledWith(12);
    expect(await screen.findByTestId("contest-lifecycle")).toHaveTextContent("PUBLISHED");

    await fireEvent.click(screen.getByRole("button", { name: "取消比赛" }));
    expect(mocks.cancel).toHaveBeenCalledWith(12);
    expect(await screen.findByTestId("contest-lifecycle")).toHaveTextContent("CANCELLED");
  });

  it("cannot publish editor state that has not been persisted to the server", async () => {
    render(ContestManagement);
    await openContest();
    const publish = screen.getByRole("button", { name: "发布比赛" });
    expect(publish).toBeEnabled();

    await fireEvent.update(screen.getByLabelText("比赛标题"), "尚未保存的标题");
    expect(publish).toBeDisabled();
    await fireEvent.click(screen.getByRole("button", { name: "保存比赛设置" }));
    await waitFor(() => expect(publish).toBeEnabled());

    await fireEvent.update(screen.getByLabelText("题目 A 分值"), "250");
    expect(publish).toBeDisabled();
    await fireEvent.click(screen.getByRole("button", { name: "保存题目编排" }));
    await waitFor(() => expect(publish).toBeEnabled());
  });

  it("locks roster edits until an in-flight server save completes", async () => {
    let resolveSave;
    mocks.arrangeProblems.mockReturnValueOnce(new Promise((resolve) => {
      resolveSave = resolve;
    }));
    render(ContestManagement);
    await openContest();

    await fireEvent.click(screen.getByRole("button", { name: "保存题目编排" }));
    await waitFor(() => expect(mocks.arrangeProblems).toHaveBeenCalledOnce());
    const remove = screen.getByRole("button", { name: "移除题目 A" });

    expect(remove).toBeDisabled();
    await fireEvent.click(remove);
    expect(screen.getByTestId("contest-problem-row-4")).toBeVisible();

    resolveSave({});
    await waitFor(() => expect(remove).toBeEnabled());
  });

  it("keeps unsaved fields visible when the server rejects a stale draft", async () => {
    mocks.update.mockRejectedValue({ response: { status: 409 } });
    render(ContestManagement);
    await openContest();
    const editor = screen.getByRole("form", { name: "比赛设置" });
    await fireEvent.update(within(editor).getByLabelText("比赛标题"), "不能丢失的修改");
    await fireEvent.click(within(editor).getByRole("button", { name: "保存比赛设置" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("比赛状态已经变化");
    expect(screen.getByLabelText("比赛标题")).toHaveValue("不能丢失的修改");
    expect(screen.getByRole("button", { name: "重新加载服务器版本" })).toBeVisible();
  });

  it("ignores a slower response after the administrator opens another contest", async () => {
    let resolveFirst;
    mocks.detail
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ data: { contest: { ...contest, id: 13, title: "Newest" } } });
    mocks.problems.mockResolvedValue({ data: [] });
    render(ContestManagement);

    await fireEvent.update(screen.getByLabelText("比赛 ID"), "12");
    await fireEvent.click(screen.getByRole("button", { name: "打开比赛" }));
    await waitFor(() => expect(mocks.detail).toHaveBeenCalledTimes(1));
    await fireEvent.update(screen.getByLabelText("比赛 ID"), "13");
    await fireEvent.click(screen.getByRole("button", { name: "打开比赛" }));
    expect(await screen.findByDisplayValue("Newest")).toBeVisible();

    resolveFirst({ data: { contest: { ...contest, title: "Stale" } } });
    await Promise.resolve();
    await Promise.resolve();
    expect(screen.getByLabelText("比赛标题")).toHaveValue("Newest");
  });
});
