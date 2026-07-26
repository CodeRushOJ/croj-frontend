import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({ default: vi.fn() }));

import request from "./request";
import {
  adminAnnouncementApi,
  announcementApi,
  isAnnouncementConflict,
  isAnnouncementForbidden,
} from "./announcement";

describe("announcement API contract", () => {
  beforeEach(() => request.mockReset());

  it("reads the public announcement surfaces", () => {
    announcementApi.list({ page: 2, size: 20 });
    announcementApi.current(1);
    announcementApi.detail(42);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/announcements",
      method: "get",
      params: { page: 2, size: 20 },
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/announcements/current",
      method: "get",
      params: { limit: 1 },
      anonymousFallback: true,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/v1/announcements/42",
      method: "get",
      anonymousFallback: true,
    });
  });

  it("maps draft fields without changing the backend DTO", () => {
    const draft = {
      title: "维护通知",
      contentMarkdown: "滚动升级",
      pinned: true,
      pinOrder: 3,
    };

    adminAnnouncementApi.list({ page: 1, size: 12, status: "DRAFT" });
    adminAnnouncementApi.create(draft);
    adminAnnouncementApi.update(9, 7, draft);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/admin/announcements",
      method: "get",
      params: { page: 1, size: 12, status: "DRAFT" },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/admin/announcements",
      method: "post",
      data: draft,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/v1/admin/announcements/9",
      method: "put",
      headers: { "If-Match": '"7"' },
      data: draft,
    });
  });

  it("carries the exact version through every lifecycle transition", () => {
    adminAnnouncementApi.schedule(9, 7, {
      publishAt: "2026-07-20T02:00:00.000Z",
      expiresAt: "2026-07-21T02:00:00.000Z",
    });
    adminAnnouncementApi.publish(9, 8, { expiresAt: null });
    adminAnnouncementApi.withdraw(9, 9);
    adminAnnouncementApi.archive(9, 10);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/admin/announcements/9/schedule",
      method: "post",
      headers: { "If-Match": '"7"' },
      data: {
        publishAt: "2026-07-20T02:00:00.000Z",
        expiresAt: "2026-07-21T02:00:00.000Z",
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/admin/announcements/9/publish",
      method: "post",
      headers: { "If-Match": '"8"' },
      data: { expiresAt: null },
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/v1/admin/announcements/9/withdraw",
      method: "post",
      headers: { "If-Match": '"9"' },
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      url: "/v1/admin/announcements/9/archive",
      method: "post",
      headers: { "If-Match": '"10"' },
    });
  });

  it("recognizes permission and optimistic-lock failures", () => {
    expect(isAnnouncementForbidden({ response: { status: 403 } })).toBe(true);
    expect(isAnnouncementConflict({ response: { status: 409 } })).toBe(true);
    expect(isAnnouncementConflict({ response: { status: 422 } })).toBe(false);
  });
});
