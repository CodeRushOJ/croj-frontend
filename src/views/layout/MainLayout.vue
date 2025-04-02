<template>
    <el-container class="app-container">
        <!-- Sidebar -->
        <el-aside width="auto" class="sidebar-container">
            <div class="logo-container">
                <h1 class="logo">{{ $t('app.title') }}</h1>
            </div>

            <el-menu :default-active="activeIndex" class="el-menu-vertical" :collapse="isCollapse"
                background-color="#304156" text-color="#bfcbd9" active-text-color="#409EFF" router>
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

                <!-- Admin menu for administrators -->
                <el-menu-item v-if="isAdmin" index="/admin">
                    <el-icon>
                        <setting />
                    </el-icon>
                    <template #title>{{ $t('routes.admin') }}</template>
                </el-menu-item>
            </el-menu>

            <!-- Collapse button -->
            <div class="collapse-btn" @click="toggleSidebar">
                <el-icon v-if="isCollapse"><d-arrow-right /></el-icon>
                <el-icon v-else><d-arrow-left /></el-icon>
            </div>
        </el-aside>

        <!-- Main content -->
        <el-container class="main-container">
            <!-- Header -->
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
                    <!-- Language dropdown -->
                    <el-dropdown @command="handleLanguageChange" class="dropdown-item">
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

                    <!-- User dropdown -->
                    <el-dropdown @command="handleCommand" class="dropdown-item">
                        <span class="el-dropdown-link user-dropdown">
                            <el-avatar :size="32" :src="userAvatar" />
                            <span class="username">{{ user?.username }}</span>
                            <el-icon class="el-icon--right"><arrow-down /></el-icon>
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

            <!-- Main content -->
            <el-main>
                <router-view />
            </el-main>

            <!-- Footer -->
            <el-footer height="50px" class="app-footer">
                <div>CodeRush Online Judge &copy; {{ currentYear }}</div>
            </el-footer>
        </el-container>
    </el-container>
</template>

<script setup>
import { computed, ref, onMounted, markRaw } from 'vue'
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

// Current route
const currentRoute = computed(() => route)

// Active menu index
const activeIndex = computed(() => route.path)

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Get user from store
const user = computed(() => {
    const currentUser = authStore.currentUser
    return currentUser ? markRaw(currentUser) : null
})

// Check if user is admin
const isAdmin = computed(() => authStore.isAdmin)

// Get user avatar with fallback
const userAvatar = computed(() => {
    return user.value?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

// Get sidebar collapse state
const isCollapse = computed(() => appStore.sidebarCollapsed)

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

// Toggle sidebar
const toggleSidebar = () => {
    appStore.toggleSidebar()
}

// Handle language change
const handleLanguageChange = (lang) => {
    appStore.setLanguage(lang)
}

// Handle dropdown commands
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

// Handle logout with confirmation
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
    }).catch((error) => {
        // User canceled logout
        console.log('Logout canceled:', error)
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
    background-color: #304156;
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
    background-color: #2b3649;
    overflow: hidden;
}

.logo {
    color: #fff;
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
    color: #bfcbd9;
    cursor: pointer;
    transition: 0.3s;
    padding: 10px 0;
}

.collapse-btn:hover {
    color: #409EFF;
    background-color: #263445;
}

.main-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex: 1;
    overflow: hidden;
}

.app-header {
    background-color: #fff;
    color: #333;
    line-height: 60px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
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

.dropdown-item {
    margin-left: 20px;
}

.el-dropdown-link {
    cursor: pointer;
    color: #409EFF;
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
    background-color: #f5f7fa;
    color: #666;
    text-align: center;
    line-height: 50px;
    font-size: 14px;
}

.el-main {
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f7fa;
    flex: 1;
}

@media (max-width: 768px) {
    .header-left {
        display: none;
    }

    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }
}
</style>