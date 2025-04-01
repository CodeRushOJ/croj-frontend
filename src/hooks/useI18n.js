import { computed } from "vue";
import { useI18n as vueUseI18n } from "vue-i18n";
import { useAppStore } from "@/store/modules/app";

/**
 * Enhanced i18n hook with additional functionality
 * @returns {Object} Enhanced i18n utilities
 */
export function useI18n() {
  const { t, locale, ...i18n } = vueUseI18n();
  const appStore = useAppStore();

  /**
   * Change current language
   * @param {string} lang - Language code to switch to
   */
  const changeLanguage = (lang) => {
    if (lang && locale.value !== lang) {
      appStore.setLanguage(lang);
      locale.value = lang;
    }
  };

  /**
   * Get current language name
   */
  const currentLanguageName = computed(() => {
    switch (locale.value) {
      case "zh-CN":
        return "中文";
      case "en":
      default:
        return "English";
    }
  });

  /**
   * Get available languages
   */
  const availableLanguages = computed(() => [
    { code: "en", name: "English" },
    { code: "zh-CN", name: "中文" },
  ]);

  /**
   * Translate with fallback for missing keys
   * @param {string} key - Translation key
   * @param {Object} options - Translation options
   * @returns {string} Translated text
   */
  const tf = (key, options = {}) => {
    const result = t(key, options);

    // If the result equals the key, the translation is missing
    if (result === key) {
      // Try to generate a readable label from the key
      const lastPart = key.split(".").pop();
      return lastPart
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
    }

    return result;
  };

  return {
    ...i18n,
    t,
    tf,
    locale,
    changeLanguage,
    currentLanguageName,
    availableLanguages,
  };
}

export default useI18n;
