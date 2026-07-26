import request from "./request";

const versionHeaders = (version) => ({ "If-Match": `"${version}"` });

export const announcementApi = {
  list: (params) => request({
    url: "/v1/announcements",
    method: "get",
    params,
    anonymousFallback: true,
  }),
  current: (limit = 1) => request({
    url: "/v1/announcements/current",
    method: "get",
    params: { limit },
    anonymousFallback: true,
  }),
  detail: (announcementId) => request({
    url: `/v1/announcements/${announcementId}`,
    method: "get",
    anonymousFallback: true,
  }),
};

export const adminAnnouncementApi = {
  list: (params) => request({ url: "/v1/admin/announcements", method: "get", params }),
  create: (data) => request({ url: "/v1/admin/announcements", method: "post", data }),
  update: (announcementId, version, data) => request({
    url: `/v1/admin/announcements/${announcementId}`,
    method: "put",
    headers: versionHeaders(version),
    data,
  }),
  schedule: (announcementId, version, data) => request({
    url: `/v1/admin/announcements/${announcementId}/schedule`,
    method: "post",
    headers: versionHeaders(version),
    data,
  }),
  publish: (announcementId, version, data) => request({
    url: `/v1/admin/announcements/${announcementId}/publish`,
    method: "post",
    headers: versionHeaders(version),
    data,
  }),
  withdraw: (announcementId, version) => request({
    url: `/v1/admin/announcements/${announcementId}/withdraw`,
    method: "post",
    headers: versionHeaders(version),
  }),
  archive: (announcementId, version) => request({
    url: `/v1/admin/announcements/${announcementId}/archive`,
    method: "post",
    headers: versionHeaders(version),
  }),
};

const httpStatus = (error) => error?.response?.status;

export const isAnnouncementConflict = (error) => httpStatus(error) === 409;
export const isAnnouncementForbidden = (error) => httpStatus(error) === 403;
