<template>
    <div>
        <h2 class="form-title">{{ $t('auth.create_account') }}</h2>

        <!-- Registration Form -->
        <el-form ref="registerFormRef" :model="registerForm" :rules="rules" label-position="top"
            @submit.prevent="handleRegister">
            <!-- Username Field -->
            <el-form-item :label="$t('auth.username')" prop="username">
                <el-input v-model="registerForm.username" :placeholder="$t('auth.username')" prefix-icon="User"
                    @blur="validateUsername"></el-input>
            </el-form-item>

            <!-- Email Field -->
            <el-form-item :label="$t('auth.email')" prop="email">
                <el-input v-model="registerForm.email" type="email" :placeholder="$t('auth.email')"
                    prefix-icon="Message" @blur="validateEmail"></el-input>
            </el-form-item>

            <!-- Email Verification Code Field -->
            <el-form-item :label="$t('auth.email_code')" prop="emailCode">
                <div class="code-input-group">
                    <el-input v-model="registerForm.emailCode" :placeholder="$t('auth.email_code')"
                        prefix-icon="Key"></el-input>
                    <el-button type="primary" @click="sendEmailCode" :loading="sendingEmailCode" :disabled="emailCodeSent">
                        {{ emailCodeSent ? $t('auth.code_sent') + `(${countdown}s)` : $t('auth.send_code') }}
                    </el-button>
                </div>
            </el-form-item>

            <!-- Password Field -->
            <el-form-item :label="$t('auth.password')" prop="password">
                <el-input v-model="registerForm.password" type="password" :placeholder="$t('auth.password')"
                    prefix-icon="Lock" show-password></el-input>
            </el-form-item>

            <!-- Confirm Password Field -->
            <el-form-item :label="$t('auth.confirm_password')" prop="confirmPassword">
                <el-input v-model="registerForm.confirmPassword" type="password"
                    :placeholder="$t('auth.confirm_password')" prefix-icon="Lock" show-password></el-input>
            </el-form-item>

            <!-- Captcha Field -->
            <el-form-item :label="$t('auth.verification_code')" prop="captcha">
                <Captcha v-model="captchaData" />
            </el-form-item>

            <!-- Submit Button -->
            <el-form-item>
                <el-button type="primary" native-type="submit" :loading="authStore.loading" class="submit-button"
                    :disabled="!isFormValid">
                    {{ authStore.loading ? $t('auth.registering') : $t('auth.sign_up') }}
                </el-button>
            </el-form-item>

            <!-- Login Link -->
            <div class="login-link">
                <span>{{ $t('auth.already_registered') }}</span>
                <router-link :to="{ name: 'Login' }">
                    <el-link type="primary" :underline="false">{{ $t('auth.login') }}</el-link>
                </router-link>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ROUTE_NAMES } from '@/constants/routes'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import Captcha from '@/components/common/Captcha.vue'
import { emailApi } from '@/api'

// Get router and auth store
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// Form reference
const registerFormRef = ref(null)

// Captcha data
const captchaData = ref({
    captcha: '',
    captchaKey: ''
})

// Email verification code state
const sendingEmailCode = ref(false)
const emailCodeSent = ref(false)
const countdown = ref(0)
let countdownTimer = null

// Form data
const registerForm = reactive({
    username: '',
    email: '',
    emailCode: '',
    password: '',
    confirmPassword: '',
    captcha: '',
    captchaKey: ''
})

// Is username being validated
const validatingUsername = ref(false)
const validatingEmail = ref(false)

// Check if username is unique
async function checkUsernameUnique(rule, value, callback) {
    if (!value || validatingUsername.value) {
        callback()
        return
    }

    validatingUsername.value = true
    try {
        const exists = await authStore.checkUsername(value)
        validatingUsername.value = false

        if (exists) {
            callback(new Error(t('validation.username_exists')))
        } else {
            callback()
        }
    } catch (error) {
        validatingUsername.value = false
        callback()
    }
}

// Check if email is unique
async function checkEmailUnique(rule, value, callback) {
    if (!value || validatingEmail.value) {
        callback()
        return
    }

    validatingEmail.value = true
    try {
        const exists = await authStore.checkEmail(value)
        validatingEmail.value = false

        if (exists) {
            callback(new Error(t('validation.email_exists')))
        } else {
            callback()
        }
    } catch (error) {
        validatingEmail.value = false
        callback()
    }
}

