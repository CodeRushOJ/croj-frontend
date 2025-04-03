// src/views/admin/ProblemManagement.vue
<template>
    <div class="problem-management">
        <div class="page-header">
            <h2>{{ $t('admin.problem_management') }}</h2>
            <div class="page-actions">
                <el-input v-model="searchKeyword" :placeholder="$t('admin.search_problem')" @input="handleSearch"
                    clearable class="search-input">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <el-button type="primary" @click="handleAdd">
                    <el-icon>
                        <Plus />
                    </el-icon>
                    {{ $t('admin.add_problem') }}
                </el-button>
            </div>
        </div>

        <!-- Problem list table -->
        <el-table :data="problems" style="width: 100%" v-loading="loading" border stripe>
            <el-table-column prop="id" label="ID" width="70" sortable />
            <el-table-column prop="problemNo" :label="$t('problems.id')" width="100" />
            <el-table-column prop="title" :label="$t('problems.title')" min-width="200">
                <template #default="scope">
                    <div class="problem-title-cell">
                        <span>{{ scope.row.title }}</span>
                        <div class="problem-tags">
                            <el-tag v-for="tag in scope.row.tags" :key="tag.id"
                                :style="{ backgroundColor: tag.color, borderColor: tag.color }" class="problem-tag"
                                size="small">
                                {{ tag.name }}
                            </el-tag>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="$t('problems.difficulty')" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="getDifficultyType(scope.row.difficulty)" size="small">
                        {{ getDifficultyLabel(scope.row.difficulty) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('admin.time_limit')" width="110" align="center">
                <template #default="scope">
                    {{ scope.row.timeLimit }}ms
                </template>
            </el-table-column>
            <el-table-column :label="$t('admin.memory_limit')" width="110" align="center">
                <template #default="scope">
                    {{ scope.row.memoryLimit }}MB
                </template>
            </el-table-column>
            <el-table-column :label="$t('admin.status')" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                        {{ getStatusLabel(scope.row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('admin.actions')" fixed="right" width="200" align="center">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
                        {{ $t('admin.edit') }}
                    </el-button>
                    <el-button type="success" size="small" @click="handlePreview(scope.row)" plain>
                        {{ $t('admin.preview') }}
                    </el-button>
                    <el-button type="danger" size="small" @click="handleDelete(scope.row)">
                        {{ $t('admin.delete') }}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>

        <!-- Problem Form Dialog -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? $t('admin.edit_problem') : $t('admin.add_problem')"
            width="80%" :before-close="handleDialogClose">
            <el-form ref="problemFormRef" :model="problemForm" :rules="rules" label-width="120px" class="problem-form">
                <el-form-item :label="$t('problems.title')" prop="title">
                    <el-input v-model="problemForm.title" />
                </el-form-item>

                <el-form-item :label="$t('problems.difficulty')" prop="difficulty">
                    <el-select v-model="problemForm.difficulty" class="w-100">
                        <el-option :label="$t('problems.easy')" :value="1" />
                        <el-option :label="$t('problems.medium')" :value="2" />
                        <el-option :label="$t('problems.hard')" :value="3" />
                    </el-select>
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="$t('admin.time_limit')" prop="timeLimit">
                            <el-input-number v-model="problemForm.timeLimit" :min="1" :max="10000" :step="100"
                                class="w-100" />
                            <div class="form-item-help">{{ $t('admin.time_limit_help') }}</div>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="$t('admin.memory_limit')" prop="memoryLimit">
                            <el-input-number v-model="problemForm.memoryLimit" :min="1" :max="1024" :step="16"
                                class="w-100" />
                            <div class="form-item-help">{{ $t('admin.memory_limit_help') }}</div>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item :label="$t('admin.tags')" prop="tagIds">
                    <el-select v-model="problemForm.tagIds" multiple filterable class="w-100">
                        <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id">
                            <span :style="{ color: tag.color }">{{ tag.name }}</span>
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item :label="$t('admin.status')" prop="status">
                    <el-select v-model="problemForm.status" class="w-100">
                        <el-option :label="$t('admin.status_visible')" :value="0" />
                        <el-option :label="$t('admin.status_hidden')" :value="1" />
                        <el-option :label="$t('admin.status_contest_only')" :value="2" />
                    </el-select>
                </el-form-item>

                <el-form-item :label="$t('problems.description')" prop="description">
                    <el-input v-model="problemForm.description" type="textarea" rows="6" />
                </el-form-item>

                <el-form-item :label="$t('problems.input_description')" prop="inputDescription">
                    <el-input v-model="problemForm.inputDescription" type="textarea" rows="4" />
                </el-form-item>

                <el-form-item :label="$t('problems.output_description')" prop="outputDescription">
                    <el-input v-model="problemForm.outputDescription" type="textarea" rows="4" />
                </el-form-item>

                <el-form-item :label="$t('problems.examples')">
                    <div v-for="(sample, index) in problemForm.samples" :key="index" class="sample-item">
                        <div class="sample-header">
                            <h4>{{ $t('problems.example') }} {{ index + 1 }}</h4>
                            <el-button @click="removeSample(index)" type="danger" size="small" circle plain>
                                <el-icon>
                                    <Delete />
                                </el-icon>
                            </el-button>
                        </div>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item :prop="`samples.${index}.input`"
                                    :rules="[{ required: true, message: $t('admin.input_required'), trigger: 'blur' }]">
                                    <template #label>
                                        <span>{{ $t('problems.input') }}</span>
                                    </template>
                                    <el-input v-model="sample.input" type="textarea" rows="4" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item :prop="`samples.${index}.output`"
                                    :rules="[{ required: true, message: $t('admin.output_required'), trigger: 'blur' }]">
                                    <template #label>
                                        <span>{{ $t('problems.output') }}</span>
                                    </template>
                                    <el-input v-model="sample.output" type="textarea" rows="4" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </div>
                    <el-button @click="addSample" type="primary" plain>
                        <el-icon>
                            <Plus />
                        </el-icon>
                        {{ $t('admin.add_example') }}
                    </el-button>
                </el-form-item>

                <el-form-item :label="$t('problems.hints')">
                    <div v-for="(hint, index) in problemForm.hints" :key="index" class="hint-item">
                        <div class="hint-content">
                            <el-input v-model="problemForm.hints[index]" type="textarea" rows="2" />
                            <el-button @click="removeHint(index)" type="danger" size="small" circle plain
                                class="hint-delete">
                                <el-icon>
                                    <Delete />
                                </el-icon>
                            </el-button>
                        </div>
                    </div>
                    <el-button @click="addHint" type="primary" plain>
                        <el-icon>
                            <Plus />
                        </el-icon>
                        {{ $t('admin.add_hint') }}
                    </el-button>
                </el-form-item>

                <el-form-item :label="$t('problems.source')">
                    <el-input v-model="problemForm.source" />
                </el-form-item>

                <el-form-item :label="$t('admin.judge_mode')" prop="judgeMode">
                    <el-radio-group v-model="problemForm.judgeMode">
                        <el-radio :label="0">{{ $t('admin.judge_mode_normal') }}</el-radio>
                        <el-radio :label="1">{{ $t('admin.judge_mode_special') }}</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- Special judge code, only shown when judgeMode is 1 -->
                <template v-if="problemForm.judgeMode === 1">
                    <el-form-item :label="$t('admin.special_judge_lang')" prop="specialJudgeLanguage">
                        <el-select v-model="problemForm.specialJudgeLanguage" class="w-100">
                            <el-option label="C" value="c" />
                            <el-option label="C++" value="cpp" />
                            <el-option label="Java" value="java" />
                            <el-option label="Python" value="python" />
                        </el-select>
                    </el-form-item>

                    <el-form-item :label="$t('admin.special_judge_code')" prop="specialJudgeCode">
                        <el-input v-model="problemForm.specialJudgeCode" type="textarea" rows="10" />
                    </el-form-item>
                </template>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
                    <el-button type="primary" @click="submitForm" :loading="submitLoading">
                        {{ $t('common.submit') }}
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- Delete Confirmation Dialog -->
        <el-dialog v-model="deleteDialogVisible" :title="$t('admin.confirm_delete')" width="400px">
            <div class="delete-confirmation">
                <el-icon class="delete-icon">
                    <Warning />
                </el-icon>
                <p>{{ $t('admin.delete_problem_confirmation', { title: selectedProblem?.title }) }}</p>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">{{ $t('common.cancel') }}</el-button>
                    <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
                        {{ $t('admin.confirm') }}
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Delete, Warning } from '@element-plus/icons-vue';
import { problemApi } from '@/api/problem';
import { tagApi } from '@/api/tag';

const { t } = useI18n();
const router = useRouter();

// State
const loading = ref(false);
const problems = ref([]);
const allTags = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const searchTimeout = ref(null);

// Dialog state
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEdit = ref(false);
const selectedProblem = ref(null);
const submitLoading = ref(false);
const deleteLoading = ref(false);

// Problem form
const problemFormRef = ref(null);
const problemForm = reactive({
    id: null,
    title: '',
    description: '',
    inputDescription: '',
    outputDescription: '',
    hints: [],
    samples: [],
    timeLimit: 1000,
    memoryLimit: 256,
    difficulty: 1,
    isSpecialJudge: false,
    specialJudgeCode: '',
    specialJudgeLanguage: 'cpp',
    judgeMode: 0,
    totalScore: 100,
    source: '',
    status: 0,
    tagIds: []
});

// Form validation rules
const rules = reactive({
    title: [
        { required: true, message: t('admin.title_required'), trigger: 'blur' },
        { min: 3, max: 100, message: t('admin.title_length'), trigger: 'blur' }
    ],
    description: [
        { required: true, message: t('admin.description_required'), trigger: 'blur' }
    ],
    inputDescription: [
        { required: true, message: t('admin.input_description_required'), trigger: 'blur' }
    ],
    outputDescription: [
        { required: true, message: t('admin.output_description_required'), trigger: 'blur' }
    ],
    timeLimit: [
        { required: true, message: t('admin.time_limit_required'), trigger: 'blur' },
        { type: 'number', min: 1, max: 10000, message: t('admin.time_limit_range'), trigger: 'blur' }
    ],
    memoryLimit: [
        { required: true, message: t('admin.memory_limit_required'), trigger: 'blur' },
        { type: 'number', min: 1, max: 1024, message: t('admin.memory_limit_range'), trigger: 'blur' }
    ],
    difficulty: [
        { required: true, message: t('admin.difficulty_required'), trigger: 'change' }
    ],
    status: [
        { required: true, message: t('admin.status_required'), trigger: 'change' }
    ],
    judgeMode: [
        { required: true, message: t('admin.judge_mode_required'), trigger: 'change' }
    ],
    specialJudgeLanguage: [
        { required: true, message: t('admin.special_judge_lang_required'), trigger: 'change' }
    ],
    specialJudgeCode: [
        { required: true, message: t('admin.special_judge_code_required'), trigger: 'blur' }
    ]
});

// Get difficulty type
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

// Get status type
const getStatusType = (status) => {
    switch (status) {
        case 0: return 'success';
        case 1: return 'info';
        case 2: return 'warning';
        default: return 'info';
    }
};

// Get status label
const getStatusLabel = (status) => {
    switch (status) {
        case 0: return t('admin.status_visible');
        case 1: return t('admin.status_hidden');
        case 2: return t('admin.status_contest_only');
        default: return t('admin.status_unknown');
    }
};

// Handle search with debounce
const handleSearch = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
        currentPage.value = 1;
        fetchProblems();
    }, 300);
};

// Add a new example
const addSample = () => {
    problemForm.samples.push({
        input: '',
        output: ''
    });
};

// Remove an example
const removeSample = (index) => {
    problemForm.samples.splice(index, 1);
};

// Add a new hint
const addHint = () => {
    problemForm.hints.push('');
};

// Remove a hint
const removeHint = (index) => {
    problemForm.hints.splice(index, 1);
};

// Handle add new problem
const handleAdd = () => {
    isEdit.value = false;
    resetForm();
    dialogVisible.value = true;
};

// Handle edit problem
const handleEdit = (problem) => {
    isEdit.value = true;
    selectedProblem.value = problem;

    // Fetch full problem details
    fetchProblemDetails(problem.id);
};

// Handle preview problem
const handlePreview = (problem) => {
    router.push({
        name: 'ProblemDetail',
        params: { problemNo: problem.problemNo }
    });
};

// Handle delete problem
const handleDelete = (problem) => {
    selectedProblem.value = problem;
    deleteDialogVisible.value = true;
};

// Confirm delete problem
const confirmDelete = async () => {
    if (!selectedProblem.value) return;

    deleteLoading.value = true;
    try {
        await problemApi.deleteProblem(selectedProblem.value.id);
        ElMessage.success(t('admin.problem_deleted'));
        deleteDialogVisible.value = false;
        fetchProblems();
    } catch (error) {
        ElMessage.error(t('admin.delete_problem_error'));
        console.error('Failed to delete problem:', error);
    } finally {
        deleteLoading.value = false;
    }
};

// Reset form
const resetForm = () => {
    if (problemFormRef.value) {
        problemFormRef.value.resetFields();
    }

    Object.assign(problemForm, {
        id: null,
        title: '',
        description: '',
        inputDescription: '',
        outputDescription: '',
        hints: [],
        samples: [{ input: '', output: '' }],
        timeLimit: 1000,
        memoryLimit: 256,
        difficulty: 1,
        isSpecialJudge: false,
        specialJudgeCode: '',
        specialJudgeLanguage: 'cpp',
        judgeMode: 0,
        totalScore: 100,
        source: '',
        status: 0,
        tagIds: []
    });
};

// Handle dialog close
const handleDialogClose = (done) => {
    ElMessageBox.confirm(
        t('admin.discard_changes'),
        t('common.warning'),
        {
            confirmButtonText: t('common.confirm'),
            cancelButtonText: t('common.cancel'),
            type: 'warning',
        }
    )
        .then(() => {
            resetForm();
            done();
        })
        .catch(() => {
            // Cancel close
        });
};

// Submit form
const submitForm = async () => {
    if (!problemFormRef.value) return;

    try {
        await problemFormRef.value.validate();
        submitLoading.value = true;

        // Convert any string or object hints to array if needed
        if (typeof problemForm.hints === 'string' && problemForm.hints.trim()) {
            problemForm.hints = [problemForm.hints];
        } else if (typeof problemForm.hints === 'object' && !Array.isArray(problemForm.hints)) {
            problemForm.hints = Object.values(problemForm.hints);
        }

        // Set special judge flag based on judgeMode
        problemForm.isSpecialJudge = problemForm.judgeMode === 1;

        if (isEdit.value) {
            // Update problem
            await problemApi.updateProblem(problemForm);
            ElMessage.success(t('admin.problem_updated'));
        } else {
            // Create new problem
            await problemApi.createProblem(problemForm);
            ElMessage.success(t('admin.problem_created'));
        }

        dialogVisible.value = false;
        fetchProblems();
    } catch (error) {
        ElMessage.error(isEdit.value ? t('admin.update_problem_error') : t('admin.create_problem_error'));
        console.error('Form validation or submission error:', error);
    } finally {
        submitLoading.value = false;
    }
};

// Fetch problem details for editing
const fetchProblemDetails = async (id) => {
    try {
        loading.value = true;
        const res = await problemApi.getProblemById(id);
        const problem = res.data;

        // Update form with problem data
        Object.assign(problemForm, {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            inputDescription: problem.inputDescription,
            outputDescription: problem.outputDescription,
            timeLimit: problem.timeLimit,
            memoryLimit: problem.memoryLimit,
            difficulty: problem.difficulty,
            isSpecialJudge: problem.isSpecialJudge,
            specialJudgeCode: problem.specialJudgeCode || '',
            specialJudgeLanguage: problem.specialJudgeLanguage || 'cpp',
            judgeMode: problem.judgeMode || 0,
            totalScore: problem.totalScore || 100,
            source: problem.source || '',
            status: problem.status,
            tagIds: problem.tags ? problem.tags.map(tag => tag.id) : []
        });

        // Parse samples and hints
        if (problem.samples) {
            if (typeof problem.samples === 'string') {
                try {
                    problemForm.samples = JSON.parse(problem.samples);
                } catch (e) {
                    problemForm.samples = [{ input: '', output: '' }];
                }
            } else {
                problemForm.samples = problem.samples;
            }
        } else {
            problemForm.samples = [{ input: '', output: '' }];
        }

        // Parse hints
        if (problem.hints) {
            if (typeof problem.hints === 'string') {
                try {
                    problemForm.hints = JSON.parse(problem.hints);
                } catch (e) {
                    // If not valid JSON, treat as single hint
                    problemForm.hints = [problem.hints];
                }
            } else if (Array.isArray(problem.hints)) {
                problemForm.hints = problem.hints;
            } else {
                problemForm.hints = [];
            }
        } else {
            problemForm.hints = [];
        }

        dialogVisible.value = true;
    } catch (error) {
        ElMessage.error(t('admin.fetch_problem_error'));
        console.error('Failed to fetch problem details:', error);
    } finally {
        loading.value = false;
    }
};

// Fetch problems list
const fetchProblems = async () => {
    loading.value = true;
    try {
        const params = {
            current: currentPage.value,
            size: pageSize.value,
            keyword: searchKeyword.value
        };

        const res = await problemApi.getProblemList(params);
        problems.value = res.data.records || [];
        total.value = res.data.total || 0;
    } catch (error) {
        ElMessage.error(t('admin.fetch_problems_error'));
        console.error('Failed to fetch problems:', error);
    } finally {
        loading.value = false;
    }
};

// Fetch all tags
const fetchAllTags = async () => {
    try {
        const res = await tagApi.getAllTags();
        allTags.value = res.data || [];
    } catch (error) {
        console.error('Failed to fetch tags:', error);
    }
};

// Handle page size change
const handleSizeChange = (size) => {
    pageSize.value = size;
    fetchProblems();
};

// Handle current page change
const handleCurrentChange = (page) => {
    currentPage.value = page;
    fetchProblems();
};

// Lifecycle hooks
onMounted(() => {
    fetchProblems();
    fetchAllTags();
});
</script>

<style scoped>
.problem-management {
    padding: 0 10px;
}

.page-header {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0;
    font-size: 20px;
}

.page-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.search-input {
    flex: 1;
    min-width: 250px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.problem-title-cell {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.problem-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.problem-tag {
    color: white;
}

.problem-form {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 20px;
}

.form-item-help {
    font-size: 12px;
    color: var(--text-color-secondary);
    margin-top: 5px;
}

.w-100 {
    width: 100%;
}

.sample-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 5px;
}

.sample-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.sample-header h4 {
    margin: 0;
}

.hint-item {
    margin-bottom: 10px;
}

.hint-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.hint-delete {
    flex-shrink: 0;
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

@media (min-width: 768px) {
    .page-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .page-actions {
        max-width: 500px;
    }
}
</style>