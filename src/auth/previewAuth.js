export const PREVIEW_AUTH_TOKEN = 'coderushoj-local-preview'

export function isPreviewAuthEnabled(env = import.meta.env) {
  return env.MODE === 'preview' && env.VITE_ENABLE_PREVIEW_MOCK_AUTH === 'true'
}

export function createPreviewAdmin() {
  return {
    id: -1,
    username: 'preview-admin',
    email: 'preview-admin@localhost.invalid',
    role: 2,
    roleName: 'Super Administrator',
    status: 0,
    statusName: 'Active',
    emailVerified: 1,
  }
}

export const previewAuthEnabled = isPreviewAuthEnabled()
