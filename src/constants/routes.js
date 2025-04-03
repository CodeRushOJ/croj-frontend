// src/constants/routes.js
export const ROUTE_NAMES = {
  // Main routes
  DASHBOARD: "Dashboard",
  PROBLEMS: "Problems",
  PROBLEM_DETAIL: "ProblemDetail",
  CONTESTS: "Contests",
  RANKING: "Ranking",
  PROFILE: "Profile",
  SETTINGS: "Settings",

  // Auth routes
  LOGIN: "Login",
  REGISTER: "Register",
  FORGOT_PASSWORD: "ForgotPassword",
  RESET_PASSWORD: "ResetPassword",

  // Email verification
  VERIFY_EMAIL: "VerifyEmail",

  // Admin routes
  ADMIN: "Admin",
  ADMIN_USERS: "AdminUsers",
  ADMIN_PROBLEMS: "AdminProblems",
  ADMIN_TAGS: "AdminTags",
  ADMIN_CONTESTS: "AdminContests",

  // Error pages
  NOT_FOUND: "NotFound",
  FORBIDDEN: "Forbidden",
  SERVER_ERROR: "ServerError",
};

export const ROUTE_PATHS = {
  // Main paths
  DASHBOARD: "/",
  PROBLEMS: "/problems",
  PROBLEM_DETAIL: "/problem/:problemNo",
  CONTESTS: "/contests",
  RANKING: "/ranking",
  PROFILE: "/profile",
  SETTINGS: "/settings",

  // Auth paths
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // Email verification
  VERIFY_EMAIL: "/verify-email",

  // Admin paths
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_PROBLEMS: "/admin/problems",
  ADMIN_TAGS: "/admin/tags",
  ADMIN_CONTESTS: "/admin/contests",

  // Error paths
  NOT_FOUND: "/404",
  FORBIDDEN: "/403",
  SERVER_ERROR: "/500",
};
