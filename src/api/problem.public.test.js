import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("./request", () => ({ default: request }));

import { problemApi } from "./problem";

describe("anonymous problem reads", () => {
  beforeEach(() => request.mockReset());

  it("opts published problem list and detail reads into anonymous fallback", () => {
    const signal = new AbortController().signal;
    problemApi.getProblemList({ current: 1, size: 20 });
    problemApi.getProblemByNo("P1000", { signal });
    problemApi.getProblemById(42, { signal });

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/problem/list",
      method: "post",
      data: { current: 1, size: 20 },
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/problem/no/P1000",
      method: "get",
      signal,
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/problem/42",
      method: "get",
      signal,
      anonymousFallback: true,
    });
  });
});
