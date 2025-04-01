<template>
    <div class="verify-email-container">
        <el-card class="verify-card">
            <template #header>
                <div class="card-header">
                    <h1>{{ $t('email.verify_email') }}</h1>
                </div>
            </template>

            <div v-if="loading" class="loading-container">
                <el-skeleton :rows="3" animated />
            </div>

            <div v-else-if="verified" class="success-container">
                <el-result icon="success" :title="$t('email.verification_success')"
                    :sub-title="$t('email.verification_success_message')">
                    <template #extra>
                        <el-button type="primary" @click="goToLogin">{{ $t('email.go_to_login') }}</el-button>
                    </template>
                </el-result>
            </div>

            <div v-else-if="error" class="error-container">
                <el-result icon="error" :title="$t('email.verification_failed')" :sub-title="error">
                    <template #extra>
                        <el-button type="primary" @click="goToLogin">{{ $t('email.go_to_login') }}</el-button>
                    </template>
                </el-result>
            </div>

            <div v-else-if="missingParams" class="error-container">
                <el-result icon="warning" :title="$t('email.missing_parameters')" :sub-title="$t('email.invalid_link')">
                    <template #extra>
                        <el-button type="primary" @click="goToLogin">{{ $t('email.go_to_login') }}</el-button>
                    </template>
                </el-result>
            </div>

            <div v-else class="verifying-container">
                <div class="text-center">
                    <el-icon class="is-loading">
                        <loading />
                    </el-icon>
                    <p>{{ $t('email.verifying_email') }}</p>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { emailApi } from '@/api'
import { ElMessage } from 'element-plus'
import { ROUTE_NAMES } from '@/constants/routes'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(true)
const verified = ref(false)
const error = ref(null)
const missingParams = ref(false)

// Verify email automatically on mount
onMounted(async () => {
    const userId = route.query.userId
    const code = route.query.code

    // Check if userId and code are provided
    if (!userId || !code) {
        missingParams.value = true
        loading.value = false
        return
    }

    try {
        loading.value = true
        await emailApi.verifyEmail(userId, code)
        verified.value = true
        ElMessage.success(t('email.verification_success'))
    } catch (err) {
        error.value = err.message || t('email.verification_failed_message')
    } finally {
        loading.value = false
    }
})

// Navigate to login page
const goToLogin = () => {
    router.push({ name: ROUTE_NAMES.LOGIN })
}
</script>

<style scoped>
.verify-email-container {
    max-width: 600px;
    margin: 40px auto;
    padding: 0 20px;
}

.verify-card {
    border-radius: 8px;
}

.card-header {
    text-align: center;
}

.card-header h1 {
    font-size: 24px;
    margin: 0;
}

.loading-container,
.success-container,
.error-container,
.verifying-container {
    padding: 20px 0;
}

.text-center {
    text-align: center;
}

.el-icon {
    font-size: 32px;
    color: #409EFF;
    margin-bottom: 10px;
}
</style>