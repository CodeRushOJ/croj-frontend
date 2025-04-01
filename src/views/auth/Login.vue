<template>
    <div>
        <!-- Registration success message -->
        <el-alert v-if="registrationSuccess" type="success" :title="$t('auth.register_success')" :closable="false"
            show-icon class="mb-4"></el-alert>

        <h2 class="form-title">{{ $t('auth.welcome_back') }}</h2>

        <!-- Login Form -->
        <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-position="top"
            @submit.prevent="handleLogin">
            <!-- Username/Email Field -->
            <el-form-item :label="$t('auth.account_label')" prop="account">
                <el-input v-model="loginForm.account" :placeholder="$t('auth.account_label')"
                    prefix-icon="User"></el-input>
            </el-form-item>

            <!-- Password Field -->
            <el-form-item :label="$t('auth.password')" prop="password">
                <el-input v-model="loginForm.password" type="password" :placeholder="$t('auth.password')"
                    prefix-icon="Lock" show-password></el-input>
            </el-form-item>

            <!-- Options Row -->
            <div class="options-row">
                <el-checkbox v-model="loginForm.rememberMe">{{ $t('auth.remember') }}</el-checkbox>
                <el-link type="primary" :underline="false">{{ $t('auth.forgot_password') }}</el-link>
            </div>

            <!-- Submit Button -->
            <el-form-item>
                <el-button type="primary" native-type="submit" :loading="authStore.loading" class="submit-button">
                    {{ authStore.loading ? $t('auth.signing_in') : $t('auth.sign_in') }}
                </el-button>
            </el-form-item>

            <!-- Register Link -->
            <div class="register-link">
                <span>{{ $t('auth.no_account') }}</span>
                <router-link :to="{ name: 'Register' }">
                    <el-link type="primary" :underline="false">{{ $t('auth.register') }}</el-link>
                </router-link>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ROUTE_NAMES } from '@/constants/routes'
import { User, Lock } from '@element-plus/icons-vue'

// Get route, router and auth store
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// Form reference
const loginFormRef = ref(null)

// Form data
const loginForm = reactive({
    account: '',
    password: '',
    rememberMe: false
})

// Check if user was redirected after successful registration
const registrationSuccess = computed(() => route.query.registered === 'true')

// Redirect URL after login (if any)
const redirectPath = computed(() => route.query.redirect || '/')

// Form validation rules - defined AFTER getting the t function
const rules = reactive({
    account: [
        { required: true, message: t('validation.username_required'), trigger: 'blur' }
    ],
    password: [
        { required: true, message: t('validation.password_required'), trigger: 'blur' },
        { min: 6, message: t('validation.password_length'), trigger: 'blur' }
    ]
})

// Handle login form submission
const handleLogin = async () => {
    if (!loginFormRef.value) return

    try {
        // Validate form
        await loginFormRef.value.validate()

        // Attempt login
        const success = await authStore.login(loginForm)

        if (success) {
            ElMessage.success(t('auth.login_success'))

            // Redirect to the original requested page or home
            router.push(redirectPath.value)
        }
    } catch (error) {
        console.error('Login validation error:', error)
    }
}

// Check if user is already logged in
onMounted(() => {
    if (authStore.isAuthenticated) {
        router.push({ name: ROUTE_NAMES.DASHBOARD })
    }
})
</script>

<style scoped>
.form-title {
    font-size: 24px;
    color: #303133;
    text-align: center;
    margin-bottom: 30px;
}

.options-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.submit-button {
    width: 100%;
    margin-top: 10px;
}

.register-link {
    text-align: center;
    margin-top: 20px;
}

.mb-4 {
    margin-bottom: 16px;
}
</style>