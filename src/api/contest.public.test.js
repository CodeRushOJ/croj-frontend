import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("./request", () => ({ default: request }));

import { contestApi } from "./contest";

describe("public contest API", () => {
  beforeEach(() => request.mockReset());

  it("retries every public contest read anonymously after session expiry", () => {
    const controller = new AbortController();

    contestApi.list({ page: 1, size: 20 });
    contestApi.detail(12, { signal: controller.signal });
    contestApi.problems(12, { signal: controller.signal });
    contestApi.scoreboard(12);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/contests",
      method: "get",
      params: { page: 1, size: 20 },
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/contests/12",
      method: "get",
      signal: controller.signal,
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/v1/contests/12/problems",
      method: "get",
      signal: controller.signal,
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      url: "/v1/contests/12/scoreboard",
      method: "get",
      anonymousFallback: true,
    });
  });

  it("keeps participant-specific reads and writes authenticated", () => {
    contestApi.registration(12);
    contestApi.register(12);
    contestApi.cancelRegistration(12);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/contests/12/me",
      method: "get",
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/contests/12/registrations",
      method: "post",
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/v1/contests/12/registrations/me",
      method: "delete",
    });
  });
});
