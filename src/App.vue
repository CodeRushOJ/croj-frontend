<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/store/modules/auth'
import { useAppStore } from '@/store/modules/app'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'

const i18n = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

// Map to Element Plus locales
const localeMap = {
  'en': en,
  'zh-CN': zhCn
}

// Get current Element Plus locale based on i18n locale
const currentLocale = computed(() => {
  return localeMap[i18n.locale.value] || en
})

// Initialize app - fetch user if token exists
onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchCurrentUser()
  }
})

// Watch for language changes
watch(() => appStore.language, (newLang) => {
  i18n.locale.value = newLang
})
</script>