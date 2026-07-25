import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  responseError: null,
  isCancel: vi.fn(),
  message: vi.fn(),
  messageBoxConfirm: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: vi.fn((_success, error) => {
            mocks.responseError = error
          }),
        },
      },
    })),
    isCancel: mocks.isCancel,
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: mocks.message,
  ElMessageBox: { confirm: mocks.messageBoxConfirm },
}))

vi.mock('@/store/modules/auth', () => ({
  useAuthStore: () => ({ token: null, logout: vi.fn() }),
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
})
