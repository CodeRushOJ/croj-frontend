import request from "./request";

export const TEST_BUNDLE_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

const pathFor = (problemId, versionId) => (
  `/v1/admin/problems/${encodeURIComponent(problemId)}/versions/${encodeURIComponent(versionId)}/test-bundle`
);

const withEtag = (response) => ({
  data: response?.data,
  etag: response?.headers?.etag || response?.headers?.ETag || "",
});

export const adminTestBundleApi = {
  listVersions(problemId) {
    return request({
      url: `/v1/admin/problems/${encodeURIComponent(problemId)}/versions`,
      method: "get",
    });
  },

  describe(problemId, versionId) {
    return request({
      url: pathFor(problemId, versionId),
      method: "get",
      includeResponseHeaders: true,
    }).then(withEtag);
  },

  upload(problemId, versionId, file, etag, { signal } = {}) {
    const data = new FormData();
    data.append("file", file);
    return request({
      url: pathFor(problemId, versionId),
      method: "put",
      data,
      headers: {
        "Content-Type": "multipart/form-data",
        "If-Match": etag,
      },
      signal,
      timeout: TEST_BUNDLE_UPLOAD_TIMEOUT_MS,
      includeResponseHeaders: true,
    }).then(withEtag);
  },

  publish(problemId, versionId, etag) {
    return request({
      url: `${pathFor(problemId, versionId)}/publish`,
      method: "post",
      headers: { "If-Match": etag },
      includeResponseHeaders: true,
    }).then(withEtag);
  },
};

export default adminTestBundleApi;
