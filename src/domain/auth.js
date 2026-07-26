import { USER_ROLES } from "@/constants/auth";

const BACKEND_ROLES = new Map([
  [USER_ROLES.USER, USER_ROLES.USER],
  [USER_ROLES.ADMIN, USER_ROLES.ADMIN],
  [USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPER_ADMIN],
  ["USER", USER_ROLES.USER],
  ["ADMIN", USER_ROLES.ADMIN],
  ["SUPER_ADMIN", USER_ROLES.SUPER_ADMIN],
]);

export const normalizeUserRole = (role) => BACKEND_ROLES.get(role) ?? null;

export const normalizeCurrentUser = (user) => {
  if (!user || typeof user !== "object" || Array.isArray(user)) return null;

  return {
    ...user,
    role: normalizeUserRole(user.role),
  };
};
