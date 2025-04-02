<template>
    <div class="settings-container">
        <el-card class="settings-card">
            <template #header>
                <div class="card-header">
                    <h2>{{ $t('settings.title') }}</h2>
                </div>
            </template>

            <div class="settings-content">
                <!-- 主题设置 -->
                <el-divider content-position="left">{{ $t('settings.theme_settings') }}</el-divider>
                <div class="setting-section">
                    <div class="setting-label">{{ $t('settings.theme_mode') }}</div>
                    <div class="setting-control">
                        <el-radio-group v-model="currentTheme" @change="handleThemeChange">
                            <el-radio-button label="light">
                                <el-icon class="theme-icon">
                                    <sunny />
                                </el-icon>
                                {{ $t('settings.light_mode') }}
                            </el-radio-button>
                            <el-radio-button label="dark">
                                <el-icon class="theme-icon">
                                    <moon />
                                </el-icon>
                                {{ $t('settings.dark_mode') }}
                            </el-radio-button>
                        </el-radio-group>
                    </div>
                </div>

                <!-- 语言设置 -->
                <el-divider content-position="left">{{ $t('settings.language_settings') }}</el-divider>
                <div class="setting-section">
                    <div class="setting-label">{{ $t('settings.language') }}</div>
                    <div class="setting-control">
                        <el-select v-model="currentLanguage" @change="handleLanguageChange">
                            <el-option v-for="lang in availableLanguages" :key="lang.code" :label="lang.name"
                                :value="lang.code" />
                        </el-select>
                    </div>
                </div>

                <!-- 界面设置 -->
                <el-divider content-position="left">{{ $t('settings.interface_settings') }}</el-divider>
                <div class="setting-section">
                    <div class="setting-label">{{ $t('settings.sidebar_collapsed') }}</div>
                    <div class="setting-control">
                        <el-switch v-model="sidebarCollapsed" @change="handleSidebarChange" />
                    </div>
                </div>

                <!-- 提交按钮 -->
                <div class="settings-actions">
                    <el-button type="primary" @click="saveSettings">{{ $t('settings.save_settings') }}</el-button>
                    <el-button @click="resetSettings">{{ $t('settings.reset') }}</el-button>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { useAppStore } from '@/store/modules/app';
import { Moon, Sunny } from '@element-plus/icons-vue';

const { t } = useI18n();
const appStore = useAppStore();

// 主题设置
const currentTheme = ref(appStore.theme);

// 语言设置
const currentLanguage = ref(appStore.language);

// 侧边栏设置
const sidebarCollapsed = ref(appStore.sidebarCollapsed);

// 可用语言
const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '中文' }
];

// 处理主题变更
const handleThemeChange = (theme) => {
    appStore.setTheme(theme);
};

// 处理语言变更
const handleLanguageChange = (language) => {
    appStore.setLanguage(language);
};

// 处理侧边栏变更
const handleSidebarChange = (collapsed) => {
    appStore.setSidebarCollapsed(collapsed);
};

// 保存设置
const saveSettings = () => {
    // 应用设置到应用存储
    appStore.setTheme(currentTheme.value);
    appStore.setLanguage(currentLanguage.value);
    appStore.setSidebarCollapsed(sidebarCollapsed.value);

    ElMessage.success(t('settings.save_success'));
};

// 重置设置
const resetSettings = () => {
    currentTheme.value = 'light';
    currentLanguage.value = 'en';
    sidebarCollapsed.value = false;

    // 应用更改到存储
    appStore.setTheme(currentTheme.value);
    appStore.setLanguage(currentLanguage.value);
    appStore.setSidebarCollapsed(sidebarCollapsed.value);

    ElMessage.success(t('settings.reset_success'));
};

// 组件挂载时加载设置
onMounted(() => {
    // 从应用存储初始化
    currentTheme.value = appStore.theme;
    currentLanguage.value = appStore.language;
    sidebarCollapsed.value = appStore.sidebarCollapsed;
});
</script>

<style scoped>
.settings-container {
    max-width: 800px;
    margin: 0 auto;
}

.settings-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h2 {
    margin: 0;
    font-size: 20px;
}

.settings-content {
    padding: 10px 0;
}

.setting-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
    padding: 10px 0;
}

.setting-label {
    font-weight: 500;
    font-size: 16px;
    color: var(--text-color);
}

.setting-control {
    min-width: 240px;
}

.settings-actions {
    margin-top: 30px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.theme-icon {
    margin-right: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .setting-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .setting-control {
        width: 100%;
    }
}
</style>