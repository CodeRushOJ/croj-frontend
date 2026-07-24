import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/testBundle", () => ({
  adminTestBundleApi: {
    listVersions: vi.fn(),
    describe: vi.fn(),
    upload: vi.fn(),
    publish: vi.fn(),
  },
}));

const routeQuery = vi.hoisted(() => ({}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: routeQuery }),
}));

import { adminTestBundleApi } from "@/api/testBundle";
import TestBundleManagement from "./TestBundleManagement.vue";

const draft = {
  data: {
    problemId: 42,
    versionId: 101,
    state: "DRAFT",
    attached: false,
    sha256: null,
  },
  etag: '"tb-v1-101-DRAFT-none"',
};

const loadDraft = async () => {
  await fireEvent.update(screen.getByLabelText("题目 ID"), "42");
  await fireEvent.click(screen.getByRole("button", { name: "加载版本" }));
  await screen.findByRole("option", { name: "版本 3 · DRAFT" });
  await fireEvent.update(screen.getByLabelText("草稿版本"), "101");
  await screen.findByText("DRAFT");
};

const selectBundle = async () => {
  const file = new File(["zip"], "tests.zip", { type: "application/zip" });
  const input = screen.getByLabelText("TestBundle ZIP");
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  Object.defineProperty(input, "value", {
    configurable: true,
    writable: true,
    value: "C:\\fakepath\\tests.zip",
  });
  await fireEvent(input, new Event("change", { bubbles: true }));
  return file;
};

