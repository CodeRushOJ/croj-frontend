const TERMINAL_STATUSES = new Set([
  'ACCEPTED',
  'COMPILE_ERROR',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'OUTPUT_LIMIT_EXCEEDED',
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

  const finish = () => {
    signal?.removeEventListener('abort', onAbort)
    resolve()
  }
  const timeout = setTimeout(finish, delayMs)
  const onAbort = () => {
    clearTimeout(timeout)
    reject(abortError())
  }
  signal?.addEventListener('abort', onAbort, { once: true })
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
  controller,
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

  const requestSignal = controller?.signal || signal
  const startedAt = now()
  const deadlineAt = startedAt + timeoutMs
  let delayMs = initialDelayMs

  const timeoutError = () => new SubmissionPollingTimeoutError(submissionId, timeoutMs)
  const failAtDeadline = (operation) => {
    const remainingMs = deadlineAt - now()
    if (remainingMs <= 0) {
      controller?.abort(timeoutError())
      return Promise.reject(timeoutError())
    }

    return new Promise((resolve, reject) => {
      let settled = false
      const cleanup = () => {
        clearTimeout(deadline)
        requestSignal?.removeEventListener('abort', onAbort)
      }
      const onAbort = () => {
        if (settled) return
        settled = true
        cleanup()
        reject(abortError())
      }
      const deadline = setTimeout(() => {
        if (settled) return
        settled = true
        const error = timeoutError()
        cleanup()
        reject(error)
        controller?.abort(error)
      }, remainingMs)
      requestSignal?.addEventListener('abort', onAbort, { once: true })

      Promise.resolve(operation).then(
        value => {
          if (settled) return
          settled = true
          cleanup()
          resolve(value)
        },
        error => {
          if (settled) return
          settled = true
          cleanup()
          reject(error)
        },
      )
    })
  }

  for (;;) {
    if (requestSignal?.aborted) throw abortError()

    const response = await failAtDeadline(getSubmission(submissionId, {
      signal: requestSignal,
    }))
    if (requestSignal?.aborted) throw abortError()
    const submission = response?.data
    if (!submission?.status) {
      throw new Error('Submission status response is missing data')
    }

    onUpdate(submission)
    if (isTerminalSubmissionStatus(submission.status)) return submission

    if (now() + delayMs >= deadlineAt) {
      const error = timeoutError()
      controller?.abort(error)
      throw error
    }

    await failAtDeadline(wait(delayMs, requestSignal))
    if (requestSignal?.aborted) throw abortError()
    delayMs = Math.min(maxDelayMs, Math.ceil(delayMs * backoffFactor))
  }
}
