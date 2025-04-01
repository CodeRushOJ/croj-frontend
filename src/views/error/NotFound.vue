<template>
    <div class="not-found-container">
        <el-result icon="error" title="404" sub-title="Sorry, the page you visited does not exist.">
            <template #extra>
                <el-button type="primary" @click="goHome">Back to Home</el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/constants/routes'

const router = useRouter()

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