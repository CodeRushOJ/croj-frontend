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
  authStore: {
    token: null,
  },
  currentRoute: {
    value: {
      fullPath: '/problems',
      meta: { requiresAuth: false },
    },
  },
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
    get token() {
      return mocks.authStore.token
    },
    logout: mocks.logout,
    clearSession: mocks.clearSession,
  }),
}))

vi.mock('@/router', () => ({
  default: {
    push: mocks.routerPush,
    currentRoute: mocks.currentRoute,
  },
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
    mocks.routerPush.mockReset()
    mocks.authStore.token = 'expired'
    mocks.currentRoute.value = {
      fullPath: '/problems',
      meta: { requiresAuth: false },
    }
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

  it('clears one expired session and preserves the protected-route redirect target', async () => {
    mocks.isCancel.mockReturnValue(false)
    mocks.authStore.token = 'expired-protected'
    mocks.currentRoute.value = {
      fullPath: '/profile?tab=submissions',
      meta: { requiresAuth: true },
    }
    const error = {
      response: { status: 401, data: {} },
      config: {
        url: '/user/info',
        method: 'get',
        headers: { Authorization: 'Bearer expired-protected' },
      },
    }

    await expect(mocks.responseError(error)).rejects.toBe(error)
    await vi.waitFor(() => expect(mocks.routerPush).toHaveBeenCalledTimes(1))

    expect(mocks.clearSession).toHaveBeenCalledOnce()
    expect(mocks.message).toHaveBeenCalledOnce()
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled()
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(mocks.routerPush).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/profile?tab=submissions' },
    })
  })

  it('coordinates simultaneous 401 responses into one public-page recovery episode', async () => {
    mocks.isCancel.mockReturnValue(false)
    mocks.authStore.token = 'expired-public'
    mocks.serviceRequest.mockResolvedValue({
      success: true,
      data: {
        records: [{ id: 42, title: 'A+B Problem' }],
        total: 1,
      },
    })
    const publicError = {
      response: { status: 401, data: {} },
      config: {
        url: '/problem/list',
        method: 'post',
        anonymousFallback: true,
        headers: { Authorization: 'Bearer expired-public' },
      },
    }
    const currentUserError = {
      response: { status: 401, data: {} },
      config: {
        url: '/user/info',
        method: 'get',
        headers: { Authorization: 'Bearer expired-public' },
      },
    }

    const [publicResult, userResult] = await Promise.allSettled([
      mocks.responseError(publicError),
      mocks.responseError(currentUserError),
    ])
    await vi.waitFor(() => expect(mocks.message).toHaveBeenCalledTimes(1))

    expect(publicResult).toMatchObject({
      status: 'fulfilled',
      value: {
        success: true,
        data: {
          records: [{ id: 42, title: 'A+B Problem' }],
          total: 1,
        },
      },
    })
    expect(userResult).toMatchObject({ status: 'rejected', reason: currentUserError })
    expect(mocks.clearSession).toHaveBeenCalledOnce()
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled()
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })

  it('does not clear a newer login when a delayed 401 belongs to an older token', async () => {
    mocks.isCancel.mockReturnValue(false)
    mocks.authStore.token = 'fresh-login'
    const error = {
      response: { status: 401, data: {} },
      config: {
        url: '/user/info',
        method: 'get',
        headers: { Authorization: 'Bearer old-login' },
      },
    }

    await expect(mocks.responseError(error)).rejects.toBe(error)

    expect(mocks.clearSession).not.toHaveBeenCalled()
    expect(mocks.message).not.toHaveBeenCalled()
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled()
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })

  it('retries an opted-in public read once without an expired bearer token', async () => {
    mocks.isCancel.mockReturnValue(false)
    mocks.authStore.token = 'expired-public-read'
    mocks.serviceRequest.mockResolvedValue({ success: true, data: { id: 42 } })
    const error = {
      response: { status: 401, data: {} },
      config: {
        url: '/problem/42',
        method: 'get',
        anonymousFallback: true,
        headers: { Authorization: 'Bearer expired-public-read' },
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
