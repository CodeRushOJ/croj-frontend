import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/problem', () => ({
  problemApi: { getProblemList: vi.fn() },
}))

vi.mock('@/api/tag', () => ({
  tagApi: { getAllTags: vi.fn() },
}))

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

import { problemApi } from '@/api/problem'
import { tagApi } from '@/api/tag'
import ProblemList from './ProblemList.vue'

const renderPage = () => render(ProblemList, {
  global: {
    stubs: {
      RouterLink: { template: '<a><slot /></a>' },
      ElSkeleton: { template: '<div>正在加载</div>' },
      ElPagination: true,
      ElIcon: { template: '<span><slot /></span>' },
      ElInput: { template: '<input />' },
      ElSelect: { template: '<select><slot /></select>' },
      ElOption: true,
    },
  },
})

describe('ProblemList real API contract', () => {
  beforeEach(() => {
    push.mockReset()
    problemApi.getProblemList.mockReset()
    tagApi.getAllTags.mockReset()
    tagApi.getAllTags.mockResolvedValue({ data: [] })
  })

  it('renders only problems returned by the backend', async () => {
    problemApi.getProblemList.mockResolvedValue({
      data: {
        records: [{
          id: 41,
          problemNo: 'CR2041',
          title: '真实接口题目',
          difficulty: 1,
          submitCount: 0,
          acceptRate: 70.2,
          userStatus: 0,
          tags: [],
        }],
        total: 1,
      },
    })

    renderPage()

    expect(await screen.findByText('真实接口题目')).toBeVisible()
    expect(screen.getByText('70.2%')).toBeVisible()
    expect(problemApi.getProblemList).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('两数之和')).not.toBeInTheDocument()
  })

  it('shows an actionable error and retries the backend request', async () => {
    problemApi.getProblemList
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockResolvedValueOnce({ data: { records: [], total: 0 } })

    renderPage()

    expect(await screen.findByText('暂时无法加载题目')).toBeVisible()
    await fireEvent.click(screen.getByRole('button', { name: '重新加载' }))

    await waitFor(() => expect(problemApi.getProblemList).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('没有匹配的题目')).toBeVisible()
  })
})
