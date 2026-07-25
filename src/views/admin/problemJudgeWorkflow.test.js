import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  configurationForProblemEditor,
  loadProblemJudgeConfiguration,
  persistProblemJudgeDraft,
  submitProblemJudgeDraft,
} from "./problemJudgeWorkflow";

const special = {
  judgeMode: 1,
  checker: "special",
  totalScore: 100,
  specialJudgeLanguage: "go",
  specialJudgeCode: "package main",
};
const context = { userId: 7, problemId: 42, baseVersionId: 9 };
const newContext = { userId: 7, problemId: null, baseVersionId: null };

describe("problem judge draft workflow", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores the current-tab draft ahead of sanitized public problem fields", () => {
    persistProblemJudgeDraft(context, special);

    expect(configurationForProblemEditor(context, {
      judgeMode: 0,
      checker: "exact",
      specialJudgeCode: "must not come from public API",
    })).toEqual(special);
  });

  it("loads an existing checker source from the newest draft through the admin boundary", async () => {
    const listVersions = vi.fn().mockResolvedValue({
      data: [
        { versionId: 9, versionNo: 3, state: "DRAFT" },
        { versionId: 8, versionNo: 2, state: "PUBLISHED" },
      ],
    });
    const loadVersionSource = vi.fn().mockResolvedValue({
      data: {
        problemId: 42,
        versionId: 9,
        specialJudge: true,
        checkerSource: "package main",
        checkerLanguage: "go",
        judgeMode: 1,
      },
    });

    await expect(loadProblemJudgeConfiguration({
      userId: 7,
      problemId: 42,
      problem: {
        judgeMode: 1,
        checker: "special",
        totalScore: 100,
        specialJudgeLanguage: "go",
        specialJudgeCode: "must not come from public API",
      },
      listVersions,
      loadVersionSource,
    })).resolves.toEqual(special);
    expect(listVersions).toHaveBeenCalledWith(42);
    expect(loadVersionSource).toHaveBeenCalledWith(42, 9);
  });

  it("prefers a same-user same-version draft without requesting admin source", async () => {
    persistProblemJudgeDraft(context, special);
    const listVersions = vi.fn().mockResolvedValue({
      data: [{ versionId: 9, state: "DRAFT" }],
    });
    const loadVersionSource = vi.fn();

    await expect(loadProblemJudgeConfiguration({
      userId: 7,
      problemId: 42,
      problem: { checker: "special", isSpecialJudge: true },
      listVersions,
      loadVersionSource,
    })).resolves.toEqual(special);
    expect(listVersions).toHaveBeenCalledWith(42);
    expect(loadVersionSource).not.toHaveBeenCalled();
  });

  it("fails closed when an admin source response belongs to another version", async () => {
    await expect(loadProblemJudgeConfiguration({
      userId: 7,
      problemId: 42,
      problem: { checker: "special", isSpecialJudge: true },
      listVersions: vi.fn().mockResolvedValue({
        data: [{ versionId: 9, state: "PUBLISHED" }],
      }),
      loadVersionSource: vi.fn().mockResolvedValue({
        data: {
          problemId: 42,
          versionId: 8,
          specialJudge: true,
          checkerSource: "source",
          checkerLanguage: "cpp",
          judgeMode: 0,
        },
      }),
    })).rejects.toThrow("version");
  });

  it("sends the strict backend DTO and clears the draft only on success", async () => {
    const write = vi.fn().mockResolvedValue({ data: 42 });
    persistProblemJudgeDraft(newContext, special);

    await submitProblemJudgeDraft({
      draftContext: newContext,
      problem: { title: "Weighted SPJ", ...special },
      write,
    });

    expect(write).toHaveBeenCalledWith({
      title: "Weighted SPJ",
      judgeMode: 1,
      checker: "special",
      totalScore: 100,
      isSpecialJudge: true,
      specialJudgeLanguage: "go",
      specialJudgeCode: "package main",
    });
    expect(configurationForProblemEditor(newContext, {})).not.toEqual(special);
  });

  it("keeps the exact session draft when the real API rejects the write", async () => {
    const write = vi.fn().mockRejectedValue(new Error("HTTP 422"));
    persistProblemJudgeDraft(context, special);

    await expect(submitProblemJudgeDraft({
      draftContext: context,
      problem: { id: 42, ...special },
      write,
    })).rejects.toThrow("HTTP 422");

    expect(configurationForProblemEditor(context, {})).toEqual(special);
  });

  it("still writes to the server when session draft persistence is blocked", async () => {
    const write = vi.fn().mockResolvedValue({ data: 42 });
    const setItem = vi.spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });

    await expect(submitProblemJudgeDraft({
      draftContext: context,
      problem: { id: 42, ...special },
      write,
    })).resolves.toEqual({ data: 42 });
    expect(write).toHaveBeenCalledOnce();
    setItem.mockRestore();
  });
});
