const prefix = "croj:submission-draft:";

export const withSubmissionTab = (fullPath, tab) => {
  const target = new URL(fullPath, "https://coderushoj.invalid");
  target.searchParams.set("tab", tab);
  return `${target.pathname}${target.search}${target.hash}`;
};

const keyFor = ({ contestId, problemId } = {}) => {
  const numericProblemId = Number(problemId);
  if (!Number.isSafeInteger(numericProblemId) || numericProblemId <= 0) return "";

  const numericContestId = Number(contestId);
  if (Number.isSafeInteger(numericContestId) && numericContestId > 0) {
    return `${prefix}contest:${numericContestId}:problem:${numericProblemId}`;
  }
  return `${prefix}problem:${numericProblemId}`;
};

export const saveSubmissionDraft = (context, draft) => {
  const key = keyFor(context);
  if (!key || typeof draft?.code !== "string" || typeof draft?.language !== "string") return false;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      language: draft.language,
      code: draft.code,
    }));
    return true;
  } catch {
    return false;
  }
};

export const getSubmissionDraft = (context) => {
  const key = keyFor(context);
  if (!key) return null;
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (typeof parsed?.code !== "string" || typeof parsed?.language !== "string") return null;
    return { language: parsed.language, code: parsed.code };
  } catch {
    return null;
  }
};

export const clearSubmissionDraft = (context) => {
  const key = keyFor(context);
  if (!key) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // A successful submission must not be reported as failed because storage is blocked.
  }
};
