<template>
    <div class="profile-container">
        <el-card class="profile-card">
            <template #header>
                <div class="card-header">
                    <h2>{{ $t('profile.title') }}</h2>
                </div>
            </template>

            <div class="profile-content">
                <!-- User Avatar Section -->
                <div class="avatar-section">
                    <el-avatar :size="120" :src="avatarUrl" class="avatar">
                        <el-icon v-if="!avatarUrl">
                            <user />
                        </el-icon>
                    </el-avatar>
                    <div class="avatar-upload">
                        <el-upload class="avatar-uploader" :action="null" :auto-upload="false" :show-file-list="false"
                            :on-change="handleAvatarChange" accept="image/jpeg,image/png,image/gif">
                            <el-button size="small" type="primary">{{ $t('profile.change_avatar') }}</el-button>
                        </el-upload>
                        <el-button v-if="avatarFile" size="small" type="success" @click="uploadAvatar"
                            :loading="avatarUploading">
                            {{ $t('profile.upload_avatar') }}
                        </el-button>
                    </div>
                </div>

                <!-- User Info Form -->
                <el-form ref="profileFormRef" :model="profileForm" :rules="rules" label-width="120px"
                    class="profile-form" v-loading="loading">
                    <el-form-item :label="$t('auth.username')" prop="username">
                        <el-input v-model="profileForm.username" disabled />
                    </el-form-item>

                    <el-form-item :label="$t('auth.email')" prop="email">
                        <el-input v-model="profileForm.email">
                            <template #append>
                                <el-tag v-if="userInfo.emailVerified === 1" type="success" size="small">
                                    {{ $t('profile.verified') }}
                                </el-tag>
                                <el-tag v-else type="warning" size="small">
                                    {{ $t('profile.unverified') }}
                                </el-tag>
                            </template>
                        </el-input>
                    </el-form-item>

                    <el-form-item :label="$t('profile.bio')" prop="bio">
                        <el-input v-model="profileForm.bio" type="textarea" :rows="3" />
                    </el-form-item>

                    <el-form-item :label="$t('profile.github')" prop="github">
                        <el-input v-model="profileForm.github">
                            <template #prepend>github.com/</template>
                        </el-input>
                    </el-form-item>

                    <el-form-item :label="$t('profile.school')" prop="school">
                        <el-input v-model="profileForm.school" />
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="submitForm" :loading="submitLoading">
                            {{ $t('profile.save_changes') }}
                        </el-button>
                        <el-button @click="resetForm">{{ $t('profile.reset') }}</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </el-card>

        <!-- Password Change Card -->
        <el-card class="password-card">
            <template #header>
                <div class="card-header">
                    <h2>{{ $t('profile.change_password') }}</h2>
                </div>
            </template>

            <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="120px"
                v-loading="passwordLoading">
                <el-form-item :label="$t('profile.old_password')" prop="oldPassword">
                    <el-input v-model="passwordForm.oldPassword" type="password" show-password />
                </el-form-item>

                <el-form-item :label="$t('profile.new_password')" prop="newPassword">
                    <el-input v-model="passwordForm.newPassword" type="password" show-password />
                </el-form-item>

                <el-form-item :label="$t('profile.confirm_password')" prop="confirmPassword">
                    <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="changePassword" :loading="passwordSubmitLoading">
                        {{ $t('profile.update_password') }}
                    </el-button>
                    <el-button @click="resetPasswordForm">{{ $t('profile.reset') }}</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User } from '@element-plus/icons-vue';
import { useAuthStore } from '@/store/modules/auth';
import { authApi } from '@/api/auth';
import { useRouter } from 'vue-router'

const { t } = useI18n();
const router = useRouter()
const authStore = useAuthStore();

// Form references
const profileFormRef = ref(null);
const passwordFormRef = ref(null);

// Loading states
const loading = ref(false);
const submitLoading = ref(false);
const passwordLoading = ref(false);
const passwordSubmitLoading = ref(false);
const avatarUploading = ref(false);

// User information
const userInfo = ref({});

// Avatar handling
const avatarUrl = ref('');
const avatarFile = ref(null);

// Profile form data
const profileForm = reactive({
    username: '',
    email: '',
    bio: '',
    github: '',
    school: ''
});

// Password form data
const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

// Get default avatar URL with fallback
const defaultAvatarUrl = computed(() => {
    if (userInfo.value?.avatar) {
        return userInfo.value.avatar;
    }
    return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
});

// Profile form validation rules
const rules = reactive({
    email: [
        { required: true, message: t('validation.email_required'), trigger: 'blur' },
        { type: 'email', message: t('validation.email_format'), trigger: 'blur' }
    ],
    bio: [
        { max: 255, message: t('profile.bio_max_length'), trigger: 'blur' }
    ],
    github: [
        { max: 100, message: t('profile.github_max_length'), trigger: 'blur' }
    ],
    school: [
        { max: 100, message: t('profile.school_max_length'), trigger: 'blur' }
    ]
});

