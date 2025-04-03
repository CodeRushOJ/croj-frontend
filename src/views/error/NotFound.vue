<template>
    <div class="not-found-container">
        <el-result icon="error" title="404" :sub-title="t('notfound.title')">
            <template #extra>
                <el-button type="primary" @click="goHome">{{ t('notfound.back_to_home') }}</el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/constants/routes'
import { useI18n } from 'vue-i18n'

const router = useRouter()

const { t } = useI18n()

const goHome = () => {
    router.push({ name: ROUTE_NAMES.DASHBOARD })
}
</script>

<style scoped>
.not-found-container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 50px 0;
}
</style>