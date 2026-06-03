import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'

import { selectDemoUrl } from '@/lib/agent/select-demo-url'

function userText(text: string): UIMessage {
  return { id: `u-${text}`, role: 'user', parts: [{ type: 'text', text }] }
}

function completedPublish(id: string, demoUrl: string): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'tool-publishGame',
        toolCallId: `call-${id}`,
        state: 'output-available',
        input: { title: 'Game', html: '<html></html>' },
        output: { ok: true, versionId: `v-${id}`, demoUrl },
      },
    ],
  } as UIMessage
}

function inProgressPublish(id: string): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'tool-publishGame',
        toolCallId: `call-${id}`,
        state: 'input-streaming',
        input: { title: 'Game', html: '<htm' },
      },
    ],
  } as UIMessage
}

describe('selectDemoUrl', () => {
  it('returns undefined when no game has been published', () => {
    const messages = [userText('make a game'), userText('please')]

    expect(selectDemoUrl(messages)).toBeUndefined()
  })

  it('returns the demoUrl of a single completed publishGame', () => {
    const messages = [
      userText('make a game'),
      completedPublish('a', 'https://cdn.example/a.html'),
    ]

    expect(selectDemoUrl(messages)).toBe('https://cdn.example/a.html')
  })

  it('returns the newest demoUrl when several games were published', () => {
    const messages = [
      userText('make a game'),
      completedPublish('a', 'https://cdn.example/a.html'),
      userText('make it faster'),
      completedPublish('b', 'https://cdn.example/b.html'),
    ]

    expect(selectDemoUrl(messages)).toBe('https://cdn.example/b.html')
  })

  it('ignores an in-progress publishGame and keeps the prior completed url', () => {
    const messages = [
      completedPublish('a', 'https://cdn.example/a.html'),
      userText('make it faster'),
      inProgressPublish('b'),
    ]

    expect(selectDemoUrl(messages)).toBe('https://cdn.example/a.html')
  })

  it('returns undefined when the only publishGame is still in progress', () => {
    const messages = [userText('make a game'), inProgressPublish('a')]

    expect(selectDemoUrl(messages)).toBeUndefined()
  })
})
