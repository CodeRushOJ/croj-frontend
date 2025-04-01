/**
 * Validation helper functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
  
  /**
   * Validate username format (letters, numbers, underscore, hyphen)
   * @param {string} username - Username to validate
   * @returns {boolean} - Whether username is valid
   */
  export function isValidUsername(username) {
    const re = /^[a-zA-Z0-9_-]+$/
    return re.test(username)
  }
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options 
   * @returns {boolean} - Whether password meets criteria
   */
  export function isStrongPassword(password, options = {}) {
    const {
      minLength = 6,
      requireLowercase = false,
      requireUppercase = false,
      requireNumbers = false,
      requireSymbols = false
    } = options
    
    if (!password || password.length < minLength) {
      return false
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
      return false
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
      return false
    }
    
    if (requireNumbers && !/[0-9]/.test(password)) {
      return false
    }
    
    if (requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false
    }
    
    return true
  }
  
  /**
   * Create custom validation rules for Element Plus form
   * @returns {Object} - Validation rules
   */
  export function createValidationRules(t) {
    return {
      username: [
        { required: true, message: t('validation.username_required'), trigger: 'blur' },
        { min: 3, max: 20, message: t('validation.username_length'), trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_-]+$/, message: t('validation.username_format'), trigger: 'blur' }
      ],
      email: [
        { required: true, message: t('validation.email_required'), trigger: 'blur' },
        { type: 'email', message: t('validation.email_format'), trigger: 'blur' }
      ],
      password: [
        { required: true, message: t('validation.password_required'), trigger: 'blur' },
        { min: 6, max: 20, message: t('validation.password_length'), trigger: 'blur' }
      ]
    }
  }
  
  export default {
    isValidEmail,
    isValidUsername,
    isStrongPassword,
    createValidationRules
  }