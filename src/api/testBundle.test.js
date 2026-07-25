import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("./request", () => ({ default: request }));

import { adminTestBundleApi, TEST_BUNDLE_UPLOAD_TIMEOUT_MS } from "./testBundle";

const manifestV2 = {
  schemaVersion: 2,
  judgeMode: "OI",
  checker: "exact",
  limits: { timeLimitMillis: 1000, memoryLimitMiB: 64 },
  totalScore: 100,
  cases: [
    { id: "a", input: "cases/a.in", output: "cases/a.out", weight: 30 },
    { id: "b", input: "cases/b.in", output: "cases/b.out", weight: 70 },
  ],
};

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

  it("loads special-judge source only through the administrator version endpoint", async () => {
    request.mockResolvedValue({
      data: {
        problemId: 4,
        versionId: 9,
        versionNo: 2,
        state: "DRAFT",
        specialJudge: true,
        checkerSource: "int main() {}",
        checkerLanguage: "cpp",
        judgeMode: 0,
      },
    });

    await expect(adminTestBundleApi.loadVersionSource(4, 9)).resolves.toMatchObject({
      data: {
        problemId: 4,
        versionId: 9,
        checkerSource: "int main() {}",
      },
    });
    expect(request).toHaveBeenCalledWith({
      url: "/v1/admin/problems/4/versions/9/source",
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
      data: { attached: true, sha256: "abc", manifest: JSON.stringify(manifestV2) },
      headers: { etag: '"tb-v1-9-DRAFT-abc"' },
    });

    await expect(adminTestBundleApi.upload(4, 9, file, '"old"', {
      signal: controller.signal,
    })).resolves.toEqual({
      data: {
        attached: true,
        sha256: "abc",
        manifestPreview: {
          schemaVersion: 2,
          judgeMode: "OI",
          checker: "exact",
          limits: { timeLimitMillis: 1000, memoryLimitMiB: 64 },
          totalScore: 100,
          specialJudge: null,
          cases: [{ id: "a", weight: 30 }, { id: "b", weight: 70 }],
        },
      },
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
      data: { state: "PUBLISHED", attached: true, manifestPreview: manifestV2 },
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

  it("normalizes an administrator-only special checker preview without source text", async () => {
    request.mockResolvedValue({
      data: {
        state: "DRAFT",
        attached: true,
        manifest: {
          schemaVersion: 2,
          judgeMode: "ACM",
          checker: "special",
          limits: { timeLimitMillis: 1000, memoryLimitMiB: 64 },
          specialJudge: {
            language: "go",
            source: "checker/main.go",
            sourceSha256: "b".repeat(64),
            timeLimitMillis: 1500,
            memoryLimitMiB: 128,
            sourceCode: "private source",
          },
          cases: [{ id: "1", input: "cases/1.in", output: "cases/1.out", weight: 1 }],
        },
      },
      headers: { etag: '"draft"' },
    });

    const response = await adminTestBundleApi.describe(4, 9);

    expect(response.data.manifest).toBeUndefined();
    expect(response.data.manifestPreview.specialJudge).toMatchObject({
      language: "go",
      source: "checker/main.go",
      timeLimitMillis: 1500,
      memoryLimitMiB: 128,
    });
    expect(JSON.stringify(response)).not.toContain("private source");
  });

  it("rejects an attached bundle when the server preview violates the contract", async () => {
    request.mockResolvedValue({
      data: {
        state: "DRAFT",
        attached: true,
        manifest: { ...manifestV2, totalScore: 99 },
      },
      headers: { etag: '"draft"' },
    });

    await expect(adminTestBundleApi.describe(4, 9)).rejects.toThrow("sum");
  });
});
