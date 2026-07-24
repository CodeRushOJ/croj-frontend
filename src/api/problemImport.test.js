import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({ default: vi.fn() }));

import request from "./request";
import { problemImportApi } from "./problemImport";

describe("problem import API contract", () => {
  beforeEach(() => request.mockReset());

  it("uploads a package for server-side preflight validation", () => {
    const file = new File(["<fps></fps>"], "problems.xml", {
      type: "application/xml",
    });

    problemImportApi.preflight(file);

    expect(request).toHaveBeenCalledTimes(1);
    const config = request.mock.calls[0][0];
    expect(config).toMatchObject({
      url: "/v1/admin/problem-imports/preflight",
      method: "post",
    });
    expect(config.data).toBeInstanceOf(FormData);
    expect(config.data.get("file")).toBe(file);
    expect(config.headers).toEqual({ "Content-Type": "multipart/form-data" });
    expect(config.timeout).toBe(5 * 60 * 1000);
  });

  it("commits an already validated import job", () => {
    const signal = new AbortController().signal;
    problemImportApi.commit("job-42", { signal });

    expect(request).toHaveBeenCalledWith({
      url: "/v1/admin/problem-imports/job-42/commit",
      method: "post",
      signal,
      timeout: 5 * 60 * 1000,
    });
  });
});
