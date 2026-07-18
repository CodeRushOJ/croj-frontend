<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar__inner">
        <router-link class="brand" to="/" aria-label="CodeRush OJ home">
          <span class="brand__mark">CR</span>
          <span class="brand__copy">
            <strong>CodeRush</strong>
            <small>Online Judge</small>
          </span>
        </router-link>

        <nav class="primary-nav" aria-label="Primary navigation">
          <router-link to="/problems">题库</router-link>
          <router-link to="/contests">竞赛</router-link>
          <router-link to="/forum">讨论</router-link>
          <router-link v-if="isAdmin" to="/admin">管理</router-link>
        </nav>

        <div class="topbar__actions">
          <ThemeToggler />
          <el-dropdown @command="handleLanguageChange">
            <button class="quiet-action" type="button">{{ currentLanguage }}</button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
                <el-dropdown-item command="en">English</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown v-if="user" @command="handleCommand">
            <button class="user-action" type="button">
              <span class="user-action__avatar">{{ userInitial }}</span>
              <span class="user-action__name">{{ user.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人主页</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <router-link v-else class="login-action" :to="loginTarget">登录</router-link>
        </div>
      </div>
    </header>

    <main class="page-scroll">
      <div class="page-frame">
        <router-view />
      </div>
      <footer>CodeRush OJ · Build, submit, improve.</footer>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/modules/auth'
import { useAppStore } from '@/store/modules/app'
import { ROUTE_NAMES } from '@/constants/routes'
import ThemeToggler from '@/components/common/ThemeToggler.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const user = computed(() => authStore.currentUser)
const isAdmin = computed(() => authStore.isAdmin)
const userInitial = computed(() => user.value?.username?.slice(0, 1).toUpperCase() || 'U')
const currentLanguage = computed(() => appStore.language === 'zh-CN' ? '中' : 'EN')
const loginTarget = computed(() => ({ name: ROUTE_NAMES.LOGIN, query: { redirect: route.fullPath } }))

const handleLanguageChange = (language) => appStore.setLanguage(language)

const handleCommand = (command) => {
  if (command === 'profile') router.push({ name: ROUTE_NAMES.PROFILE })
  if (command === 'settings') router.push({ name: ROUTE_NAMES.SETTINGS })
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出当前账号吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => authStore.logout(router)).catch(() => {})
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg-color);
}

.topbar {
  height: 68px;
  border-bottom: 1px solid var(--border-color-light);
  background: color-mix(in srgb, var(--header-bg) 92%, transparent);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  z-index: 30;
}

.topbar__inner {
  width: min(1320px, calc(100% - 40px));
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px 1fr auto;
  align-items: center;
  gap: 28px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-color);
}

.brand__mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #635bff, #00a7e1);
  box-shadow: 0 8px 24px rgba(99, 91, 255, .22);
}

.brand__copy { display: grid; line-height: 1.05; }
.brand__copy strong { font-size: 16px; letter-spacing: -.02em; }
.brand__copy small { color: var(--text-color-secondary); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }

.primary-nav { display: flex; align-items: center; justify-content: center; gap: 8px; }
.primary-nav a {
  color: var(--text-color-secondary);
  font-weight: 650;
  padding: 9px 15px;
  border-radius: 10px;
  transition: .18s ease;
}
.primary-nav a:hover { color: var(--text-color); background: var(--border-color-light); }
.primary-nav a.router-link-active { color: #635bff; background: rgba(99, 91, 255, .1); }

.topbar__actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.quiet-action, .user-action, .login-action {
  border: 0;
  font: inherit;
  cursor: pointer;
  border-radius: 10px;
}
.quiet-action { background: transparent; color: var(--text-color-secondary); padding: 9px 10px; }
.user-action { background: var(--border-color-light); color: var(--text-color); padding: 5px 9px 5px 5px; display: flex; align-items: center; gap: 8px; }
.user-action__avatar { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; color: white; font-weight: 800; background: #14151a; }
.user-action__name { max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
.login-action { color: white; background: #14151a; padding: 9px 14px; font-weight: 700; }

.page-scroll { height: calc(100vh - 68px); overflow-y: auto; }
.page-frame { width: min(1240px, calc(100% - 40px)); margin: 0 auto; padding: 40px 0 64px; }
footer { text-align: center; color: var(--text-color-secondary); padding: 22px 16px 32px; font-size: 12px; }

@media (max-width: 760px) {
  .topbar__inner { width: min(100% - 24px, 1320px); grid-template-columns: auto 1fr; gap: 12px; }
  .brand__copy, .user-action__name { display: none; }
  .primary-nav { order: 3; grid-column: 1 / -1; justify-content: flex-start; overflow-x: auto; }
  .topbar { height: 112px; }
  .page-scroll { height: calc(100vh - 112px); }
  .page-frame { width: min(100% - 24px, 1240px); padding-top: 26px; }
}
</style>
