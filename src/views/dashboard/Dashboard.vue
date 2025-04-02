<template>
    <div class="dashboard-container">
        <!-- 邮箱验证横幅 -->
        <EmailVerificationBanner />

        <el-card class="welcome-card">
            <template #header>
                <div class="card-header">
                    <h2>{{ $t('app.welcome') }}</h2>
                </div>
            </template>
            <div class="card-content">
                <p>{{ $t('dashboard.greeting', { username: user?.username }) }}</p>

                <el-divider />

                <div class="user-info">
                    <h3>{{ $t('dashboard.user_info') }}</h3>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item :label="$t('auth.username')">
                            {{ user?.username || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="$t('auth.email')">
                            {{ user?.email || '-' }}
                            <el-tag v-if="user?.emailVerified === 1" type="success" size="small" class="ml-2">
                                {{ $t('dashboard.verified') }}
                            </el-tag>
                            <el-tag v-else type="warning" size="small" class="ml-2">
                                {{ $t('dashboard.unverified') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="$t('dashboard.role')">
                            {{ user?.roleName || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="$t('dashboard.status')">
                            <el-tag :type="user?.status === 0 ? 'success' : 'danger'">
                                {{ user?.statusName }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="$t('dashboard.last_login')">
                            {{ user?.lastLoginTime || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="$t('dashboard.register_time')">
                            {{ user?.createTime || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-card>

        <div class="dashboard-row">
            <el-card class="stat-card">
                <template #header>
                    <div class="card-header">
                        <h3>{{ $t('dashboard.stats') }}</h3>
                    </div>
                </template>
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-value">0</div>
                        <div class="stat-label">{{ $t('dashboard.solved_problems') }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">0</div>
                        <div class="stat-label">{{ $t('dashboard.submissions') }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">0</div>
                        <div class="stat-label">{{ $t('dashboard.contests') }}</div>
                    </div>
                </div>
            </el-card>

            <el-card class="recent-card">
                <template #header>
                    <div class="card-header">
                        <h3>{{ $t('dashboard.recent_activities') }}</h3>
                    </div>
                </template>
                <div class="empty-data">
                    <el-empty :description="$t('dashboard.no_activities')"></el-empty>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useI18n } from 'vue-i18n'
import EmailVerificationBanner from '@/components/common/EmailVerificationBanner.vue'

const { t } = useI18n()
const authStore = useAuthStore()

// 获取用户
const user = computed(() => authStore.currentUser)

// 获取用户信息
onMounted(async () => {
    if (!user.value && authStore.token) {
        await authStore.fetchCurrentUser()
    }
})
</script>

<style scoped>
.dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.welcome-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h2 {
    margin: 0;
    font-size: 18px;
}

.card-header h3 {
    margin: 0;
    font-size: 16px;
}

.card-content {
    font-size: 14px;
}

.user-info {
    margin-top: 20px;
}

.user-info h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
}

.dashboard-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.stat-card,
.recent-card {
    flex: 1;
    min-width: 300px;
}

.stats-container {
    display: flex;
    justify-content: space-around;
    text-align: center;
}

.stat-item {
    padding: 10px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--el-color-primary);
}

.stat-label {
    font-size: 14px;
    color: var(--text-color-secondary);
    margin-top: 5px;
}

.empty-data {
    padding: 20px 0;
}

.ml-2 {
    margin-left: 8px;
}

@media (max-width: 768px) {
    .dashboard-row {
        flex-direction: column;
    }
}
</style>