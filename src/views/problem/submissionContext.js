const positiveInteger = value => {
  const candidate = Array.isArray(value) ? value[0] : value
  const parsed = Number(candidate)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export const buildSubmissionPayload = (submission, context) => {
  const payload = {
    problemId: positiveInteger(context?.problemId),
    language: submission.language,
    code: submission.code,
  }
  const normalizedContestId = positiveInteger(context?.contestId)

  if (normalizedContestId) payload.contestId = normalizedContestId
  return payload
}