describe("TestBundleManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(routeQuery).forEach((key) => delete routeQuery[key]);
    adminTestBundleApi.listVersions.mockResolvedValue({
      data: [
        { versionId: 101, versionNo: 3, state: "DRAFT", attached: false, etag: draft.etag },
        { versionId: 99, versionNo: 2, state: "PUBLISHED", attached: true, etag: '"published"' },
      ],
    });
    adminTestBundleApi.describe.mockResolvedValue(draft);
    adminTestBundleApi.upload.mockResolvedValue({
      data: { ...draft.data, attached: true, sha256: "abc" },
      etag: '"tb-v1-101-DRAFT-abc"',
    });
    adminTestBundleApi.publish.mockResolvedValue({
      data: { ...draft.data, attached: true, state: "PUBLISHED", sha256: "abc" },
      etag: '"tb-v1-101-PUBLISHED-abc"',
    });
  });

  it("loads metadata, uploads with its ETag and publishes with the new ETag", async () => {
    render(TestBundleManagement);
    await loadDraft();
    const file = await selectBundle();
    await fireEvent.click(screen.getByRole("button", { name: "上传并校验测试包" }));

    await waitFor(() => expect(adminTestBundleApi.upload).toHaveBeenCalled());
    expect(adminTestBundleApi.upload.mock.calls[0].slice(0, 4)).toEqual([
      42, 101, file, '"tb-v1-101-DRAFT-none"',
    ]);
    expect(await screen.findByText("abc")).toBeVisible();

    await fireEvent.click(screen.getByRole("button", { name: "发布题目版本" }));
    await waitFor(() => expect(adminTestBundleApi.publish).toHaveBeenCalledWith(
      42, 101, '"tb-v1-101-DRAFT-abc"',
    ));
    expect(await screen.findByText("PUBLISHED")).toBeVisible();
  });

  it("discovers DRAFT versions from the problemId route query", async () => {
    routeQuery.problemId = "42";
    render(TestBundleManagement);

    await waitFor(() => expect(adminTestBundleApi.listVersions).toHaveBeenCalledWith(42));
    expect(await screen.findByRole("option", { name: "版本 3 · DRAFT" })).toBeVisible();
    expect(screen.queryByRole("option", { name: /PUBLISHED/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("题目 ID")).toHaveValue("42");
  });

  it.each([
    [400, "请求格式不正确"],
    [403, "没有测试包管理权限"],
    [404, "题目或草稿版本不存在"],
    [409, "当前题目版本状态不允许此操作"],
    [412, "服务器版本已经变化"],
    [413, "测试包超过服务端大小限制"],
    [422, "测试包未通过安全或格式校验"],
    [428, "缺少服务器版本前置条件"],
  ])("renders a specific state for HTTP %s", async (status, message) => {
    adminTestBundleApi.describe.mockRejectedValue({ response: { status } });
    render(TestBundleManagement);
    await fireEvent.update(screen.getByLabelText("题目 ID"), "42");
    await fireEvent.click(screen.getByRole("button", { name: "加载版本" }));
    await screen.findByRole("option", { name: "版本 3 · DRAFT" });
    await fireEvent.update(screen.getByLabelText("草稿版本"), "101");
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("preserves the file on stale ETag and refreshes only when requested", async () => {
    adminTestBundleApi.upload.mockRejectedValueOnce({ response: { status: 412 } });
    render(TestBundleManagement);
    await loadDraft();
    const file = await selectBundle();
    const input = screen.getByLabelText("TestBundle ZIP");
    await fireEvent.click(screen.getByRole("button", { name: "上传并校验测试包" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("服务器版本已经变化");
    expect(screen.getByText(/tests\.zip/)).toBeVisible();
    await fireEvent.click(screen.getByRole("button", { name: "刷新服务器版本" }));
    await waitFor(() => expect(adminTestBundleApi.describe).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/tests\.zip/)).toBeVisible();
    expect(input.value).toBe("C:\\fakepath\\tests.zip");
    expect(file.name).toBe("tests.zip");
  });

  it("clears the selected archive when the draft version target changes", async () => {
    adminTestBundleApi.listVersions.mockResolvedValue({
      data: [
        { versionId: 102, versionNo: 4, state: "DRAFT", attached: false },
        { versionId: 101, versionNo: 3, state: "DRAFT", attached: false },
      ],
    });
    adminTestBundleApi.describe.mockImplementation((_problemId, versionId) => Promise.resolve({
      data: { ...draft.data, versionId, state: "DRAFT" },
      etag: `"tb-v1-${versionId}-DRAFT-none"`,
    }));
    render(TestBundleManagement);
    await loadDraft();
    await selectBundle();
    const input = screen.getByLabelText("TestBundle ZIP");

    await fireEvent.update(screen.getByLabelText("草稿版本"), "102");
    await screen.findByText('"tb-v1-102-DRAFT-none"');

    expect(screen.queryByText(/tests\.zip/)).not.toBeInTheDocument();
    expect(input.value).toBe("");
    expect(screen.getByRole("button", { name: "上传并校验测试包" })).toBeDisabled();
  });

  it("clears the selected archive when the problem target changes", async () => {
    render(TestBundleManagement);
    await loadDraft();
    await selectBundle();
    const input = screen.getByLabelText("TestBundle ZIP");

    await fireEvent.update(screen.getByLabelText("题目 ID"), "43");

    expect(screen.queryByText(/tests\.zip/)).not.toBeInTheDocument();
    expect(input.value).toBe("");
    expect(screen.getByRole("button", { name: "上传并校验测试包" })).toBeDisabled();
  });

  it("refuses to upload when the selected archive target no longer matches the form", async () => {
    render(TestBundleManagement);
    await loadDraft();
    await selectBundle();

    await fireEvent.update(screen.getByLabelText("题目 ID"), "43");
    await fireEvent.click(screen.getByRole("button", { name: "上传并校验测试包" }));

    expect(adminTestBundleApi.upload).not.toHaveBeenCalled();
  });

  it("lets an administrator cancel an active upload", async () => {
    adminTestBundleApi.upload.mockImplementation((problemId, versionId, file, etag, { signal }) => (
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(
          Object.assign(new Error("cancelled"), { code: "ERR_CANCELED" }),
        ));
      })
    ));
    render(TestBundleManagement);
    await loadDraft();
    await selectBundle();
    await fireEvent.click(screen.getByRole("button", { name: "上传并校验测试包" }));
    await fireEvent.click(await screen.findByRole("button", { name: "取消上传" }));

    await waitFor(() => expect(screen.getByText("上传已取消，文件仍保留。")).toBeVisible());
    expect(screen.getByText(/tests\.zip/)).toBeVisible();
  });
});
