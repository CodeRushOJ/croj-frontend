// src/views/problem/ProblemList.vue
<template>
    <div class="problem-list-container">
        <!-- Display email verification banner for unverified users -->
        <EmailVerificationBanner />

        <el-card class="problem-list-card">
            <template #header>
                <div class="card-header">
                    <h2>{{ $t('problems.list_title') }}</h2>
                    <div class="filter-section">
                        <el-input v-model="searchQuery.keyword" :placeholder="$t('problems.search_placeholder')"
                            clearable @clear="handleSearch" @keyup.enter="handleSearch" class="search-input">
                            <template #prefix>
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </template>
                            <template #append>
                                <el-button @click="handleSearch">{{ $t('common.search') }}</el-button>
                            </template>
                        </el-input>
                        <el-button @click="showFilterDrawer = true" type="primary" plain>
                            <el-icon>
                                <Filter />
                            </el-icon>
                            {{ $t('problems.filter') }}
                        </el-button>
                    </div>
                </div>
            </template>

            <!-- Loading state -->
            <div v-if="loading" class="loading-container">
                <el-skeleton :rows="10" animated />
            </div>

            <!-- Problem list -->
            <el-table v-else :data="problemList" style="width: 100%" @row-click="navigateToDetail"
                :empty-text="$t('problems.no_problems')" row-key="id" border>
                <el-table-column prop="problemNo" :label="$t('problems.id')" min-width="80" />
                <el-table-column prop="title" :label="$t('problems.title')" min-width="200">
                    <template #default="scope">
                        <div class="problem-title">
                            <router-link :to="{ name: 'ProblemDetail', params: { problemNo: scope.row.problemNo } }">
                                {{ scope.row.title }}
                            </router-link>
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
                <el-table-column :label="$t('problems.difficulty')" min-width="120" align="center">
                    <template #default="scope">
                        <el-tag :type="getDifficultyType(scope.row.difficulty)" size="small">
                            {{ getDifficultyLabel(scope.row.difficulty) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('problems.submission')" align="center" min-width="100">
                    <template #default="scope">
                        {{ scope.row.submitCount }}
                    </template>
                </el-table-column>
                <el-table-column :label="$t('problems.accepted')" align="center" min-width="100">
                    <template #default="scope">
                        {{ scope.row.acceptedCount }}
                    </template>
                </el-table-column>
                <el-table-column :label="$t('problems.acceptance_rate')" align="center" min-width="120">
                    <template #default="scope">
                        {{ (scope.row.acceptRate * 100).toFixed(1) }}%
                    </template>
                </el-table-column>
                <el-table-column :label="$t('problems.status')" align="center" min-width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.userStatus === 1" type="success" size="small">
                            {{ $t('problems.status_accepted') }}
                        </el-tag>
                        <el-tag v-else-if="scope.row.userStatus === 2" type="danger" size="small">
                            {{ $t('problems.status_attempted') }}
                        </el-tag>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- Filter drawer -->
        <el-drawer v-model="showFilterDrawer" :title="$t('problems.filter_problems')" direction="rtl" size="300px">
            <div class="filter-drawer-content">
                <h3>{{ $t('problems.difficulty') }}</h3>
                <el-radio-group v-model="searchQuery.difficulty" @change="handleFilterChange">
                    <el-radio :label="0">{{ $t('problems.all') }}</el-radio>
                    <el-radio :label="1">{{ $t('problems.easy') }}</el-radio>
                    <el-radio :label="2">{{ $t('problems.medium') }}</el-radio>
                    <el-radio :label="3">{{ $t('problems.hard') }}</el-radio>
                </el-radio-group>

                <h3>{{ $t('problems.status') }}</h3>
                <el-radio-group v-model="searchQuery.status" @change="handleFilterChange">
                    <el-radio :label="0">{{ $t('problems.all') }}</el-radio>
                    <el-radio :label="1">{{ $t('problems.solved') }}</el-radio>
                    <el-radio :label="2">{{ $t('problems.attempted') }}</el-radio>
                    <el-radio :label="3">{{ $t('problems.unsolved') }}</el-radio>
                </el-radio-group>

                <h3>{{ $t('problems.tags') }}</h3>
                <div class="tags-container">
                    <el-tag v-for="tag in allTags" :key="tag.id" :style="{
                        backgroundColor: isTagSelected(tag.id) ? tag.color : '',
                        borderColor: tag.color,
                        cursor: 'pointer'
                    }" class="filter-tag" @click="toggleTag(tag.id)" :effect="isTagSelected(tag.id) ? 'dark' : 'plain'"
                        size="large">
                        {{ tag.name }}
                    </el-tag>
                </div>

                <div class="filter-actions">
                    <el-button type="primary" @click="handleSearch">{{ $t('common.apply') }}</el-button>
                    <el-button @click="resetFilters">{{ $t('common.reset') }}</el-button>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Filter } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import EmailVerificationBanner from '@/components/common/EmailVerificationBanner.vue';
