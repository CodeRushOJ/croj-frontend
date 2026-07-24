import request from "./request";

export const PROBLEM_IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

export const problemImportApi = {
  preflight(file, { signal } = {}) {
    const data = new FormData();
    data.append("file", file);

    return request({
      url: "/v1/admin/problem-imports/preflight",
      method: "post",
      data,
      // Override the request client's JSON default during transform. Axios' browser
      // adapter clears this value and lets the browser append the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      timeout: PROBLEM_IMPORT_TIMEOUT_MS,
    });
  },

  commit(jobId, { signal } = {}) {
    return request({
      url: `/v1/admin/problem-imports/${encodeURIComponent(jobId)}/commit`,
      method: "post",
      signal,
      timeout: PROBLEM_IMPORT_TIMEOUT_MS,
    });
  },
};

export default problemImportApi;
