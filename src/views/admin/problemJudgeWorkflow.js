import {
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
