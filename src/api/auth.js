import request from './request'

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise with the registration result
   */
  register: (userData) => {
    return request({
      url: '/user/register',
      method: 'post',
      data: userData
    })
  },

  /**
   * Log in a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise} Promise with the login result
   */
  login: (credentials) => {
    return request({
      url: '/user/login',
      method: 'post',
      data: credentials
    })
  },

  /**
   * Check if username already exists
   * @param {string} username - Username to check
   * @returns {Promise} Promise with check result
   */
  checkUsername: (username) => {
    return request({
      url: `/user/check/username/${username}`,
      method: 'get'
    })
  },

  /**
   * Check if email already exists
   * @param {string} email - Email to check
   * @returns {Promise} Promise with check result
   */
  checkEmail: (email) => {
    return request({
      url: `/user/check/email/${email}`,
      method: 'get'
    })
  },

  /**
   * Get current user info
   * @returns {Promise} Promise with user info
   */
  getCurrentUser: () => {
    return request({
      url: '/user/info',
      method: 'get'
    })
  },

  /**
   * Update user info
   * @param {Object} userData - User data to update
   * @returns {Promise} Promise with update result
   */
  updateUserInfo: (userData) => {
    return request({
      url: '/user/info',
      method: 'put',
      data: userData
    })
  },

  /**
   * Update user password
   * @param {Object} passwordData - Password data
   * @returns {Promise} Promise with update result
   */
  updatePassword: (passwordData) => {
    return request({
      url: '/user/password',
      method: 'put',
      params: passwordData
    })
  }
}

export default authApi