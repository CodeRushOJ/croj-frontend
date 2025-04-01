import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/modules/auth";
import { ElMessage } from "element-plus";
import { ROUTE_NAMES } from "@/constants/routes";

/**
 * Custom hook for auth-related functionality
 * @returns {Object} - Auth utilities and state
 */
export function useAuth() {
  const { t } = useI18n();
  const router = useRouter();
  const authStore = useAuthStore();

  // Form refs
  const loginFormRef = ref(null);
  const registerFormRef = ref(null);

  // Login form data
  const loginForm = reactive({
    account: "",
    password: "",
    rememberMe: false,
  });

  // Register form data
  const registerForm = reactive({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    captcha: "12345", // Pre-filled for demo
  });

  // Validation states
  const validatingUsername = ref(false);
  const validatingEmail = ref(false);

  // Check if user is authenticated
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  // Check if user is admin
  const isAdmin = computed(() => authStore.isAdmin);

  // Get current user
  const currentUser = computed(() => authStore.currentUser);

  // Login validation rules
  const loginRules = reactive({
    account: [
      {
        required: true,
        message: t("validation.username_required"),
        trigger: "blur",
      },
    ],
    password: [
      {
        required: true,
        message: t("validation.password_required"),
        trigger: "blur",
      },
      { min: 6, message: t("validation.password_length"), trigger: "blur" },
    ],
  });

  // Register validation rules
  const registerRules = reactive({
    username: [
      {
        required: true,
        message: t("validation.username_required"),
        trigger: "blur",
      },
      {
        min: 3,
        max: 20,
        message: t("validation.username_length"),
        trigger: "blur",
      },
      {
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: t("validation.username_format"),
        trigger: "blur",
      },
      { validator: checkUsernameUnique, trigger: "blur" },
    ],
    email: [
      {
        required: true,
        message: t("validation.email_required"),
        trigger: "blur",
      },
      { type: "email", message: t("validation.email_format"), trigger: "blur" },
      { validator: checkEmailUnique, trigger: "blur" },
    ],
    password: [
      {
        required: true,
        message: t("validation.password_required"),
        trigger: "blur",
      },
      {
        min: 6,
        max: 20,
        message: t("validation.password_length"),
        trigger: "blur",
      },
    ],
    confirmPassword: [
      {
        required: true,
        message: t("validation.confirm_password_required"),
        trigger: "blur",
      },
      { validator: validatePasswordMatch, trigger: "blur" },
    ],
    captcha: [
      {
        required: true,
        message: t("validation.captcha_required"),
        trigger: "blur",
      },
    ],
  });

  // Check if username is unique
  async function checkUsernameUnique(rule, value, callback) {
    if (!value || validatingUsername.value) {
      callback();
      return;
    }

    validatingUsername.value = true;
    try {
      const exists = await authStore.checkUsername(value);
      validatingUsername.value = false;

      if (exists) {
        callback(new Error(t("validation.username_exists")));
      } else {
        callback();
      }
    } catch (error) {
      validatingUsername.value = false;
      callback();
    }
  }

  // Check if email is unique
  async function checkEmailUnique(rule, value, callback) {
    if (!value || validatingEmail.value) {
      callback();
      return;
    }

    validatingEmail.value = true;
    try {
      const exists = await authStore.checkEmail(value);
      validatingEmail.value = false;

      if (exists) {
        callback(new Error(t("validation.email_exists")));
      } else {
        callback();
      }
    } catch (error) {
      validatingEmail.value = false;
      callback();
    }
  }

  // Validate password match
  function validatePasswordMatch(rule, value, callback) {
    if (registerForm.password !== value) {
      callback(new Error(t("validation.passwords_not_match")));
    } else {
      callback();
    }
  }

  // Handle login
  async function handleLogin() {
    if (!loginFormRef.value) return;

    try {
      // Validate form
      await loginFormRef.value.validate();

      // Attempt login
      const success = await authStore.login(loginForm);

      if (success) {
        ElMessage.success(t("auth.login_success"));

        // Redirect to dashboard
        router.push({ name: ROUTE_NAMES.DASHBOARD });
      }
    } catch (error) {
      console.error("Login validation error:", error);
    }
  }

  // Handle register
  async function handleRegister() {
    if (!registerFormRef.value) return;

    try {
      // Validate form
      await registerFormRef.value.validate();

      // Attempt registration
      const userId = await authStore.register(registerForm);

      if (userId) {
        ElMessage.success(t("auth.register_success"));

        // Redirect to login page
        router.push({ name: ROUTE_NAMES.LOGIN, query: { registered: "true" } });
      }
    } catch (error) {
      console.error("Registration validation error:", error);
    }
  }

  // Handle logout
  function handleLogout() {
    authStore.logout();
    ElMessage.success(t("auth.logout_success"));
    router.push({ name: ROUTE_NAMES.LOGIN });
  }

  // Reset forms
  function resetLoginForm() {
    if (loginFormRef.value) {
      loginFormRef.value.resetFields();
    }
  }

  function resetRegisterForm() {
    if (registerFormRef.value) {
      registerFormRef.value.resetFields();
    }
  }

  return {
    // State
    loginForm,
    registerForm,
    loginFormRef,
    registerFormRef,
    loginRules,
    registerRules,

    // Computed
    isAuthenticated,
    isAdmin,
    currentUser,

    // Methods
    handleLogin,
    handleRegister,
    handleLogout,
    resetLoginForm,
    resetRegisterForm,
    validateUsername: checkUsernameUnique,
    validateEmail: checkEmailUnique,
  };
}

export default useAuth;
