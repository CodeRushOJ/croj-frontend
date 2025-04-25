<!-- src/views/problem/ProblemDetail.vue -->
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
                    <div class="submissions-section" v-loading="loadingSubmissions">
                         <h3>{{ $t('problems.submission_history') }}</h3>
                         <el-table :data="submissionsList.records" style="width: 100%" empty-text="No submissions yet">
                             <el-table-column prop="id" label="ID" width="100" />
                             <el-table-column prop="status" :label="$t('submissions.status')">
                                 <template #default="{ row }">
                                     <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
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
                        <div v-if="isSubmitting || submissionResult" class="submission-status-container submit-feedback">
                            <div v-if="isSubmitting">
                                <p>{{ $t('submissions.submitting') }}...</p>
                                <el-progress :percentage="100" status="success" :indeterminate="true" :duration="1" />
                            </div>
                            <div v-else-if="submissionResult">
                                 <h4>{{ $t('submissions.last_submission_status') }}</h4>
                                 <p>
                                     {{ $t('submissions.status') }}:
                                     <strong :class="`status-${submissionResult.status?.toLowerCase()}`">
                                         {{ submissionResult.status }}
                                     </strong>
                                 </p>
                                <el-progress
                                    v-if="pollingInterval !== null && ['PENDING', 'RUNNING', 'COMPILING'].includes(submissionResult.status)"
                                    :percentage="100"
                                    :indeterminate="true"
                                    status="success"
                                    :duration="1"
                                    style="margin-top: 10px;"
                                 />
                                 <div v-if="!pollingInterval && submissionResult.status !== 'PENDING'">
                                     <p v-if="submissionResult.time != null">{{ $t('submissions.time') }}: {{ submissionResult.time }} ms</p>
                                     <p v-if="submissionResult.memory != null">{{ $t('submissions.memory') }}: {{ submissionResult.memory }} KB</p>
                                     <p v-if="submissionResult.message">{{ $t('submissions.message') }}: {{ submissionResult.message }}</p>
                                 </div>
                                 <div v-else-if="['SUBMIT_ERROR', 'SUBMIT_FAILED', 'POLL_ERROR'].includes(submissionResult.status)">
                                     <p style="color: var(--el-color-danger);">{{ submissionResult.message || $t('errors.unknown_error') }}</p>
                                 </div>
                            </div>
                        </div>

                        <code-editor :problem="problem" @submit="handleSubmitCode" :disabled="isSubmitting" />
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { problemApi, submissionApi } from '@/api';
import CodeEditor from '@/components/problem/CodeEditor.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// State for problem detail
const loading = ref(true);
const problem = ref(null);
const activeTab = ref('description');

// State for the submission initiated from THIS component instance
const isSubmitting = ref(false); // Loading state for the submit button
const pollingInterval = ref(null);
const submissionResult = ref(null); // Stores the LATEST submission result initiated from this page

// State for the submissions list tab
const loadingSubmissions = ref(false);
const submissionsList = ref({ records: [], total: 0 }); // For el-table
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
        submissionsQuery.value.problemId = problem.value?.id; // Set problemId for submissions query

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
        ElMessage.error(t('problems.fetch_error'));
        console.error('Failed to fetch problem detail:', error);
    } finally {
        loading.value = false;
    }
};

// Fetch submissions list for the table
const fetchSubmissions = async () => {
    if (!submissionsQuery.value.problemId) {
        console.warn("Problem ID not set, cannot fetch submissions.");
        return;
    }
    loadingSubmissions.value = true;
    try {
        console.log("Fetching submissions with query:", submissionsQuery.value);
        const res = await submissionApi.getSubmissionList(submissionsQuery.value);
        if (res.success && res.data) {
            submissionsList.value = res.data; // Assuming res.data = { records: [], total: number }
             console.log("Submissions fetched:", submissionsList.value);
        } else {
             console.error("Failed to fetch submissions list:", res);
             ElMessage.error(t('submissions.fetch_list_error'));
             submissionsList.value = { records: [], total: 0 }; // Reset on error
        }
    } catch (error) {
        console.error("Error fetching submissions list:", error);
        ElMessage.error(t('submissions.fetch_list_error'));
        submissionsList.value = { records: [], total: 0 }; // Reset on error
    } finally {
        loadingSubmissions.value = false;
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
onUnmounted(() => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
    }
});

