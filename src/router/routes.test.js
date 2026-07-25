import { describe, expect, it } from "vitest";

import { ROUTE_NAMES, ROUTE_PATHS } from "@/constants/routes";
import routes from "./routes";

describe("administrator problem import route", () => {
  it("exposes a guarded route below the administrator workspace", () => {
    const adminShell = routes.find((route) => route.path === "/admin");
    const adminLayout = adminShell.children.find((route) => route.path === "");
    const importRoute = adminLayout.children.find((route) => route.path === "problem-imports");

    expect(adminShell.meta).toMatchObject({ requiresAuth: true, admin: true });
    expect(importRoute).toMatchObject({
      name: ROUTE_NAMES.ADMIN_PROBLEM_IMPORTS,
      meta: { title: "Problem Import" },
    });
    expect(ROUTE_PATHS.ADMIN_PROBLEM_IMPORTS).toBe("/admin/problem-imports");
  });
});

describe("contest problem route", () => {
  it("uses contest and problem ids instead of a mutable problem number", () => {
    const mainShell = routes.find((route) => route.path === "/");
    const contestProblem = mainShell.children.find(
      (route) => route.name === ROUTE_NAMES.CONTEST_PROBLEM_DETAIL,
    );

    expect(contestProblem.path).toBe("contests/:contestId/problems/:problemId");
    expect(ROUTE_PATHS.CONTEST_PROBLEM_DETAIL)
      .toBe("/contests/:contestId/problems/:problemId");
  });
});
