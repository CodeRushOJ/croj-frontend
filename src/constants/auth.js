/**
 * Authentication related constants
 */

// User roles
export const USER_ROLES = {
  USER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

// User role names (for display)
export const USER_ROLE_NAMES = {
  [USER_ROLES.USER]: "User",
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.SUPER_ADMIN]: "Super Admin",
};

// User statuses
export const USER_STATUSES = {
  NORMAL: 0,
  DISABLED: 1,
};

// User status names (for display)
export const USER_STATUS_NAMES = {
  [USER_STATUSES.NORMAL]: "Normal",
  [USER_STATUSES.DISABLED]: "Disabled",
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "croj-token",
  USER: "croj-user",
  LANGUAGE: "language",
  THEME: "theme",
};

// Token expiration time (in minutes)
export const TOKEN_EXPIRATION = 60 * 24; // 24 hours

// Auth-related HTTP headers
export const AUTH_HEADER = "Authorization";
export const TOKEN_PREFIX = "Bearer ";

export default {
  USER_ROLES,
  USER_ROLE_NAMES,
  USER_STATUSES,
  USER_STATUS_NAMES,
  STORAGE_KEYS,
  TOKEN_EXPIRATION,
  AUTH_HEADER,
  TOKEN_PREFIX,
};
