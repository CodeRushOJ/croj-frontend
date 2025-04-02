// src/store/modules/app.js

import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    // 应用设置
    sidebarCollapsed:
      localStorage.getItem("sidebarCollapsed") === "true" || false,
    language:
      localStorage.getItem("language") ||
      import.meta.env.VITE_I18N_LOCALE ||
      "en",
    theme: localStorage.getItem("theme") || "light",

    // 应用状态
    loading: false,
    error: null,
  }),

  actions: {
    /**
     * 切换侧边栏折叠状态
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem("sidebarCollapsed", this.sidebarCollapsed);
    },

    /**
     * 设置侧边栏折叠状态
     */
    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed;
      localStorage.setItem("sidebarCollapsed", collapsed);
    },

    /**
     * 设置应用语言
     */
    setLanguage(lang) {
      this.language = lang;
      localStorage.setItem("language", lang);
    },

    /**
     * 设置应用主题
     */
    setTheme(theme) {
      this.theme = theme;
      localStorage.setItem("theme", theme);

      // 应用主题到body
      document.body.setAttribute("data-theme", theme);
    },
  },

  persist: {
    key: "croj-app",
    storage: localStorage,
    paths: ["sidebarCollapsed", "language", "theme"],
  },
});
