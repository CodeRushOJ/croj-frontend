const REQUIRED_TIMES = [
  "registrationOpensAt",
  "registrationClosesAt",
  "startsAt",
  "endsAt",
];

const asTime = (value) => {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
};

export const toLocalDateTimeInput = (value) => {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 23);
};

export const validateContestDraft = (draft) => {
  if (!draft.title?.trim()) return "请输入比赛标题";
  if (!["ACM", "OI"].includes(draft.ruleType)) return "请选择后端支持的赛制";
  if (!["PUBLIC", "PRIVATE"].includes(draft.visibility)) return "请选择后端支持的可见性";

  if (REQUIRED_TIMES.some((field) => !Number.isFinite(asTime(draft[field])))) {
    return "请填写完整且有效的比赛时间";
  }

  const opensAt = asTime(draft.registrationOpensAt);
  const closesAt = asTime(draft.registrationClosesAt);
  const startsAt = asTime(draft.startsAt);
  const endsAt = asTime(draft.endsAt);
  const freezeAt = draft.freezeAt ? asTime(draft.freezeAt) : null;

  if (
    opensAt > closesAt
    || closesAt > startsAt
    || startsAt >= endsAt
    || (freezeAt !== null && (!Number.isFinite(freezeAt) || freezeAt <= startsAt || freezeAt >= endsAt))
  ) {
    return "比赛时间顺序不合法";
  }

  return "";
};

export const toContestPayload = (draft) => ({
  title: draft.title.trim(),
  descriptionMarkdown: draft.descriptionMarkdown || "",
  ruleType: draft.ruleType,
  visibility: draft.visibility,
  registrationOpensAt: new Date(draft.registrationOpensAt).toISOString(),
  registrationClosesAt: new Date(draft.registrationClosesAt).toISOString(),
  startsAt: new Date(draft.startsAt).toISOString(),
  freezeAt: draft.freezeAt ? new Date(draft.freezeAt).toISOString() : null,
  endsAt: new Date(draft.endsAt).toISOString(),
});

export const normalizeProblemArrangement = (problems) => {
  if (!Array.isArray(problems) || problems.length > 100) {
    throw new Error("一场比赛最多编排 100 道题目");
  }

  const normalized = problems.map((problem) => ({
    problemId: Number(problem.problemId),
    problemVersionId: Number(problem.problemVersionId),
    label: String(problem.label || "").trim().toUpperCase(),
    score: Number(problem.score),
  }));

  normalized.forEach((problem) => {
    if (!Number.isInteger(problem.problemId) || problem.problemId <= 0) {
      throw new Error("题目 ID 无效");
    }
    if (!Number.isInteger(problem.problemVersionId) || problem.problemVersionId <= 0) {
      throw new Error("题目版本无效");
    }
    if (!problem.label || problem.label.length > 16) {
      throw new Error("题目标签必须为 1 到 16 个字符");
    }
    if (!Number.isInteger(problem.score) || problem.score <= 0 || problem.score > 10000) {
      throw new Error("题目分值无效");
    }
  });

  if (new Set(normalized.map(({ problemId }) => problemId)).size !== normalized.length) {
    throw new Error("同一道题目不能重复添加");
  }
  if (new Set(normalized.map(({ label }) => label)).size !== normalized.length) {
    throw new Error("题目标签不能重复");
  }

  return normalized;
};
