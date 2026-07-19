import { render, screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authStore = {
  currentUser: null,
  isAdmin: false,
  logout: vi.fn(),
}

vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => authStore }))
vi.mock('@/store/modules/app', () => ({
  useAppStore: () => ({ language: 'zh-CN', setLanguage: vi.fn() }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/' }),
  useRouter: () => ({ push: vi.fn() }),
}))

import MainLayout from './MainLayout.vue'

const renderLayout = () => render(MainLayout, {
  global: {
    stubs: {
      RouterLink: { props: ['to'], template: '<a><slot /></a>' },
      RouterView: true,
      ThemeToggler: true,
      ElIcon: { template: '<span><slot /></span>' },
      ElDropdown: { template: '<div><slot /><slot name="dropdown" /></div>' },
      ElDropdownMenu: { template: '<div><slot /></div>' },
      ElDropdownItem: { template: '<button><slot /></button>' },
    },
  },
})

describe('MainLayout administration entry', () => {
  beforeEach(() => {
    authStore.currentUser = { username: 'admin', role: 1 }
    authStore.isAdmin = true
  })

  it('keeps administration out of primary navigation and inside the user menu', () => {
    renderLayout()

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(primaryNavigation).queryByText('管理')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '管理工作台' })).toBeVisible()
  })
})
