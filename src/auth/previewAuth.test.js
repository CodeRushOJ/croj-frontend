import { describe, expect, it } from 'vitest'

import { createPreviewAdmin, isPreviewAuthEnabled } from './previewAuth'

describe('preview authentication contract', () => {
  it('is enabled only for the explicit preview mode and flag', () => {
    expect(isPreviewAuthEnabled({ MODE: 'preview', VITE_ENABLE_PREVIEW_MOCK_AUTH: 'true' })).toBe(true)
    expect(isPreviewAuthEnabled({ MODE: 'production', VITE_ENABLE_PREVIEW_MOCK_AUTH: 'true' })).toBe(false)
    expect(isPreviewAuthEnabled({ MODE: 'preview', VITE_ENABLE_PREVIEW_MOCK_AUTH: 'false' })).toBe(false)
  })

  it('creates the documented administrator without a reusable password', () => {
    expect(createPreviewAdmin()).toEqual(expect.objectContaining({
      id: -1,
      username: 'preview-admin',
      role: 2,
    }))
  })
})
