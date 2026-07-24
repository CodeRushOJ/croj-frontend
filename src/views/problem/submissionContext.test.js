import { describe, expect, it } from 'vitest'

import { buildSubmissionPayload } from './submissionContext'

describe('problem submission context', () => {
  it('uses only the validated contest roster context', () => {
    expect(buildSubmissionPayload(
      { code: 'int main() {}', language: 'cpp' },
      { problemId: 3001, contestId: 20, problemVersionId: 7001 },
    )).toEqual({
      problemId: 3001,
      contestId: 20,
      language: 'cpp',
      code: 'int main() {}',
    })
  })

  it('does not infer contest context from unvalidated route strings', () => {
    expect(buildSubmissionPayload(
      { code: 'print(1)', language: 'python' },
      { problemId: 3001 },
    )).toEqual({
      problemId: 3001,
      language: 'python',
      code: 'print(1)',
    })
  })
})
