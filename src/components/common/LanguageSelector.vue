<template>
    <el-dropdown @command="handleLanguageChange" trigger="click">
        <span class="el-dropdown-link">
            {{ currentLanguageName }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item v-for="lang in availableLanguages" :key="lang.code" :command="lang.code"
                    :disabled="lang.code === currentLanguage">
                    {{ lang.name }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const appStore = useAppStore()

// Current language code
const currentLanguage = computed(() => locale.value)

// Current language name
const currentLanguageName = computed(() => {
    switch (currentLanguage.value) {
        case 'zh-CN':
            return '中文'
        case 'en':
        default:
            return 'English'
    }
})

// Available languages
const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '中文' }
]

// Handle language change
const handleLanguageChange = (lang) => {
    if (lang !== currentLanguage.value) {
        appStore.setLanguage(lang)
        locale.value = lang
    }
}
</script>

<style scoped>
.el-dropdown-link {
    cursor: pointer;
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
}
</style>