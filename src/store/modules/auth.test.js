import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import {
  loadJudgeConfigurationDraft,
  saveJudgeConfigurationDraft,
} from "@/services/judgeConfigurationDraft";
import { useAuthStore } from "./auth";

const { getCurrentUser } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/api/auth", () => ({
  authApi: {
    getCurrentUser,
  },
}));

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
    getCurrentUser.mockReset();
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

describe("auth role hydration", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    setActivePinia(createPinia());
  });

  it.each([
    { backendRole: 1, normalizedRole: 1, isAdmin: true, isSuperAdmin: false },
    { backendRole: 2, normalizedRole: 2, isAdmin: true, isSuperAdmin: true },
    { backendRole: "ADMIN", normalizedRole: 1, isAdmin: true, isSuperAdmin: false },
    { backendRole: "SUPER_ADMIN", normalizedRole: 2, isAdmin: true, isSuperAdmin: true },
  ])(
    "normalizes supported backend role $backendRole to $normalizedRole",
    async ({ backendRole, normalizedRole, isAdmin, isSuperAdmin }) => {
      getCurrentUser.mockResolvedValue({
        data: { id: 7, username: "admin", role: backendRole },
      });
      const auth = useAuthStore();
      auth.token = "persisted-token";

      await auth.fetchCurrentUser();

      expect(auth.currentUser.role).toBe(normalizedRole);
      expect(auth.isAdmin).toBe(isAdmin);
      expect(auth.isSuperAdmin).toBe(isSuperAdmin);
    },
  );

  it("fails closed when the backend returns an unknown role", async () => {
    getCurrentUser.mockResolvedValue({
      data: { id: 7, username: "admin", role: "ROOT" },
    });
    const auth = useAuthStore();
    auth.token = "persisted-token";

    await auth.fetchCurrentUser();

    expect(auth.currentUser.role).toBeNull();
    expect(auth.isAdmin).toBe(false);
    expect(auth.isSuperAdmin).toBe(false);
  });

  it("shares one in-flight current-user request between hydration callers", async () => {
    let resolveCurrentUser;
    getCurrentUser.mockReturnValue(new Promise((resolve) => {
      resolveCurrentUser = resolve;
    }));
    const auth = useAuthStore();
    auth.token = "persisted-token";

    const first = auth.fetchCurrentUser();
    const second = auth.fetchCurrentUser();

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    resolveCurrentUser({
      data: { id: 7, username: "admin", role: "SUPER_ADMIN" },
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ role: 2 }),
      expect.objectContaining({ role: 2 }),
    ]);
  });
});
