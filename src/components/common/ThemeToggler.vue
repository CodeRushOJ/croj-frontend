<template>
  <el-tooltip :content="isDarkMode ? $t('common.light_mode') : $t('common.dark_mode')" placement="bottom">
    <el-button :icon="isDarkMode ? 'Sunny' : 'Moon'" circle @click="toggleTheme" class="theme-toggle-btn"
      size="small"></el-button>
  </el-tooltip>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { Moon, Sunny } from '@element-plus/icons-vue'

const appStore = useAppStore()

// Is dark mode active
const isDarkMode = computed(() => appStore.theme === 'dark')

// Toggle between light and dark theme
const toggleTheme = () => {
  const newTheme = isDarkMode.value ? 'light' : 'dark'
  appStore.setTheme(newTheme)
}
</script>

<style scoped>
.theme-toggle-btn {
  transition: background-color 0.3s, border-color 0.3s;
}
</style>