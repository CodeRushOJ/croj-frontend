import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllJudgeConfigurationDrafts,
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
const context = { userId: 7, problemId: 42, baseVersionId: 9 };
const newContext = { userId: 7, problemId: null, baseVersionId: null };

describe("administrator judge configuration draft", () => {
  beforeEach(() => sessionStorage.clear());

  it("scopes drafts to the administrator, problem and immutable base version", () => {
    expect(judgeConfigurationDraftKey(newContext))
      .toBe("croj:admin:judge-config:v2:user:7:problem:new:version:new");
    expect(judgeConfigurationDraftKey(context))
      .toBe("croj:admin:judge-config:v2:user:7:problem:42:version:9");
    expect(() => judgeConfigurationDraftKey({ ...context, problemId: "../42" }))
      .toThrow("problemId");
  });

  it("round-trips a valid session-only special-judge draft", () => {
    expect(saveJudgeConfigurationDraft(context, specialDraft)).toBe(true);
    expect(loadJudgeConfigurationDraft(context)).toEqual(specialDraft);
    expect(localStorage).toHaveLength(0);
  });

  it("rejects corrupt, future-version and invalid configuration records", () => {
    const key = judgeConfigurationDraftKey(context);

    sessionStorage.setItem(key, "{");
    expect(loadJudgeConfigurationDraft(context)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();

    sessionStorage.setItem(key, JSON.stringify({ version: 3, configuration: specialDraft }));
    expect(loadJudgeConfigurationDraft(context)).toBeNull();

    sessionStorage.setItem(key, JSON.stringify({
      version: 2,
      configuration: { ...specialDraft, checker: "shell" },
    }));
    expect(loadJudgeConfigurationDraft(context)).toBeNull();
  });

  it("clears the exact target only after a confirmed server write", () => {
    saveJudgeConfigurationDraft(newContext, { ...specialDraft, checker: "exact", specialJudgeCode: "" });
    saveJudgeConfigurationDraft(context, specialDraft);

    clearJudgeConfigurationDraft(context);

    expect(loadJudgeConfigurationDraft(context)).toBeNull();
    expect(loadJudgeConfigurationDraft(newContext)?.checker).toBe("exact");
  });

  it("does not expose a draft across administrators or newer base versions", () => {
    saveJudgeConfigurationDraft(context, specialDraft);

    expect(loadJudgeConfigurationDraft({ ...context, userId: 8 })).toBeNull();
    expect(loadJudgeConfigurationDraft({ ...context, baseVersionId: 10 })).toBeNull();
  });

  it("treats blocked or exhausted session storage as a recoverability miss", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });

    expect(saveJudgeConfigurationDraft(context, specialDraft)).toBe(false);
    setItem.mockRestore();
  });

  it("clears every administrator judge draft without touching unrelated session state", () => {
    saveJudgeConfigurationDraft(context, specialDraft);
    saveJudgeConfigurationDraft({ ...context, userId: 8 }, specialDraft);
    sessionStorage.setItem("croj:admin:judge-config:v1:42", "legacy private source");
    sessionStorage.setItem("unrelated", "keep");

    clearAllJudgeConfigurationDrafts();

    expect(loadJudgeConfigurationDraft(context)).toBeNull();
    expect(loadJudgeConfigurationDraft({ ...context, userId: 8 })).toBeNull();
    expect(sessionStorage.getItem("croj:admin:judge-config:v1:42")).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
});
