import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  responseError: null,
  isCancel: vi.fn(),
  message: vi.fn(),
  messageBoxConfirm: vi.fn(),
  logout: vi.fn(),
  clearSession: vi.fn(),
  routerPush: vi.fn(),
  serviceRequest: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => {
      const service = vi.fn()
      service.request = mocks.serviceRequest
      service.interceptors = {
        request: { use: vi.fn() },
        response: {
          use: vi.fn((_success, error) => {
            mocks.responseError = error
          }),
        },
      }
      return service
    }),
    isCancel: mocks.isCancel,
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: mocks.message,
  ElMessageBox: { confirm: mocks.messageBoxConfirm },
}))

vi.mock('@/store/modules/auth', () => ({
  useAuthStore: () => ({
    token: null,
    logout: mocks.logout,
    clearSession: mocks.clearSession,
  }),
}))

vi.mock('@/router', () => ({
  default: { push: mocks.routerPush },
}))

vi.mock('@/i18n', () => ({
  i18n: {
    global: { t: key => key },
  },
}))

await import('./request')

describe('request cancellation handling', () => {
  beforeEach(() => {
    mocks.isCancel.mockReset()
    mocks.message.mockReset()
    mocks.messageBoxConfirm.mockReset()
    mocks.logout.mockReset()
    mocks.clearSession.mockReset()
    mocks.serviceRequest.mockReset()
  })

  it.each([
    ['Axios cancellation code', { code: 'ERR_CANCELED' }, false],
    ['Axios cancellation predicate', { reason: 'cancelled' }, true],
  ])('silently rejects %s', async (_label, error, isCancel) => {
    mocks.isCancel.mockReturnValue(isCancel)

    await expect(mocks.responseError(error)).rejects.toBe(error)

    expect(mocks.message).not.toHaveBeenCalled()
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled()
  })

  it('logs out with the application router after a confirmed 401 dialog', async () => {
    mocks.isCancel.mockReturnValue(false)
    mocks.messageBoxConfirm.mockResolvedValue()
    const error = { response: { status: 401, data: {} } }

    await expect(mocks.responseError(error)).rejects.toBe(error)
    await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalledTimes(1))

    const router = (await import('@/router')).default
    expect(mocks.logout).toHaveBeenCalledWith(router)
  })

  it('retries an opted-in public read once without an expired bearer token', async () => {
    mocks.isCancel.mockReturnValue(false)
    mocks.serviceRequest.mockResolvedValue({ success: true, data: { id: 42 } })
    const error = {
      response: { status: 401, data: {} },
      config: {
        url: '/problem/42',
        method: 'get',
        anonymousFallback: true,
        headers: { Authorization: 'Bearer expired' },
      },
    }

    await expect(mocks.responseError(error)).resolves.toEqual({
      success: true,
      data: { id: 42 },
    })

    expect(mocks.clearSession).toHaveBeenCalledOnce()
    expect(mocks.serviceRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: '/problem/42',
      anonymousFallback: true,
      skipAuth: true,
      _anonymousRetry: true,
      headers: {},
    }))
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled()
    expect(mocks.logout).not.toHaveBeenCalled()
  })

  it('rejects an anonymous retry failure without opening the protected-session dialog', async () => {
    mocks.isCancel.mockReturnValue(false)
    const error = {
      response: { status: 401, data: {} },
      config: {
        url: '/problem/42',
        method: 'get',
        anonymousFallback: true,
        _anonymousRetry: true,
        skipAuth: true,
        headers: {},
      },
    }

    await expect(mocks.responseError(error)).rejects.toBe(error)

    expect(mocks.serviceRequest).not.toHaveBeenCalled()
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled()
    expect(mocks.logout).not.toHaveBeenCalled()
  })
})
