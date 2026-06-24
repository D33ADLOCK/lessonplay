import { describe, expect, it } from 'vitest'

import { readGeneratedSourceFiles } from '@/lib/agent/generated-file-view-model'

describe('readGeneratedSourceFiles', () => {
  it('returns complete generated files', () => {
    expect(
      readGeneratedSourceFiles({
        files: [
          { path: 'src/App.tsx', content: 'export function App() {}' },
          { path: 'src/styles.css', content: 'body {}' },
        ],
      }),
    ).toEqual([
      { path: 'src/App.tsx', content: 'export function App() {}' },
      { path: 'src/styles.css', content: 'body {}' },
    ])
  })

  it('keeps a partially streamed file with empty content', () => {
    expect(
      readGeneratedSourceFiles({
        files: [{ path: 'src/App.tsx' }],
      }),
    ).toEqual([{ path: 'src/App.tsx', content: '' }])
  })

  it('ignores malformed files and malformed input', () => {
    expect(
      readGeneratedSourceFiles({
        files: [
          null,
          { content: 'missing path' },
          { path: '', content: 'empty path' },
          { path: 'README.md', content: 42 },
        ],
      }),
    ).toEqual([{ path: 'README.md', content: '' }])
    expect(readGeneratedSourceFiles(undefined)).toEqual([])
    expect(readGeneratedSourceFiles({ files: 'not-an-array' })).toEqual([])
  })
})
