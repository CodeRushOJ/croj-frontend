import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSubmissionDraft,
  getSubmissionDraft,
  saveSubmissionDraft,
  withSubmissionTab,
} from "./submissionDraft";

describe("submission draft handoff", () => {
  beforeEach(() => sessionStorage.clear());

  it("scopes ordinary and contest drafts and keeps them out of persistent storage", () => {
    saveSubmissionDraft({ problemId: 42 }, { language: "cpp", code: "ordinary" });
    saveSubmissionDraft(
      { contestId: 7, problemId: 42 },
      { language: "python", code: "contest" },
    );

    expect(getSubmissionDraft({ problemId: 42 })).toEqual({
      language: "cpp",
      code: "ordinary",
    });
    expect(getSubmissionDraft({ contestId: 7, problemId: 42 })).toEqual({
      language: "python",
      code: "contest",
    });
    expect(localStorage.length).toBe(0);
  });

  it("ignores malformed data and clears only the accepted submission context", () => {
    sessionStorage.setItem("croj:submission-draft:problem:42", "{broken");
    expect(getSubmissionDraft({ problemId: 42 })).toBeNull();

    saveSubmissionDraft({ problemId: 42 }, { language: "go", code: "package main" });
    saveSubmissionDraft({ problemId: 43 }, { language: "cpp", code: "keep" });
    clearSubmissionDraft({ problemId: 42 });

    expect(getSubmissionDraft({ problemId: 42 })).toBeNull();
    expect(getSubmissionDraft({ problemId: 43 })?.code).toBe("keep");
  });

  it("preserves existing query and hash state while selecting the authenticated action tab", () => {
    expect(withSubmissionTab("/problem/P1000?source=list#editor", "submit"))
      .toBe("/problem/P1000?source=list&tab=submit#editor");
    expect(withSubmissionTab("/problem/P1000?tab=description", "discussion"))
      .toBe("/problem/P1000?tab=discussion");
  });

  it("does not block the login handoff when browser session storage is unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });

    expect(() => saveSubmissionDraft(
      { problemId: 42 },
      { language: "cpp", code: "int main() {}" },
    )).not.toThrow();
    expect(setItem).toHaveBeenCalledOnce();
  });

  it("treats blocked draft reads and cleanup as unavailable storage", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem")
      .mockImplementationOnce(() => {
        throw new DOMException("blocked", "SecurityError");
      });
    const removeItem = vi.spyOn(Storage.prototype, "removeItem")
      .mockImplementationOnce(() => {
        throw new DOMException("blocked", "SecurityError");
      });

    expect(() => getSubmissionDraft({ problemId: 42 })).not.toThrow();
    expect(getSubmissionDraft({ problemId: 42 })).toBeNull();
    expect(() => clearSubmissionDraft({ problemId: 42 })).not.toThrow();
    expect(getItem).toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalledOnce();
  });
});
