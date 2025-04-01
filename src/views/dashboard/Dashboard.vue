<template>
    <div class="dashboard-container">
        <!-- Email Verification Banner -->
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

// Get user from store
const user = computed(() => authStore.currentUser)

// Add translations for dashboard
useI18n().mergeLocaleMessage('en', {
    dashboard: {
        greeting: 'Hello, {username}!',
        user_info: 'User Information',
        role: 'Role',
        status: 'Status',
        last_login: 'Last Login',
        register_time: 'Register Time',
        stats: 'Statistics',
        solved_problems: 'Solved Problems',
        submissions: 'Submissions',
        contests: 'Contests',
        recent_activities: 'Recent Activities',
        no_activities: 'No recent activities',
        verified: 'Verified',
        unverified: 'Unverified'
    }
})

useI18n().mergeLocaleMessage('zh-CN', {
    dashboard: {
        greeting: '你好，{username}！',
        user_info: '用户信息',
        role: '角色',
        status: '状态',
        last_login: '最后登录',
        register_time: '注册时间',
        stats: '统计数据',
        solved_problems: '已解决问题',
        submissions: '提交记录',
        contests: '参与竞赛',
        recent_activities: '最近活动',
        no_activities: '暂无活动记录',
        verified: '已验证',
        unverified: '未验证'
    }
})

// Fetch user info if needed
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
    color: #409EFF;
}

.stat-label {
    font-size: 14px;
    color: #606266;
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