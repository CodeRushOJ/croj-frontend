import { createI18n } from "vue-i18n";
import en from "@/locales/en";
import zhCN from "@/locales/zh-CN";

const messages = {
  en,
  "zh-CN": zhCN,
};

export const i18n = createI18n({
  legacy: false, // Use Composition API
  locale:
    localStorage.getItem("language") ||
    import.meta.env.VITE_I18N_LOCALE ||
    "en",
  fallbackLocale: import.meta.env.VITE_I18N_FALLBACK_LOCALE || "en",
  messages,
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false,
});

export default i18n