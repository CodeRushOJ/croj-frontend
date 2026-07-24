import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'

vi.mock('@/api', () => ({
  problemApi: { getProblemByNo: vi.fn(), getProblemById: vi.fn() },
  contestApi: { problems: vi.fn() },
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

const route = reactive({
  params: { contestId: '20', problemId: '3001' },
  query: { tab: 'submit' },
})
const routerPush = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: routerPush }),
}))

import { contestApi, problemApi, submissionApi } from '@/api'
import { ROUTE_NAMES } from '@/constants/routes'
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

const rosterItem = ({
  problemId,
  problemVersionId,
  title,
  label = 'A',
}) => ({
  problemId,
  problemVersionId,
  label,
  score: 100,
  statementJson: JSON.stringify({
    title,
    description: `${title} statement`,
    inputDescription: 'input',
    outputDescription: 'output',
    hints: [],
    samples: [],
  }),
  limitsJson: JSON.stringify({ timeLimit: 1000, memoryLimit: 256 }),
})

describe('ProblemDetail real submission flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.params = { contestId: '20', problemId: '3001' }
    route.query = { tab: 'submit' }
    contestApi.problems.mockResolvedValue({
      data: [{
        problemId: 3001,
        problemVersionId: 7001,
        label: 'A',
        score: 100,
        statementJson: JSON.stringify({
          title: '固定版本比赛题目',
          description: '不可变题面 v7',
          inputDescription: '输入 v7',
          outputDescription: '输出 v7',
          hints: [],
          samples: [],
        }),
        limitsJson: JSON.stringify({ timeLimit: 1000, memoryLimit: 256 }),
      }],
    })
    submissionApi.submitCode.mockResolvedValue({ success: true, data: 88 })
    submissionApi.getSubmissionList.mockResolvedValue({
      success: true,
      data: { records: [], total: 0 },
    })
    submissionApi.getSubmission
      .mockResolvedValueOnce({ success: true, data: { id: 88, status: 'PENDING' } })
      .mockResolvedValueOnce({
        success: true,
        data: { id: 88, status: 'ACCEPTED', time: 12, memory: 1024 },
      })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders and submits the fixed contest roster version', async () => {
    vi.useFakeTimers()
    renderPage()

    expect(await screen.findByText('固定版本比赛题目')).toBeVisible()
    expect(screen.getByText('不可变题面 v7')).toBeVisible()
    expect(problemApi.getProblemByNo).not.toHaveBeenCalled()
    expect(problemApi.getProblemById).not.toHaveBeenCalled()

    await fireEvent.click(await screen.findByRole('button', { name: 'submit from editor' }))
    const [payload, requestOptions] = submissionApi.submitCode.mock.calls[0]
    expect(payload).toEqual({
      problemId: 3001,
      contestId: 20,
      language: 'cpp',
      code: 'int main() {}',
    })
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal)

    await waitFor(() => expect(submissionApi.getSubmission).toHaveBeenCalledTimes(1))
    expect(submissionApi.getSubmission.mock.calls[0][1].signal).toBe(requestOptions.signal)
    await vi.advanceTimersByTimeAsync(500)
    await waitFor(() => expect(submissionApi.getSubmission).toHaveBeenCalledTimes(2))

    expect(await screen.findByText('ACCEPTED')).toBeVisible()
    expect(screen.getByText(/12 ms/)).toBeVisible()
    expect(screen.getByText(/1024 KB/)).toBeVisible()
  })

  it('rejects a problem id that is not in the contest roster', async () => {
    route.params = { contestId: '20', problemId: '9999' }
    renderPage()

    expect(
      await screen.findByText('该题目不属于当前比赛，或题目尚未开放。'),
    ).toBeVisible()
    expect(submissionApi.submitCode).not.toHaveBeenCalled()
  })

  it('keeps ordinary problem-bank routes on the public problem API', async () => {
    route.params = { problemNo: 'P1000' }
    problemApi.getProblemByNo.mockResolvedValueOnce({
      data: {
        id: 1000,
        problemNo: 'P1000',
        title: '普通题库题目',
        difficulty: 1,
        tags: [],
        samples: [],
      },
    })
    renderPage()

    expect(await screen.findByText('普通题库题目')).toBeVisible()
    expect(problemApi.getProblemByNo).toHaveBeenCalledWith('P1000', {
      signal: expect.any(AbortSignal),
    })
    expect(contestApi.problems).not.toHaveBeenCalled()
  })

  it('returns a failed problem load through the registered problem-list route', async () => {
    route.params = { problemNo: 'P404' }
    problemApi.getProblemByNo.mockRejectedValueOnce(new Error('problem unavailable'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: '返回题库' }))

    expect(routerPush).toHaveBeenCalledWith({ name: ROUTE_NAMES.PROBLEMS })
  })

  it('sanitizes ordinary problem-bank HTML at the shared render boundary', async () => {
    route.params = { problemNo: 'P1001' }
    problemApi.getProblemByNo.mockResolvedValueOnce({
      data: {
        id: 1001,
        problemNo: 'P1001',
        title: 'Untrusted problem-bank import',
        description: '<p>safe</p><script>alert(1)</script>',
        inputDescription: '<img src="x" onerror="alert(2)">',
        outputDescription: '<a href="javascript:alert(3)">answer</a>',
        difficulty: 1,
        tags: [],
        samples: [],
      },
    })
    const { container } = renderPage()

    expect(await screen.findByText('Untrusted problem-bank import')).toBeVisible()
    expect(container.querySelector('.description-content script')).toBeNull()
    expect(container.querySelector('.description-content img')?.hasAttribute('onerror')).toBe(false)
    expect(container.querySelector('.description-content a')?.hasAttribute('href')).toBe(false)
  })

  it('aborts an in-flight POST when the reused route changes', async () => {
    let postSignal
    submissionApi.submitCode.mockImplementationOnce((_payload, options) => {
      postSignal = options.signal
      return new Promise(() => {})
    })
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: 'submit from editor' }))
    await waitFor(() => expect(postSignal).toBeInstanceOf(AbortSignal))

    route.params = { contestId: '20', problemId: '3002' }
    await nextTick()

    expect(postSignal.aborted).toBe(true)
  })

  it('aborts an in-flight workflow when reused-route query state changes', async () => {
    let postSignal
    submissionApi.submitCode.mockImplementationOnce((_payload, options) => {
      postSignal = options.signal
      return new Promise(() => {})
    })
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: 'submit from editor' }))
    await waitFor(() => expect(postSignal).toBeInstanceOf(AbortSignal))

    route.query = { tab: 'description' }
    await nextTick()

    expect(postSignal.aborted).toBe(true)
  })

  it('never lets a cancelled old roster response overwrite the reused route', async () => {
    let resolveOldRoster
    contestApi.problems.mockReset()
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveOldRoster = resolve
      }))
      .mockResolvedValueOnce({
        data: [rosterItem({
          problemId: 4001,
          problemVersionId: 8001,
          title: '新比赛固定题面',
        })],
      })
    renderPage()

    route.params = { contestId: '21', problemId: '4001' }
    await nextTick()
    expect(await screen.findByText('新比赛固定题面')).toBeVisible()

    resolveOldRoster({
      data: [rosterItem({
        problemId: 3001,
        problemVersionId: 7001,
        title: '旧比赛题面',
      })],
    })
    await nextTick()

    expect(screen.queryByText('旧比赛题面')).not.toBeInTheDocument()
    expect(screen.getByText('固定版本 #8001')).toBeVisible()
  })

  it('aborts an old submissions-list request when the route is reused', async () => {
    route.query = { tab: 'submissions' }
    let listSignal
    submissionApi.getSubmissionList.mockImplementationOnce((_query, options) => {
      listSignal = options.signal
      return new Promise(() => {})
    })
    renderPage()

    await waitFor(() => expect(listSignal).toBeInstanceOf(AbortSignal))
    route.params = { contestId: '21', problemId: '4001' }
    contestApi.problems.mockResolvedValueOnce({
      data: [rosterItem({
        problemId: 4001,
        problemVersionId: 8001,
        title: '新比赛固定题面',
      })],
    })
    await nextTick()

    expect(listSignal.aborted).toBe(true)
  })

  it('ends a POST that ignores cancellation at the absolute workflow deadline', async () => {
    vi.useFakeTimers()
    let postSignal
    submissionApi.submitCode.mockImplementationOnce((_payload, options) => {
      postSignal = options.signal
      return new Promise(() => {})
    })
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: 'submit from editor' }))
    await vi.advanceTimersByTimeAsync(60_000)

    expect(postSignal.aborted).toBe(true)
    expect(await screen.findByText('POLL_TIMEOUT')).toBeVisible()
  })

  it('aborts the same signal during a slow status GET on route reuse', async () => {
    let postSignal
    let getSignal
    submissionApi.submitCode.mockImplementationOnce((_payload, options) => {
      postSignal = options.signal
      return Promise.resolve({ success: true, data: 88 })
    })
    submissionApi.getSubmission.mockReset().mockImplementationOnce((_id, options) => {
      getSignal = options.signal
      return new Promise(() => {})
    })
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: 'submit from editor' }))
    await waitFor(() => expect(getSignal).toBeInstanceOf(AbortSignal))
    expect(getSignal).toBe(postSignal)

    route.params = { contestId: '21', problemId: '4001' }
    await nextTick()

    expect(getSignal.aborted).toBe(true)
  })
})
