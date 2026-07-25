import { describe, expect, it } from "vitest";

import { ROUTE_NAMES, ROUTE_PATHS } from "@/constants/routes";
import { adminTestBundlesLocation } from "@/constants/routes";
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

describe("administrator TestBundle route", () => {
  it("exposes the guarded immutable test-bundle workspace", () => {
    const adminShell = routes.find((route) => route.path === "/admin");
    const adminLayout = adminShell.children.find((route) => route.path === "");
    const bundleRoute = adminLayout.children.find((route) => route.path === "test-bundles");

    expect(bundleRoute).toMatchObject({
      name: ROUTE_NAMES.ADMIN_TEST_BUNDLES,
      meta: { title: "TestBundle Management" },
    });
    expect(ROUTE_PATHS.ADMIN_TEST_BUNDLES).toBe("/admin/test-bundles");
    expect(adminTestBundlesLocation(42)).toEqual({
      name: ROUTE_NAMES.ADMIN_TEST_BUNDLES,
      query: { problemId: "42" },
    });
  });
});

describe("administrator contest route", () => {
  it("exposes the guarded real-server contest workspace", () => {
    const adminShell = routes.find((route) => route.path === "/admin");
    const adminLayout = adminShell.children.find((route) => route.path === "");
    const contestRoute = adminLayout.children.find((route) => route.path === "contests");

    expect(contestRoute).toMatchObject({
      name: ROUTE_NAMES.ADMIN_CONTESTS,
      meta: { title: "Contest Management" },
    });
    expect(ROUTE_PATHS.ADMIN_CONTESTS).toBe("/admin/contests");
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

describe("public problem routes", () => {
  it("allows anonymous list and detail reads but keeps contest problems guarded", () => {
    const mainShell = routes.find((route) => route.path === "/");
    const list = mainShell.children.find((route) => route.name === ROUTE_NAMES.PROBLEMS);
    const detail = mainShell.children.find((route) => route.name === ROUTE_NAMES.PROBLEM_DETAIL);
    const contestProblem = mainShell.children.find(
      (route) => route.name === ROUTE_NAMES.CONTEST_PROBLEM_DETAIL,
    );

    expect(list.meta.requiresAuth).toBe(false);
    expect(detail.meta.requiresAuth).toBe(false);
    expect(contestProblem.meta.requiresAuth).toBe(true);
  });
});
