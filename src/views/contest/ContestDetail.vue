<template>
  <section v-if="contest" class="contest-detail">
    <header class="detail-hero">
      <router-link class="back-link" to="/contests">← 返回竞赛</router-link>
      <div class="detail-hero__body">
        <div>
          <span class="phase-badge">{{ phaseLabel(contest.phase) }}</span>
          <h1>{{ contest.title }}</h1>
          <p>{{ contest.ruleType }} 赛制 · {{ formatDate(contest.startsAt) }} · {{ duration(contest) }}</p>
        </div>
        <div class="hero-action">
          <small>{{ contest.phase === 'RUNNING' ? '距离结束' : '距离开始' }}</small>
          <strong>{{ countdown }}</strong>
          <button v-if="contest.phase === 'REGISTRATION'" type="button" @click="toggleRegistration">
            {{ registered ? '取消报名' : '立即报名' }}
          </button>
          <button v-else-if="contest.phase === 'RUNNING'" class="hero-action__primary" type="button" @click="activeTab = 'problems'">进入赛场</button>
        </div>
      </div>
    </header>

    <nav class="detail-tabs" aria-label="Contest sections">
      <button v-for="tab in tabs" :key="tab.value" :class="{ active: activeTab === tab.value }" type="button" @click="activeTab = tab.value">{{ tab.label }}</button>
    </nav>

    <div v-if="activeTab === 'overview'" class="overview-grid">
      <article class="panel rules-panel">
        <span class="panel-label">比赛说明</span>
        <h2>公平、清晰、可追溯</h2>
        <template v-if="contest.ruleType === 'OI'">
          <p>比赛采用 OI 计分：执行全部测试用例并按不可变权重累计，总分越高排名越高。封榜后公开榜停止更新，比赛结束后自动揭榜。</p>
          <ul><li>每题分数取该题历史最佳有效提交</li><li>分题分数与总分均来自服务端排名快照</li><li>系统错误不改变参赛者最佳分数</li></ul>
        </template>
        <template v-else>
          <p>比赛采用 ACM 计分：通过题数越多排名越高；每次错误提交增加 20 分钟罚时。封榜后公开榜停止更新，比赛结束后自动揭榜。</p>
          <ul><li>只能提交已编排的不可变题目版本</li><li>编译错误、答案错误、超时、超内存和运行错误计罚时</li><li>系统错误不计入参赛者罚时</li></ul>
        </template>
      </article>
      <aside class="panel schedule-panel">
        <span class="panel-label">赛程</span>
        <dl><div><dt>报名</dt><dd>{{ registered ? '已报名' : '未报名' }}</dd></div><div><dt>开始</dt><dd>{{ formatDate(contest.startsAt) }}</dd></div><div><dt>结束</dt><dd>{{ formatDate(contest.endsAt) }}</dd></div><div><dt>赛制</dt><dd>{{ contest.ruleType }}</dd></div></dl>
      </aside>
    </div>

    <div v-else-if="activeTab === 'problems'" class="panel problem-panel">
      <div class="panel-heading"><div><span class="panel-label">Problems</span><h2>比赛题目</h2></div><span>{{ contestProblems.length }} 题</span></div>
      <article v-for="(problem, index) in contestProblems" :key="problem.id" class="contest-problem">
        <b>{{ String.fromCharCode(65 + index) }}</b>
        <div><strong>{{ problem.title || `题目 ${problem.label || index + 1}` }}</strong><small>{{ problem.problemNo || `#${problem.problemId}` }}<template v-if="problem.tags?.length"> · {{ problem.tags.map(tag => tag.name).join(' / ') }}</template></small></div>
        <span :class="`difficulty-${problem.difficulty || 0}`">{{ problem.difficulty ? difficultyLabel(problem.difficulty) : `${problem.score || 100} 分` }}</span>
        <router-link :to="{
          name: 'ContestProblemDetail',
          params: { contestId: contest.id, problemId: problem.problemId },
        }">开始解题 →</router-link>
      </article>
    </div>

    <div v-else class="panel scoreboard-panel">
      <div class="panel-heading"><div><span class="panel-label">Scoreboard</span><h2>实时排名</h2></div><span>最后更新：刚刚</span></div>
      <p v-if="!scoreboardRows.length" class="scoreboard-empty">排名尚未产生。</p>
      <div v-else class="score-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">排名</th>
              <th scope="col">选手</th>
              <template v-if="scoreboardRuleType === 'OI'">
                <th scope="col">总分</th>
                <th v-for="problem in scoreboardProblems" :key="problem.key" scope="col">{{ problem.label }}</th>
              </template>
              <template v-else>
                <th scope="col">通过</th>
                <th scope="col">罚时</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in scoreboardRows" :key="row.rank || row.userId">
              <td><b>{{ row.rank || index + 1 }}</b></td>
              <td><strong>{{ row.username || `用户 #${row.userId}` }}</strong></td>
              <template v-if="scoreboardRuleType === 'OI'">
                <td class="score-total">{{ row.totalScore ?? 0 }} / {{ scoreboardMaximumScore }}</td>
                <td v-for="problem in scoreboardProblems" :key="problem.key">{{ problemScore(row, problem) }}</td>
              </template>
              <template v-else>
                <td>{{ row.solved ?? 0 }}</td>
                <td>{{ row.penaltyMinutes ?? row.penalty ?? 0 }}</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <section v-else-if="loadError" class="panel contest-load-error" role="alert">
    <h1>暂时无法加载比赛</h1>
    <p>比赛详情服务没有返回有效数据，请稍后重试。</p>
    <button type="button" @click="loadContest">重新加载</button>
  </section>
  <el-skeleton v-else :rows="12" animated />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { contestApi } from '@/api/contest'
