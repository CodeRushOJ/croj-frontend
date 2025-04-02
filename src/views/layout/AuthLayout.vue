<template>
    <div class="auth-container">
        <!-- 顶部操作栏 -->
        <div class="auth-top-bar">
            <!-- 主题切换 -->
            <ThemeToggler />

            <!-- 语言选择器 -->
            <el-dropdown @command="handleLanguageChange" class="language-dropdown">
                <span class="el-dropdown-link">
                    {{ currentLanguage }}
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="en">English</el-dropdown-item>
                        <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <!-- 认证内容 -->
        <div class="auth-content">
            <div class="auth-card">
                <!-- 徽标 -->
                <div class="auth-logo">
                    <h1>{{ $t('app.title') }}</h1>
                </div>

                <!-- 表单容器 -->
                <div class="auth-form">
                    <router-view />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import ThemeToggler from '@/components/common/ThemeToggler.vue'

const appStore = useAppStore()

// 获取当前语言名称
const currentLanguage = computed(() => {
    switch (appStore.language) {
        case 'zh-CN':
            return '中文'
        case 'en':
        default:
            return 'English'
    }
})

// 处理语言变更
const handleLanguageChange = (lang) => {
    appStore.setLanguage(lang)
}
</script>

<style scoped>
.auth-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--bg-color);
}

.auth-top-bar {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 15px;
}

.language-dropdown {
    margin-left: 15px;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--text-color);
}

.auth-content {
    width: 100%;
    max-width: 420px;
    padding: 20px;
}

.auth-card {
    background: var(--bg-color-secondary);
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--shadow-color);
    padding: 30px;
    overflow: hidden;
}

.auth-logo {
    text-align: center;
    margin-bottom: 30px;
}

.auth-logo h1 {
    color: var(--el-color-primary);
    font-size: 24px;
    margin: 0;
}

.auth-form {
    margin-top: 20px;
}
</style>