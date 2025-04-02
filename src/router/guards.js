// src/router/guards.js
import { useAuthStore } from "@/store/modules/auth";
import { ROUTE_NAMES } from "@/constants/routes";
import { ElMessage } from "element-plus";
import i18n from "@/i18n";

const { t } = i18n.global;

export function setupRouterGuards(router) {
  router.beforeEach((to, from, next) => {
    // 更新页面标题
    document.title = to.meta.title
      ? `${to.meta.title} - CodeRush OJ`
      : "CodeRush Online Judge";

    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;
    const isAdmin = authStore.isAdmin; // 检查是否是管理员

    // 需要认证的路由
    if (to.meta.requiresAuth && !isAuthenticated) {
      ElMessage.warning(t("auth.login_hint"));
      next({ name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } });
      return;
    }

    // 仅访客可访问的路由（如登录页）- 如果已登录则重定向
    if (to.meta.guest && isAuthenticated) {
      next({ name: ROUTE_NAMES.DASHBOARD });
      return;
    }

    // 管理员路由 - 检查用户是否是管理员
    if (to.meta.admin && !isAdmin) {
      ElMessage.error(t("auth.permission_hint"));
      next({ name: ROUTE_NAMES.DASHBOARD });
      return;
    }

    next();
  });
}
