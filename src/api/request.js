import axios from "axios";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/store/modules/auth";
import { i18n } from "@/i18n";
import { ROUTE_NAMES } from "@/constants/routes";

let handledExpiredToken = null;

const bearerTokenFrom = (config, authStore) => {
  const authorization = typeof config.headers?.get === "function"
    ? config.headers.get("Authorization")
    : config.headers?.Authorization || config.headers?.authorization;

  if (authorization) {
    return String(authorization).replace(/^Bearer\s+/i, "");
  }
  return authStore.token;
};

const recoverExpiredSession = (config, authStore, t) => {
  const failedToken = bearerTokenFrom(config, authStore);
  if (!failedToken) return;

  // A delayed response from an older login must never clear a newer session.
  if (authStore.token && failedToken !== authStore.token) return;
  if (handledExpiredToken === failedToken) return;

  handledExpiredToken = failedToken;
  authStore.clearSession();
  ElMessage({
    message: t("errors.session_expired"),
    type: "warning",
    duration: 5 * 1000,
  });

  import("@/router")
    .then(({ default: router }) => {
      const route = router.currentRoute?.value;
      if (!route?.meta?.requiresAuth || route.name === ROUTE_NAMES.LOGIN) return;

      return router.push({
        name: ROUTE_NAMES.LOGIN,
        query: { redirect: route.fullPath },
      });
    })
    .catch(() => {});
};

// Create axios instance with relative URL (for proxy)
const service = axios.create({
  baseURL: "/api", // Use relative path instead of http://localhost:8080/api
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();

    if (config.skipAuth) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Authorization");
      } else if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
      return config;
    }

    // Add token to headers if it exists
    if (authStore.token) {
      config.headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    const { t } = i18n.global;

    // Handle API custom error response
    if (!res.success) {
      // Map backend error codes to i18n message keys
      let errorMessageKey;
      switch (res.code) {
        case 40001: // ACCOUNT_ERROR
          errorMessageKey = "errors.account_error";
          break;
        case 40002: // ACCOUNT_EXIST
          errorMessageKey = "errors.account_exists";
          break;
        case 40003: // CAPTCHA_ERROR
          errorMessageKey = "errors.captcha_error";
          break;
        case 40004: // ACCOUNT_DISABLED
          errorMessageKey = "errors.account_disabled";
          break;
        case 40005: // PASSWORD_ERROR
          errorMessageKey = "errors.password_error";
          break;
        case 40006: // PASSWORD_NOT_MATCH
          errorMessageKey = "errors.passwords_not_match";
          break;
        case 40007: // ACCOUNT_NOT_EXIST
          errorMessageKey = "errors.account_not_exist";
          break;
        case 40008: // EMAIL_CODE_ERROR
          errorMessageKey = "errors.email_code_error";
          break;
        case 40009: // EMAIL_EXIST
          errorMessageKey = "errors.email_exists";
          break;
        case 40010: // DISABLED_ERROR
          errorMessageKey = "errors.disabled_error";
          break;
        case 40011: // EMAIL_IS_VERIFIED
          errorMessageKey = "errors.email_verified";
          break;
        case 40012: // UPDATE_ERROR
          errorMessageKey = "errors.update_error";
          break;
        case 40013: // UPLOAD_ERROR
          errorMessageKey = "errors.upload_error";
          break;
        case 40100: // FORBIDDEN
          errorMessageKey = "errors.unauthorized";
          break;
        default:
          errorMessageKey = "errors.unknown_error";
      }

      // Show translated error message or fallback to the backend message
      ElMessage({
        message:
          t(errorMessageKey, null, { fallbackWarn: false }) || res.message,
        type: "error",
        duration: 5 * 1000,
      });

      return Promise.reject(new Error(res.message || "Error"));
    }

    if (response.config.includeResponseHeaders) {
      return { ...res, headers: response.headers };
    }
    return res;
  },
  (error) => {
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const { t } = i18n.global;
    const authStore = useAuthStore();

    // Handle different error responses
    if (error.response) {
      const { status } = error.response;

      // Handle 401 - Unauthorized
      if (status === 401) {
        const config = error.config || {};
        if (config.anonymousFallback) {
          if (!config._anonymousRetry) {
            recoverExpiredSession(config, authStore, t);
            const sourceHeaders = typeof config.headers?.toJSON === "function"
              ? config.headers.toJSON()
              : { ...(config.headers || {}) };
            delete sourceHeaders.Authorization;
            delete sourceHeaders.authorization;
            return service.request({
              ...config,
              headers: sourceHeaders,
              skipAuth: true,
              _anonymousRetry: true,
            });
          }
          return Promise.reject(error);
        }

        recoverExpiredSession(config, authStore, t);
      }
      // Handle 403 - Forbidden
      else if (status === 403) {
        ElMessage({
          message: t("errors.unauthorized"),
          type: "error",
          duration: 5 * 1000,
        });
      }
      // Handle other errors
      else {
        ElMessage({
          message: error.response.data?.message || t("errors.unknown_error"),
          type: "error",
          duration: 5 * 1000,
        });
      }
    } else {
      // Network error
      ElMessage({
        message: t("errors.network_error"),
        type: "error",
        duration: 5 * 1000,
      });
    }

    return Promise.reject(error);
  }
);

export default service;
