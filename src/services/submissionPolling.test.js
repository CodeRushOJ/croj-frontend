import { describe, expect, it, vi } from 'vitest'

import {
  SubmissionPollingTimeoutError,
  pollSubmissionUntilComplete,
} from './submissionPolling'

describe('submission polling', () => {
  it('backs off while pending and returns the first terminal result', async () => {
    const getSubmission = vi.fn()
      .mockResolvedValueOnce({ data: { id: 42, status: 'PENDING' } })
      .mockResolvedValueOnce({ data: { id: 42, status: 'PENDING' } })
      .mockResolvedValueOnce({
        data: { id: 42, status: 'ACCEPTED', time: 18, memory: 2048 },
      })
    const wait = vi.fn().mockResolvedValue()
    const onUpdate = vi.fn()

    const result = await pollSubmissionUntilComplete(42, {
      getSubmission,
      wait,
      onUpdate,
      initialDelayMs: 250,
      maxDelayMs: 1000,
      backoffFactor: 2,
      timeoutMs: 10_000,
      now: (() => {
        let now = 0
        return () => now += 100
      })(),
    })

    expect(result).toMatchObject({ status: 'ACCEPTED', time: 18, memory: 2048 })
    expect(getSubmission).toHaveBeenCalledTimes(3)
    expect(wait.mock.calls.map(([delay]) => delay)).toEqual([250, 500])
    expect(onUpdate).toHaveBeenCalledTimes(3)
  })

  it('stops with an explicit timeout instead of polling forever', async () => {
    const getSubmission = vi.fn().mockResolvedValue({
      data: { id: 91, status: 'PENDING' },
    })
    const wait = vi.fn().mockResolvedValue()

    await expect(pollSubmissionUntilComplete(91, {
      getSubmission,
      wait,
      timeoutMs: 1000,
      initialDelayMs: 500,
      now: (() => {
        let now = 0
        return () => now += 600
      })(),
    })).rejects.toBeInstanceOf(SubmissionPollingTimeoutError)

    expect(getSubmission).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
  })

  it('stops immediately when the caller aborts navigation', async () => {
    const controller = new AbortController()
    controller.abort()
    const getSubmission = vi.fn()

    await expect(pollSubmissionUntilComplete(17, {
      getSubmission,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' })

    expect(getSubmission).not.toHaveBeenCalled()
  })

  it('aborts a slow status request at the absolute deadline', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const getSubmission = vi.fn(() => new Promise(() => {}))

    const polling = pollSubmissionUntilComplete(81, {
      getSubmission,
      controller,
      timeoutMs: 1000,
    })
    const timeout = expect(polling)
      .rejects.toBeInstanceOf(SubmissionPollingTimeoutError)
    await vi.advanceTimersByTimeAsync(1000)

    await timeout
    expect(controller.signal.aborted).toBe(true)
    vi.useRealTimers()
  })
})
