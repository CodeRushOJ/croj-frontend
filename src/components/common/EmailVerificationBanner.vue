<template>
    <el-alert
      v-if="!isEmailVerified"
      type="warning"
      show-icon
      :closable="false"
      class="email-verification-banner"
    >
      <template #title>
        <span>{{ $t('email.verification_required') }}</span>
      </template>
      <template #default>
        <div class="verification-actions">
          <span>{{ $t('email.verification_message') }}</span>
          <el-button type="primary" size="small" @click="sendVerificationLink" :loading="loading">
            {{ $t('email.send_verification') }}
          </el-button>
        </div>
      </template>
    </el-alert>
  </template>
  
  <script setup>
  import { computed, ref } from 'vue'
  import { useAuthStore } from '@/store/modules/auth'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { emailApi } from '@/api'
  
  const authStore = useAuthStore()
  const { t } = useI18n()
  const loading = ref(false)
  
  // Check if the user's email is verified
  const isEmailVerified = computed(() => {
    return authStore.currentUser && authStore.currentUser.emailVerified === 1
  })
  
  // Send verification link
  const sendVerificationLink = async () => {
    loading.value = true
    try {
      await emailApi.sendVerificationLink()
      ElMessage.success(t('email.verification_sent'))
    } catch (error) {
      ElMessage.error(error.message || t('errors.unknown_error'))
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  .email-verification-banner {
    margin-bottom: 15px;
  }
  
  .verification-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  </style>