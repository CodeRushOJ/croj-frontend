import { describe, expect, it } from "vitest";
import {
  CHECKERS,
  JUDGE_MODES,
  JudgeConfigurationContractError,
  defaultJudgeConfiguration,
  judgeConfigurationFromProblem,
  normalizeManifestPreview,
  toProblemJudgePayload,
  validateJudgeConfiguration,
} from "./judgeConfiguration";

describe("judge configuration domain", () => {
  it("maps ACM exact configuration without stale special-judge secrets", () => {
    expect(toProblemJudgePayload({
      title: "A + B",
      judgeMode: JUDGE_MODES.ACM,
      checker: CHECKERS.EXACT,
      totalScore: 900,
      specialJudgeLanguage: "cpp",
      specialJudgeCode: "secret",
    })).toEqual({
      title: "A + B",
      judgeMode: 0,
      checker: "exact",
      totalScore: null,
      isSpecialJudge: false,
      specialJudgeLanguage: null,
      specialJudgeCode: null,
    });
  });

  it("maps OI token configuration with its positive total score", () => {
    expect(toProblemJudgePayload({
      judgeMode: JUDGE_MODES.OI,
      checker: CHECKERS.TOKEN,
      totalScore: 100,
    })).toEqual({
      judgeMode: 1,
      checker: "token",
      totalScore: 100,
      isSpecialJudge: false,
      specialJudgeLanguage: null,
      specialJudgeCode: null,
    });
  });

  it("maps special checker source and canonical language independently of scoring mode", () => {
    expect(toProblemJudgePayload({
      judgeMode: JUDGE_MODES.OI,
      checker: CHECKERS.SPECIAL,
      totalScore: 120,
      specialJudgeLanguage: "go",
      specialJudgeCode: "package main",
    })).toEqual({
      judgeMode: 1,
      checker: "special",
      totalScore: 120,
      isSpecialJudge: true,
      specialJudgeLanguage: "go",
      specialJudgeCode: "package main",
    });
  });

  it.each([
    [{ judgeMode: 2, checker: "exact", totalScore: null }, "judgeMode"],
    [{ judgeMode: 1, checker: "exact", totalScore: 0 }, "totalScore"],
    [{ judgeMode: 0, checker: "custom", totalScore: null }, "checker"],
    [{
      judgeMode: 0,
      checker: "special",
      totalScore: null,
      specialJudgeLanguage: "ruby",
      specialJudgeCode: "puts 1",
    }, "specialJudgeLanguage"],
    [{
      judgeMode: 0,
      checker: "special",
      totalScore: null,
      specialJudgeLanguage: "cpp",
      specialJudgeCode: " ",
    }, "specialJudgeCode"],
  ])("rejects invalid writable configuration %o", (value, field) => {
    expect(validateJudgeConfiguration(value)).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
    expect(() => toProblemJudgePayload(value)).toThrow(JudgeConfigurationContractError);
  });

  it("normalizes missing legacy problem fields to safe ACM exact defaults", () => {
    expect(judgeConfigurationFromProblem({})).toEqual(defaultJudgeConfiguration());
  });
});

