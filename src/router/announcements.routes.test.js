import { describe, expect, it } from "vitest";
import { ROUTE_NAMES } from "@/constants/routes";
import routes from "./routes";

describe("announcement route access", () => {
  it("keeps public announcement list and detail anonymous", () => {
    const main = routes.find((route) => route.path === "/");
    const list = main.children.find((route) => route.name === ROUTE_NAMES.ANNOUNCEMENTS);
    const detail = main.children.find((route) => route.name === ROUTE_NAMES.ANNOUNCEMENT_DETAIL);

    expect(list).toMatchObject({ path: "announcements", meta: { requiresAuth: false } });
    expect(detail).toMatchObject({ path: "announcements/:announcementId", meta: { requiresAuth: false } });
  });

  it("nests announcement administration below the authenticated admin guard", () => {
    const admin = routes.find((route) => route.path === "/admin");
    const workspace = admin.children[0].children.find(
      (route) => route.name === ROUTE_NAMES.ADMIN_ANNOUNCEMENTS,
    );

    expect(admin.meta).toEqual({ requiresAuth: true, admin: true });
    expect(workspace).toMatchObject({ path: "announcements", name: ROUTE_NAMES.ADMIN_ANNOUNCEMENTS });
  });
});
