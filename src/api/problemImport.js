import request from "./request";

export const problemImportApi = {
  preflight(file) {
    const data = new FormData();
    data.append("file", file);

    return request({
      url: "/v1/admin/problem-imports/preflight",
      method: "post",
      data,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  commit(jobId) {
    return request({
      url: `/v1/admin/problem-imports/${encodeURIComponent(jobId)}/commit`,
      method: "post",
    });
  },
};

export default problemImportApi;