import { normalizeContestProblem } from '@/views/problem/contestProblem'

const route = useRoute()
const contest = ref(null)
const loadError = ref(false)
const registered = ref(false)
const activeTab = ref('overview')
const contestProblems = ref([])
const tabs = [{ value: 'overview', label: '概览' }, { value: 'problems', label: '题目' }, { value: 'scoreboard', label: '排名' }]
const scoreboard = ref({ ruleType: 'ACM', maximumScore: null, rows: [] })
const scoreboardRows = computed(() => scoreboard.value.rows)
const scoreboardRuleType = computed(() => scoreboard.value.ruleType)
const scoreboardMaximumScore = computed(() => scoreboard.value.maximumScore ?? 0)
const scoreboardProblems = computed(() => {
  const columns = new Map()
  scoreboardRows.value.forEach(row => {
    const problems = Array.isArray(row.problems) ? row.problems : []
    problems.forEach((problem, index) => {
      const key = problem.problemId ?? problem.label ?? index
      if (!columns.has(key)) {
        columns.set(key, {
          key,
          problemId: problem.problemId,
          label: problem.label || `P${index + 1}`,
          maximumScore: problem.maximumScore ?? 0,
        })
      }
    })
  })
  return [...columns.values()]
})
const problemScore = (row, column) => {
  const problems = Array.isArray(row.problems) ? row.problems : []
  const problem = problems.find(item => (
    (column.problemId != null && item.problemId === column.problemId)
    || (column.problemId == null && item.label === column.label)
  ))
  return `${problem?.score ?? 0} / ${problem?.maximumScore ?? column.maximumScore}`
}
const countdown = computed(() => {
  const target = contest.value?.phase === 'RUNNING' ? contest.value.endsAt : contest.value?.startsAt
  if (!target) return '--'
  const minutes = Math.max(0, Math.round((new Date(target) - Date.now()) / 60000))
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
})
const phaseLabel = phase => ({ REGISTRATION: '报名中', RUNNING: '进行中', FROZEN: '已封榜', ENDED: '已结束' }[phase] || phase)
const formatDate = value => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const duration = value => `${Math.round((new Date(value.endsAt) - new Date(value.startsAt)) / 36e5)} 小时`
const difficultyLabel = value => ({ 1: '入门', 2: '进阶', 3: '挑战' }[value])
const toggleRegistration = async () => {
  registered.value ? await contestApi.cancelRegistration(contest.value.id) : await contestApi.register(contest.value.id)
  registered.value = !registered.value
}

const loadContest = async () => {
  const id = Number(route.params.contestId)
  loadError.value = false

  try {
    const detail = await contestApi.detail(id)
    contest.value = detail.data.contest
      ? { ...detail.data.contest, phase: detail.data.phase }
      : detail.data
  } catch (error) {
    console.error('Failed to load contest detail:', error)
    contest.value = null
    loadError.value = true
    return
  }

  const [problems, board] = await Promise.allSettled([
    contestApi.problems(id),
    contestApi.scoreboard(id),
  ])
  contestProblems.value = problems.status === 'fulfilled'
    ? (problems.value.data || []).map(item => normalizeContestProblem(item, id))
    : []
  const boardData = board.status === 'fulfilled' ? board.value.data || {} : {}
  const ruleType = boardData.ruleType === 'OI' || boardData.ruleType === 'ACM'
    ? boardData.ruleType
    : contest.value.ruleType === 'OI'
      ? 'OI'
      : 'ACM'
  scoreboard.value = {
    ruleType,
    maximumScore: Number.isFinite(boardData.maximumScore) ? boardData.maximumScore : null,
    rows: Array.isArray(boardData.rows) ? boardData.rows : [],
  }
}

