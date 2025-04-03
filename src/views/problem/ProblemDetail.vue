// src/views/problem/ProblemDetail.vue
<template>
    <div class="problem-detail-container">
        <!-- Loading skeleton -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="10" animated />
        </div>

        <!-- Problem not found -->
        <el-empty v-else-if="!problem" :description="$t('problems.problem_not_found')" />

        <!-- Problem content -->
        <div v-else class="problem-content">
            <div class="problem-header">
                <div class="problem-title-section">
                    <div class="problem-no-difficulty">
                        <span class="problem-no">{{ problem.problemNo }}</span>
                        <el-tag :type="getDifficultyType(problem.difficulty)" size="small">
                            {{ getDifficultyLabel(problem.difficulty) }}
                        </el-tag>
                    </div>
                    <h1 class="problem-title">{{ problem.title }}</h1>
                    <div class="problem-tags">
                        <el-tag v-for="tag in problem.tags" :key="tag.id"
                            :style="{ backgroundColor: tag.color, borderColor: tag.color }" class="problem-tag"
                            size="small">
                            {{ tag.name }}
                        </el-tag>
                    </div>
                </div>

                <div class="problem-stats">
                    <div class="stat-item">
                        <div class="stat-label">{{ $t('problems.submission') }}</div>
                        <div class="stat-value">{{ problem.submitCount }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">{{ $t('problems.accepted') }}</div>
                        <div class="stat-value">{{ problem.acceptedCount }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">{{ $t('problems.acceptance_rate') }}</div>
                        <div class="stat-value">{{ (problem.acceptRate * 100).toFixed(1) }}%</div>
                    </div>
                </div>
            </div>

            <el-divider />

            <!-- Problem tabs -->
            <el-tabs v-model="activeTab" type="card">
                <el-tab-pane :label="$t('problems.description')" name="description">
                    <div class="description-section">
                        <div class="description-content" v-html="problem.description"></div>

                        <el-divider />

                        <h3>{{ $t('problems.input_description') }}</h3>
                        <div class="description-content" v-html="problem.inputDescription"></div>

                        <el-divider />

                        <h3>{{ $t('problems.output_description') }}</h3>
                        <div class="description-content" v-html="problem.outputDescription"></div>

                        <el-divider />

                        <h3>{{ $t('problems.examples') }}</h3>
                        <div class="examples-section">
                            <div v-for="(sample, index) in problem.samples" :key="index" class="example-item">
                                <h4>{{ $t('problems.example') }} {{ index + 1 }}</h4>
                                <div class="example-content">
                                    <div class="example-input">
                                        <div class="example-header">{{ $t('problems.input') }}:</div>
                                        <pre>{{ sample.input }}</pre>
                                    </div>
                                    <div class="example-output">
                                        <div class="example-header">{{ $t('problems.output') }}:</div>
                                        <pre>{{ sample.output }}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Show hints if available -->
                        <template v-if="problem.hints && problem.hints.length > 0">
                            <el-divider />

                            <h3>{{ $t('problems.hints') }}</h3>
                            <div class="hints-section">
                                <div v-for="(hint, index) in problem.hints" :key="index" class="hint-item">
                                    <div class="hint-content">{{ hint }}</div>
                                </div>
                            </div>
                        </template>

                        <!-- Source information if available -->
                        <template v-if="problem.source">
                            <el-divider />

                            <div class="source-section">
                                <strong>{{ $t('problems.source') }}:</strong> {{ problem.source }}
                            </div>
                        </template>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('problems.solution')" name="solution">
                    <div class="solution-section">
                        <p>{{ $t('problems.solution_placeholder') }}</p>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('problems.submissions')" name="submissions">
                    <div class="submissions-section">
                        <p>{{ $t('problems.submissions_placeholder') }}</p>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <!-- Submit button -->
            <div class="action-buttons">
                <el-button type="primary" size="large" @click="handleSubmit">
                    {{ $t('problems.submit_solution') }}
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { problemApi } from '@/api/problem';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// State
const loading = ref(true);
const problem = ref(null);
const activeTab = ref('description');

// Fetch problem detail
const fetchProblemDetail = async () => {
    loading.value = true;
    try {
        const problemNo = route.params.problemNo;
        if (!problemNo) {
            ElMessage.error(t('problems.invalid_problem_id'));
            router.push({ name: 'ProblemList' });
            return;
        }

        const res = await problemApi.getProblemByNo(problemNo);
        problem.value = res.data;

        // Parse hints if they're in JSON string format
        if (problem.value && problem.value.hints && typeof problem.value.hints === 'string') {
            try {
                problem.value.hints = JSON.parse(problem.value.hints);
            } catch (e) {
                // If parsing fails, treat it as a single hint
                problem.value.hints = [problem.value.hints];
            }
        }
    } catch (error) {
        ElMessage.error(t('problems.fetch_error'));
        console.error('Failed to fetch problem detail:', error);
    } finally {
        loading.value = false;
    }
};

// Get difficulty type for tag color
const getDifficultyType = (difficulty) => {
    switch (difficulty) {
        case 1: return 'success';
        case 2: return 'warning';
        case 3: return 'danger';
        default: return 'info';
    }
};

// Get difficulty label
const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
        case 1: return t('problems.easy');
        case 2: return t('problems.medium');
        case 3: return t('problems.hard');
        default: return t('problems.unknown');
    }
};

