import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ROUTE_NAMES } from "@/constants/routes";
import { useAuthStore } from "@/store/modules/auth";
import { setupRouterGuards } from "./guards";

const { getCurrentUser, error, warning } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("@/api/auth", () => ({
  authApi: {
    getCurrentUser,
  },
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    error,
    warning,
  },
}));

const adminRoute = {
  fullPath: "/admin/problem-imports",
  meta: {
    title: "Problem Import",
    requiresAuth: true,
    admin: true,
  },
};

const installGuard = () => {
  let guard;
  setupRouterGuards({
    beforeEach(callback) {
      guard = callback;
    },
  });
  return guard;
};

describe("administrator route guard", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    error.mockReset();
    warning.mockReset();
    setActivePinia(createPinia());
  });

  it("waits for persisted-session hydration before allowing a super admin", async () => {
    getCurrentUser.mockResolvedValue({
      data: { id: 7, username: "admin", role: "SUPER_ADMIN" },
    });
    const auth = useAuthStore();
    auth.token = "persisted-token";
    const next = vi.fn();

    await installGuard()(adminRoute, {}, next);

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(error).not.toHaveBeenCalled();
  });

  it("fails closed after hydrating an unknown backend role", async () => {
    getCurrentUser.mockResolvedValue({
      data: { id: 7, username: "admin", role: "ROOT" },
    });
    const auth = useAuthStore();
    auth.token = "persisted-token";
    const next = vi.fn();

    await installGuard()(adminRoute, {}, next);

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith({ name: ROUTE_NAMES.DASHBOARD });
    expect(error).toHaveBeenCalledTimes(1);
  });
});
