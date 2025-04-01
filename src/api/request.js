import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/modules/auth'
import { i18n } from '@/i18n'

// Create axios instance with relative URL (for proxy)
const service = axios.create({
  baseURL: '/api', // Use relative path instead of http://localhost:8080/api
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    // Add token to headers if it exists
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data

    // Handle API custom error response
    if (!res.success) {
      // Show error message
      ElMessage({
        message: res.message || i18n.t('errors.unknown_error'),
        type: 'error',
        duration: 5 * 1000
      })

      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  (error) => {
    const { t } = i18n.global
    const authStore = useAuthStore()
    
    // Handle different error responses
    if (error.response) {
      const { status } = error.response
      
      // Handle 401 - Unauthorized
      if (status === 401) {
        // Show session expired dialog
        ElMessageBox.confirm(
          t('errors.session_expired'),
          t('common.warning'),
          {
            confirmButtonText: t('auth.login'),
            cancelButtonText: t('common.cancel'),
            type: 'warning'
          }
        ).then(() => {
          // Log out and redirect to login
          authStore.logout()
        })
      } 
      // Handle 403 - Forbidden
      else if (status === 403) {
        ElMessage({
          message: t('errors.unauthorized'),
          type: 'error',
          duration: 5 * 1000
        })
      } 
      // Handle other errors
      else {
        ElMessage({
          message: error.response.data?.message || t('errors.unknown_error'),
          type: 'error',
          duration: 5 * 1000
        })
      }
    } else {
      // Network error
      ElMessage({
        message: t('errors.network_error'),
        type: 'error',
        duration: 5 * 1000
      })
    }
    
    return Promise.reject(error)
  }
)

export default service