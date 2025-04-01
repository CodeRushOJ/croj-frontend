import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'
import routes from './routes'

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Setup navigation guards
setupRouterGuards(router)

export default router