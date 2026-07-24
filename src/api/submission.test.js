import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./request', () => ({ default: vi.fn() }))

import request from './request'
import { submissionApi } from './submission'

describe('submission API contract', () => {
  beforeEach(() => request.mockReset())

  it('loads one submission through the detail endpoint', async () => {
    request.mockResolvedValue({ data: { id: 73, status: 1 } })

    const response = await submissionApi.getSubmission(73)

    expect(request).toHaveBeenCalledWith({
      url: '/submission/73',
      method: 'get',
    })
    expect(response.data).toMatchObject({ id: 73, status: 'ACCEPTED', statusCode: 1 })
  })

  it('passes one request abort signal through POST and status GET', async () => {
    const controller = new AbortController()
    request
      .mockResolvedValueOnce({ success: true, data: 73 })
      .mockResolvedValueOnce({ success: true, data: { id: 73, status: 0 } })

    await submissionApi.submitCode({ problemId: 9, language: 'cpp', code: 'code' }, {
      signal: controller.signal,
    })
    await submissionApi.getSubmission(73, { signal: controller.signal })

    expect(request.mock.calls[0][0].signal).toBe(controller.signal)
    expect(request.mock.calls[1][0].signal).toBe(controller.signal)
  })

  it('passes an abort signal to the submissions list request', async () => {
    const controller = new AbortController()
    request.mockResolvedValue({ success: true, data: { records: [], total: 0 } })

    await submissionApi.getSubmissionList({ problemId: 9 }, {
      signal: controller.signal,
    })

    expect(request).toHaveBeenCalledWith({
      url: '/submission/list',
      method: 'post',
      data: { problemId: 9 },
      signal: controller.signal,
    })
  })
})
