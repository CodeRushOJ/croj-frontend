<template>
    <div class="auth-container">
        <!-- Language Selector -->
        <div class="lang-selector">
            <el-dropdown @command="handleLanguageChange">
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

        <!-- Auth Content -->
        <div class="auth-content">
            <div class="auth-card">
                <!-- Logo -->
                <div class="auth-logo">
                    <h1>{{ $t('app.title') }}</h1>
                </div>

                <!-- Form Container -->
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

const appStore = useAppStore()

// Get current language name
const currentLanguage = computed(() => {
    switch (appStore.language) {
        case 'zh-CN':
            return '中文'
        case 'en':
        default:
            return 'English'
    }
})

// Handle language change
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

.lang-selector {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #409eff;
}

.auth-content {
    width: 100%;
    max-width: 420px;
    padding: 20px;
}

.auth-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 30px;
    overflow: hidden;
}

.auth-logo {
    text-align: center;
    margin-bottom: 30px;
}

.auth-logo h1 {
    color: #409eff;
    font-size: 24px;
    margin: 0;
}

.auth-form {
    margin-top: 20px;
}
</style>