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
})