// Function to poll submission status
const pollSubmissionStatus = (submissionId) => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
    }
    submissionResult.value = { id: submissionId, status: 'PENDING' }; // Initial status for Submit Tab
    console.log(`Starting polling for submission ID: ${submissionId}`);

    pollingInterval.value = setInterval(async () => {
        try {
            // Use a specific query for the single submission status poll
            const pollQuery = { id: submissionId, current: 1, size: 1 };
            console.log(`Polling status with query:`, pollQuery);
            const res = await submissionApi.getSubmissionList(pollQuery); // Still uses list endpoint
            console.log('Polling response:', res);

            if (res.success && res.data && res.data.records && res.data.records.length > 0) {
                const currentSubmission = res.data.records.find(s => s.id === submissionId);

                if (currentSubmission) {
                    submissionResult.value = currentSubmission; // Update result for Submit Tab
                    console.log('Current submission status:', currentSubmission.status);

                    const finalStatuses = ['ACCEPTED', 'WRONG_ANSWER', 'COMPILE_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'SYSTEM_ERROR', 'CANCELLED'];

                    if (finalStatuses.includes(currentSubmission.status)) {
                        clearInterval(pollingInterval.value);
                        pollingInterval.value = null;
                        console.log(`Polling stopped for submission ${submissionId}. Final status: ${currentSubmission.status}`);

                         // Refresh the submissions list if the user is currently viewing it
                         if (activeTab.value === 'submissions') {
                             fetchSubmissions();
                         }

                        // Optional: Show a final status message for the submit action
                        if (currentSubmission.status === 'ACCEPTED') {
                             ElMessage.success(t('submissions.accepted'));
                        } else {
                             ElMessage.warning(`${t('submissions.finished_with_status')}: ${currentSubmission.status}`);
                        }
                    }
                } else {
                     console.warn(`Polling: Submission ID ${submissionId} not found in response.`);
                     // Consider stopping polling after some attempts if not found
                }
            } else {
                 console.warn(`Polling: Received no records or unsuccessful response for ID ${submissionId}.`);
                 // Consider stopping polling
            }
        } catch (error) {
            console.error(`Error polling submission status for ID ${submissionId}:`, error);
            ElMessage.error(t('submissions.poll_error'));
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
            if (submissionResult.value && submissionResult.value.id === submissionId) {
                 submissionResult.value.status = 'POLL_ERROR';
            } else {
                submissionResult.value = { id: submissionId, status: 'POLL_ERROR' };
            }
        }
    }, 1000); // Poll every 1 second
};

// Handle submit code
const handleSubmitCode = async (submissionData) => {
    if (isSubmitting.value) {
        ElMessage.warning(t('submissions.already_submitting'));
        return;
    }

    isSubmitting.value = true;
    submissionResult.value = null; // Clear previous submit tab result
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
    }

    const fullSubmissionData = { ...submissionData, problemId: problem.value?.id };

    if (!fullSubmissionData.problemId) {
        ElMessage.error(t('problems.invalid_problem_id'));
        isSubmitting.value = false;
        return;
    }

    console.log('Submitting code with data:', fullSubmissionData);

    try {
        const res = await submissionApi.submitCode(fullSubmissionData);
        console.log('Submission response:', res);

        if (res.success && res.data) {
            const submissionId = res.data;
            ElMessage.success(t('problems.submission_sent'));
            pollSubmissionStatus(submissionId); // Start polling for Submit Tab feedback
        } else {
            console.error('Submission API request failed logically:', res);
             submissionResult.value = { status: 'SUBMIT_FAILED', message: res.message || t('errors.unknown_error') };
        }
    } catch (error) {
        console.error('Failed to submit code due to exception:', error);
        submissionResult.value = { status: 'SUBMIT_ERROR', message: error.message || t('errors.unknown_error') };
    } finally {
        isSubmitting.value = false; // Allow new submissions once API call finishes (polling happens independently)
    }
};

// Function to show code in dialog
const viewCode = (submission) => {
    currentCode.value = submission.code; // Assuming submission object has 'code'
    currentLanguage.value = submission.language; // Assuming submission object has 'language'
    codeDialogVisible.value = true;
};

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
        case 'CANCELLED': return 'warning';
        case 'PENDING':
        case 'RUNNING':
        case 'COMPILING': return 'primary';
        default: return 'info';
    }
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