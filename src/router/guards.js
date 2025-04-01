import { useAuthStore } from '@/store/modules/auth'
import { ROUTE_NAMES } from '@/constants/routes'
import { ElMessage } from 'element-plus'

export function setupRouterGuards(router) {
  router.beforeEach((to, from, next) => {
    // Update page title
    document.title = to.meta.title
      ? `${to.meta.title} - CodeRush OJ`
      : 'CodeRush Online Judge'

    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    // Routes that require authentication
    if (to.meta.requiresAuth && !isAuthenticated) {
      ElMessage.warning('Please log in to access this page')
      next({ name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } })
      return
    }

    // Routes for guests only (like login page) - redirect if already logged in
    if (to.meta.guest && isAuthenticated) {
      next({ name: ROUTE_NAMES.DASHBOARD })
      return
    }

    // Admin routes - check if user is admin
    if (to.meta.admin && !authStore.isAdmin) {
      ElMessage.error('You do not have permission to access this page')
      next({ name: ROUTE_NAMES.DASHBOARD })
      return
    }

    next()
  })
}