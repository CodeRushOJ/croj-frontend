import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("./request", () => ({ default: request }));

import { adminTestBundleApi, TEST_BUNDLE_UPLOAD_TIMEOUT_MS } from "./testBundle";

describe("adminTestBundleApi", () => {
  beforeEach(() => request.mockReset());

  it("lists discoverable versions for an administrator-selected problem", async () => {
    request.mockResolvedValue({
      data: [
        { versionId: 9, versionNo: 2, state: "DRAFT", attached: false, etag: '"draft"' },
        { versionId: 8, versionNo: 1, state: "PUBLISHED", attached: true, etag: '"published"' },
      ],
    });

    await expect(adminTestBundleApi.listVersions(4)).resolves.toEqual({
      data: [
        { versionId: 9, versionNo: 2, state: "DRAFT", attached: false, etag: '"draft"' },
        { versionId: 8, versionNo: 1, state: "PUBLISHED", attached: true, etag: '"published"' },
      ],
    });
    expect(request).toHaveBeenCalledWith({
      url: "/v1/admin/problems/4/versions",
      method: "get",
    });
  });

  it("loads metadata and exposes the strong response ETag", async () => {
    request.mockResolvedValue({
      data: { state: "DRAFT", attached: false },
      headers: { etag: '"tb-v1-9-DRAFT-none"' },
    });

    await expect(adminTestBundleApi.describe(4, 9)).resolves.toEqual({
      data: { state: "DRAFT", attached: false },
      etag: '"tb-v1-9-DRAFT-none"',
    });
    expect(request).toHaveBeenCalledWith({
      url: "/v1/admin/problems/4/versions/9/test-bundle",
      method: "get",
      includeResponseHeaders: true,
    });
  });

  it("uploads multipart data with the current ETag, signal and long deadline", async () => {
    const file = new File(["zip"], "bundle.zip", { type: "application/zip" });
    const controller = new AbortController();
    request.mockResolvedValue({
      data: { attached: true, sha256: "abc" },
      headers: { etag: '"tb-v1-9-DRAFT-abc"' },
    });

    await expect(adminTestBundleApi.upload(4, 9, file, '"old"', {
      signal: controller.signal,
    })).resolves.toEqual({
      data: { attached: true, sha256: "abc" },
      etag: '"tb-v1-9-DRAFT-abc"',
    });

    const config = request.mock.calls[0][0];
    expect(config).toMatchObject({
      url: "/v1/admin/problems/4/versions/9/test-bundle",
      method: "put",
      headers: {
        "Content-Type": "multipart/form-data",
        "If-Match": '"old"',
      },
      signal: controller.signal,
      timeout: TEST_BUNDLE_UPLOAD_TIMEOUT_MS,
      includeResponseHeaders: true,
    });
    expect(config.data).toBeInstanceOf(FormData);
    expect(config.data.get("file")).toBe(file);
  });

  it("publishes with the ETag returned after upload", async () => {
    request.mockResolvedValue({
      data: { state: "PUBLISHED", attached: true },
      headers: { etag: '"tb-v1-9-PUBLISHED-abc"' },
    });

    await adminTestBundleApi.publish(4, 9, '"tb-v1-9-DRAFT-abc"');

    expect(request).toHaveBeenCalledWith({
      url: "/v1/admin/problems/4/versions/9/test-bundle/publish",
      method: "post",
      headers: { "If-Match": '"tb-v1-9-DRAFT-abc"' },
      includeResponseHeaders: true,
    });
  });
});