import { problemApi } from '@/api/problem';
import { tagApi } from '@/api/tag';

const { t } = useI18n();
const router = useRouter();

// State
const loading = ref(false);
const problemList = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const allTags = ref([]);
const showFilterDrawer = ref(false);

// Search query
const searchQuery = reactive({
    keyword: '',
    difficulty: 0, // 0 means all
    status: 0, // 0 means all
    tagIds: []
});

// Fetch problem list
const fetchProblems = async () => {
    loading.value = true;
    try {
        const params = {
            current: currentPage.value,
            size: pageSize.value,
            ...searchQuery
        };

        // If difficulty is 0 (all), remove it from params
        if (params.difficulty === 0) {
            delete params.difficulty;
        }

        // If status is 0 (all), remove it from params
        if (params.status === 0) {
            delete params.status;
        }

        // If no tags selected, remove tagIds from params
        if (params.tagIds.length === 0) {
            delete params.tagIds;
        }

        const res = await problemApi.getProblemList(params);
        problemList.value = res.data.records || [];
        total.value = res.data.total || 0;
    } catch (error) {
        ElMessage.error(t('problems.fetch_error'));
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

// Navigate to problem detail
const navigateToDetail = (row) => {
    router.push({
        name: 'ProblemDetail',
        params: { problemNo: row.problemNo }
    });
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

// Check if tag is selected
const isTagSelected = (tagId) => {
    return searchQuery.tagIds.includes(tagId);
};

// Toggle tag selection
const toggleTag = (tagId) => {
    const index = searchQuery.tagIds.indexOf(tagId);
    if (index > -1) {
        searchQuery.tagIds.splice(index, 1);
    } else {
        searchQuery.tagIds.push(tagId);
    }
};

// Handle search
const handleSearch = () => {
    currentPage.value = 1;
    fetchProblems();
    showFilterDrawer.value = false;
};

// Handle filter change
const handleFilterChange = () => {
    currentPage.value = 1;
};

// Reset filters
const resetFilters = () => {
    searchQuery.keyword = '';
    searchQuery.difficulty = 0;
    searchQuery.status = 0;
    searchQuery.tagIds = [];
    currentPage.value = 1;
    fetchProblems();
    showFilterDrawer.value = false;
};

// Handle pagination
const handleSizeChange = (size) => {
    pageSize.value = size;
    fetchProblems();
};

const handleCurrentChange = (page) => {
    currentPage.value = page;
    fetchProblems();
};

// Lifecycle
onMounted(() => {
    fetchProblems();
    fetchAllTags();
});
</script>

<style scoped>
.problem-list-container {
    padding: 0 10px;
}

.card-header {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.card-header h2 {
    margin: 0;
    font-size: 20px;
}

.filter-section {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.search-input {
    flex: 1;
    min-width: 250px;
}

.loading-container {
    padding: 20px 0;
}

.problem-title {
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

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.filter-drawer-content {
    padding: 10px;
}

.filter-drawer-content h3 {
    margin-top: 20px;
    margin-bottom: 10px;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
}

.filter-tag {
    cursor: pointer;
}

.filter-actions {
    margin-top: 30px;
    display: flex;
    gap: 10px;
}

@media (min-width: 768px) {
    .card-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .filter-section {
        max-width: 500px;
    }
}
</style>