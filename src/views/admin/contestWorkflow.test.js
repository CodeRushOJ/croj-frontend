import { describe, expect, it } from "vitest";

import {
  normalizeProblemArrangement,
  toLocalDateTimeInput,
  toContestPayload,
  validateContestDraft,
} from "./contestWorkflow";

const validDraft = () => ({
  title: " Weekly 42 ",
  descriptionMarkdown: "A real contest",
  ruleType: "ACM",
  visibility: "PUBLIC",
  registrationOpensAt: "2026-08-01T08:00",
  registrationClosesAt: "2026-08-01T09:00",
  startsAt: "2026-08-01T10:00",
  freezeAt: "2026-08-01T11:00",
  endsAt: "2026-08-01T12:00",
});

describe("contest draft validation", () => {
  it("maps browser-local date inputs to the exact backend DTO", () => {
    const draft = validDraft();

    expect(validateContestDraft(draft)).toBe("");
    expect(toContestPayload(draft)).toEqual({
      title: "Weekly 42",
      descriptionMarkdown: "A real contest",
      ruleType: "ACM",
      visibility: "PUBLIC",
      registrationOpensAt: new Date(draft.registrationOpensAt).toISOString(),
      registrationClosesAt: new Date(draft.registrationClosesAt).toISOString(),
      startsAt: new Date(draft.startsAt).toISOString(),
      freezeAt: new Date(draft.freezeAt).toISOString(),
      endsAt: new Date(draft.endsAt).toISOString(),
    });
  });

  it("round-trips server UTC instants through local datetime inputs without timezone drift", () => {
    const server = {
      registrationOpensAt: "2026-01-15T00:00:37.000Z",
      registrationClosesAt: "2026-01-15T01:00:12.000Z",
      startsAt: "2026-07-15T02:00:41.000Z",
      freezeAt: "2026-07-15T03:00:29.000Z",
      endsAt: "2026-07-15T04:00:53.000Z",
    };
    const draft = {
      title: "UTC-safe",
      descriptionMarkdown: "",
      ruleType: "ACM",
      visibility: "PUBLIC",
      ...Object.fromEntries(
        Object.entries(server).map(([field, value]) => [field, toLocalDateTimeInput(value)]),
      ),
    };

    expect(toContestPayload(draft)).toMatchObject(server);
    expect(toLocalDateTimeInput(null)).toBe("");
    expect(toLocalDateTimeInput("not-a-date")).toBe("");
  });

  it("preserves backend millisecond precision while editing a schedule", () => {
    const instant = "2026-08-01T01:02:03.456Z";
    const localInput = toLocalDateTimeInput(instant);

    expect(localInput).toMatch(/\.456$/);
    expect(new Date(localInput).toISOString()).toBe(instant);
  });

  it.each([
    ["registration closes before it opens", { registrationClosesAt: "2026-08-01T07:00" }],
    ["contest starts before registration closes", { startsAt: "2026-08-01T08:30" }],
    ["freeze is outside the contest", { freezeAt: "2026-08-01T13:00" }],
    ["contest ends before it starts", { endsAt: "2026-08-01T09:30" }],
  ])("rejects %s", (_label, patch) => {
    expect(validateContestDraft({ ...validDraft(), ...patch })).toMatch(/时间/);
  });

  it("allows the backend-supported zero-length registration window", () => {
    const draft = validDraft();

    expect(validateContestDraft({
      ...draft,
      registrationClosesAt: draft.registrationOpensAt,
    })).toBe("");
  });

  it("rejects rule and visibility values not supported by the backend", () => {
    expect(validateContestDraft({ ...validDraft(), ruleType: "IOI" })).toMatch(/赛制/);
    expect(validateContestDraft({ ...validDraft(), visibility: "UNLISTED" })).toMatch(/可见性/);
  });
});

describe("contest problem arrangement", () => {
  it("normalizes labels and numeric fields without exposing bundle metadata", () => {
    expect(normalizeProblemArrangement([
      {
        problemId: "4",
        problemVersionId: "9",
        label: " a ",
        score: "100",
        sha256: "must-not-leak",
      },
    ])).toEqual([
      { problemId: 4, problemVersionId: 9, label: "A", score: 100 },
    ]);
  });

  it("rejects duplicate problem ids and labels before mutation", () => {
    expect(() => normalizeProblemArrangement([
      { problemId: 4, problemVersionId: 9, label: "A", score: 100 },
      { problemId: 4, problemVersionId: 10, label: "B", score: 100 },
    ])).toThrow(/题目/);
    expect(() => normalizeProblemArrangement([
      { problemId: 4, problemVersionId: 9, label: "a", score: 100 },
      { problemId: 5, problemVersionId: 11, label: "A", score: 100 },
    ])).toThrow(/标签/);
  });

  it("enforces the backend label, score, and roster bounds", () => {
    expect(() => normalizeProblemArrangement([
      { problemId: 4, problemVersionId: 9, label: "ABCDEFGHIJKLMNOPQ", score: 100 },
    ])).toThrow(/标签/);
    expect(() => normalizeProblemArrangement([
      { problemId: 4, problemVersionId: 9, label: "A", score: 1.5 },
    ])).toThrow(/分值/);
    expect(() => normalizeProblemArrangement(
      Array.from({ length: 101 }, (_, index) => ({
        problemId: index + 1,
        problemVersionId: index + 101,
        label: `P${index + 1}`,
        score: 100,
      })),
    )).toThrow(/100/);
  });
});
