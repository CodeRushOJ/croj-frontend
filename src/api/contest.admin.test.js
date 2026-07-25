import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("./request", () => ({ default: request }));

import { adminContestApi } from "./contest";

describe("administrator contest API", () => {
  beforeEach(() => request.mockReset());

  it("maps draft creation and updates to the backend DTO without inventing fields", () => {
    const draft = {
      title: "Weekly 42",
      descriptionMarkdown: "Practice",
      ruleType: "ACM",
      visibility: "PUBLIC",
      registrationOpensAt: "2026-08-01T00:00:00.000Z",
      registrationClosesAt: "2026-08-02T00:00:00.000Z",
      startsAt: "2026-08-02T01:00:00.000Z",
      freezeAt: "2026-08-02T02:00:00.000Z",
      endsAt: "2026-08-02T03:00:00.000Z",
    };
    const controller = new AbortController();

    adminContestApi.create(draft, { signal: controller.signal });
    adminContestApi.update(12, draft, { signal: controller.signal });

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/admin/contests",
      method: "post",
      data: draft,
      signal: controller.signal,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/admin/contests/12",
      method: "put",
      data: draft,
      signal: controller.signal,
    });
  });

  it("maps arrangement, publish and cancel to the only supported lifecycle endpoints", () => {
    const problems = [
      { problemId: 4, problemVersionId: 9, label: "A", score: 100 },
    ];

    adminContestApi.arrangeProblems(12, problems);
    adminContestApi.publish(12);
    adminContestApi.cancel(12);

    expect(request).toHaveBeenNthCalledWith(1, {
      url: "/v1/admin/contests/12/problems",
      method: "put",
      data: { problems },
      signal: undefined,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: "/v1/admin/contests/12/publish",
      method: "post",
      signal: undefined,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      url: "/v1/admin/contests/12",
      method: "delete",
      signal: undefined,
    });
  });
});
