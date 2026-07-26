import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({ default: vi.fn() }));

import request from "./request";
import { tagApi } from "./tag";

describe("public tag API contract", () => {
  beforeEach(() => request.mockReset());

  it("allows the public problem catalogue to retry tag discovery anonymously", () => {
    tagApi.getAllTags();

    expect(request).toHaveBeenCalledWith({
      url: "/problem/tag/all",
      method: "get",
      anonymousFallback: true,
    });
  });
});
