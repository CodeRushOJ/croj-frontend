import { beforeEach, describe, expect, it } from "vitest";
import {
  clearJudgeConfigurationDraft,
  judgeConfigurationDraftKey,
  loadJudgeConfigurationDraft,
  saveJudgeConfigurationDraft,
} from "./judgeConfigurationDraft";

const specialDraft = {
  judgeMode: 1,
  checker: "special",
  totalScore: 100,
  specialJudgeLanguage: "cpp",
  specialJudgeCode: "int main() {}",
};

describe("administrator judge configuration draft", () => {
  beforeEach(() => sessionStorage.clear());

  it("scopes drafts to a new problem or one concrete problem ID", () => {
    expect(judgeConfigurationDraftKey(null)).toBe("croj:admin:judge-config:v1:new");
    expect(judgeConfigurationDraftKey(42)).toBe("croj:admin:judge-config:v1:42");
    expect(() => judgeConfigurationDraftKey("../42")).toThrow("problemId");
  });

  it("round-trips a valid session-only special-judge draft", () => {
    saveJudgeConfigurationDraft(42, specialDraft);
    expect(loadJudgeConfigurationDraft(42)).toEqual(specialDraft);
    expect(localStorage).toHaveLength(0);
  });

  it("rejects corrupt, future-version and invalid configuration records", () => {
    const key = judgeConfigurationDraftKey(42);

    sessionStorage.setItem(key, "{");
    expect(loadJudgeConfigurationDraft(42)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();

    sessionStorage.setItem(key, JSON.stringify({ version: 2, configuration: specialDraft }));
    expect(loadJudgeConfigurationDraft(42)).toBeNull();

    sessionStorage.setItem(key, JSON.stringify({
      version: 1,
      configuration: { ...specialDraft, checker: "shell" },
    }));
    expect(loadJudgeConfigurationDraft(42)).toBeNull();
  });

  it("clears the exact target only after a confirmed server write", () => {
    saveJudgeConfigurationDraft(null, { ...specialDraft, checker: "exact", specialJudgeCode: "" });
    saveJudgeConfigurationDraft(42, specialDraft);

    clearJudgeConfigurationDraft(42);

    expect(loadJudgeConfigurationDraft(42)).toBeNull();
    expect(loadJudgeConfigurationDraft(null)?.checker).toBe("exact");
  });
});
