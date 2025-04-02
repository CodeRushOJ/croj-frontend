import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/constants/routes'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // User data
    user: null,
    // Auth token
    token: null,
    // Loading states
    loading: false,
    // Error states
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    isAdmin: (state) => state.user && (state.user.role === 1 || state.user.role === 2)
  },
  
  actions: {
    /**
     * Register a new user
     */
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authApi.register(userData)
        return response.data
      } catch (error) {
        this.error = error.message
        return null
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Login a user
     */
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authApi.login(credentials)
        
        const { token } = response.data
        
        // Store token in state
        this.token = token
        
        // Get user info
        await this.fetchCurrentUser()
        
        return true
      } catch (error) {
        this.error = error.message
        return false
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Fetch current user info
     */
    async fetchCurrentUser() {
      if (!this.token) return null
      
      try {
        const response = await authApi.getCurrentUser()
        this.user = response.data
        return this.user
      } catch (error) {
        this.user = null
        return null
      }
    },
    
    /**
     * Logout user
     */
    logout(router) {
      // Clear token and user data
      this.token = null
      this.user = null
      
      // Redirect to login page
      router.push({ name: ROUTE_NAMES.LOGIN })
    },
    
    /**
     * Check if username exists
     */
    async checkUsername(username) {
      try {
        const response = await authApi.checkUsername(username)
        return response.data
      } catch (error) {
        return false
      }
    },
    
    /**
     * Check if email exists
     */
    async checkEmail(email) {
      try {
        const response = await authApi.checkEmail(email)
        return response.data
      } catch (error) {
        return false
      }
    }
  },
  
  persist: {
    key: 'croj-auth',
    storage: localStorage,
    paths: ['token']
  }
})