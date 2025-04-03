<template>
  <el-tooltip :content="tooltipContent" placement="bottom">
    <div class="theme-toggle" @click="toggleTheme">
      <el-icon v-if="isDarkMode" class="toggle-icon">
        <sunny />
      </el-icon>
      <el-icon v-else class="toggle-icon">
        <moon />
      </el-icon>
    </div>
  </el-tooltip>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Sunny, Moon } from '@element-plus/icons-vue';
import { useAppStore } from '@/store/modules/app';

const { t } = useI18n();
const appStore = useAppStore();

// 检查是否是暗色模式
const isDarkMode = computed(() => appStore.theme === 'dark');

// 切换主题
const toggleTheme = () => {
  const newTheme = isDarkMode.value ? 'light' : 'dark';
  appStore.setTheme(newTheme);
};

// 动态工具提示内容
const tooltipContent = computed(() => {
  return isDarkMode.value ? t('common.light_mode') : t('common.dark_mode');
});
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s;
}

.theme-toggle:hover {
  background-color: var(--border-color-light);
}

.toggle-icon {
  font-size: 20px;
  color: var(--text-color);
}
</style>