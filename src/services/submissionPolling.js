const TERMINAL_STATUSES = new Set([
  'ACCEPTED',
  'COMPILE_ERROR',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'SYSTEM_ERROR',
])

const abortError = () => {
  const error = new Error('Submission polling aborted')
  error.name = 'AbortError'
  return error
}

const defaultWait = (delayMs, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(abortError())
    return
  }

  const timeout = setTimeout(resolve, delayMs)
  signal?.addEventListener('abort', () => {
    clearTimeout(timeout)
    reject(abortError())
  }, { once: true })
})

export class SubmissionPollingTimeoutError extends Error {
  constructor(submissionId, timeoutMs) {
    super(`Submission ${submissionId} did not finish within ${timeoutMs}ms`)
    this.name = 'SubmissionPollingTimeoutError'
    this.submissionId = submissionId
    this.timeoutMs = timeoutMs
  }
}

export const isTerminalSubmissionStatus = status => TERMINAL_STATUSES.has(status)

export const pollSubmissionUntilComplete = async (submissionId, {
  getSubmission,
  onUpdate = () => {},
  signal,
  timeoutMs = 60_000,
  initialDelayMs = 500,
  maxDelayMs = 4_000,
  backoffFactor = 1.7,
  wait = defaultWait,
  now = Date.now,
} = {}) => {
  if (typeof getSubmission !== 'function') {
    throw new TypeError('getSubmission is required')
  }

  const startedAt = now()
  let delayMs = initialDelayMs

  for (;;) {
    if (signal?.aborted) throw abortError()

    const response = await getSubmission(submissionId)
    const submission = response?.data
    if (!submission?.status) {
      throw new Error('Submission status response is missing data')
    }

    onUpdate(submission)
    if (isTerminalSubmissionStatus(submission.status)) return submission

    const elapsedMs = now() - startedAt
    if (elapsedMs + delayMs >= timeoutMs) {
      throw new SubmissionPollingTimeoutError(submissionId, timeoutMs)
    }

    await wait(delayMs, signal)
    delayMs = Math.min(maxDelayMs, Math.ceil(delayMs * backoffFactor))
  }
}
