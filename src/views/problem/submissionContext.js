const positiveInteger = value => {
  const candidate = Array.isArray(value) ? value[0] : value
  const parsed = Number(candidate)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export const buildSubmissionPayload = (submission, problemId, contestId) => {
  const payload = {
    problemId: positiveInteger(problemId),
    language: submission.language,
    code: submission.code,
  }
  const normalizedContestId = positiveInteger(contestId)

  if (normalizedContestId) payload.contestId = normalizedContestId
  return payload
}
