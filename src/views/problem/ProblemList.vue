<template>
  <section class="problem-page">
    <header class="page-hero">
      <div>
        <span class="eyebrow">PROBLEMS</span>
        <h1>题库</h1>
        <p>按题号、难度、状态或标签筛选题目。</p>
      </div>
      <div class="progress-card">
        <span>你的进度</span>
        <strong>{{ solvedCount }}<small> / {{ total || problemList.length }}</small></strong>
        <div class="progress-track"><i :style="{ width: `${progressPercent}%` }" /></div>
      </div>
    </header>

    <div class="workspace-card">
      <div class="toolbar">
        <el-input
          v-model="searchQuery.keyword"
          class="search-control"
          placeholder="搜索题号或标题"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="searchQuery.difficulty" class="select-control" @change="handleSearch">
          <el-option label="全部难度" :value="0" />
          <el-option label="入门" :value="1" />
          <el-option label="进阶" :value="2" />
          <el-option label="挑战" :value="3" />
        </el-select>
        <el-select v-model="searchQuery.status" class="select-control" @change="handleSearch">
          <el-option label="全部状态" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="尝试过" :value="2" />
          <el-option label="未开始" :value="3" />
        </el-select>
        <button class="reset-button" type="button" @click="resetFilters">重置</button>
      </div>

      <div v-if="allTags.length" class="tag-filter" aria-label="Algorithm tags">
        <button
          v-for="tag in allTags"
          :key="tag.id"
          type="button"
          :class="['tag-chip', { 'tag-chip--active': isTagSelected(tag.id) }]"
          @click="toggleTag(tag.id)">
          {{ tag.name }}
        </button>
      </div>

      <div class="list-meta">
        <span><strong>{{ total || problemList.length }}</strong> 道题目</span>
        <span class="legend"><i class="status-dot status-dot--accepted" /> 已通过 <i class="status-dot status-dot--attempted" /> 尝试过</span>
      </div>

      <div v-if="loading" class="loading-state"><el-skeleton :rows="8" animated /></div>
      <div v-else-if="loadError" class="error-state" role="alert">
        <span aria-hidden="true">!</span>
        <h2>暂时无法加载题目</h2>
        <p>题目服务没有返回有效数据。请检查网络或稍后重试。</p>
        <button type="button" @click="fetchProblems">重新加载</button>
      </div>
      <div v-else-if="problemList.length" class="problem-table" role="table" aria-label="题目列表">
        <div class="problem-row problem-row--head" role="row">
          <span>状态</span><span>题目</span><span>难度</span><span>通过率</span><span>提交</span><span></span>
        </div>
        <article
          v-for="problem in problemList"
          :key="problem.id"
          class="problem-row"
          role="row"
          @click="navigateToDetail(problem)">
          <span class="status-cell">
            <i :class="['status-indicator', statusClass(problem.userStatus)]" />
          </span>
          <span class="problem-cell">
            <small>{{ problem.problemNo }}</small>
            <router-link :to="{ name: 'ProblemDetail', params: { problemNo: problem.problemNo } }" @click.stop>
              {{ problem.title }}
            </router-link>
            <span class="row-tags"><em v-for="tag in problem.tags" :key="tag.id">{{ tag.name }}</em></span>
          </span>
          <span><b :class="['difficulty', `difficulty--${problem.difficulty}`]">{{ difficultyLabel(problem.difficulty) }}</b></span>
          <span class="metric">{{ formatRate(problem.acceptRate) }}</span>
          <span class="metric">{{ formatCount(problem.submitCount) }}</span>
          <span><button class="solve-button" type="button">开始做题 <el-icon><ArrowRight /></el-icon></button></span>
        </article>
      </div>
      <div v-else class="empty-state">
        <span>∅</span>
        <h2>没有匹配的题目</h2>
        <p>调整筛选条件，或清空搜索后再试一次。</p>
        <button type="button" @click="resetFilters">清空筛选</button>
      </div>

      <div v-if="total > pageSize" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Search } from '@element-plus/icons-vue'
import { problemApi } from '@/api/problem'
import { tagApi } from '@/api/tag'

