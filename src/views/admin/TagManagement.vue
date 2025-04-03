<template>
    <div class="tag-management">
        <div class="page-header">
            <h2>{{ $t('admin.tag_management') }}</h2>
            <div class="page-actions">
                <el-input v-model="searchKeyword" :placeholder="$t('admin.search_tag')" @input="handleSearch" clearable
                    class="search-input">
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
                    {{ $t('admin.add_tag') }}
                </el-button>
            </div>
        </div>

        <!-- Tags list -->
        <div class="table-container">
            <el-table :data="tags" style="width: 100%" v-loading="loading" border stripe :header-cell-style="headerCellStyle" :cell-style="cellStyle">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column :label="$t('admin.tag_name')" min-width="180">
                    <template #default="scope">
                        <div class="tag-name-cell">
                            <el-tag
                                :style="{ backgroundColor: scope.row.color, borderColor: scope.row.color, color: getContrastColor(scope.row.color) }"
                                size="large">
                                {{ scope.row.name }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('admin.actions')" width="180" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
                            {{ $t('admin.edit') }}
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDelete(scope.row)">
                            {{ $t('admin.delete') }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>

        <!-- Tag Form Dialog -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? $t('admin.edit_tag') : $t('admin.add_tag')" width="500px"
            :before-close="handleDialogClose">
            <el-form ref="tagFormRef" :model="tagForm" :rules="rules" label-width="100px">
                <el-form-item :label="$t('admin.tag_name')" prop="name">
                    <el-input v-model="tagForm.name" />
                </el-form-item>

                <el-form-item :label="$t('admin.color')" prop="color">
                    <el-color-picker v-model="tagForm.color" color-format="hex"/>
                </el-form-item>

                <el-form-item :label="$t('admin.preview')">
                    <el-tag
                        :style="{ backgroundColor: tagForm.color, borderColor: tagForm.color, color: getContrastColor(tagForm.color) }"
                        size="large">
                        {{ tagForm.name || $t('admin.tag_preview') }}
                    </el-tag>
                </el-form-item>
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
                <p>{{ $t('admin.delete_tag_confirmation', { name: selectedTag?.name }) }}</p>
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
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Warning } from '@element-plus/icons-vue';
import { tagApi } from '@/api/tag';
import { useAppStore } from '@/store/modules/app';

const { t } = useI18n();
const appStore = useAppStore();

// State
const loading = ref(false);
const tags = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const searchTimeout = ref(null);

// Dialog state
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEdit = ref(false);
const selectedTag = ref(null);
const submitLoading = ref(false);
const deleteLoading = ref(false);

// Table styles for correct theme application
const headerCellStyle = {
    backgroundColor: 'var(--bg-color-secondary)',
    color: 'var(--text-color)',
    borderColor: 'var(--border-color)'
};

const cellStyle = {
    backgroundColor: 'var(--bg-color-secondary)',
    color: 'var(--text-color)',
    borderColor: 'var(--border-color)'
};

// Tag form
const tagFormRef = ref(null);
const tagForm = reactive({
    id: null,
    name: '',
    color: '#409EFF'
});

// Form validation rules
const rules = reactive({
    name: [
        { required: true, message: t('admin.tag_name_required'), trigger: 'blur' },
        { min: 1, max: 20, message: t('admin.tag_name_length'), trigger: 'blur' }
    ],
    color: [
        { required: true, message: t('admin.color_required'), trigger: 'change' }
    ]
});

// Get contrast color for text based on background color
const getContrastColor = (hexColor) => {
    // Default to white if no color provided
    if (!hexColor) return '#ffffff';

    // Handle rgba notation
    if (hexColor.startsWith('rgba')) {
        const colorParts = hexColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (colorParts) {
            const r = parseInt(colorParts[1]);
            const g = parseInt(colorParts[2]);
            const b = parseInt(colorParts[3]);
            // Calculate brightness
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }
        return '#ffffff'; // Default if parsing fails
    }

    // Handle hex format
    let hex = hexColor.replace('#', '');

    // Convert 3-character hex to 6 characters
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate brightness using the formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black or white based on brightness
    return brightness > 128 ? '#000000' : '#ffffff';
};

// Handle search with debounce
const handleSearch = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
        currentPage.value = 1;
        fetchTags();
    }, 300);
};

// Handle add new tag
const handleAdd = () => {
    isEdit.value = false;
    resetForm();
    dialogVisible.value = true;
};

// Handle edit tag
const handleEdit = (tag) => {
    isEdit.value = true;
    selectedTag.value = tag;

    // Copy tag data to form
    Object.assign(tagForm, {
        id: tag.id,
        name: tag.name,
        color: tag.color
    });

    dialogVisible.value = true;
};

// Handle delete tag
const handleDelete = (tag) => {
    selectedTag.value = tag;
    deleteDialogVisible.value = true;
};

// Confirm delete tag
const confirmDelete = async () => {
    if (!selectedTag.value) return;

    deleteLoading.value = true;
    try {
        await tagApi.deleteTag(selectedTag.value.id);
        ElMessage.success(t('admin.tag_deleted'));
        deleteDialogVisible.value = false;
        fetchTags();
    } catch (error) {
        ElMessage.error(t('admin.delete_tag_error'));
        console.error('Failed to delete tag:', error);
    } finally {
        deleteLoading.value = false;
    }
};

// Reset form
const resetForm = () => {
    if (tagFormRef.value) {
        tagFormRef.value.resetFields();
    }

    Object.assign(tagForm, {
        id: null,
        name: '',
        color: '#409EFF'
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
    if (!tagFormRef.value) return;

    try {
        await tagFormRef.value.validate();
        submitLoading.value = true;

        if (isEdit.value) {
            // Update tag
            await tagApi.updateTag(tagForm);
            ElMessage.success(t('admin.tag_updated'));
        } else {
            // Create new tag
            await tagApi.createTag(tagForm);
            ElMessage.success(t('admin.tag_created'));
        }

        dialogVisible.value = false;
        fetchTags();
    } catch (error) {
        ElMessage.error(isEdit.value ? t('admin.update_tag_error') : t('admin.create_tag_error'));
        console.error('Form validation or submission error:', error);
    } finally {
        submitLoading.value = false;
    }
};

// Fetch tags list
const fetchTags = async () => {
    loading.value = true;
    try {
        const params = {
            current: currentPage.value,
            size: pageSize.value,
            keyword: searchKeyword.value
        };

        const res = await tagApi.getTagList(params);
        tags.value = res.data.records || [];
        total.value = res.data.total || 0;
    } catch (error) {
        ElMessage.error(t('admin.fetch_tags_error'));
        console.error('Failed to fetch tags:', error);
    } finally {
        loading.value = false;
    }
};

// Handle page size change
const handleSizeChange = (size) => {
    pageSize.value = size;
    fetchTags();
};

// Handle current page change
const handleCurrentChange = (page) => {
    currentPage.value = page;
    fetchTags();
};

// Lifecycle hooks
onMounted(() => {
    fetchTags();
});
</script>

<style scoped>
.tag-management {
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

.table-container {
    width: 100%;
    overflow-x: auto;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.tag-name-cell {
    display: flex;
    align-items: center;
}

.color-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.color-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
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