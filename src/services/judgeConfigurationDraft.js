import { toProblemJudgePayload } from "@/domain/judgeConfiguration";

const DRAFT_VERSION = 1;
const KEY_PREFIX = `croj:admin:judge-config:v${DRAFT_VERSION}:`;

export const judgeConfigurationDraftKey = (problemId) => {
  if (problemId === null || problemId === undefined || problemId === "") {
    return `${KEY_PREFIX}new`;
  }
  const parsed = Number(problemId);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== String(problemId)) {
    throw new TypeError("problemId must be a positive integer");
  }
  return `${KEY_PREFIX}${parsed}`;
};

const sanitize = (configuration) => {
  const payload = toProblemJudgePayload(configuration);
  return {
    judgeMode: payload.judgeMode,
    checker: payload.checker,
    totalScore: payload.totalScore,
    specialJudgeLanguage: payload.specialJudgeLanguage,
    specialJudgeCode: payload.specialJudgeCode,
  };
};

export const saveJudgeConfigurationDraft = (problemId, configuration) => {
  const record = {
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    configuration: sanitize(configuration),
  };
  sessionStorage.setItem(judgeConfigurationDraftKey(problemId), JSON.stringify(record));
  return record.configuration;
};

export const loadJudgeConfigurationDraft = (problemId) => {
  const key = judgeConfigurationDraftKey(problemId);
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (
      !record
      || record.version !== DRAFT_VERSION
      || !record.configuration
      || typeof record.configuration !== "object"
    ) {
      throw new TypeError("unsupported judge configuration draft");
    }
    return sanitize(record.configuration);
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

export const clearJudgeConfigurationDraft = (problemId) => {
  sessionStorage.removeItem(judgeConfigurationDraftKey(problemId));
};
