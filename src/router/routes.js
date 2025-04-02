// src/router/routes.js
import { ROUTE_NAMES } from "@/constants/routes";

// 布局组件
const MainLayout = () => import("@/views/layout/MainLayout.vue");
const AuthLayout = () => import("@/views/layout/AuthLayout.vue");

// 认证页面
const Login = () => import("@/views/auth/Login.vue");
const Register = () => import("@/views/auth/Register.vue");

// 仪表板和其他页面
const Dashboard = () => import("@/views/dashboard/Dashboard.vue");
const Settings = () => import("@/views/settings/Settings.vue");
const NotFound = () => import("@/views/error/NotFound.vue");

// 管理页面
const AdminLayout = () => import("@/views/admin/AdminLayout.vue");
const AdminDashboard = () => import("@/views/admin/Dashboard.vue");
const UserManagement = () => import("@/views/admin/UserManagement.vue");

// 路由配置
const routes = [
  {
    path: "/",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: ROUTE_NAMES.DASHBOARD,
        component: Dashboard,
        meta: {
          title: "Dashboard",
          icon: "el-icon-menu",
        },
      },
      {
        path: "profile",
        name: ROUTE_NAMES.PROFILE,
        component: () => import("@/views/profile/Profile.vue"),
        meta: {
          title: "Profile",
          requiresAuth: true,
          icon: "el-icon-user",
        },
      },
      {
        path: "settings",
        name: ROUTE_NAMES.SETTINGS,
        component: Settings,
        meta: {
          title: "Settings",
          requiresAuth: true,
          icon: "el-icon-setting",
        },
      },
    ],
  },
  // 管理路由
  {
    path: "/admin",
    component: MainLayout,
    meta: {
      requiresAuth: true,
      admin: true,
    },
    children: [
      {
        path: "",
        component: AdminLayout,
        children: [
          {
            path: "",
            name: ROUTE_NAMES.ADMIN,
            component: AdminDashboard,
            meta: {
              title: "Admin Dashboard",
              icon: "el-icon-s-platform",
            },
          },
          {
            path: "users",
            name: ROUTE_NAMES.ADMIN_USERS,
            component: UserManagement,
            meta: {
              title: "User Management",
              icon: "el-icon-user",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/auth",
    component: AuthLayout,
    meta: { guest: true },
    children: [
      {
        path: "login",
        name: ROUTE_NAMES.LOGIN,
        component: Login,
        meta: {
          title: "Login",
        },
      },
      {
        path: "register",
        name: ROUTE_NAMES.REGISTER,
        component: Register,
        meta: {
          title: "Register",
        },
      },
    ],
  },
  // 重定向 /login 和 /register 到 /auth/login 和 /auth/register
  {
    path: "/login",
    redirect: { name: ROUTE_NAMES.LOGIN },
  },
  {
    path: "/register",
    redirect: { name: ROUTE_NAMES.REGISTER },
  },
  // 邮箱验证路由
  {
    path: "/verify-email",
    name: ROUTE_NAMES.VERIFY_EMAIL,
    component: () => import("@/views/auth/VerifyEmail.vue"),
    meta: {
      title: "Verify Email",
    },
  },
  // 404 路由
  {
    path: "/:pathMatch(.*)*",
    name: ROUTE_NAMES.NOT_FOUND,
    component: NotFound,
  },
];

export default routes;
