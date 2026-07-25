import { describe, expect, it } from 'vitest'

import { normalizeContestProblem } from './contestProblem'

describe('contest problem roster contract', () => {
  it('renders the immutable statement and limits snapshot', () => {
    expect(normalizeContestProblem({
      problemId: 3001,
      problemVersionId: 7001,
      label: 'B',
      score: 80,
      statementJson: JSON.stringify({
        title: 'Pinned statement',
        description: '<p>Version seven</p>',
        inputDescription: 'input v7',
        outputDescription: 'output v7',
        hints: ['stay pinned'],
        samples: [{ input: '1', output: '2' }],
      }),
      limitsJson: JSON.stringify({
        timeLimit: 1500,
        memoryLimit: 512,
        totalScore: 80,
      }),
    }, 20)).toMatchObject({
      id: 3001,
      contestId: 20,
      problemVersionId: 7001,
      problemNo: 'B',
      title: 'Pinned statement',
      description: '<p>Version seven</p>',
      timeLimit: 1500,
      memoryLimit: 512,
      samples: [{ input: '1', output: '2' }],
    })
  })

  it('rejects a malformed roster item instead of falling back to the problem bank', () => {
    expect(() => normalizeContestProblem({
      problemId: 3001,
      problemVersionId: null,
      label: 'A',
      statementJson: '{}',
      limitsJson: '{}',
    }, 20)).toThrow(/problemVersionId/)
  })

  it('sanitizes imported statement HTML before it reaches v-html', () => {
    const problem = normalizeContestProblem({
      problemId: 3001,
      problemVersionId: 7001,
      label: 'A',
      score: 100,
      statementJson: JSON.stringify({
        title: 'Untrusted import',
        description: [
          '<p>Safe text</p>',
          '<img src="x" onerror="alert(1)">',
          '<script>alert(2)</script>',
          '<a href="javascript:alert(3)">bad link</a>',
          '<a href="https://example.com">safe link</a>',
        ].join(''),
        inputDescription: '<svg><a xlink:href="javascript:alert(4)">x</a></svg>',
        outputDescription: '<strong onclick="alert(5)">answer</strong>',
        hints: [],
        samples: [],
      }),
      limitsJson: JSON.stringify({ timeLimit: 1000, memoryLimit: 256 }),
    }, 20)

    expect(problem.description).toContain('<p>Safe text</p>')
    expect(problem.description).toContain('href="https://example.com"')
    expect(problem.description).not.toMatch(/script|onerror|javascript:/i)
    expect(problem.inputDescription).not.toMatch(/svg|xlink|javascript:/i)
    expect(problem.outputDescription).toBe('<strong>answer</strong>')
  })
})
