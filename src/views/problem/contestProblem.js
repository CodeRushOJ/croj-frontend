import { sanitizeProblemStatement } from './problemStatement'

const positiveInteger = (value, field) => {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Contest problem ${field} must be a positive integer`)
  }
  return parsed
}

const parseSnapshot = (value, field) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error()
    }
    return parsed
  } catch {
    throw new Error(`Contest problem ${field} must be a JSON object`)
  }
}

export const normalizeContestProblem = (item, contestId) => {
  const problemId = positiveInteger(item?.problemId, 'problemId')
  const problemVersionId = positiveInteger(item?.problemVersionId, 'problemVersionId')
  const normalizedContestId = positiveInteger(contestId, 'contestId')
  const statement = parseSnapshot(item.statementJson, 'statementJson')
  const limits = parseSnapshot(item.limitsJson, 'limitsJson')

  if (typeof statement.title !== 'string' || !statement.title.trim()) {
    throw new Error('Contest problem statementJson.title is required')
  }

  return sanitizeProblemStatement({
    id: problemId,
    problemId,
    contestId: normalizedContestId,
    problemVersionId,
    problemNo: String(item.label || problemId),
    label: String(item.label || problemId),
    score: Number(item.score) || 0,
    title: statement.title,
    description: statement.description,
    inputDescription: statement.inputDescription,
    outputDescription: statement.outputDescription,
    hints: Array.isArray(statement.hints) ? statement.hints : [],
    samples: Array.isArray(statement.samples) ? statement.samples : [],
    timeLimit: Number(limits.timeLimit) || null,
    memoryLimit: Number(limits.memoryLimit) || null,
    totalScore: Number(limits.totalScore) || Number(item.score) || null,
    difficulty: 0,
    tags: [],
    submitCount: 0,
    acceptedCount: 0,
    acceptRate: 0,
  })
}
