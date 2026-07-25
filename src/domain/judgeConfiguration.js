export const JUDGE_MODES = Object.freeze({
  ACM: 0,
  OI: 1,
});

export const CHECKERS = Object.freeze({
  EXACT: "exact",
  TOKEN: "token",
  SPECIAL: "special",
});

export const CHECKER_LANGUAGES = Object.freeze([
  "go",
  "cpp",
  "python",
  "java",
  "javascript",
]);

const CHECKER_VALUES = Object.freeze(Object.values(CHECKERS));
const MODE_VALUES = Object.freeze(Object.values(JUDGE_MODES));
const CASE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_SCORE = 1_000_000_000;
const MAX_CASES = 256;

export class JudgeConfigurationContractError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "JudgeConfigurationContractError";
    this.issues = issues;
  }
}

export const defaultJudgeConfiguration = () => ({
  judgeMode: JUDGE_MODES.ACM,
  checker: CHECKERS.EXACT,
  totalScore: null,
  specialJudgeLanguage: "cpp",
  specialJudgeCode: "",
});

const positiveInteger = (value, maximum = Number.MAX_SAFE_INTEGER) => (
  Number.isSafeInteger(value) && value > 0 && value <= maximum
);

const issue = (field, message) => ({ field, message });

export const judgeConfigurationFromProblem = (problem = {}) => {
  const special = problem.checker === CHECKERS.SPECIAL || problem.isSpecialJudge === true;
  const checker = CHECKER_VALUES.includes(problem.checker)
    ? problem.checker
    : special
      ? CHECKERS.SPECIAL
      : CHECKERS.EXACT;
  const judgeMode = MODE_VALUES.includes(problem.judgeMode)
    ? problem.judgeMode
    : JUDGE_MODES.ACM;

  return {
    judgeMode,
    checker,
    totalScore: judgeMode === JUDGE_MODES.OI
      ? (positiveInteger(problem.totalScore, MAX_SCORE) ? problem.totalScore : 100)
      : null,
    specialJudgeLanguage: CHECKER_LANGUAGES.includes(problem.specialJudgeLanguage)
      ? problem.specialJudgeLanguage
      : "cpp",
    specialJudgeCode: typeof problem.specialJudgeCode === "string"
      ? problem.specialJudgeCode
      : "",
  };
};

export const validateJudgeConfiguration = (value = {}) => {
  const issues = [];
  if (!MODE_VALUES.includes(value.judgeMode)) {
    issues.push(issue("judgeMode", "判题模式必须是 ACM 或 OI。"));
  }
  if (!CHECKER_VALUES.includes(value.checker)) {
    issues.push(issue("checker", "输出校验器必须是 exact、token 或 special。"));
  }
  if (value.judgeMode === JUDGE_MODES.OI && !positiveInteger(value.totalScore, MAX_SCORE)) {
    issues.push(issue("totalScore", "OI 总分必须是正整数。"));
  }
  if (value.checker === CHECKERS.SPECIAL) {
    if (!CHECKER_LANGUAGES.includes(value.specialJudgeLanguage)) {
      issues.push(issue("specialJudgeLanguage", "特殊判题语言不受当前 Sandbox 支持。"));
    }
    if (typeof value.specialJudgeCode !== "string" || !value.specialJudgeCode.trim()) {
      issues.push(issue("specialJudgeCode", "特殊判题源码不能为空。"));
    }
  }
  return issues;
};

export const toProblemJudgePayload = (problem = {}) => {
  const configuration = {
    judgeMode: problem.judgeMode,
    checker: problem.checker,
    totalScore: problem.totalScore,
    specialJudgeLanguage: problem.specialJudgeLanguage,
    specialJudgeCode: problem.specialJudgeCode,
  };
  const issues = validateJudgeConfiguration(configuration);
  if (issues.length) {
    throw new JudgeConfigurationContractError("判题配置未通过校验。", issues);
  }
  const special = configuration.checker === CHECKERS.SPECIAL;
  return {
    ...problem,
    judgeMode: configuration.judgeMode,
    checker: configuration.checker,
    totalScore: configuration.judgeMode === JUDGE_MODES.OI
      ? configuration.totalScore
      : null,
    isSpecialJudge: special,
    specialJudgeLanguage: special ? configuration.specialJudgeLanguage : null,
    specialJudgeCode: special ? configuration.specialJudgeCode : null,
  };
};

const parseManifest = (input) => {
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      throw new JudgeConfigurationContractError("TestBundle manifest 不是有效 JSON。");
    }
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new JudgeConfigurationContractError("TestBundle manifest 必须是 JSON 对象。");
  }
  return input;
};

