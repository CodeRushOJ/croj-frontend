<template>
    <div class="admin-dashboard">
        <h2>{{ $t('admin.dashboard_title') }}</h2>

        <!-- 统计卡片 -->
        <el-row :gutter="20" class="stats-row">
            <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stats-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>{{ $t('admin.total_users') }}</span>
                            <el-icon>
                                <User />
                            </el-icon>
                        </div>
                    </template>
                    <div v-if="loading" class="stats-loading">
                        <el-skeleton-item variant="h3" style="width: 50%" />
                    </div>
                    <template v-else>
                        <div class="stats-value">{{ stats.userCount || 0 }}</div>
                    </template>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stats-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>{{ $t('admin.active_users') }}</span>
                            <el-icon>
                                <UserFilled />
                            </el-icon>
                        </div>
                    </template>
                    <div v-if="loading" class="stats-loading">
                        <el-skeleton-item variant="h3" style="width: 50%" />
                    </div>
                    <template v-else>
                        <div class="stats-value">{{ stats.activeUserCount || 0 }}</div>
                    </template>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stats-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>{{ $t('admin.verified_users') }}</span>
                            <el-icon>
                                <Check />
                            </el-icon>
                        </div>
                    </template>
                    <div v-if="loading" class="stats-loading">
                        <el-skeleton-item variant="h3" style="width: 50%" />
                    </div>
                    <template v-else>
                        <div class="stats-value">{{ stats.verifiedUserCount || 0 }}</div>
                        <div class="stats-percentage">
                            {{ calculatePercentage(stats.verifiedUserCount, stats.userCount) }}% {{ $t('admin.of_total')
                            }}
                        </div>
                    </template>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
                <el-card class="stats-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>{{ $t('admin.today_registered') }}</span>
                            <el-icon>
                                <Calendar />
                            </el-icon>
                        </div>
                    </template>
                    <div v-if="loading" class="stats-loading">
                        <el-skeleton-item variant="h3" style="width: 50%" />
                    </div>
                    <template v-else>
                        <div class="stats-value">{{ stats.todayUserCount || 0 }}</div>
                    </template>
                </el-card>
            </el-col>
        </el-row>

        <!-- 最近用户 -->
        <div class="recent-section">
            <div class="section-header">
                <h3>{{ $t('admin.recent_users') }}</h3>
                <el-button type="primary" size="small" @click="goToUsers">
                    {{ $t('admin.view_all') }}
                </el-button>
            </div>

            <el-table :data="recentUsers" style="width: 100%" v-loading="loading" border>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="username" :label="$t('auth.username')" min-width="120" />
                <el-table-column prop="email" :label="$t('auth.email')" min-width="200" />
                <el-table-column :label="$t('admin.email_verified')" width="120" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.emailVerified === 1 ? 'success' : 'warning'" size="small">
                            {{ scope.row.emailVerified === 1 ? $t('admin.verified') : $t('admin.unverified') }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" :label="$t('admin.register_time')" min-width="180" />
                <el-table-column :label="$t('admin.status')" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
                            {{ scope.row.statusName }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('admin.actions')" width="120" align="center" fixed="right">
                    <template #default="scope">
                        <router-link :to="`/admin/users?id=${scope.row.id}`">
                            <el-button type="primary" size="small" plain>
                                {{ $t('admin.details') }}
                            </el-button>
                        </router-link>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { User, UserFilled, Check, Calendar } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ROUTE_NAMES } from '@/constants/routes';
import { adminApi } from '@/api';

const router = useRouter();
const { t } = useI18n();
const loading = ref(true);

// 统计数据
const stats = ref({
    userCount: 0,
    activeUserCount: 0,
    verifiedUserCount: 0,
    todayUserCount: 0
});

// 最近用户列表
const recentUsers = ref([]);

// 导航到用户管理页面
const goToUsers = () => {
    router.push({ name: ROUTE_NAMES.ADMIN_USERS });
};

// 计算百分比
const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
};

// 获取仪表板数据
const fetchDashboardData = async () => {
    loading.value = true;
    try {
        // 获取用户统计数据
        // 实际中应该有专门的API，这里使用现有API模拟
        const response = await adminApi.getUsers({
            current: 1,
            size: 10
        });

        if (response.data) {
            const users = response.data.records || [];
            recentUsers.value = users.slice(0, 5); // 只取前5个用户

            // 通过用户数据计算基本统计信息
            const totalUsers = response.data.total || 0;
            const verified = users.filter(u => u.emailVerified === 1).length;
            const active = users.filter(u => u.status === 0).length;

            // 更新统计数据
            stats.value = {
                userCount: totalUsers,
                verifiedUserCount: verified,
                activeUserCount: active,
                todayUserCount: 0 // 实际应该从后端获取
            };
        }
    } catch (error) {
        console.error('获取仪表板数据失败:', error);
        ElMessage.error(t('admin.fetch_data_error'));
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchDashboardData();
});

// 添加翻译
useI18n().mergeLocaleMessage('en', {
    admin: {
        dashboard_title: 'Admin Dashboard',
        total_users: 'Total Users',
        active_users: 'Active Users',
        verified_users: 'Verified Users',
        today_registered: 'Today Registered',
        of_total: 'of total',
        recent_users: 'Recent Users',
        view_all: 'View All',
        register_time: 'Registration Time',
        status: 'Status',
        actions: 'Actions',
        details: 'Details',
        email_verified: 'Email Status',
        verified: 'Verified',
        unverified: 'Unverified',
        fetch_data_error: 'Failed to fetch dashboard data'
    }
});

useI18n().mergeLocaleMessage('zh-CN', {
    admin: {
        dashboard_title: '管理控制台',
        total_users: '用户总数',
        active_users: '活跃用户',
        verified_users: '已验证用户',
        today_registered: '今日注册',
        of_total: '占总数',
        recent_users: '最近注册用户',
        view_all: '查看全部',
        register_time: '注册时间',
        status: '状态',
        actions: '操作',
        details: '详情',
        email_verified: '邮箱状态',
        verified: '已验证',
        unverified: '未验证',
        fetch_data_error: '获取仪表板数据失败'
    }
});
</script>

<style scoped>
.admin-dashboard {
    padding: 0 10px;
}

.stats-row {
    margin-bottom: 30px;
}

.stats-card {
    margin-bottom: 20px;
    height: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stats-value {
    font-size: 36px;
    font-weight: bold;
    color: #303133;
    margin: 10px 0;
}

.stats-percentage {
    color: #909399;
    font-size: 14px;
}

.stats-loading {
    height: 60px;
    display: flex;
    align-items: center;
}

.recent-section {
    margin-top: 20px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.section-header h3 {
    margin: 0;
}
</style>