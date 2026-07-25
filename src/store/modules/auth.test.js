import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  loadJudgeConfigurationDraft,
  saveJudgeConfigurationDraft,
} from "@/services/judgeConfigurationDraft";
import { useAuthStore } from "./auth";

const context = { userId: 7, problemId: 42, baseVersionId: 9 };
const special = {
  judgeMode: 1,
  checker: "special",
  totalScore: 100,
  specialJudgeLanguage: "cpp",
  specialJudgeCode: "int main() {}",
};

describe("auth administrator-secret cleanup", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setActivePinia(createPinia());
  });

  it("clears every judge-configuration draft when the session is cleared", () => {
    saveJudgeConfigurationDraft(context, special);
    const auth = useAuthStore();
    auth.token = "expired";
    auth.user = { id: 7, role: 1 };

    auth.clearSession();

    expect(auth.token).toBeNull();
    expect(auth.user).toBeNull();
    expect(loadJudgeConfigurationDraft(context)).toBeNull();
  });
});
