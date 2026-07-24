// src/constants/routes.js
export const ROUTE_NAMES = {
  // Main routes
  DASHBOARD: "Dashboard",
  PROBLEMS: "Problems",
  PROBLEM_DETAIL: "ProblemDetail",
  CONTEST_PROBLEM_DETAIL: "ContestProblemDetail",
  FORUM: "Forum",
  FORUM_POST_DETAIL: "ForumPostDetail",
  FORUM_POST_CREATE: "ForumPostCreate",
  SOLUTION_DETAIL: "SolutionDetail",
  CONTESTS: "Contests",
  CONTEST_DETAIL: "ContestDetail",
  ANNOUNCEMENTS: "Announcements",
  ANNOUNCEMENT_DETAIL: "AnnouncementDetail",
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
  ADMIN_PROBLEM_IMPORTS: "AdminProblemImports",
  ADMIN_TEST_BUNDLES: "AdminTestBundles",
  ADMIN_TAGS: "AdminTags",
  ADMIN_ANNOUNCEMENTS: "AdminAnnouncements",

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
  CONTEST_PROBLEM_DETAIL: "/contests/:contestId/problems/:problemId",
  FORUM: "/forum",
  FORUM_POST_CREATE: "/forum/new",
  FORUM_POST_DETAIL: "/forum/:postId",
  SOLUTION_DETAIL: "/problems/:problemId/solutions/:solutionId",
  CONTESTS: "/contests",
  ANNOUNCEMENTS: "/announcements",
  ANNOUNCEMENT_DETAIL: "/announcements/:announcementId",
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
  ADMIN_PROBLEM_IMPORTS: "/admin/problem-imports",
  ADMIN_TEST_BUNDLES: "/admin/test-bundles",
  ADMIN_TAGS: "/admin/tags",
  ADMIN_ANNOUNCEMENTS: "/admin/announcements",

  // Error paths
  NOT_FOUND: "/404",
  FORBIDDEN: "/403",
  SERVER_ERROR: "/500",
};

export const adminTestBundlesLocation = (problemId) => ({
  name: ROUTE_NAMES.ADMIN_TEST_BUNDLES,
  query: { problemId: String(problemId) },
});
