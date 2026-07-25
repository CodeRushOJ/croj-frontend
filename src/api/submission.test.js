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
})