describe("immutable TestBundle manifest preview", () => {
  it("normalizes a legacy v1 JSON string", () => {
    const preview = normalizeManifestPreview(JSON.stringify({
      schemaVersion: 1,
      judgeMode: "ACM",
      checker: "token",
      limits: { timeLimitMillis: 1000, memoryLimitMiB: 64 },
      cases: [
        { id: "01", input: "cases/01.in", output: "cases/01.out", weight: 1 },
      ],
    }));

    expect(preview).toEqual({
      schemaVersion: 1,
      judgeMode: "ACM",
      checker: "token",
      limits: { timeLimitMillis: 1000, memoryLimitMiB: 64 },
      totalScore: null,
      specialJudge: null,
      cases: [{ id: "01", weight: 1 }],
    });
  });

  it("normalizes OI weights and special checker metadata without source text", () => {
    const preview = normalizeManifestPreview({
      schemaVersion: 2,
      judgeMode: "OI",
      checker: "special",
      limits: { timeLimitMillis: 1500, memoryLimitMiB: 256 },
      totalScore: 100,
      specialJudge: {
        language: "cpp",
        source: "checker/main.cpp",
        sourceSha256: "a".repeat(64),
        timeLimitMillis: 2000,
        memoryLimitMiB: 128,
        sourceCode: "must never cross the adapter",
      },
      cases: [
        { id: "subtask-a", input: "cases/a.in", output: "cases/a.out", weight: 30 },
        { id: "subtask-b", input: "cases/b.in", output: "cases/b.out", weight: 70 },
      ],
    });

    expect(preview).toEqual({
      schemaVersion: 2,
      judgeMode: "OI",
      checker: "special",
      limits: { timeLimitMillis: 1500, memoryLimitMiB: 256 },
      totalScore: 100,
      specialJudge: {
        language: "cpp",
        source: "checker/main.cpp",
        sourceSha256: "a".repeat(64),
        timeLimitMillis: 2000,
        memoryLimitMiB: 128,
      },
      cases: [
        { id: "subtask-a", weight: 30 },
        { id: "subtask-b", weight: 70 },
      ],
    });
    expect(JSON.stringify(preview)).not.toContain("must never cross");
  });

  it("accepts arbitrary safe relative archive paths and rejects duplicate file references", () => {
    const manifest = {
      schemaVersion: 2,
      judgeMode: "ACM",
      checker: "special",
      limits: { timeLimitMillis: 1000, memoryLimitMiB: 64 },
      specialJudge: {
        language: "cpp",
        source: "validators/check.cpp",
        sourceSha256: "a".repeat(64),
        timeLimitMillis: 1000,
        memoryLimitMiB: 64,
      },
      cases: [
        { id: "01", input: "input/01.txt", output: "expected/01.txt", weight: 1 },
      ],
    };

    expect(normalizeManifestPreview(manifest).specialJudge.source).toBe("validators/check.cpp");
    expect(() => normalizeManifestPreview({
      ...manifest,
      cases: [
        { id: "01", input: "input/01.txt", output: "input/01.txt", weight: 1 },
      ],
    })).toThrow("唯一");
  });

  it.each([
    [{ schemaVersion: 2, judgeMode: "OI", checker: "exact", limits: { timeLimitMillis: 1, memoryLimitMiB: 1 }, totalScore: 100, cases: [{ id: "a", input: "cases/a.in", output: "cases/a.out", weight: 90 }] }, "sum"],
    [{ schemaVersion: 2, judgeMode: "ACM", checker: "exact", limits: { timeLimitMillis: 1, memoryLimitMiB: 1 }, cases: [{ id: "a", input: "cases/a.in", output: "cases/a.out", weight: 2 }] }, "weight"],
    [{ schemaVersion: 2, judgeMode: "ACM", checker: "special", limits: { timeLimitMillis: 1, memoryLimitMiB: 1 }, cases: [{ id: "a", input: "cases/a.in", output: "cases/a.out", weight: 1 }] }, "specialJudge"],
    [{ schemaVersion: 2, judgeMode: "ACM", checker: "special", limits: { timeLimitMillis: 1, memoryLimitMiB: 1 }, specialJudge: { language: "cpp", source: "../checker.cpp", sourceSha256: "a".repeat(64), timeLimitMillis: 1, memoryLimitMiB: 1 }, cases: [{ id: "a", input: "cases/a.in", output: "cases/a.out", weight: 1 }] }, "source"],
    [{ schemaVersion: 2, judgeMode: "ACM", checker: "exact", limits: { timeLimitMillis: 1, memoryLimitMiB: 1 }, cases: [{ id: "a", input: "inputs//a.in", output: "outputs/a.out", weight: 1 }] }, "input"],
    [{ schemaVersion: 2, judgeMode: "ACM", checker: "exact", limits: { timeLimitMillis: 1, memoryLimitMiB: 1 }, cases: [{ id: "a", input: "manifest.json", output: "outputs/a.out", weight: 1 }] }, "input"],
    ["not-json", "JSON"],
  ])("fails closed for an invalid server preview", (manifest, message) => {
    expect(() => normalizeManifestPreview(manifest)).toThrow(message);
  });
});
