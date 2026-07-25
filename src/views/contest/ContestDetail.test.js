import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/contest', () => ({
  contestApi: {
    detail: vi.fn(),
    problems: vi.fn(),
    scoreboard: vi.fn(),
    register: vi.fn(),
    cancelRegistration: vi.fn(),
  },
}))

const route = { params: { contestId: '20' } }
vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

import { contestApi } from '@/api/contest'
import ContestDetail from './ContestDetail.vue'

const renderPage = () => render(ContestDetail, {
  global: {
    stubs: {
      RouterLink: {
        props: ['to'],
        template: '<a href="#" :data-to="JSON.stringify(to)"><slot /></a>',
      },
      ElSkeleton: { template: '<div>正在加载</div>' },
    },
  },
})

describe('ContestDetail resilient loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    contestApi.detail.mockResolvedValue({
      data: {
        id: 20,
        title: 'CodeRush 周赛 20',
        phase: 'RUNNING',
        ruleType: 'ACM',
        startsAt: '2026-07-24T08:00:00Z',
        endsAt: '2026-07-24T10:00:00Z',
      },
    })
    contestApi.problems.mockResolvedValue({
      data: [{
        problemId: 3001,
        problemVersionId: 7001,
        label: 'A',
        score: 100,
        statementJson: JSON.stringify({
          title: '固定版本比赛题目',
          description: '不可变题面',
          samples: [],
        }),
        limitsJson: JSON.stringify({ timeLimit: 1000, memoryLimit: 256 }),
      }],
    })
    contestApi.scoreboard.mockResolvedValue({ data: { rows: [] } })
  })

  it('keeps the contest usable when a protected scoreboard request returns 403', async () => {
    contestApi.scoreboard.mockRejectedValue(new Error('403 forbidden'))

    renderPage()

    expect(await screen.findByText('CodeRush 周赛 20')).toBeVisible()
    expect(screen.queryByText('Failed to fetch problem details')).not.toBeInTheDocument()
  })

  it('preserves contest context in every problem link', async () => {
    renderPage()

    await screen.findByText('CodeRush 周赛 20')
    await fireEvent.click(await screen.findByRole('button', { name: '题目' }))
    const link = await screen.findByRole('link', { name: '开始解题 →' })

    expect(JSON.parse(link.dataset.to)).toEqual({
      name: 'ContestProblemDetail',
      params: { contestId: 20, problemId: 3001 },
    })
  })

  it('keeps the legacy ACM scoreboard compatible', async () => {
    contestApi.scoreboard.mockResolvedValue({
      data: {
        rows: [{
          rank: 1,
          userId: 7,
          username: 'acm-user',
          solved: 2,
          penaltyMinutes: 35,
          lastAcceptedAt: '2026-07-24T09:00:00Z',
        }],
      },
    })
    renderPage()

    await screen.findByText('CodeRush 周赛 20')
    await fireEvent.click(screen.getByRole('button', { name: '排名' }))

    expect(screen.getByRole('columnheader', { name: '通过' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: '罚时' })).toBeVisible()
    expect(screen.getByRole('cell', { name: 'acm-user' })).toBeVisible()
    expect(screen.getByRole('cell', { name: '35' })).toBeVisible()
  })

  it('renders OI total and per-problem scores from the ruleType contract', async () => {
    contestApi.detail.mockResolvedValue({
      data: {
        id: 20,
        title: 'CodeRush OI 20',
        phase: 'RUNNING',
        ruleType: 'OI',
        startsAt: '2026-07-24T08:00:00Z',
        endsAt: '2026-07-24T10:00:00Z',
      },
    })
    contestApi.scoreboard.mockResolvedValue({
      data: {
        ruleType: 'OI',
        maximumScore: 200,
        rows: [{
          rank: 1,
          userId: 8,
          username: 'oi-user',
          totalScore: 170,
          scoredProblems: 2,
          lastImprovedAt: '2026-07-24T09:20:00Z',
          problems: [
            { problemId: 3001, label: 'A', maximumScore: 100, score: 70, submissionId: 41, achievedAt: '2026-07-24T09:10:00Z' },
            { problemId: 3002, label: 'B', maximumScore: 100, score: 100, submissionId: 42, achievedAt: '2026-07-24T09:20:00Z' },
          ],
        }],
      },
    })
    renderPage()

    await screen.findByText('CodeRush OI 20')
    expect(screen.getByText(/OI 计分：执行全部测试用例/)).toBeVisible()
    await fireEvent.click(screen.getByRole('button', { name: '排名' }))

    expect(screen.getByRole('columnheader', { name: '总分' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'A' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'B' })).toBeVisible()
    expect(screen.getByRole('cell', { name: '170 / 200' })).toBeVisible()
    expect(screen.getByRole('cell', { name: '70 / 100' })).toBeVisible()
    expect(screen.getByRole('cell', { name: '100 / 100' })).toBeVisible()
    expect(screen.queryByRole('columnheader', { name: '罚时' })).not.toBeInTheDocument()
  })
})
