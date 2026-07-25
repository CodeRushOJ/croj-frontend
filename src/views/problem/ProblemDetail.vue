<!-- src/views/problem/ProblemDetail.vue -->
<template>
    <div class="problem-detail-container">
        <!-- Loading skeleton -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="10" animated />
        </div>

        <section v-else-if="problemLoadError" class="problem-load-error" role="alert">
            <span aria-hidden="true">!</span>
            <h1>暂时无法加载题目</h1>
            <p>{{ problemLoadErrorMessage }}</p>
            <div>
                <el-button type="primary" @click="fetchProblemDetail">重新加载</el-button>
                <el-button @click="router.push({ name: ROUTE_NAMES.PROBLEMS })">返回题库</el-button>
            </div>
        </section>

        <!-- Problem not found -->
        <el-empty v-else-if="!problem" :description="$t('problems.problem_not_found')" />

        <!-- Problem content -->
        <div v-else class="problem-content">
            <div class="problem-header">
                <div class="problem-title-section">
                    <div class="problem-no-difficulty">
                        <span class="problem-no">{{ problem.problemNo }}</span>
                        <el-tag v-if="problem.problemVersionId" type="info" size="small">
                            固定版本 #{{ problem.problemVersionId }}
                        </el-tag>
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
                        <div class="stat-value">{{ Number(problem.acceptRate || 0).toFixed(1) }}%</div>
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
                    <ProblemSolutions
                        v-if="problem.id"
                        :problem-id="problem.id"
                        :authenticated="isAuthenticated"
                        @require-login="requireLogin('solution')"
                    />
                </el-tab-pane>

                <el-tab-pane label="讨论" name="discussion">
                    <ProblemDiscussions
                        v-if="problem.id"
                        :problem-id="problem.id"
                        :authenticated="isAuthenticated"
                        @require-login="requireLogin('discussion')"
                    />
                </el-tab-pane>

                <el-tab-pane :label="$t('problems.submissions')" name="submissions">
                    <div class="submissions-section" v-loading="loadingSubmissions">
                         <h3>{{ $t('problems.submission_history') }}</h3>
                         <div v-if="!isAuthenticated" class="login-gate" data-testid="submission-history-login-gate">
                            <p>登录后查看你的提交记录</p>
                            <el-button type="primary" @click="requireLogin('submissions')">前往登录</el-button>
                         </div>
                         <el-table v-else :data="submissionsList.records" style="width: 100%" empty-text="No submissions yet">
                             <el-table-column prop="id" label="ID" width="100" />
                             <el-table-column prop="status" :label="$t('submissions.status')">
                                 <template #default="{ row }">
                                     <el-tag :type="getStatusTagType(row.status)">
                                         {{ formatSubmissionStatus(row.status) }}
                                     </el-tag>
                                 </template>
                             </el-table-column>
                             <el-table-column prop="language" :label="$t('submissions.language')" />
                             <el-table-column prop="time" :label="$t('submissions.time')">
                                <template #default="{ row }">
                                    {{ row.time != null ? row.time + ' ms' : '--' }}
                                </template>
                             </el-table-column>
                            <el-table-column prop="memory" :label="$t('submissions.memory')">
                                <template #default="{ row }">
                                     {{ row.memory != null ? row.memory + ' KB' : '--' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="createTime" :label="$t('submissions.submit_time')" width="180">
                                <template #default="{ row }">
                                    {{ row.createTime ? new Date(row.createTime).toLocaleString() : '--' }}
                                </template>
                             </el-table-column>
                             <el-table-column :label="$t('common.actions')" width="120">
                                <template #default="{ row }">
                                    <el-button
                                        type="primary"
                                        size="small"
                                        link
                                        @click="viewCode(row)" 
                                        :disabled="!row.code"
                                    >
                                        {{ $t('common.view_code') }}
                                    </el-button>
                                </template>
                             </el-table-column>
                         </el-table>

                         <el-pagination
                            v-if="submissionsList.total > 0"
                            background
                            layout="prev, pager, next, sizes, total"
                            :total="submissionsList.total"
                            :current-page="submissionsQuery.current"
                            :page-size="submissionsQuery.size"
                            :page-sizes="[10, 20, 50]"
                            @current-change="handlePageChange"
                            @size-change="handleSizeChange"
                            style="margin-top: 20px; justify-content: flex-end;"
                        />
                    </div>
                </el-tab-pane>

                <!-- New tab for code submission -->
                <el-tab-pane :label="$t('problems.submit')" name="submit">
                    <div class="submit-section">
                         <!-- Submission Status Feedback Area -->
                        <div v-if="isSubmitting || isPolling || submissionResult" class="submission-status-container submit-feedback">
                            <div v-if="isSubmitting">
                                <p>{{ $t('submissions.submitting') }}...</p>
                                <el-progress :percentage="100" status="success" :indeterminate="true" :duration="1" />
                            </div>
                            <div v-else-if="submissionResult">
                                 <h4>{{ $t('submissions.last_submission_status') }}</h4>
                                 <p>
                                     {{ $t('submissions.status') }}:
                                     <strong :class="`status-${submissionResult.status?.toLowerCase()}`">
                                         {{ formatSubmissionStatus(submissionResult.status) }}
                                     </strong>
                                 </p>
                                <el-progress
                                    v-if="isPolling && submissionResult.status === 'PENDING'"
                                    :percentage="100"
                                    :indeterminate="true"
                                    status="success"
                                    :duration="1"
                                    style="margin-top: 10px;"
                                 />
                                 <div v-if="!isPolling && submissionResult.status !== 'PENDING'">
                                     <p v-if="submissionResult.time != null">{{ $t('submissions.time') }}: {{ submissionResult.time }} ms</p>
                                     <p v-if="submissionResult.memory != null">{{ $t('submissions.memory') }}: {{ submissionResult.memory }} KB</p>
                                     <p
                                        v-if="submissionResult.message"
                                        :class="{ 'submission-error': isSubmissionError(submissionResult.status) }"
                                     >
                                        {{ $t('submissions.message') }}: {{ submissionResult.message }}
                                     </p>
                                 </div>
                            </div>
                        </div>

                        <code-editor
                            :problem="problem"
                            :disabled="isSubmitting || isPolling"
                            :initial-code="restoredDraft.code"
                            :initial-language="restoredDraft.language"
                            @submit="handleSubmitCode"
                        />
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- Code View Dialog -->
        <el-dialog v-model="codeDialogVisible" :title="`${$t('submissions.view_code_title')} - ${currentLanguage}`" width="70%">
            <pre class="code-view"><code>{{ currentCode }}</code></pre>
            <template #footer>
                <span class="dialog-footer">
                <el-button @click="codeDialogVisible = false">{{ $t('common.close') }}</el-button>
                </span>
            </template>
        </el-dialog>

    </div>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { contestApi, problemApi, submissionApi } from '@/api';
import { ROUTE_NAMES } from '@/constants/routes';
import { useAuthStore } from '@/store/modules/auth';
import CodeEditor from '@/components/problem/CodeEditor.vue';
import ProblemSolutions from '@/components/problem/ProblemSolutions.vue';
import ProblemDiscussions from '@/components/problem/ProblemDiscussions.vue';
import {
    SubmissionPollingTimeoutError,
    pollSubmissionUntilComplete,
} from '@/services/submissionPolling';
import { buildSubmissionPayload } from './submissionContext';
import { normalizeContestProblem } from './contestProblem';
import { sanitizeProblemStatement } from './problemStatement';
import {
    clearSubmissionDraft,
    getSubmissionDraft,
    saveSubmissionDraft,
    withSubmissionTab,
} from '@/services/submissionDraft';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

// State for problem detail
const loading = ref(true);
const problem = ref(null);
const problemLoadError = ref(false);
const problemLoadErrorMessage = ref('题目服务没有返回有效数据，请确认服务状态后重试。');
const activeTab = ref(route.query.tab || 'description');
const problemRequestController = ref(null);
const submissionContext = ref(null);
const restoredDraft = ref({ code: '', language: 'cpp' });

const requireLogin = (tab = activeTab.value) => router.push({
    name: ROUTE_NAMES.LOGIN,
    query: { redirect: withSubmissionTab(route.fullPath, tab) },
});

// State for the submission initiated from THIS component instance
const isSubmitting = ref(false); // Loading state for the submit button
const isPolling = ref(false);
const pollingController = ref(null);
const pollingDeadlineTimer = ref(null);
const submissionResult = ref(null); // Stores the LATEST submission result initiated from this page

// State for the submissions list tab
const loadingSubmissions = ref(false);
const submissionsList = ref({ records: [], total: 0 }); // For el-table
const submissionsRequestController = ref(null);
const submissionsQuery = ref({
    current: 1,
    size: 10,
    problemId: null, // Will be set after problem is fetched
    // Add other potential filters if needed from SubmissionQueryDTO, e.g., userId, status
});

// State for code view dialog
const codeDialogVisible = ref(false);
const currentCode = ref('');
const currentLanguage = ref(''); // Store language for potential syntax highlighting

// Fetch problem detail
const fetchProblemDetail = async () => {
    problemRequestController.value?.abort();
    const controller = new AbortController();
    problemRequestController.value = controller;
    loading.value = true;
    problemLoadError.value = false;
    problemLoadErrorMessage.value = '题目服务没有返回有效数据，请确认服务状态后重试。';
    try {
        const contestId = Number(route.params.contestId);
        const contestProblemId = Number(route.params.problemId);
        const isContestProblem = Number.isSafeInteger(contestId) && contestId > 0
            && Number.isSafeInteger(contestProblemId) && contestProblemId > 0;

        if (isContestProblem) {
            const response = await contestApi.problems(contestId, {
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            const rosterItem = (response.data || []).find(
                item => Number(item.problemId) === contestProblemId,
            );
            if (!rosterItem) {
                throw new Error('该题目不属于当前比赛，或题目尚未开放。');
            }
            problem.value = normalizeContestProblem(rosterItem, contestId);
            submissionContext.value = {
                contestId,
                problemId: problem.value.problemId,
                problemVersionId: problem.value.problemVersionId,
            };
        } else {
            const problemNo = route.params.problemNo;
            if (!problemNo) {
                throw new Error('题目标识无效。');
            }
            const response = await problemApi.getProblemByNo(problemNo, {
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            problem.value = sanitizeProblemStatement(response.data);
            submissionContext.value = { problemId: problem.value?.id };
        }

        if (controller.signal.aborted) return;
        submissionsQuery.value.problemId = problem.value?.id; // Set problemId for submissions query
        restoredDraft.value = getSubmissionDraft(submissionContext.value)
            || { code: '', language: 'cpp' };

        // Parse hints if they're in JSON string format
        if (problem.value && problem.value.hints && typeof problem.value.hints === 'string') {
            try {
                problem.value.hints = JSON.parse(problem.value.hints);
            } catch (e) {
                // If parsing fails, treat it as a single hint
                problem.value.hints = [problem.value.hints];
            }
        }

        // If the initial tab is 'submissions', fetch them now
        if (activeTab.value === 'submissions' && submissionsQuery.value.problemId) {
             fetchSubmissions();
        }

    } catch (error) {
        if (controller.signal.aborted) return;
        problem.value = null;
        submissionContext.value = null;
        problemLoadError.value = true;
        problemLoadErrorMessage.value = error.message
            || '题目服务没有返回有效数据，请确认服务状态后重试。';
        console.error('Failed to fetch problem detail:', error);
    } finally {
        if (problemRequestController.value === controller) {
            problemRequestController.value = null;
            loading.value = false;
        }
    }
};

// Fetch submissions list for the table
const fetchSubmissions = async () => {
    if (!isAuthenticated.value) return;
    if (!submissionsQuery.value.problemId) {
        console.warn("Problem ID not set, cannot fetch submissions.");
        return;
    }
    submissionsRequestController.value?.abort();
    const controller = new AbortController();
    submissionsRequestController.value = controller;
    loadingSubmissions.value = true;
    try {
        const res = await submissionApi.getSubmissionList(submissionsQuery.value, {
            signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (res.success && res.data) {
            submissionsList.value = res.data; // Assuming res.data = { records: [], total: number }
        } else {
             console.error("Failed to fetch submissions list:", res);
             ElMessage.error(t('submissions.fetch_list_error'));
             submissionsList.value = { records: [], total: 0 }; // Reset on error
        }
    } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching submissions list:", error);
        ElMessage.error(t('submissions.fetch_list_error'));
        submissionsList.value = { records: [], total: 0 }; // Reset on error
    } finally {
        if (submissionsRequestController.value === controller) {
            submissionsRequestController.value = null;
            loadingSubmissions.value = false;
        }
    }
};

// Watch for tab changes to load submissions list
watch(activeTab, (newTab) => {
    if (newTab === 'submissions' && submissionsQuery.value.problemId && submissionsList.value.records.length === 0) {
        // Fetch only if entering the tab and list is empty (or fetch always if desired)
        fetchSubmissions();
    }
});

// Handle pagination changes
const handlePageChange = (newPage) => {
  submissionsQuery.value.current = newPage;
  fetchSubmissions();
};

const handleSizeChange = (newSize) => {
  submissionsQuery.value.size = newSize;
  submissionsQuery.value.current = 1; // Reset to first page
  fetchSubmissions();
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

// Stop polling when component is unmounted
const cancelSubmissionRequest = () => {
    pollingController.value?.abort();
    pollingController.value = null;
    if (pollingDeadlineTimer.value) {
        clearTimeout(pollingDeadlineTimer.value);
        pollingDeadlineTimer.value = null;
    }
};

onUnmounted(() => {
    problemRequestController.value?.abort();
    submissionsRequestController.value?.abort();
    cancelSubmissionRequest();
});

// Function to poll submission status
const pollSubmissionStatus = async (submissionId, controller, timeoutMs) => {
    isPolling.value = true;
    submissionResult.value = { id: submissionId, status: 'PENDING' }; // Initial status for Submit Tab

    const completed = await pollSubmissionUntilComplete(submissionId, {
        getSubmission: submissionApi.getSubmission,
        controller,
        timeoutMs,
        onUpdate: currentSubmission => {
            if (controller.signal.aborted) return;
            const expectedVersion = submissionContext.value?.problemVersionId;
            if (expectedVersion && currentSubmission.problemVersionId != null
                && Number(currentSubmission.problemVersionId) !== expectedVersion) {
                throw new Error('判题结果的题目版本与比赛固定版本不一致。');
            }
            submissionResult.value = currentSubmission;
        },
    });
    if (controller.signal.aborted) return null;

    if (activeTab.value === 'submissions') {
        fetchSubmissions();
    }
    if (completed.status === 'ACCEPTED') {
        ElMessage.success(t('submissions.accepted'));
    } else {
        ElMessage.warning(`${t('submissions.finished_with_status')}: ${formatSubmissionStatus(completed.status)}`);
    }
    return completed;
};

const isSubmissionError = status => [
    'SUBMIT_ERROR',
    'SUBMIT_FAILED',
    'POLL_ERROR',
    'POLL_TIMEOUT',
].includes(status);

const showSubmissionFailure = (submissionId, error, deadlineExpired) => {
    console.error(`Submission workflow failed for ID ${submissionId || 'pending'}:`, error);
    if (deadlineExpired || error instanceof SubmissionPollingTimeoutError) {
        submissionResult.value = {
            id: submissionId,
            status: 'POLL_TIMEOUT',
            message: t('submissions.poll_timeout'),
        };
    } else {
        ElMessage.error(t('submissions.poll_error'));
        submissionResult.value = {
            id: submissionId,
            status: submissionId ? 'POLL_ERROR' : 'SUBMIT_ERROR',
            message: error.message || t('errors.unknown_error'),
        };
    }
};

const remainingUntil = deadlineAt => Math.max(0, deadlineAt - Date.now());

const requireActiveRequest = controller => {
    if (controller.signal.aborted) {
        const error = new Error('Submission request aborted');
        error.name = 'AbortError';
        throw error;
    }
};

const awaitCancellable = (operation, controller) => new Promise((resolve, reject) => {
    let settled = false;
    const onAbort = () => {
        if (settled) return;
        settled = true;
        reject(Object.assign(new Error('Submission request aborted'), {
            name: 'AbortError',
        }));
    };
    controller.signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(operation).then(
        value => {
            if (settled) return;
            settled = true;
            controller.signal.removeEventListener('abort', onAbort);
            resolve(value);
        },
        error => {
            if (settled) return;
            settled = true;
            controller.signal.removeEventListener('abort', onAbort);
            reject(error);
        },
    );
});

// Handle submit code
const handleSubmitCode = async (submissionData) => {
    if (isSubmitting.value || isPolling.value) {
        ElMessage.warning(t('submissions.already_submitting'));
        return;
    }

    if (!isAuthenticated.value) {
        saveSubmissionDraft(submissionContext.value, submissionData);
        requireLogin('submit');
        return;
    }

    const fullSubmissionData = buildSubmissionPayload(
        submissionData,
        submissionContext.value,
    );
    if (!fullSubmissionData.problemId) {
        ElMessage.error(t('problems.invalid_problem_id'));
        return;
    }

    cancelSubmissionRequest();
    const controller = new AbortController();
    const deadlineAt = Date.now() + 60_000;
    let deadlineExpired = false;
    let submissionId = null;
    pollingController.value = controller;
    pollingDeadlineTimer.value = setTimeout(() => {
        deadlineExpired = true;
        controller.abort();
    }, remainingUntil(deadlineAt));
    isSubmitting.value = true;
    submissionResult.value = null;

    try {
        const response = await awaitCancellable(
            submissionApi.submitCode(fullSubmissionData, {
                signal: controller.signal,
            }),
            controller,
        );
        requireActiveRequest(controller);
        if (!response.success || !response.data) {
            throw new Error(response.message || t('errors.unknown_error'));
        }
        submissionId = response.data;
        clearSubmissionDraft(submissionContext.value);
        restoredDraft.value = { code: '', language: 'cpp' };
        ElMessage.success(t('problems.submission_sent'));
        isSubmitting.value = false;
        await pollSubmissionStatus(
            submissionId,
            controller,
            remainingUntil(deadlineAt),
        );
        requireActiveRequest(controller);
    } catch (error) {
        if (controller.signal.aborted && !deadlineExpired) return;
        showSubmissionFailure(submissionId, error, deadlineExpired);
    } finally {
        if (pollingController.value === controller) {
            if (pollingDeadlineTimer.value) clearTimeout(pollingDeadlineTimer.value);
            pollingDeadlineTimer.value = null;
            pollingController.value = null;
            isSubmitting.value = false;
            isPolling.value = false;
        }
    }
};

// Function to show code in dialog
const viewCode = (submission) => {
    currentCode.value = submission.code; // Assuming submission object has 'code'
    currentLanguage.value = submission.language; // Assuming submission object has 'language'
    codeDialogVisible.value = true;
};

const formatSubmissionStatus = status => status === 'OUTPUT_LIMIT_EXCEEDED'
    ? 'OUTPUT_LIMIT_EXCEEDED (OLE)'
    : status;

// Helper function to get tag type for submission status in the table
const getStatusTagType = (status) => {
    switch (status) {
        case 'ACCEPTED': return 'success';
        case 'WRONG_ANSWER':
        case 'RUNTIME_ERROR':
        case 'COMPILE_ERROR':
        case 'SYSTEM_ERROR': return 'danger';
        case 'TIME_LIMIT_EXCEEDED':
        case 'MEMORY_LIMIT_EXCEEDED':
        case 'OUTPUT_LIMIT_EXCEEDED':
        case 'CANCELLED': return 'warning';
        case 'PENDING':
        case 'RUNNING':
        case 'COMPILING': return 'primary';
        default: return 'info';
    }
};

watch(
    () => [
        route.params.problemNo,
        route.params.contestId,
        route.params.problemId,
        route.query.tab,
        route.query.contestId,
        route.query.problemVersionId,
    ],
    () => {
        problemRequestController.value?.abort();
        submissionsRequestController.value?.abort();
        cancelSubmissionRequest();
        problem.value = null;
        submissionContext.value = null;
        restoredDraft.value = { code: '', language: 'cpp' };
        submissionResult.value = null;
        submissionsList.value = { records: [], total: 0 };
        submissionsQuery.value = {
            current: 1,
            size: 10,
            problemId: null,
        };
        isSubmitting.value = false;
        isPolling.value = false;
        activeTab.value = route.query.tab || 'description';
        void fetchProblemDetail();
    },
    { immediate: true },
);
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

.problem-load-error {
    max-width: 520px;
    margin: 56px auto;
    padding: 32px;
    text-align: center;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: var(--card-bg);
}

.problem-load-error > span {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid #c47a55;
    border-radius: 50%;
    color: #9a4f31;
    font-weight: 750;
}

.problem-load-error h1 { margin: 14px 0 6px; font-size: 21px; }
.problem-load-error p { color: var(--text-color-secondary); line-height: 1.7; }
.problem-load-error div { margin-top: 20px; }

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
    color: var(--text-color-secondary);
}

.submission-status-container {
    border: 1px solid var(--border-color);
    padding: 15px;
    border-radius: 8px;
    background-color: var(--bg-color);
}

.status-pending, .status-running {
    color: var(--el-color-primary);
}
.status-accepted {
    color: var(--el-color-success);
    font-weight: bold;
}
.status-error {
     color: var(--el-color-danger);
     font-weight: bold;
}
.status-failed {
     color: var(--el-color-warning);
     font-weight: bold;
}
.status-output_limit_exceeded {
     color: var(--el-color-warning);
     font-weight: bold;
}

.submission-error {
    color: var(--el-color-danger);
}

.submit-section {
    position: relative; /* Needed if feedback is positioned absolutely */
    padding-top: 10px; /* Add space if feedback is above */
}

.submit-feedback {
    margin-bottom: 20px; /* Space between feedback and editor */
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--bg-color);
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

.code-view {
    background-color: var(--el-fill-color-lighter);
    padding: 15px;
    border-radius: 4px;
    max-height: 60vh;
    overflow: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: monospace;
    color: var(--el-text-color-primary);
}
</style>
