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
        <p>比赛采用 ACM 计分：通过题数越多排名越高；每次错误提交增加 20 分钟罚时。封榜后公开榜停止更新，比赛结束后自动揭榜。</p>
        <ul><li>只能提交已编排的不可变题目版本</li><li>编译错误、答案错误、超时、超内存和运行错误计罚时</li><li>系统错误不计入参赛者罚时</li></ul>
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
        <router-link v-if="problem.problemNo" :to="{ name: 'ProblemDetail', params: { problemNo: problem.problemNo } }">开始解题 →</router-link>
        <span v-else class="contract-pending">等待题目摘要</span>
      </article>
    </div>

    <div v-else class="panel scoreboard-panel">
      <div class="panel-heading"><div><span class="panel-label">Scoreboard</span><h2>实时排名</h2></div><span>最后更新：刚刚</span></div>
      <div class="score-row score-row--head"><span>排名</span><span>选手</span><span>通过</span><span>罚时</span></div>
      <div v-for="(row, index) in scoreboard" :key="row.rank || row.userId" class="score-row"><b>{{ row.rank || index + 1 }}</b><strong>{{ row.username || `用户 #${row.userId}` }}</strong><span>{{ row.solved }}</span><span>{{ row.penalty ?? row.penaltyMinutes }}</span></div>
    </div>
  </section>
  <el-skeleton v-else :rows="12" animated />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { contestApi } from '@/api/contest'
import { previewAuthEnabled } from '@/auth/previewAuth'
import { previewContests, previewProblems } from '@/auth/previewData'

const route = useRoute()
const contest = ref(null)
const registered = ref(false)
const activeTab = ref('overview')
const contestProblems = ref([])
const tabs = [{ value: 'overview', label: '概览' }, { value: 'problems', label: '题目' }, { value: 'scoreboard', label: '排名' }]
const scoreboard = ref([])
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
  if (previewAuthEnabled) { registered.value = !registered.value; return }
  registered.value ? await contestApi.cancelRegistration(contest.value.id) : await contestApi.register(contest.value.id)
  registered.value = !registered.value
}

onMounted(async () => {
  const id = Number(route.params.contestId)
  if (previewAuthEnabled) {
    contest.value = previewContests.find(item => item.id === id) || previewContests[0]
    contestProblems.value = previewProblems.slice(0, 5)
    scoreboard.value = [{ rank: 1, username: 'north_star', solved: 5, penalty: 312 }, { rank: 2, username: 'lambda', solved: 4, penalty: 247 }, { rank: 3, username: 'preview-admin', solved: 3, penalty: 198 }]
    return
  }
  const [detail, problems, board] = await Promise.all([contestApi.detail(id), contestApi.problems(id), contestApi.scoreboard(id)])
  contest.value = detail.data.contest ? { ...detail.data.contest, phase: detail.data.phase } : detail.data
  contestProblems.value = problems.data || []
  scoreboard.value = board.data.rows || []
})
</script>

<style scoped>
.contest-detail { display: grid; gap: 22px; }.back-link { color: rgba(255,255,255,.7); font-size: 12px; }.detail-hero { color: white; border-radius: 24px; padding: 24px 28px 30px; background: radial-gradient(circle at 85% 15%, rgba(66,214,179,.35), transparent 30%), linear-gradient(135deg,#181a25,#2d275a); box-shadow: 0 22px 50px rgba(28,25,55,.2); }.detail-hero__body { margin-top: 34px; display: flex; justify-content: space-between; align-items: end; gap: 30px; }.detail-hero h1 { margin: 8px 0; color: white; font-size: clamp(30px,5vw,50px); letter-spacing: -.05em; }.detail-hero p,.hero-action small { color: rgba(255,255,255,.65); }.phase-badge { color: #61e0bf; font-size: 12px; font-weight: 800; }.hero-action { min-width: 190px; text-align: right; }.hero-action strong { display: block; color: white; font-size: 30px; font-variant-numeric: tabular-nums; }.hero-action button { margin-top: 12px; border: 1px solid rgba(255,255,255,.35); background: transparent; color: white; border-radius: 10px; padding: 9px 14px; cursor: pointer; }.hero-action button.hero-action__primary { border-color: #61e0bf; background: #61e0bf; color: #15261f; font-weight: 800; }.detail-tabs { display: flex; gap: 5px; border-bottom: 1px solid var(--border-color); }.detail-tabs button { border: 0; border-bottom: 2px solid transparent; background: transparent; padding: 12px 17px; color: var(--text-color-secondary); cursor: pointer; font-weight: 700; }.detail-tabs button.active { color: #635bff; border-bottom-color: #635bff; }.overview-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 18px; }.panel { background: var(--card-bg); border: 1px solid var(--border-color-light); border-radius: 18px; padding: 24px; box-shadow: 0 10px 32px rgba(18,24,40,.05); }.panel-label { color: #635bff; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }.panel h2 { margin: 7px 0 15px; font-size: 24px; }.rules-panel p,.rules-panel li { color: var(--text-color-secondary); line-height: 1.7; }.schedule-panel dl { margin: 14px 0 0; }.schedule-panel dl div { display: flex; justify-content: space-between; padding: 13px 0; border-top: 1px solid var(--border-color-light); }.schedule-panel dt { color: var(--text-color-secondary); }.schedule-panel dd { margin: 0; font-weight: 750; }.panel-heading { display: flex; justify-content: space-between; align-items: end; margin-bottom: 8px; }.panel-heading > span { color: var(--text-color-secondary); font-size: 12px; }.contest-problem { min-height: 72px; display: grid; grid-template-columns: 42px 1fr 70px 90px; gap: 12px; align-items: center; border-top: 1px solid var(--border-color-light); }.contest-problem > b { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: rgba(99,91,255,.1); color: #635bff; }.contest-problem div { display: grid; }.contest-problem small { color: var(--text-color-secondary); }.contest-problem [class^='difficulty-'] { font-size: 11px; }.difficulty-1 { color: #087d5c; }.difficulty-2 { color: #9a6500; }.difficulty-3 { color: #c23e43; }.contract-pending { color: var(--text-color-secondary); font-size: 11px; }.score-row { min-height: 58px; display: grid; grid-template-columns: 70px 1fr 100px 100px; align-items: center; border-top: 1px solid var(--border-color-light); }.score-row--head { min-height: 38px; color: var(--text-color-secondary); font-size: 11px; text-transform: uppercase; }@media(max-width:720px){.detail-hero__body{align-items:start;flex-direction:column}.hero-action{text-align:left}.overview-grid{grid-template-columns:1fr}.contest-problem{grid-template-columns:38px 1fr 60px}.contest-problem>a{display:none}}
</style>