// Handle submit solution
const handleSubmit = () => {
    ElMessage.info(t('problems.submit_placeholder'));
    // This would navigate to a code editor or submission page
    // router.push({ name: 'ProblemSubmit', params: { problemNo: problem.value.problemNo } });
};

// Lifecycle
onMounted(() => {
    fetchProblemDetail();
});
</script>

<style scoped>
.problem-detail-container {
    padding: 0 10px;
    max-width: 1200px;
    margin: 0 auto;
}

.loading-container {
    padding: 20px;
}

.problem-content {
    background-color: var(--bg-color-secondary);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
}

.problem-header {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.problem-title-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.problem-no-difficulty {
    display: flex;
    align-items: center;
    gap: 10px;
}

.problem-no {
    font-weight: bold;
    color: var(--text-color);
}

.problem-title {
    margin: 0;
    font-size: 24px;
    color: var(--text-color);
}

.problem-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.problem-tag {
    color: white;
}

.problem-stats {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-label {
    font-size: 14px;
    color: var(--text-color-secondary);
}

.stat-value {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-color);
}

.description-section {
    padding: 10px;
}

.description-content {
    line-height: 1.6;
    color: var(--text-color);
}

.examples-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.example-item {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 15px;
}

.example-item h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: var(--text-color);
}

.example-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.example-header {
    font-weight: bold;
    margin-bottom: 5px;
    color: var(--text-color);
}

pre {
    background-color: var(--bg-color);
    padding: 10px;
    border-radius: 5px;
    overflow: auto;
    margin: 0;
    color: var(--text-color);
}

.hints-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.hint-item {
    background-color: var(--bg-color);
    padding: 15px;
    border-radius: 5px;
    border-left: 4px solid var(--el-color-warning);
}

.hint-content {
    color: var(--text-color);
}

.source-section {
    color: var(--text-color-secondary);
    font-style: italic;
}

.solution-section,
.submissions-section {
    padding: 20px;
    min-height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-color-secondary);
}

.action-buttons {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

@media (min-width: 768px) {
    .problem-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
    }

    .problem-stats {
        flex-direction: column;
        align-items: flex-end;
    }

    .stat-item {
        flex-direction: row;
        gap: 10px;
    }

    .example-content {
        flex-direction: row;
        gap: 30px;
    }

    .example-input,
    .example-output {
        flex: 1;
    }
}
</style>