onMounted(loadContest)
</script>

<style scoped>
.contest-detail { display: grid; gap: 22px; }.back-link { color: rgba(255,255,255,.72); font-size: 12px; }.detail-hero { color: white; border-radius: 24px; padding: 24px 28px 30px; background: #3b3733; box-shadow: 0 22px 50px rgba(61,49,39,.18); }.detail-hero__body { margin-top: 34px; display: flex; justify-content: space-between; align-items: end; gap: 30px; }.detail-hero h1 { margin: 8px 0; color: white; font-size: clamp(30px,5vw,50px); letter-spacing: -.05em; }.detail-hero p,.hero-action small { color: rgba(255,255,255,.68); }.phase-badge { color: #e8b18f; font-size: 12px; font-weight: 800; }.hero-action { min-width: 190px; text-align: right; }.hero-action strong { display: block; color: white; font-size: 30px; font-variant-numeric: tabular-nums; }.hero-action button { margin-top: 12px; border: 1px solid rgba(255,255,255,.4); background: transparent; color: white; border-radius: 10px; padding: 9px 14px; cursor: pointer; }.hero-action button.hero-action__primary { border-color: #fffaf5; background: #fffaf5; color: #3b3733; font-weight: 800; }.detail-tabs { display: flex; gap: 5px; border-bottom: 1px solid var(--border-color); }.detail-tabs button { border: 0; border-bottom: 2px solid transparent; background: transparent; padding: 12px 17px; color: var(--text-color-secondary); cursor: pointer; font-weight: 700; }.detail-tabs button.active { color: var(--accent-color); border-bottom-color: var(--accent-color); }.overview-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 18px; }.panel { background: var(--card-bg); border: 1px solid var(--border-color-light); border-radius: 18px; padding: 24px; box-shadow: 0 10px 32px rgba(61,49,39,.05); }.panel-label { color: var(--accent-color); font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }.panel h2 { margin: 7px 0 15px; font-size: 24px; }.rules-panel p,.rules-panel li { color: var(--text-color-secondary); line-height: 1.7; }.schedule-panel dl { margin: 14px 0 0; }.schedule-panel dl div { display: flex; justify-content: space-between; padding: 13px 0; border-top: 1px solid var(--border-color-light); }.schedule-panel dt { color: var(--text-color-secondary); }.schedule-panel dd { margin: 0; font-weight: 750; }.panel-heading { display: flex; justify-content: space-between; align-items: end; margin-bottom: 8px; }.panel-heading > span { color: var(--text-color-secondary); font-size: 12px; }.contest-problem { min-height: 72px; display: grid; grid-template-columns: 42px 1fr 70px 90px; gap: 12px; align-items: center; border-top: 1px solid var(--border-color-light); }.contest-problem > b { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--accent-color-soft); color: var(--accent-color); }.contest-problem div { display: grid; }.contest-problem small { color: var(--text-color-secondary); }.contest-problem [class^='difficulty-'] { font-size: 11px; }.difficulty-1 { color: #087d5c; }.difficulty-2 { color: #9a6500; }.difficulty-3 { color: #c23e43; }.contract-pending { color: var(--text-color-secondary); font-size: 11px; }.scoreboard-empty { margin: 18px 0 0; color: var(--text-color-secondary); }.score-table-wrap { overflow-x: auto; border-top: 1px solid var(--border-color-light); }.score-table-wrap table { width: 100%; border-collapse: collapse; white-space: nowrap; }.score-table-wrap th,.score-table-wrap td { min-width: 88px; padding: 13px 14px; border-bottom: 1px solid var(--border-color-light); text-align: right; }.score-table-wrap th { color: var(--text-color-secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; }.score-table-wrap th:first-child,.score-table-wrap td:first-child { min-width: 54px; text-align: left; }.score-table-wrap th:nth-child(2),.score-table-wrap td:nth-child(2) { min-width: 170px; text-align: left; }.score-table-wrap tbody tr:last-child td { border-bottom: 0; }.score-total { color: var(--accent-color); font-weight: 800; }@media(max-width:720px){.detail-hero__body{align-items:start;flex-direction:column}.hero-action{text-align:left}.overview-grid{grid-template-columns:1fr}.contest-problem{grid-template-columns:38px 1fr 60px}.contest-problem>a{display:none}}
</style>
