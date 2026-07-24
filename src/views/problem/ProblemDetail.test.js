import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api', () => ({
  problemApi: { getProblemByNo: vi.fn() },
  submissionApi: {
    submitCode: vi.fn(),
    getSubmission: vi.fn(),
    getSubmissionList: vi.fn(),
  },
}))

vi.mock('@/components/problem/CodeEditor.vue', () => ({
  default: {
    props: ['disabled'],
    emits: ['submit'],
    template: `
      <button
        type="button"
        :disabled="disabled"
        @click="$emit('submit', { language: 'cpp', code: 'int main() {}' })"
      >submit from editor</button>
    `,
  },
}))

const route = {
  params: { problemNo: 'CR3001' },
  query: { contestId: '20', tab: 'submit' },
}
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn() }),
}))

import { problemApi, submissionApi } from '@/api'
import { i18n } from '@/i18n'
import ProblemDetail from './ProblemDetail.vue'

const renderPage = () => render(ProblemDetail, {
  global: {
    plugins: [i18n],
    stubs: {
      ProblemSolutions: true,
      ProblemDiscussions: true,
      ElSkeleton: { template: '<div>loading</div>' },
      ElTabs: { template: '<div><slot /></div>' },
      ElTabPane: { template: '<section><slot /></section>' },
      ElTag: { template: '<span><slot /></span>' },
      ElDivider: true,
      ElProgress: true,
      ElTable: true,
      ElTableColumn: true,
      ElPagination: true,
      ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
      ElButton: {
        emits: ['click'],
        template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
      },
      ElEmpty: true,
    },
  },
})

describe('ProblemDetail real submission flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    problemApi.getProblemByNo.mockResolvedValue({
      data: {
        id: 3001,
        problemNo: 'CR3001',
        title: '真实比赛题目',
        difficulty: 1,
        tags: [],
        samples: [],
      },
    })
    submissionApi.submitCode.mockResolvedValue({ success: true, data: 88 })
    submissionApi.getSubmission
      .mockResolvedValueOnce({ success: true, data: { id: 88, status: 'PENDING' } })
      .mockResolvedValueOnce({
        success: true,
        data: { id: 88, status: 'ACCEPTED', time: 12, memory: 1024 },
      })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('submits with contest context and renders the terminal judge result', async () => {
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: 'submit from editor' }))
    expect(submissionApi.submitCode).toHaveBeenCalledWith({
      problemId: 3001,
      contestId: 20,
      language: 'cpp',
      code: 'int main() {}',
    })

    await waitFor(() => expect(submissionApi.getSubmission).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(500)
    await waitFor(() => expect(submissionApi.getSubmission).toHaveBeenCalledTimes(2))

    expect(await screen.findByText('ACCEPTED')).toBeVisible()
    expect(screen.getByText(/12 ms/)).toBeVisible()
    expect(screen.getByText(/1024 KB/)).toBeVisible()
  })
})
