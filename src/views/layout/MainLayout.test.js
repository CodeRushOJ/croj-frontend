import { render, screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))

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
  useRouter: () => ({ push: routerPush }),
}))

import MainLayout from './MainLayout.vue'

const renderLayout = () => render(MainLayout, {
  global: {
    stubs: {
      RouterLink: { props: ['to'], template: '<a :href="typeof to === \'string\' ? to : \'#named-route\'"><slot /></a>' },
      RouterView: true,
      ThemeToggler: true,
      CurrentAnnouncement: true,
      ElIcon: { template: '<span><slot /></span>' },
      ElDropdown: {
        emits: ['command'],
        template: '<div><slot /><button data-testid="admin-command" @click="$emit(\'command\', \'admin\')">触发管理命令</button><slot name="dropdown" /></div>',
      },
      ElDropdownMenu: { template: '<div><slot /></div>' },
      ElDropdownItem: { template: '<button><slot /></button>' },
    },
  },
})

describe('MainLayout administration entry', () => {
  beforeEach(() => {
    authStore.currentUser = { username: 'admin', role: 1 }
    authStore.isAdmin = true
    routerPush.mockReset()
  })

  it('keeps administration out of primary navigation and inside the user menu', () => {
    renderLayout()

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(primaryNavigation).queryByText('管理')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '管理工作台' })).toBeVisible()
  })

  it('exposes public announcements in primary navigation', () => {
    renderLayout()

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(primaryNavigation).getByRole('link', { name: '公告' })).toHaveAttribute('href', '/announcements')
  })

  it('routes the user-menu administration command to the guarded workspace', async () => {
    const { getAllByTestId } = renderLayout()

    await getAllByTestId('admin-command').at(-1).click()
    expect(routerPush).toHaveBeenCalledWith({ name: 'Admin' })
  })
})
