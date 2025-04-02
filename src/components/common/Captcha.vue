<!-- src/components/common/Captcha.vue -->
<template>
    <div class="captcha-container">
        <el-input v-model="captchaValue" :placeholder="t('auth.verification_code')" class="captcha-input"
            @input="updateValue" />
        <div class="captcha-image" @click="refreshCaptcha">
            <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" height="40" />
            <div v-else class="captcha-loading">
                <el-button type="primary" size="small" :loading="loading">
                    {{ t('auth.get_verification_code') }}
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { captchaApi } from '@/api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()

// No longer need to explicitly import defineProps and defineEmits
const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            captcha: '',
            captchaKey: ''
        })
    }
})

const emit = defineEmits(['update:modelValue'])

// 验证码相关状态
const captchaUrl = ref('')
const captchaKey = ref('')
const captchaValue = ref('')
const loading = ref(false)

// 获取验证码
const getCaptcha = async () => {
    if (loading.value) return

    loading.value = true
    try {
        // 释放旧的URL对象
        if (captchaUrl.value && captchaUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(captchaUrl.value)
        }

        const result = await captchaApi.getCaptcha()
        captchaUrl.value = result.captchaUrl
        captchaKey.value = result.captchaKey

        updateValue()
    } catch (error) {
        console.error('获取验证码失败:', error)
        ElMessage.error(t('errors.captcha_error') || '获取验证码失败，请重试')
    } finally {
        loading.value = false
    }
}

// 刷新验证码
const refreshCaptcha = () => {
    captchaValue.value = ''
    getCaptcha()
}

// 更新值
const updateValue = () => {
    emit('update:modelValue', {
        captcha: captchaValue.value,
        captchaKey: captchaKey.value
    })
}

// 监听外部传入的值变化
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        captchaValue.value = newVal.captcha || ''

        // 如果key变化了，需要重新获取验证码
        if (captchaKey.value !== newVal.captchaKey) {
            getCaptcha()
        }
    }
}, { deep: true })

// 组件挂载时获取验证码
onMounted(() => {
    getCaptcha()
})
</script>

<style scoped>
.captcha-container {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
    align-items: center;
}

.captcha-input {
    flex: 1;
}

.captcha-image {
    width: 120px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
}

.captcha-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.captcha-loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>