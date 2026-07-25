import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  configurationForProblemEditor,
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

describe("problem judge draft workflow", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores the current-tab draft ahead of sanitized public problem fields", () => {
    persistProblemJudgeDraft(42, special);

    expect(configurationForProblemEditor(42, {
      judgeMode: 0,
      checker: "exact",
      specialJudgeCode: "must not come from public API",
    })).toEqual(special);
  });

  it("sends the strict backend DTO and clears the draft only on success", async () => {
    const write = vi.fn().mockResolvedValue({ data: 42 });
    persistProblemJudgeDraft(null, special);

    await submitProblemJudgeDraft({
      problemId: null,
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
    expect(configurationForProblemEditor(null, {})).not.toEqual(special);
  });

  it("keeps the exact session draft when the real API rejects the write", async () => {
    const write = vi.fn().mockRejectedValue(new Error("HTTP 422"));
    persistProblemJudgeDraft(42, special);

    await expect(submitProblemJudgeDraft({
      problemId: 42,
      problem: { id: 42, ...special },
      write,
    })).rejects.toThrow("HTTP 422");

    expect(configurationForProblemEditor(42, {})).toEqual(special);
  });
});
