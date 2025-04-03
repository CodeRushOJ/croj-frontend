// src/router/routes.js
import { ROUTE_NAMES } from "@/constants/routes";

// Layout components
const MainLayout = () => import("@/views/layout/MainLayout.vue");
const AuthLayout = () => import("@/views/layout/AuthLayout.vue");

// Auth pages
const Login = () => import("@/views/auth/Login.vue");
const Register = () => import("@/views/auth/Register.vue");

// Dashboard and other pages
const Dashboard = () => import("@/views/dashboard/Dashboard.vue");
const Settings = () => import("@/views/settings/Settings.vue");
const NotFound = () => import("@/views/error/NotFound.vue");

// Problem pages
const ProblemList = () => import("@/views/problem/ProblemList.vue");
const ProblemDetail = () => import("@/views/problem/ProblemDetail.vue");

// Admin pages
const AdminLayout = () => import("@/views/admin/AdminLayout.vue");
const AdminDashboard = () => import("@/views/admin/Dashboard.vue");
const UserManagement = () => import("@/views/admin/UserManagement.vue");
const ProblemManagement = () => import("@/views/admin/ProblemManagement.vue");
const TagManagement = () => import("@/views/admin/TagManagement.vue");

// Route configuration
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
        path: "problems",
        name: ROUTE_NAMES.PROBLEMS,
        component: ProblemList,
        meta: {
          title: "Problems",
          requiresAuth: true,
          icon: "el-icon-document",
        },
      },
      {
        path: "problem/:problemNo",
        name: "ProblemDetail",
        component: ProblemDetail,
        meta: {
          title: "Problem Detail",
          requiresAuth: true,
          icon: "el-icon-document",
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
  // Admin routes
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
          {
            path: "problems",
            name: ROUTE_NAMES.ADMIN_PROBLEMS,
            component: ProblemManagement,
            meta: {
              title: "Problem Management",
              icon: "el-icon-document",
            },
          },
          {
            path: "tags",
            name: "AdminTags",
            component: TagManagement,
            meta: {
              title: "Tag Management",
              icon: "el-icon-collection-tag",
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
  // Redirect /login and /register to /auth/login and /auth/register
  {
    path: "/login",
    redirect: { name: ROUTE_NAMES.LOGIN },
  },
  {
    path: "/register",
    redirect: { name: ROUTE_NAMES.REGISTER },
  },
  // Email verification route
  {
    path: "/verify-email",
    name: ROUTE_NAMES.VERIFY_EMAIL,
    component: () => import("@/views/auth/VerifyEmail.vue"),
    meta: {
      title: "Verify Email",
    },
  },
  // 404 route
  {
    path: "/:pathMatch(.*)*",
    name: ROUTE_NAMES.NOT_FOUND,
    component: NotFound,
  },
];

export default routes;