// Validate password match
function validatePasswordMatch(rule, value, callback) {
    if (registerForm.password !== value) {
        callback(new Error(t('validation.passwords_not_match')))
    } else {
        callback()
    }
}

// Form validation rules
const rules = reactive({
    username: [
        { required: true, message: t('validation.username_required'), trigger: 'blur' },
        { min: 3, max: 20, message: t('validation.username_length'), trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_-]+$/, message: t('validation.username_format'), trigger: 'blur' },
        { validator: checkUsernameUnique, trigger: 'blur' }
    ],
    email: [
        { required: true, message: t('validation.email_required'), trigger: 'blur' },
        { type: 'email', message: t('validation.email_format'), trigger: 'blur' },
        { validator: checkEmailUnique, trigger: 'blur' }
    ],
    emailCode: [
        { required: true, message: t('validation.email_code_required'), trigger: 'blur' }
    ],
    password: [
        { required: true, message: t('validation.password_required'), trigger: 'blur' },
        { min: 6, max: 20, message: t('validation.password_length'), trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: t('validation.confirm_password_required'), trigger: 'blur' },
        { validator: validatePasswordMatch, trigger: 'blur' }
    ],
    captcha: [
        { required: true, message: t('validation.captcha_required'), trigger: 'blur' }
    ]
})

// Watch captcha data changes
watch(captchaData, (newVal) => {
    registerForm.captcha = newVal.captcha
    registerForm.captchaKey = newVal.captchaKey
}, { deep: true })

// Check if form is valid
const isFormValid = computed(() => {
    return (
        registerForm.username &&
        registerForm.email &&
        registerForm.emailCode &&
        registerForm.password &&
        registerForm.confirmPassword &&
        registerForm.password === registerForm.confirmPassword &&
        registerForm.captcha &&
        registerForm.captchaKey
    )
})

// Validate username field manually
const validateUsername = () => {
    if (registerFormRef.value) {
        registerFormRef.value.validateField('username')
    }
}

// Validate email field manually
const validateEmail = () => {
    if (registerFormRef.value) {
        registerFormRef.value.validateField('email')
    }
}

// Send email verification code
const sendEmailCode = async () => {
    // Validate email field
    try {
        await registerFormRef.value.validateField('email')
        await registerFormRef.value.validateField('username')
    } catch (error) {
        return
    }

    sendingEmailCode.value = true
    try {
        await emailApi.sendVerificationCode(registerForm.email, registerForm.username)
        ElMessage.success(t('validation.email_code_sent'))
        emailCodeSent.value = true
        startCountdown()
    } catch (error) {
        ElMessage.error(error.message || t('validation.email_code_send_failed'))
    } finally {
        sendingEmailCode.value = false
    }
}

// Start countdown timer
const startCountdown = () => {
    countdown.value = 60
    countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(countdownTimer)
            emailCodeSent.value = false
        }
    }, 1000)
}

// Handle register form submission
const handleRegister = async () => {
    if (!registerFormRef.value) return

    try {
        // Add captcha data to form
        registerForm.captcha = captchaData.value.captcha
        registerForm.captchaKey = captchaData.value.captchaKey

        // Validate form
        await registerFormRef.value.validate()

        // Attempt registration
        const userId = await authStore.register(registerForm)

        if (userId) {
            ElMessage.success(t('auth.register_success'))

            // Redirect to login page with success message
            router.push({ name: ROUTE_NAMES.LOGIN, query: { registered: 'true' } })
        } else {
            // Refresh captcha on failure
            captchaData.value = { captcha: '', captchaKey: '' }
        }
    } catch (error) {
        console.error('Registration validation error:', error)
        // Refresh captcha on failure
        captchaData.value = { captcha: '', captchaKey: '' }
    }
}

// Check if user is already logged in
onMounted(() => {
    if (authStore.isAuthenticated) {
        router.push({ name: ROUTE_NAMES.DASHBOARD })
    }
})

// Clear timer on component unmount
onUnmounted(() => {
    if (countdownTimer) {
        clearInterval(countdownTimer)
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

[data-theme="dark"] .form-title {
    color: #e0e0e0;
}

.code-input-group {
    display: flex;
    gap: 10px;
}

.code-input-group .el-input {
    flex: 1;
}

.submit-button {
    width: 100%;
    margin-top: 10px;
}

.login-link {
    text-align: center;
    margin-top: 20px;
}
</style>