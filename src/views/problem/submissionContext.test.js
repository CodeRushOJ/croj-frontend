import { describe, expect, it } from 'vitest'

import { buildSubmissionPayload } from './submissionContext'

describe('problem submission context', () => {
  it('carries a positive contest id from the contest problem route', () => {
    expect(buildSubmissionPayload(
      { code: 'int main() {}', language: 'cpp' },
      3001,
      '20',
    )).toEqual({
      problemId: 3001,
      contestId: 20,
      language: 'cpp',
      code: 'int main() {}',
    })
  })

  it('omits invalid contest context for ordinary problem-bank submissions', () => {
    expect(buildSubmissionPayload(
      { code: 'print(1)', language: 'python' },
      3001,
      'not-a-contest',
    )).toEqual({
      problemId: 3001,
      language: 'python',
      code: 'print(1)',
    })
  })
})
