<template>
    <div class="admin-layout">
        <!-- Admin header and title -->
        <div class="admin-header">
            <h1 class="admin-title">{{ $t('admin.title') }}</h1>
            <div class="admin-description">{{ $t('admin.description') }}</div>
        </div>

        <!-- Admin content area with sidebar and main area -->
        <div class="admin-content">
            <!-- Sidebar navigation -->
            <div class="admin-sidebar">
                <el-menu :default-active="activeMenu" class="admin-menu" router>
                    <el-menu-item index="/admin">
                        <el-icon>
                            <Monitor />
                        </el-icon>
                        <span>{{ $t('admin.dashboard') }}</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/users">
                        <el-icon>
                            <User />
                        </el-icon>
                        <span>{{ $t('admin.users') }}</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/problems">
                        <el-icon>
                            <Document />
                        </el-icon>
                        <span>{{ $t('admin.problems') }}</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/tags">
                        <el-icon>
                            <CollectionTag />
                        </el-icon>
                        <span>{{ $t('admin.tags') }}</span>
                    </el-menu-item>
                    <el-menu-item index="/admin/contests">
                        <el-icon>
                            <Trophy />
                        </el-icon>
                        <span>{{ $t('admin.contests') }}</span>
                    </el-menu-item>
                </el-menu>
                <!-- Add a filler div to ensure background covers the entire sidebar -->
                <div class="sidebar-filler"></div>
            </div>

            <!-- Main content area -->
            <div class="admin-main">
                <router-view />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Monitor, User, Document, CollectionTag, Trophy } from '@element-plus/icons-vue';

const route = useRoute();
const { t } = useI18n();

// Use current path to determine active menu item
const activeMenu = computed(() => {
    return route.path;
});
</script>

<style scoped>
.admin-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: var(--bg-color);
}

.admin-header {
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
    margin-bottom: 20px;
    background-color: var(--bg-color);
}

.admin-title {
    font-size: 24px;
    margin: 0 0 10px 0;
    color: var(--text-color);
}

.admin-description {
    color: var(--text-color-secondary);
    font-size: 14px;
}

.admin-content {
    display: flex;
    flex: 1;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
    overflow: hidden;
    height: calc(100% - 110px);
    background-color: var(--bg-color);
}

.admin-sidebar {
    width: 240px;
    border-right: 1px solid var(--border-color);
    height: 100%;
    overflow-y: auto;
    background-color: var(--bg-color);
    display: flex;
    flex-direction: column;
}

.admin-menu {
    height: auto;
    border-right: none;
    background-color: var(--bg-color);
}

/* This fills the remaining space in the sidebar to maintain background color */
.sidebar-filler {
    flex-grow: 1;
    background-color: var(--bg-color);
}

.admin-menu :deep(.el-menu) {
    background-color: var(--bg-color);
    border-right: none;
}

.admin-menu :deep(.el-menu-item) {
    background-color: var(--bg-color);
}

.admin-menu :deep(.el-menu-item.is-active) {
    background-color: var(--el-menu-hover-bg-color);
}

.admin-menu :deep(.el-menu-item:hover) {
    background-color: var(--el-menu-hover-bg-color);
}

.admin-main {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: var(--bg-color);
}

@media (max-width: 768px) {
    .admin-content {
        flex-direction: column;
        height: calc(100% - 120px);
    }

    .admin-sidebar {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
    }

    .admin-main {
        height: calc(100% - 200px);
    }
}
</style>