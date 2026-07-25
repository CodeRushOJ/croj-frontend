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

export const configurationForProblemEditor = (draftContext, problem) => (
  loadJudgeConfigurationDraft(draftContext)
  || judgeConfigurationFromProblem({
    ...problem,
    // The public problem adapter is not an authorized checker-source boundary.
    specialJudgeCode: "",
  })
);

const sameIdentifier = (left, right) => String(left) === String(right);

export const loadProblemJudgeEditorState = async ({
  userId,
  problemId,
  problem,
  listVersions,
  loadVersionSource,
}) => {
  let selected = null;
  if (problemId !== null && problemId !== undefined) {
    const versionsResponse = await listVersions(problemId);
    const versions = versionsResponse?.data;
    if (!Array.isArray(versions)) {
      throw new JudgeConfigurationContractError("管理员题目版本响应无效。");
    }
    selected = versions.find(({ state }) => state === "DRAFT")
      || versions.find(({ state }) => state === "PUBLISHED")
      || null;
  }
  const draftContext = {
    userId,
    problemId,
    baseVersionId: selected?.versionId ?? null,
  };
  const configuration = configurationForProblemEditor(draftContext, problem);
  if (
    configuration.checker !== CHECKERS.SPECIAL
    || configuration.specialJudgeCode.trim()
    || !selected
  ) {
    return { configuration, draftContext };
  }

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
    draftContext,
    configuration: {
      ...configuration,
      judgeMode: source.judgeMode,
      specialJudgeLanguage: source.checkerLanguage,
      specialJudgeCode: source.checkerSource,
    },
  };
};

export const loadProblemJudgeConfiguration = async (options) => (
  (await loadProblemJudgeEditorState(options)).configuration
);

export const persistProblemJudgeDraft = (draftContext, configuration) => (
  saveJudgeConfigurationDraft(draftContext, configuration)
);

export const submitProblemJudgeDraft = async ({
  draftContext,
  problem,
  write,
}) => {
  const payload = toProblemJudgePayload(problem);
  // Draft persistence is recovery only. Browser storage must never gate the write.
  persistProblemJudgeDraft(draftContext, payload);
  const response = await write(payload);
  clearJudgeConfigurationDraft(draftContext);
  return response;
};
