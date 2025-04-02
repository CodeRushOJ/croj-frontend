<template>
    <div class="admin-layout">
        <!-- 管理头部与标题 -->
        <div class="admin-header">
            <h1 class="admin-title">{{ $t('admin.title') }}</h1>
            <div class="admin-description">{{ $t('admin.description') }}</div>
        </div>

        <!-- 管理内容区域，包含侧边栏和主区域 -->
        <div class="admin-content">
            <!-- 侧边栏导航 -->
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
                    <el-menu-item index="/admin/contests">
                        <el-icon>
                            <Trophy />
                        </el-icon>
                        <span>{{ $t('admin.contests') }}</span>
                    </el-menu-item>
                </el-menu>
            </div>

            <!-- 主内容区域 -->
            <div class="admin-main">
                <router-view />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Monitor, User, Document, Trophy } from '@element-plus/icons-vue';
import { useAuthStore } from '@/store/modules/auth';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

// 检查用户是否是管理员，如果不是则重定向
const isSuperAdmin = computed(() => authStore.isSuperAdmin);
const isAdmin = computed(() => authStore.isAdmin);

// 使用当前路径确定活动菜单项
const activeMenu = computed(() => {
    return route.path;
});

// 添加翻译
useI18n().mergeLocaleMessage('en', {
    admin: {
        title: 'Administration',
        description: 'Manage users, problems, and contests',
        dashboard: 'Dashboard',
        users: 'Users',
        problems: 'Problems',
        contests: 'Contests',
    }
});

useI18n().mergeLocaleMessage('zh-CN', {
    admin: {
        title: '管理后台',
        description: '管理用户、题目和竞赛',
        dashboard: '控制台',
        users: '用户管理',
        problems: '题目管理',
        contests: '竞赛管理',
    }
});
</script>

<style scoped>
.admin-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.admin-header {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.admin-title {
    font-size: 24px;
    margin: 0 0 10px 0;
    color: #303133;
}

.admin-description {
    color: #606266;
    font-size: 14px;
}

.admin-content {
    display: flex;
    flex: 1;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
    height: calc(100% - 110px);
}

.admin-sidebar {
    width: 240px;
    border-right: 1px solid #e6e6e6;
    height: 100%;
    overflow-y: auto;
}

.admin-menu {
    height: 100%;
    border-right: none;
}

.admin-main {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
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
        border-bottom: 1px solid #e6e6e6;
    }

    .admin-main {
        height: calc(100% - 200px);
    }
}
</style>