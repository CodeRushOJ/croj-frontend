import {
  CHECKERS,
  CHECKER_LANGUAGES,
  JudgeConfigurationContractError,
  judgeConfigurationFromProblem,
  toProblemJudgePayload,
} from "@/domain/judgeConfiguration";
import {
  clearJudgeConfigurationDraft,
  loadJudgeConfigurationDraft,
  saveJudgeConfigurationDraft,
} from "@/services/judgeConfigurationDraft";

export const configurationForProblemEditor = (problemId, problem) => (
  loadJudgeConfigurationDraft(problemId)
  || judgeConfigurationFromProblem({
    ...problem,
    // The public problem adapter is not an authorized checker-source boundary.
    specialJudgeCode: "",
  })
);

const sameIdentifier = (left, right) => String(left) === String(right);

export const loadProblemJudgeConfiguration = async ({
  problemId,
  problem,
  listVersions,
  loadVersionSource,
}) => {
  const configuration = configurationForProblemEditor(problemId, problem);
  if (
    configuration.checker !== CHECKERS.SPECIAL
    || configuration.specialJudgeCode.trim()
  ) {
    return configuration;
  }

  const versionsResponse = await listVersions(problemId);
  const versions = versionsResponse?.data;
  if (!Array.isArray(versions)) {
    throw new JudgeConfigurationContractError("管理员题目版本响应无效。");
  }
  const selected = versions.find(({ state }) => state === "DRAFT")
    || versions.find(({ state }) => state === "PUBLISHED");
  if (!selected) return configuration;

  const sourceResponse = await loadVersionSource(problemId, selected.versionId);
  const source = sourceResponse?.data;
  if (
    !source
    || !sameIdentifier(source.problemId, problemId)
    || !sameIdentifier(source.versionId, selected.versionId)
  ) {
    throw new JudgeConfigurationContractError("管理员 checker source version 响应不匹配。");
  }
  if (
    source.specialJudge !== true
    || typeof source.checkerSource !== "string"
    || !source.checkerSource.trim()
    || !CHECKER_LANGUAGES.includes(source.checkerLanguage)
  ) {
    throw new JudgeConfigurationContractError("管理员 checker source 响应缺少有效的 SPJ 源码。");
  }

  return {
    ...configuration,
    judgeMode: source.judgeMode,
    specialJudgeLanguage: source.checkerLanguage,
    specialJudgeCode: source.checkerSource,
  };
};

export const persistProblemJudgeDraft = (problemId, configuration) => (
  saveJudgeConfigurationDraft(problemId, configuration)
);

export const submitProblemJudgeDraft = async ({
  problemId,
  problem,
  write,
}) => {
  const payload = toProblemJudgePayload(problem);
  persistProblemJudgeDraft(problemId, payload);
  const response = await write(payload);
  clearJudgeConfigurationDraft(problemId);
  return response;
};