const router = useRouter()
const loading = ref(false)
const loadError = ref(false)
const problemList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const allTags = ref([])
const searchQuery = reactive({ keyword: '', difficulty: 0, status: 0, tagIds: [] })

const solvedCount = computed(() => problemList.value.filter(problem => problem.userStatus === 1).length)
const progressPercent = computed(() => Math.min(100, Math.round((solvedCount.value / Math.max(total.value, problemList.value.length, 1)) * 100)))

const fetchProblems = async () => {
  loading.value = true
  loadError.value = false
  try {
    const params = { current: currentPage.value, size: pageSize.value, ...searchQuery }
    if (!params.difficulty) delete params.difficulty
    if (!params.status) delete params.status
    if (!params.tagIds.length) delete params.tagIds
    const response = await problemApi.getProblemList(params)
    problemList.value = response.data.records || []
    total.value = response.data.total || 0
  } catch {
    problemList.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const fetchTags = async () => {
  try {
    const response = await tagApi.getAllTags()
    allTags.value = response.data || []
  } catch {
    allTags.value = []
  }
}

const handleSearch = () => { currentPage.value = 1; fetchProblems() }
const resetFilters = () => { Object.assign(searchQuery, { keyword: '', difficulty: 0, status: 0, tagIds: [] }); currentPage.value = 1; fetchProblems() }
const isTagSelected = id => searchQuery.tagIds.includes(id)
const toggleTag = id => { const index = searchQuery.tagIds.indexOf(id); index >= 0 ? searchQuery.tagIds.splice(index, 1) : searchQuery.tagIds.push(id); handleSearch() }
const handleSizeChange = size => { pageSize.value = size; fetchProblems() }
const handleCurrentChange = page => { currentPage.value = page; fetchProblems() }
const navigateToDetail = problem => router.push({ name: 'ProblemDetail', params: { problemNo: problem.problemNo } })
const difficultyLabel = difficulty => ({ 1: '入门', 2: '进阶', 3: '挑战' }[difficulty] || '未知')
const statusClass = status => status === 1 ? 'status-indicator--accepted' : status === 2 ? 'status-indicator--attempted' : ''
const formatRate = rate => `${Number(rate || 0).toFixed(1)}%`
const formatCount = count => new Intl.NumberFormat('zh-CN', { notation: count > 9999 ? 'compact' : 'standard' }).format(count || 0)

onMounted(() => Promise.allSettled([fetchProblems(), fetchTags()]))
</script>

<style scoped>
.problem-page { display: grid; gap: 26px; }
.page-hero { display: grid; grid-template-columns: 1fr 230px; gap: 30px; align-items: end; padding: 8px 2px; }
.eyebrow { color: var(--accent-color); font-size: 11px; font-weight: 750; letter-spacing: .1em; }
.page-hero h1 { margin: 5px 0 8px; font-size: clamp(27px, 4vw, 36px); line-height: 1.12; letter-spacing: -.035em; }
.page-hero p { margin: 0; max-width: 680px; color: var(--text-color-secondary); font-size: 15px; }
.progress-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px; }
.progress-card span, .progress-card small { color: var(--text-color-secondary); }
.progress-card strong { display: block; color: var(--text-color); font-size: 27px; margin: 3px 0 9px; }
.progress-track { height: 4px; background: var(--border-color-light); border-radius: 999px; overflow: hidden; }
.progress-track i { display: block; height: 100%; background: var(--accent-color); border-radius: inherit; }
.workspace-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
.toolbar { padding: 20px; display: grid; grid-template-columns: minmax(280px, 1fr) 150px 150px auto; gap: 10px; border-bottom: 1px solid var(--border-color-light); }
.search-control :deep(.el-input__wrapper), .select-control :deep(.el-select__wrapper) { min-height: 42px; box-shadow: 0 0 0 1px var(--border-color) inset; border-radius: 11px; }
.reset-button { border: 0; border-radius: 11px; padding: 0 15px; color: var(--text-color-secondary); background: var(--border-color-light); cursor: pointer; font-weight: 650; }
.tag-filter { padding: 14px 20px; display: flex; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid var(--border-color-light); }
.tag-chip { border: 1px solid var(--border-color); background: transparent; color: var(--text-color-secondary); border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.tag-chip--active { border-color: var(--accent-color); color: var(--accent-color); background: var(--accent-color-soft); }
.list-meta { padding: 14px 20px; display: flex; justify-content: space-between; color: var(--text-color-secondary); font-size: 12px; }
.legend { display: flex; gap: 7px; align-items: center; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #bec2cd; }
.status-dot--accepted { background: #16a77a; }.status-dot--attempted { background: #f3a51b; margin-left: 8px; }
.problem-row { display: grid; grid-template-columns: 54px minmax(300px, 1.8fr) 100px 100px 90px 125px; align-items: center; min-height: 78px; padding: 0 20px; border-top: 1px solid var(--border-color-light); transition: .16s ease; cursor: pointer; }
.problem-row:not(.problem-row--head):hover { background: color-mix(in srgb, var(--border-color-light) 55%, transparent); transform: translateY(-1px); }
.problem-row--head { min-height: 42px; color: var(--text-color-secondary); background: color-mix(in srgb, var(--border-color-light) 60%, transparent); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; cursor: default; }
.status-cell { display: grid; place-items: center; }
.status-indicator { width: 11px; height: 11px; border: 2px solid #c7cbd4; border-radius: 50%; }
.status-indicator--accepted { border-color: #16a77a; background: #16a77a; box-shadow: 0 0 0 4px rgba(22,167,122,.11); }
.status-indicator--attempted { border-color: #f3a51b; background: #f3a51b; box-shadow: 0 0 0 4px rgba(243,165,27,.12); }
.problem-cell { display: grid; grid-template-columns: auto 1fr; align-items: baseline; gap: 3px 12px; }
.problem-cell small { color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }
.problem-cell a { color: var(--text-color); font-size: 15px; font-weight: 750; }
.row-tags { grid-column: 2; display: flex; gap: 6px; }
.row-tags em { color: var(--text-color-secondary); font-size: 11px; font-style: normal; }
.difficulty { display: inline-flex; border-radius: 999px; padding: 5px 9px; font-size: 11px; }
.difficulty--1 { color: #087d5c; background: #e7f8f2; }.difficulty--2 { color: #9a6500; background: #fff4d7; }.difficulty--3 { color: #c23e43; background: #ffeaeb; }
.metric { color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }
.solve-button { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: var(--accent-color); font-weight: 700; cursor: pointer; }
.loading-state, .empty-state, .error-state { padding: 48px 28px; }
.empty-state, .error-state { text-align: center; }
.empty-state > span, .error-state > span { display: inline-grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--border-color); border-radius: 50%; color: #9a6b47; font-weight: 750; }
.empty-state h2, .error-state h2 { margin: 10px 0 4px; font-size: 18px; }.empty-state p, .error-state p { color: var(--text-color-secondary); }
.empty-state button, .error-state button { border: 1px solid #2f2b28; background: #2f2b28; color: #fffaf3; border-radius: 8px; padding: 9px 14px; cursor: pointer; }
.pagination-container { display: flex; justify-content: center; padding: 18px; border-top: 1px solid var(--border-color-light); }
@media (max-width: 900px) {
  .page-hero { grid-template-columns: 1fr; }.progress-card { display: none; }
  .toolbar { grid-template-columns: 1fr 1fr; }.search-control { grid-column: 1 / -1; }
  .problem-row { grid-template-columns: 42px 1fr 80px; padding: 0 12px; }.problem-row > :nth-child(4), .problem-row > :nth-child(5), .problem-row > :nth-child(6) { display: none; }
}
@media (max-width: 560px) { .toolbar { grid-template-columns: 1fr; }.search-control { grid-column: auto; }.list-meta .legend { display: none; }.problem-row { grid-template-columns: 32px 1fr 64px; }.problem-cell { grid-template-columns: 1fr; }.row-tags { grid-column: 1; }.problem-cell small { display: none; } }
</style>
