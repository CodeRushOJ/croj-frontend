import { toProblemJudgePayload } from "@/domain/judgeConfiguration";

const DRAFT_VERSION = 2;
const KEY_FAMILY_PREFIX = "croj:admin:judge-config:";
const KEY_PREFIX = `${KEY_FAMILY_PREFIX}v${DRAFT_VERSION}:`;

const positiveIdentifier = (value, label) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== String(value)) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return parsed;
};

export const judgeConfigurationDraftKey = ({
  userId,
  problemId,
  baseVersionId,
} = {}) => {
  const user = positiveIdentifier(userId, "userId");
  const problem = problemId === null || problemId === undefined || problemId === ""
    ? "new"
    : positiveIdentifier(problemId, "problemId");
  const version = baseVersionId === null || baseVersionId === undefined || baseVersionId === ""
    ? "new"
    : positiveIdentifier(baseVersionId, "baseVersionId");
  return `${KEY_PREFIX}user:${user}:problem:${problem}:version:${version}`;
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

export const saveJudgeConfigurationDraft = (context, configuration) => {
  const record = {
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    configuration: sanitize(configuration),
  };
  try {
    sessionStorage.setItem(judgeConfigurationDraftKey(context), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
};

export const loadJudgeConfigurationDraft = (context) => {
  const key = judgeConfigurationDraftKey(context);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
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
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Blocked storage is equivalent to no recoverable local draft.
    }
    return null;
  }
};

export const clearJudgeConfigurationDraft = (context) => {
  try {
    sessionStorage.removeItem(judgeConfigurationDraftKey(context));
  } catch {
    // A successful server write must not be reported as failed by storage cleanup.
  }
};

export const clearAllJudgeConfigurationDrafts = () => {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(KEY_FAMILY_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Session teardown remains successful when browser storage is unavailable.
  }
};
