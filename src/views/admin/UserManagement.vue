<template>
    <div class="user-management">
        <div class="page-header">
            <h2>{{ $t('admin.user_management') }}</h2>
            <div class="page-actions">
                <el-input v-model="searchKeyword" :placeholder="$t('admin.search_user')" @input="handleSearch" clearable
                    class="search-input">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
        </div>

        <!-- 用户表格 -->
        <el-table :data="users" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="id" label="ID" width="80" sortable />
            <el-table-column prop="username" :label="$t('auth.username')" min-width="120" />
            <el-table-column prop="email" :label="$t('auth.email')" min-width="180" />

            <el-table-column :label="$t('admin.email_verified')" width="120" align="center">
                <template #default="scope">
                    <el-tag :type="scope.row.emailVerified === 1 ? 'success' : 'warning'" size="small">
                        {{ scope.row.emailVerified === 1 ? $t('admin.verified') : $t('admin.unverified') }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="roleName" :label="$t('admin.role')" width="120" align="center">
                <template #default="scope">
                    <el-tag :type="getRoleTagType(scope.row.role)" size="small">
                        {{ scope.row.roleName }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column :label="$t('admin.status')" width="120" align="center">
                <template #default="scope">
                    <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
                        {{ scope.row.statusName }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="createTime" :label="$t('admin.register_time')" min-width="180" sortable />

            <el-table-column :label="$t('admin.actions')" fixed="right" width="220" align="center">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
                        {{ $t('admin.view') }}
                    </el-button>

                    <el-button :type="scope.row.status === 0 ? 'danger' : 'success'" size="small"
                        @click="handleStatusChange(scope.row)" :disabled="!canModifyUser(scope.row)" plain>
                        {{ scope.row.status === 0 ? $t('admin.disable') : $t('admin.enable') }}
                    </el-button>

                    <el-button type="danger" size="small" @click="handleDelete(scope.row)"
                        :disabled="!canModifyUser(scope.row)">
                        {{ $t('admin.delete') }}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>

        <!-- 用户详情对话框 -->
        <el-dialog v-model="userDialogVisible" :title="$t('admin.user_details')" width="600px">
            <el-descriptions :column="1" border v-if="selectedUser">
                <el-descriptions-item :label="$t('admin.user_id')">
                    {{ selectedUser.id }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('auth.username')">
                    {{ selectedUser.username }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('auth.email')">
                    {{ selectedUser.email }}
                    <el-tag v-if="selectedUser.emailVerified === 1" type="success" class="ml-2" size="small">
                        {{ $t('admin.verified') }}
                    </el-tag>
                    <el-tag v-else type="warning" class="ml-2" size="small">
                        {{ $t('admin.unverified') }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.role')">
                    <el-tag :type="getRoleTagType(selectedUser.role)">
                        {{ selectedUser.roleName }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.status')">
                    <el-tag :type="selectedUser.status === 0 ? 'success' : 'danger'">
                        {{ selectedUser.statusName }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.register_time')">
                    {{ selectedUser.createTime }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.last_login')">
                    {{ selectedUser.lastLoginTime || $t('admin.never') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.bio')" v-if="selectedUser.bio">
                    {{ selectedUser.bio }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.school')" v-if="selectedUser.school">
                    {{ selectedUser.school }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('admin.github')" v-if="selectedUser.github">
                    <a :href="'https://github.com/' + selectedUser.github" target="_blank">{{ selectedUser.github }}</a>
                </el-descriptions-item>
            </el-descriptions>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="userDialogVisible = false">
                        {{ $t('common.close') }}
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" :title="$t('admin.confirm_delete')" width="400px">
            <div class="delete-confirmation">
                <el-icon class="delete-icon">
                    <Warning />
                </el-icon>
                <p>{{ $t('admin.delete_confirmation', { username: selectedUser?.username }) }}</p>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">
                        {{ $t('common.cancel') }}
                    </el-button>
                    <el-button type="danger" @click="confirmDelete" :loading="actionLoading">
                        {{ $t('admin.confirm') }}
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Warning } from '@element-plus/icons-vue';
import { adminApi } from '@/api';
import { useAuthStore } from '@/store/modules/auth';

const { t } = useI18n();
const route = useRoute();
const authStore = useAuthStore();

// 状态
const users = ref([]);
const loading = ref(false);
const actionLoading = ref(false);
const userDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const selectedUser = ref(null);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const searchTimeout = ref(null);

// 获取当前用户角色
const currentUserRole = computed(() => {
    return authStore.currentUser?.role || 0;
});

// 判断是否为超级管理员
const isSuperAdmin = computed(() => currentUserRole.value === 2);

// 判断是否可以修改用户（超级管理员可以修改所有人，普通管理员不能修改超级管理员）
const canModifyUser = (user) => {
    // 如果当前用户是超级管理员，可以修改任何人（除了自己）
    if (isSuperAdmin.value) {
        return user.id !== authStore.currentUser?.id;
    }

    // 普通管理员不能修改超级管理员和其他管理员
    return user.role < 1;
};

// 获取角色标签类型
const getRoleTagType = (role) => {
    switch (role) {
        case 2: return 'danger'; // 超级管理员
        case 1: return 'warning'; // 管理员
        default: return 'info'; // 普通用户
    }
};

// 带分页获取用户
const fetchUsers = async () => {
    loading.value = true;
    try {
        const response = await adminApi.getUsers({
            current: currentPage.value,
            size: pageSize.value,
            keyword: searchKeyword.value
        });

        users.value = response.data.records || [];
        total.value = response.data.total || 0;

        // 如果URL中有ID参数，自动打开该用户的详情
        const userId = route.query.id;
        if (userId) {
            const user = users.value.find(u => u.id === Number(userId));
            if (user) {
                handleView(user);
            } else {
                // 如果在当前页面没找到，可能在其他页面，尝试直接获取
                try {
                    const userResponse = await adminApi.getUserById(userId);
                    if (userResponse.data) {
                        handleView(userResponse.data);
                    }
                } catch (e) {
                    console.error('Failed to get user by ID:', e);
                }
            }
        }
    } catch (error) {
        console.error('获取用户列表失败:', error);
        ElMessage.error(t('admin.fetch_users_error'));
    } finally {
        loading.value = false;
    }
};

// 处理搜索输入（带防抖）
const handleSearch = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
        currentPage.value = 1; // 搜索时重置到第一页
        fetchUsers();
    }, 300);
};

// 查看用户详情
const handleView = (user) => {
    selectedUser.value = user;
    userDialogVisible.value = true;
};

// 处理状态变更（启用/禁用）
const handleStatusChange = (user) => {
    // 确保当前用户有权限修改此用户
    if (!canModifyUser(user)) {
        if (user.role === 2) {
            ElMessage.warning(t('admin.cannot_change_super_admin'));
        } else if (user.role === 1) {
            ElMessage.warning(t('admin.cannot_change_admin'));
        }
        return;
    }

    const newStatus = user.status === 0 ? 1 : 0;
    const actionText = newStatus === 0 ? t('admin.enable') : t('admin.disable');

    ElMessageBox.confirm(
        t('admin.status_confirmation', {
            username: user.username,
            action: actionText.toLowerCase()
        }),
        t('common.warning'),
        {
            confirmButtonText: t('admin.confirm'),
            cancelButtonText: t('common.cancel'),
            type: 'warning'
        }
    ).then(async () => {
        actionLoading.value = true;
        try {
            await adminApi.updateUserStatus(user.id, newStatus);
            ElMessage.success(t('admin.status_updated'));

            // 更新列表中的用户
            user.status = newStatus;
            user.statusName = newStatus === 0 ? t('admin.normal') : t('admin.disabled');

            // 如果是查看的用户，也更新它
            if (selectedUser.value && selectedUser.value.id === user.id) {
                selectedUser.value.status = newStatus;
                selectedUser.value.statusName = newStatus === 0 ? t('admin.normal') : t('admin.disabled');
            }
        } catch (error) {
            console.error('更新用户状态失败:', error);
            ElMessage.error(t('admin.update_status_error'));
        } finally {
            actionLoading.value = false;
        }
    }).catch(() => {
        // 用户取消
    });
};

// 处理删除按钮点击
const handleDelete = (user) => {
    // 确保当前用户有权限删除此用户
    if (!canModifyUser(user)) {
        if (user.role === 2) {
            ElMessage.warning(t('admin.cannot_delete_super_admin'));
        } else if (user.role === 1) {
            ElMessage.warning(t('admin.cannot_delete_admin'));
        }
        return;
    }

    selectedUser.value = user;
    deleteDialogVisible.value = true;
};

// 确认删除操作
const confirmDelete = async () => {
    if (!selectedUser.value) return;

    actionLoading.value = true;
    try {
        await adminApi.deleteUser(selectedUser.value.id);
        ElMessage.success(t('admin.user_deleted'));

        // 从列表中移除并关闭对话框
        users.value = users.value.filter(u => u.id !== selectedUser.value.id);
        deleteDialogVisible.value = false;

        // 如果列表现在为空但应该有更多页，则重新获取
        if (users.value.length === 0 && total.value > 0) {
            // 如果不是第一页，则转到上一页
            if (currentPage.value > 1) {
                currentPage.value--;
            }
            fetchUsers();
        } else {
            // 只更新总数
            total.value--;
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        ElMessage.error(t('admin.delete_user_error'));
    } finally {
        actionLoading.value = false;
    }
};

// 分页处理程序
const handleSizeChange = (size) => {
    pageSize.value = size;
    fetchUsers();
};

const handleCurrentChange = (page) => {
    currentPage.value = page;
    fetchUsers();
};

// 监听变化以获取数据
watch([currentPage, pageSize], () => {
    fetchUsers();
});

// 组件挂载时获取用户
onMounted(() => {
    fetchUsers();
});

// 添加翻译
useI18n().mergeLocaleMessage('en', {
    admin: {
        user_management: 'User Management',
        search_user: 'Search by username or email',
        email_verified: 'Email Status',
        verified: 'Verified',
        unverified: 'Unverified',
        role: 'Role',
        status: 'Status',
        actions: 'Actions',
        view: 'View',
        disable: 'Disable',
        enable: 'Enable',
        delete: 'Delete',
        user_details: 'User Details',
        user_id: 'User ID',
        last_login: 'Last Login',
        never: 'Never',
        bio: 'Bio',
        school: 'School',
        github: 'GitHub',
        confirm_delete: 'Confirm Delete',
        delete_confirmation: 'Are you sure you want to delete the user {username}? This action cannot be undone.',
        confirm: 'Confirm',
        status_confirmation: 'Are you sure you want to {action} the user {username}?',
        cannot_change_super_admin: 'Cannot modify super admin',
        cannot_delete_super_admin: 'Cannot delete super admin',
        cannot_change_admin: 'Regular admin cannot modify other admins',
        cannot_delete_admin: 'Regular admin cannot delete other admins',
        status_updated: 'User status updated successfully',
        user_deleted: 'User deleted successfully',
        fetch_users_error: 'Failed to fetch users',
        update_status_error: 'Failed to update user status',
        delete_user_error: 'Failed to delete user',
        normal: 'Normal',
        disabled: 'Disabled'
    }
});

useI18n().mergeLocaleMessage('zh-CN', {
    admin: {
        user_management: '用户管理',
        search_user: '搜索用户名或邮箱',
        email_verified: '邮箱状态',
        verified: '已验证',
        unverified: '未验证',
        role: '角色',
        status: '状态',
        actions: '操作',
        view: '查看',
        disable: '禁用',
        enable: '启用',
        delete: '删除',
        user_details: '用户详情',
        user_id: '用户ID',
        last_login: '最后登录',
        never: '从未登录',
        bio: '个人简介',
        school: '学校',
        github: 'GitHub账号',
        confirm_delete: '确认删除',
        delete_confirmation: '您确定要删除用户 {username} 吗？此操作不可撤销。',
        confirm: '确认',
        status_confirmation: '您确定要{action}用户 {username} 吗？',
        cannot_change_super_admin: '无法修改超级管理员',
        cannot_delete_super_admin: '无法删除超级管理员',
        cannot_change_admin: '普通管理员无法修改其他管理员',
        cannot_delete_admin: '普通管理员无法删除其他管理员',
        status_updated: '用户状态更新成功',
        user_deleted: '用户删除成功',
        fetch_users_error: '获取用户列表失败',
        update_status_error: '更新用户状态失败',
        delete_user_error: '删除用户失败',
        normal: '正常',
        disabled: '禁用'
    }
});
</script>

<style scoped>
.user-management {
    padding: 0 10px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0;
}

.page-actions {
    display: flex;
    gap: 15px;
}

.search-input {
    width: 300px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.delete-confirmation {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
}

.delete-icon {
    font-size: 48px;
    color: #f56c6c;
}

.ml-2 {
    margin-left: 8px;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .page-actions {
        width: 100%;
    }

    .search-input {
        width: 100%;
    }
}
</style>