// Password form validation rules
const passwordRules = reactive({
    oldPassword: [
        { required: true, message: t('profile.old_password_required'), trigger: 'blur' },
    ],
    newPassword: [
        { required: true, message: t('profile.new_password_required'), trigger: 'blur' },
        { min: 6, max: 20, message: t('validation.password_length'), trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: t('profile.confirm_password_required'), trigger: 'blur' },
        { validator: validatePasswordMatch, trigger: 'blur' }
    ]
});

// Validate password match
function validatePasswordMatch(rule, value, callback) {
    if (passwordForm.newPassword !== value) {
        callback(new Error(t('validation.passwords_not_match')));
    } else {
        callback();
    }
}

// Load user information
async function loadUserInfo() {
    loading.value = true;
    try {
        // Fetch current user info
        if (!authStore.currentUser) {
            await authStore.fetchCurrentUser();
        }

        userInfo.value = authStore.currentUser;

        // Populate form with user data
        if (userInfo.value) {
            profileForm.username = userInfo.value.username || '';
            profileForm.email = userInfo.value.email || '';
            profileForm.bio = userInfo.value.bio || '';
            profileForm.github = userInfo.value.github || '';
            profileForm.school = userInfo.value.school || '';

            // Set avatar URL
            avatarUrl.value = userInfo.value.avatar || defaultAvatarUrl.value;
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
        ElMessage.error(t('profile.load_error'));
    } finally {
        loading.value = false;
    }
}

// Handle avatar file change
function handleAvatarChange(file) {
    file = file.raw || file;
    // Check file size (max 2MB)
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        ElMessage.error(t('profile.avatar_size_limit'));
        return;
    }

    // Check file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
        ElMessage.error(t('profile.avatar_type_error'));
        return;
    }

    // Preview the image
    avatarFile.value = file;
    avatarUrl.value = URL.createObjectURL(file);
}

// Upload avatar
async function uploadAvatar() {
    if (!avatarFile.value) {
        return;
    }

    try {
        avatarUploading.value = true;
        const response = await authApi.updateAvatar(avatarFile.value);

        if (response.success) {
            ElMessage.success(t('profile.avatar_update_success'));
            // Update avatar URL with the one returned from server
            avatarUrl.value = response.data;

            // Refresh user info in store to get the updated avatar
            await authStore.fetchCurrentUser();

            // Clear avatar file reference
            avatarFile.value = null;
        }
    } catch (error) {
        console.error('Failed to update avatar:', error);
        ElMessage.error(error.message || t('profile.avatar_update_error'));
    } finally {
        avatarUploading.value = false;
    }
}

// Submit profile form
async function submitForm() {
    if (!profileFormRef.value) return;

    try {
        // Validate form
        await profileFormRef.value.validate();

        submitLoading.value = true;

        // Create update DTO data
        const updateData = {
            email: profileForm.email,
            bio: profileForm.bio || '',
            github: profileForm.github || '',
            school: profileForm.school || ''
        };

        // Update profile
        const response = await authApi.updateUserInfo(updateData);

        if (response.success) {
            ElMessage.success(t('profile.update_success'));

            // Refresh user info in store
            await authStore.fetchCurrentUser();

            // Refresh local user info
            loadUserInfo();
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        ElMessage.error(error.message || t('profile.update_error'));
    } finally {
        submitLoading.value = false;
    }
}

// Reset profile form
function resetForm() {
    profileFormRef.value?.resetFields();

    // Reset avatar to original if it was changed but not uploaded
    if (avatarFile.value) {
        avatarUrl.value = userInfo.value?.avatar || defaultAvatarUrl.value;
        avatarFile.value = null;
    }

    // Re-populate form with original user data
    loadUserInfo();
}

// Change password
async function changePassword() {
    if (!passwordFormRef.value) return;

    try {
        // Validate form
        await passwordFormRef.value.validate();

        passwordSubmitLoading.value = true;

        // Update password
        const response = await authApi.updatePassword(
            passwordForm.oldPassword,
            passwordForm.newPassword,
            passwordForm.confirmPassword
        );

        if (response.success) {
            ElMessage.success(t('profile.password_update_success'));

            // Reset password form
            resetPasswordForm();

            // Show message suggesting re-login for security
            ElMessageBox.confirm(
                t('profile.relogin_suggestion'),
                t('profile.password_changed'),
                {
                    confirmButtonText: t('profile.logout_now'),
                    cancelButtonText: t('profile.later'),
                    type: 'info'
                }
            ).then(() => {
                // Logout if confirmed
                authStore.logout(router);
            }).catch(() => {
                // Do nothing if cancelled
            });
        }
    } catch (error) {
        console.error('Failed to change password:', error);
        ElMessage.error(error.message || t('profile.password_update_error'));
    } finally {
        passwordSubmitLoading.value = false;
    }
}

// Reset password form
function resetPasswordForm() {
    passwordFormRef.value?.resetFields();
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
}

// Load user info on component mount
onMounted(() => {
    loadUserInfo();
});
</script>

<style scoped>
.profile-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.profile-card,
.password-card {
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

.profile-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}

.avatar {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.avatar-upload {
    display: flex;
    gap: 10px;
}

.profile-form {
    margin-top: 20px;
}

@media (max-width: 768px) {
    .profile-container {
        padding: 0 10px;
    }
}
</style>