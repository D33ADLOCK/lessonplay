import { describe, expect, it } from 'vitest'
import type { ToolUIPart } from 'ai'

import { toPublishViewModel } from '@/lib/agent/publish-view-model'

function toolPart(part: Record<string, unknown>) {
  return part as ToolUIPart
}

describe('toPublishViewModel', () => {
  it('normalizes running states for both publishing tools', () => {
    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-publishGame',
          toolCallId: 'call-arcade',
          state: 'input-streaming',
          input: { title: 'Arcade', html: '<html' },
        }),
      ),
    ).toMatchObject({
      tool: 'publishGame',
      status: 'running',
      title: 'Publishing game...',
    })

    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-publishLearnLoopGame',
          toolCallId: 'call-learn-loop',
          state: 'input-available',
          input: { title: 'Lab' },
        }),
      ),
    ).toMatchObject({
      tool: 'publishLearnLoopGame',
      status: 'running',
      title: 'Building game...',
    })
  })

  it('normalizes successful outputs and exposes the preview url', () => {
    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-publishLearnLoopGame',
          toolCallId: 'call-success',
          state: 'output-available',
          input: { title: 'Lab' },
          output: {
            ok: true,
            demoUrl: 'https://cdn.example/lab.html',
          },
        }),
      ),
    ).toEqual({
      tool: 'publishLearnLoopGame',
      status: 'succeeded',
      title: 'Published successfully',
      demoUrl: 'https://cdn.example/lab.html',
    })
  })

  it('normalizes returned Vite failures', () => {
    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-publishLearnLoopGame',
          toolCallId: 'call-failure',
          state: 'output-available',
          input: { title: 'Lab' },
          output: {
            ok: false,
            error: 'Could not resolve react/jsx-runtime',
          },
        }),
      ),
    ).toEqual({
      tool: 'publishLearnLoopGame',
      status: 'failed',
      title: 'Build failed',
      error: 'Could not resolve react/jsx-runtime',
    })
  })

  it('handles execution errors and malformed successful output', () => {
    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-publishGame',
          toolCallId: 'call-error',
          state: 'output-error',
          input: { title: 'Arcade', html: '<html></html>' },
          errorText: 'Upload failed',
        }),
      ),
    ).toMatchObject({
      status: 'failed',
      title: 'Publish failed',
      error: 'Upload failed',
    })

    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-publishGame',
          toolCallId: 'call-malformed',
          state: 'output-available',
          input: { title: 'Arcade', html: '<html></html>' },
          output: { ok: true },
        }),
      ),
    ).toMatchObject({
      status: 'failed',
      error: 'Publishing completed without a preview URL.',
    })
  })

  it('ignores unrelated tools', () => {
    expect(
      toPublishViewModel(
        toolPart({
          type: 'tool-readLearnLoopReference',
          toolCallId: 'call-reference',
          state: 'output-available',
          input: { path: 'SKILL.md' },
          output: 'contents',
        }),
      ),
    ).toBeUndefined()
  })
})