const assert = (condition, message) => {
  if (!condition) throw new JudgeConfigurationContractError(message);
};

const safeArchivePath = (value, prefix) => (
  typeof value === "string"
  && value.startsWith(prefix)
  && !value.startsWith("/")
  && !value.includes("\\")
  && !value.split("/").includes("..")
  && !value.includes("\0")
);

const normalizeLimits = (limits, label = "limits") => {
  assert(limits && typeof limits === "object" && !Array.isArray(limits), `${label} 缺失。`);
  assert(positiveInteger(limits.timeLimitMillis), `${label}.timeLimitMillis 必须是正整数。`);
  assert(positiveInteger(limits.memoryLimitMiB), `${label}.memoryLimitMiB 必须是正整数。`);
  return {
    timeLimitMillis: limits.timeLimitMillis,
    memoryLimitMiB: limits.memoryLimitMiB,
  };
};

const normalizeSpecialJudge = (value) => {
  assert(value && typeof value === "object" && !Array.isArray(value), "specialJudge 缺失。");
  assert(CHECKER_LANGUAGES.includes(value.language), "specialJudge.language 不受支持。");
  assert(safeArchivePath(value.source, "checker/"), "specialJudge.source 必须是 checker/ 下的安全路径。");
  assert(SHA256.test(value.sourceSha256), "specialJudge.sourceSha256 必须是小写 SHA-256。");
  const limits = normalizeLimits(value, "specialJudge");
  return {
    language: value.language,
    source: value.source,
    sourceSha256: value.sourceSha256,
    ...limits,
  };
};

export const normalizeManifestPreview = (input) => {
  const manifest = parseManifest(input);
  assert(manifest.schemaVersion === 1 || manifest.schemaVersion === 2, "不支持的 manifest schemaVersion。");
  assert(manifest.judgeMode === "ACM" || manifest.judgeMode === "OI", "不支持的 manifest judgeMode。");
  assert(CHECKER_VALUES.includes(manifest.checker), "不支持的 manifest checker。");
  if (manifest.schemaVersion === 1) {
    assert(manifest.judgeMode === "ACM", "manifest v1 只支持 ACM。");
    assert(manifest.checker !== CHECKERS.SPECIAL, "manifest v1 不支持 special checker。");
  }
  const limits = normalizeLimits(manifest.limits);
  assert(Array.isArray(manifest.cases) && manifest.cases.length > 0, "manifest cases 不能为空。");
  assert(manifest.cases.length <= MAX_CASES, "manifest cases 超过平台上限。");

  const ids = new Set();
  let weightSum = 0;
  const cases = manifest.cases.map((testCase) => {
    assert(testCase && typeof testCase === "object", "manifest case 必须是对象。");
    assert(CASE_ID.test(testCase.id), "manifest case id 无效。");
    assert(!ids.has(testCase.id), "manifest case id 必须唯一。");
    ids.add(testCase.id);
    assert(safeArchivePath(testCase.input, "cases/"), "manifest case input 路径无效。");
    assert(safeArchivePath(testCase.output, "cases/"), "manifest case output 路径无效。");
    assert(positiveInteger(testCase.weight, MAX_SCORE), "manifest case weight 必须是正整数。");
    if (manifest.judgeMode === "ACM") {
      assert(testCase.weight === 1, "ACM case weight 必须为 1。");
    }
    weightSum += testCase.weight;
    assert(Number.isSafeInteger(weightSum) && weightSum <= MAX_SCORE, "manifest case weight 总和超限。");
    return { id: testCase.id, weight: testCase.weight };
  });

  let totalScore = null;
  if (manifest.judgeMode === "OI") {
    assert(positiveInteger(manifest.totalScore, MAX_SCORE), "OI totalScore 必须是正整数。");
    assert(manifest.totalScore === weightSum, "OI totalScore 必须等于 case weight sum。");
    totalScore = manifest.totalScore;
  } else {
    assert(manifest.totalScore === undefined || manifest.totalScore === null, "ACM manifest 不允许 totalScore。");
  }

  let specialJudge = null;
  if (manifest.checker === CHECKERS.SPECIAL) {
    assert(manifest.schemaVersion === 2, "special checker 需要 manifest v2。");
    specialJudge = normalizeSpecialJudge(manifest.specialJudge);
  } else {
    assert(manifest.specialJudge === undefined || manifest.specialJudge === null, "非 special checker 不允许 specialJudge。");
  }

  return {
    schemaVersion: manifest.schemaVersion,
    judgeMode: manifest.judgeMode,
    checker: manifest.checker,
    limits,
    totalScore,
    specialJudge,
    cases,
  };
};
