<template>
  <section class="contest-page">
    <header class="contest-hero">
      <span class="eyebrow">Competitive programming</span>
      <h1>在倒计时结束前，写出更好的答案</h1>
      <p>参加正式竞赛，查看实时赛程；封榜后仍可继续提交练习。</p>
    </header>

    <div class="phase-tabs" role="tablist" aria-label="Contest phase">
      <button v-for="item in tabs" :key="item.value" :class="{ active: phase === item.value }" type="button" @click="phase = item.value">
        {{ item.label }} <span>{{ countByPhase(item.value) }}</span>
      </button>
    </div>

    <div v-if="loading" class="contest-grid"><el-skeleton v-for="index in 3" :key="index" :rows="6" animated /></div>
    <div v-else class="contest-grid">
      <article v-for="contest in visibleContests" :key="contest.id" :class="['contest-card', `contest-card--${contest.phase.toLowerCase()}`]">
        <div class="contest-card__top">
          <span class="phase-badge">{{ phaseLabel(contest.phase) }}</span>
          <span>{{ contest.ruleType }}</span>
        </div>
        <h2>{{ contest.title }}</h2>
        <div class="contest-time">
          <small>{{ contest.phase === 'ENDED' ? '结束于' : contest.phase === 'RUNNING' ? '剩余时间' : '距离开始' }}</small>
          <strong>{{ relativeTime(contest) }}</strong>
        </div>
        <dl>
          <div><dt>开始</dt><dd>{{ formatDate(contest.startsAt) }}</dd></div>
          <div><dt>时长</dt><dd>{{ duration(contest) }}</dd></div>
        </dl>
        <button type="button" @click="openContest(contest)">
          {{ contest.phase === 'RUNNING' ? '进入赛场' : contest.phase === 'ENDED' ? '查看赛况' : '查看详情' }}
          <el-icon><ArrowRight /></el-icon>
        </button>
      </article>
      <div v-if="!visibleContests.length" class="empty-contests">当前分类暂无竞赛</div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { contestApi } from '@/api/contest'
import { previewAuthEnabled } from '@/auth/previewAuth'
import { previewContests } from '@/auth/previewData'

const router = useRouter()
const contests = ref([])
const phase = ref('ALL')
const loading = ref(false)
const tabs = [
  { value: 'ALL', label: '全部' },
  { value: 'UPCOMING', label: '即将开始' },
  { value: 'RUNNING', label: '进行中' },
  { value: 'ENDED', label: '已结束' },
]

const group = contest => contest.phase === 'ENDED' ? 'ENDED' : contest.phase === 'RUNNING' || contest.phase === 'FROZEN' ? 'RUNNING' : 'UPCOMING'
const visibleContests = computed(() => phase.value === 'ALL' ? contests.value : contests.value.filter(contest => group(contest) === phase.value))
const countByPhase = value => value === 'ALL' ? contests.value.length : contests.value.filter(contest => group(contest) === value).length
const phaseLabel = value => ({ REGISTRATION: '报名中', SCHEDULED: '即将开始', RUNNING: '进行中', FROZEN: '已封榜', ENDED: '已结束' }[value] || value)
const formatDate = value => new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const duration = contest => `${Math.round((new Date(contest.endsAt) - new Date(contest.startsAt)) / 36e5)} 小时`
const relativeTime = contest => {
  const target = contest.phase === 'ENDED' ? contest.endsAt : contest.phase === 'RUNNING' ? contest.endsAt : contest.startsAt
  const hours = Math.max(0, Math.round(Math.abs(new Date(target) - Date.now()) / 36e5))
  return hours >= 24 ? `${Math.floor(hours / 24)} 天 ${hours % 24} 小时` : `${hours} 小时`
}
const openContest = contest => router.push(`/contests/${contest.id}`)

onMounted(async () => {
  if (previewAuthEnabled) { contests.value = previewContests; return }
  loading.value = true
  try {
    const response = await contestApi.list({ page: 1, size: 50 })
    contests.value = response.data.items || []
  } finally { loading.value = false }
})
</script>

<style scoped>
.contest-page { display: grid; gap: 28px; }
.contest-hero { padding: 8px 2px 2px; max-width: 760px; }
.eyebrow { color: #635bff; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.contest-hero h1 { margin: 8px 0 10px; font-size: clamp(30px, 4.5vw, 48px); line-height: 1.06; letter-spacing: -.05em; }
.contest-hero p { margin: 0; color: var(--text-color-secondary); font-size: 15px; }
.phase-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.phase-tabs button { border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color-secondary); border-radius: 999px; padding: 8px 13px; cursor: pointer; font-weight: 650; }
.phase-tabs button span { margin-left: 5px; color: inherit; opacity: .65; }.phase-tabs button.active { border-color: #635bff; color: #635bff; background: rgba(99,91,255,.08); }
.contest-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.contest-card { min-height: 320px; padding: 22px; display: flex; flex-direction: column; border: 1px solid var(--border-color-light); border-radius: 20px; background: var(--card-bg); box-shadow: 0 12px 36px rgba(18,24,40,.055); position: relative; overflow: hidden; }
.contest-card::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: #a6abb8; }.contest-card--running::before { background: linear-gradient(90deg,#635bff,#42d6b3); }.contest-card--registration::before { background: #f3a51b; }
.contest-card__top { display: flex; justify-content: space-between; color: var(--text-color-secondary); font-size: 12px; }.phase-badge { color: #635bff; font-weight: 800; }
.contest-card h2 { margin: 22px 0 20px; font-size: 22px; letter-spacing: -.03em; }
.contest-time small { display: block; color: var(--text-color-secondary); }.contest-time strong { display: block; margin-top: 3px; font-size: 24px; }
.contest-card dl { margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.contest-card dl div { padding: 10px; border-radius: 10px; background: var(--border-color-light); }.contest-card dt { color: var(--text-color-secondary); font-size: 11px; }.contest-card dd { margin: 3px 0 0; font-weight: 700; font-size: 12px; }
.contest-card > button { margin-top: auto; border: 0; background: #14151a; color: white; border-radius: 11px; padding: 11px 14px; display: flex; justify-content: center; align-items: center; gap: 7px; cursor: pointer; font-weight: 750; }
.empty-contests { grid-column: 1 / -1; padding: 60px; text-align: center; color: var(--text-color-secondary); }
@media (max-width: 940px) { .contest-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 620px) { .contest-grid { grid-template-columns: 1fr; } }
</style>
