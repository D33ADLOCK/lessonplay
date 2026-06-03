import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'

import {
  MAX_MESSAGES,
  validateChatRequest,
} from '@/lib/agent/validate-chat-request'

function userText(text: string): UIMessage {
  return { id: `u-${text}`, role: 'user', parts: [{ type: 'text', text }] }
}

describe('validateChatRequest', () => {
  it('accepts a well-formed messages array and returns the validated messages', async () => {
    const messages = [userText('make a game'), userText('make it faster')]

    const result = await validateChatRequest({ messages })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0].parts[0]).toMatchObject({
        type: 'text',
        text: 'make a game',
      })
    }
  })

  it('rejects an empty or non-array payload', async () => {
    expect((await validateChatRequest({ messages: [] })).ok).toBe(false)
    expect((await validateChatRequest({ messages: 'nope' })).ok).toBe(false)
    expect((await validateChatRequest({ messages: undefined })).ok).toBe(false)
  })

  it('rejects a malformed message whose shape is not a valid UIMessage', async () => {
    const result = await validateChatRequest({
      messages: [{ role: 'user', parts: 'not-an-array' }],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Invalid message format')
    }
  })

  it('rejects an oversized payload that exceeds the turn cap', async () => {
    const messages = Array.from({ length: MAX_MESSAGES + 1 }, (_, i) =>
      userText(`m${i}`),
    )

    const result = await validateChatRequest({ messages })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Too many messages')
    }
  })
})
