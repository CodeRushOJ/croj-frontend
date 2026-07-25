import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const editor = {
  dispose: vi.fn(),
  focus: vi.fn(),
  getValue: vi.fn(() => 'int main() { return 0; }'),
}

vi.mock('@/services/MonacoEditorService', () => ({
  default: {
    getMonaco: vi.fn(async () => ({
      editor: { create: vi.fn(() => editor) },
    })),
    getOrCreateModel: vi.fn(() => ({})),
  },
}))

import { i18n } from '@/i18n'
import MonacoEditorService from '@/services/MonacoEditorService'
import CodeEditor from './CodeEditor.vue'

describe('CodeEditor submission boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.IntersectionObserver = undefined
  })

  it('emits code immediately and exposes no fake run action', async () => {
    const onSubmit = vi.fn()
    render(CodeEditor, {
      props: {
        problem: { id: 3001, problemNo: 'CR3001', title: 'A + B' },
        onSubmit,
      },
      global: { plugins: [i18n] },
    })

    await waitFor(() => expect(editor.focus).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /run code|运行代码/i })).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: /submit solution|提交解答/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      code: 'int main() { return 0; }',
      language: 'cpp',
    })
  })

  it('initializes Monaco with the language and code restored from the login handoff', async () => {
    render(CodeEditor, {
      props: {
        problem: { id: 3001, problemNo: 'CR3001', title: 'A + B' },
        initialLanguage: 'python',
        initialCode: 'print("restored")',
      },
      global: { plugins: [i18n] },
    })

    await waitFor(() => expect(MonacoEditorService.getOrCreateModel).toHaveBeenCalledWith(
      expect.anything(),
      'python',
      'print("restored")',
    ))
  })
})
