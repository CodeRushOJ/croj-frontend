import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // App settings
    sidebarCollapsed: false,
    language: localStorage.getItem('language') || import.meta.env.VITE_I18N_LOCALE || 'en',
    theme: localStorage.getItem('theme') || 'light',
    
    // App state
    loading: false,
    error: null
  }),
  
  actions: {
    /**
     * Toggle sidebar collapse state
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    /**
     * Set application language
     */
    setLanguage(lang) {
      this.language = lang
      localStorage.setItem('language', lang)
    },
    
    /**
     * Set application theme
     */
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      
      // Apply theme to body
      document.body.setAttribute('data-theme', theme)
    }
  },
  
  persist: {
    key: 'croj-app',
    storage: localStorage,
    paths: ['sidebarCollapsed', 'language', 'theme']
  }
})