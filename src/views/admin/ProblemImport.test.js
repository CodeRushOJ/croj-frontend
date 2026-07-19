import { fireEvent, render, screen, waitFor, within } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/problemImport", () => ({
  problemImportApi: {
    preflight: vi.fn(),
    commit: vi.fn(),
  },
}));

import { problemImportApi } from "@/api/problemImport";
import ProblemImport from "./ProblemImport.vue";

const readyPreflight = {
  data: {
    jobId: "job-42",
    detectedFormat: "FPS_XML",
    sha256: "0f2a7cc6d4a9073de739b77d7f4a3cc8",
    problemCount: 2,
    testCaseCount: 5,
    errors: [],
    warnings: ["题目 CR-2 缺少来源信息"],
    problems: [
      {
        sourceId: "CR-1",
        title: "A + B Problem",
        testCaseCount: 3,
        status: "READY",
        errors: [],
        warnings: [],
      },
      {
        sourceId: "CR-2",
        title: "Shortest Path",
        testCaseCount: 2,
        status: "WARNING",
        errors: [],
        warnings: ["缺少来源信息"],
      },
    ],
  },
};

const upload = async (name = "freeproblemset.xml") => {
  const file = new File(["<fps></fps>"], name, { type: "application/xml" });
  const input = screen.getByLabelText("选择题目包");
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await fireEvent(input, new Event("change", { bubbles: true }));
  return file;
};

describe("ProblemImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    problemImportApi.preflight.mockResolvedValue(readyPreflight);
    problemImportApi.commit.mockResolvedValue({ data: { importedCount: 2 } });
  });

  it("preflights an XML package and commits only after a clean validation", async () => {
    render(ProblemImport);
    const file = await upload();

    await waitFor(() => expect(problemImportApi.preflight).toHaveBeenCalledWith(file));
    expect(await screen.findByText("FPS_XML")).toBeVisible();
    expect(screen.getByText("2 道题目")).toBeVisible();
    expect(screen.getByText("5 个测试用例")).toBeVisible();
    expect(screen.getByText(readyPreflight.data.sha256)).toBeVisible();

    const table = screen.getByRole("table", { name: "题目预检结果" });
    expect(within(table).getByText("A + B Problem")).toBeVisible();
    expect(within(table).getByText("Shortest Path")).toBeVisible();
    expect(screen.getByText("题目 CR-2 缺少来源信息")).toBeVisible();

    await fireEvent.click(screen.getByRole("button", { name: "确认导入 2 道题目" }));
    await waitFor(() => expect(problemImportApi.commit).toHaveBeenCalledWith("job-42"));
    expect(await screen.findByText("已成功导入 2 道题目")).toBeVisible();
  });

  it("blocks commit when server validation contains errors", async () => {
    problemImportApi.preflight.mockResolvedValue({
      data: {
        ...readyPreflight.data,
        errors: ["测试包包含不安全路径 ../answer.out"],
      },
    });

    render(ProblemImport);
    await upload("unsafe.zip");

    expect(await screen.findByText("测试包包含不安全路径 ../answer.out")).toBeVisible();
    expect(screen.getByRole("button", { name: "修复错误后才能导入" })).toBeDisabled();
    expect(problemImportApi.commit).not.toHaveBeenCalled();
  });

  it("shows a retry action after preflight fails and retries the same real file", async () => {
    problemImportApi.preflight
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(readyPreflight);

    render(ProblemImport);
    const file = await upload();

    expect(await screen.findByRole("alert")).toHaveTextContent("题目包预检失败");
    await fireEvent.click(screen.getByRole("button", { name: "重试预检" }));

    await waitFor(() => expect(problemImportApi.preflight).toHaveBeenCalledTimes(2));
    expect(problemImportApi.preflight).toHaveBeenLastCalledWith(file);
    expect(await screen.findByText("FPS_XML")).toBeVisible();
  });

  it("keeps a validated job retryable when commit fails", async () => {
    problemImportApi.commit
      .mockRejectedValueOnce(new Error("temporary storage failure"))
      .mockResolvedValueOnce({ data: { importedCount: 2 } });

    render(ProblemImport);
    await upload();
    const confirmButton = await screen.findByRole("button", { name: "确认导入 2 道题目" });
    await fireEvent.click(confirmButton);

    expect(await screen.findByRole("alert")).toHaveTextContent("确认导入失败");
    await fireEvent.click(screen.getByRole("button", { name: "重试导入 2 道题目" }));

    await waitFor(() => expect(problemImportApi.commit).toHaveBeenCalledTimes(2));
    expect(problemImportApi.commit).toHaveBeenLastCalledWith("job-42");
    expect(await screen.findByText("已成功导入 2 道题目")).toBeVisible();
  });

  it("rejects unsupported files before calling the API", async () => {
    render(ProblemImport);
    await upload("problems.txt");

    expect(await screen.findByRole("alert")).toHaveTextContent("仅支持 .xml 或 .zip");
    expect(problemImportApi.preflight).not.toHaveBeenCalled();
  });
});
