<template>
    <el-container class="app-container">
        <!-- 侧边栏 -->
        <el-aside :width="isCollapse ? '64px' : '210px'" class="sidebar-container">
            <div class="logo-container">
                <h1 class="logo">{{ $t('app.title') }}</h1>
            </div>

            <el-menu :default-active="activeIndex" class="el-menu-vertical" :collapse="isCollapse"
                background-color="var(--sidebar-bg)" text-color="var(--sidebar-text)"
                active-text-color="var(--sidebar-active)" router>
                <el-menu-item index="/">
                    <el-icon>
                        <house />
                    </el-icon>
                    <template #title>{{ $t('routes.dashboard') }}</template>
                </el-menu-item>

                <el-menu-item index="/problems">
                    <el-icon>
                        <document />
                    </el-icon>
                    <template #title>{{ $t('routes.problems') }}</template>
                </el-menu-item>

                <el-menu-item index="/contests">
                    <el-icon>
                        <trophy />
                    </el-icon>
                    <template #title>{{ $t('routes.contests') }}</template>
                </el-menu-item>

                <el-menu-item index="/ranking">
                    <el-icon>
                        <list />
                    </el-icon>
                    <template #title>{{ $t('routes.ranking') }}</template>
                </el-menu-item>

                <!-- 管理员菜单 -->
                <el-menu-item v-if="isAdmin" index="/admin">
                    <el-icon>
                        <setting />
                    </el-icon>
                    <template #title>{{ $t('routes.admin') }}</template>
                </el-menu-item>
            </el-menu>

            <!-- 折叠按钮 -->
            <div class="collapse-btn" @click="toggleSidebar">
                <el-icon v-if="isCollapse">
                    <d-arrow-right />
                </el-icon>
                <el-icon v-else>
                    <d-arrow-left />
                </el-icon>
            </div>
        </el-aside>

        <!-- 主内容区 -->
        <el-container class="main-container">
            <!-- 头部 -->
            <el-header class="app-header">
                <div class="header-left">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item :to="{ path: '/' }">{{ $t('routes.dashboard') }}</el-breadcrumb-item>
                        <el-breadcrumb-item v-if="currentRoute.meta.title">
                            {{ $t(`routes.${currentRoute.meta.title.toLowerCase()}`) }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>

                <div class="header-right">
                    <!-- 主题切换 -->
                    <ThemeToggler class="header-item" />

                    <!-- 语言下拉 -->
                    <el-dropdown @command="handleLanguageChange" class="header-item">
                        <span class="el-dropdown-link">
                            {{ currentLanguage }}
                            <el-icon class="el-icon--right">
                                <arrow-down />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="en">English</el-dropdown-item>
                                <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>

                    <!-- 用户下拉 -->
                    <el-dropdown @command="handleCommand" class="header-item">
                        <span class="el-dropdown-link user-dropdown">
                            <el-avatar :size="32" :src="userAvatar" />
                            <span class="username">{{ user?.username }}</span>
                            <el-icon class="el-icon--right">
                                <arrow-down />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">
                                    <template #default>
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                        <span>{{ $t('routes.profile') }}</span>
                                    </template>
                                </el-dropdown-item>
                                <el-dropdown-item command="settings">
                                    <template #default>
                                        <el-icon>
                                            <setting />
                                        </el-icon>
                                        <span>{{ $t('routes.settings') }}</span>
                                    </template>
                                </el-dropdown-item>
                                <el-dropdown-item divided command="logout">
                                    <template #default>
                                        <el-icon><switch-button /></el-icon>
                                        <span>{{ $t('auth.logout') }}</span>
                                    </template>
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>

            <!-- 主内容 -->
            <el-main>
                <router-view />
            </el-main>

            <!-- 底部 -->
            <el-footer height="50px" class="app-footer">
                <div>CodeRush Online Judge &copy; {{ currentYear }}</div>
            </el-footer>
        </el-container>
    </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n';
import {
    House,
    Document,
    Trophy,
    List,
    Setting,
    User,
    SwitchButton,
    DArrowLeft,
    DArrowRight,
    ArrowDown
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/modules/auth'
import { useAppStore } from '@/store/modules/app'
import { ROUTE_NAMES } from '@/constants/routes'
import { ElMessageBox } from 'element-plus'
import ThemeToggler from '@/components/common/ThemeToggler.vue'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const appStore = useAppStore()
const { t } = useI18n();

onMounted(async () => {
    // 如果有 token 但没有用户数据，则获取用户信息
    if (authStore.token && !authStore.currentUser) {
        await authStore.fetchCurrentUser();
    }
});

// 当前路由
const currentRoute = computed(() => route)

// 活动菜单索引
const activeIndex = computed(() => route.path)

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

// 获取用户
const user = computed(() => authStore.currentUser)

// 检查用户是否是管理员
const isAdmin = computed(() => authStore.isAdmin)

// 获取用户头像
const userAvatar = computed(() => {
    return user.value?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

// 获取侧边栏折叠状态
const isCollapse = computed(() => appStore.sidebarCollapsed)

// 获取当前语言
const currentLanguage = computed(() => {
    switch (appStore.language) {
        case 'zh-CN':
            return '中文'
        case 'en':
        default:
            return 'English'
    }
})

// 切换侧边栏
const toggleSidebar = () => {
    appStore.toggleSidebar()
}

// 处理语言更改
const handleLanguageChange = (lang) => {
    appStore.setLanguage(lang)
}

// 处理下拉命令
const handleCommand = (command) => {
    switch (command) {
        case 'profile':
            router.push({ name: ROUTE_NAMES.PROFILE })
            break
        case 'settings':
            router.push({ name: ROUTE_NAMES.SETTINGS })
            break
        case 'logout':
            handleLogout()
            break
    }
}

// 处理登出
const handleLogout = () => {
    ElMessageBox.confirm(
        t('auth.logout_confirm'),
        t('auth.logout'),
        {
            confirmButtonText: t('auth.logout'),
            cancelButtonText: t('common.cancel'),
            type: 'warning'
        }
    ).then(() => {
        authStore.logout(router)
    }).catch(() => {
        // 用户取消登出
        console.log('Logout canceled')
    })
}
</script>

<style scoped>
.app-container {
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
}

.sidebar-container {
    height: 100%;
    transition: width 0.3s;
    position: relative;
    z-index: 10;
    overflow: hidden;
}

.logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.logo {
    color: var(--sidebar-text);
    font-size: 18px;
    white-space: nowrap;
    margin: 0;
}

.el-menu-vertical:not(.el-menu--collapse) {
    width: 210px;
}

.collapse-btn {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    color: var(--sidebar-text);
    cursor: pointer;
    transition: 0.3s;
    padding: 10px 0;
}

.collapse-btn:hover {
    color: var(--sidebar-active);
    background-color: rgba(0, 0, 0, 0.1);
}

.main-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex: 1;
    overflow: hidden;
}

.app-header {
    color: var(--text-color);
    line-height: 60px;
    box-shadow: 0 1px 4px var(--shadow-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.header-left {
    display: flex;
    align-items: center;
}

.header-right {
    display: flex;
    align-items: center;
}

.header-item {
    margin-left: 20px;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
}

.user-dropdown {
    display: flex;
    align-items: center;
}

.username {
    margin: 0 5px;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.app-footer {
    color: var(--text-color-secondary);
    text-align: center;
    line-height: 50px;
    font-size: 14px;
}

.el-main {
    overflow-y: auto;
    padding: 20px;
    flex: 1;
}

@media (max-width: 768px) {
    .header-left {
        display: none;
    }

    .header-item {
        margin-left: 10px;
    }
}
</style>