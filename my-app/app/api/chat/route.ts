import { auth } from '@clerk/nextjs/server'
import { openai } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { NextRequest, NextResponse } from 'next/server'

import { SYSTEM_PROMPT } from '@/lib/agent/skills'
import { createGameTools } from '@/lib/agent/tools'
import { addMessage, createChat, getChat } from '@/lib/db/queries'

export const maxDuration = 300

function createLegacyMessage(content: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    parts: [{ type: 'text', text: content }],
  }
}

function getLastUserMessage(messages: UIMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    chatId: requestedChatId,
    messages: requestMessages,
    message: legacyMessage,
  } = body as {
    chatId?: string
    messages?: UIMessage[]
    message?: string
  }

  const chatId = requestedChatId || crypto.randomUUID()
  const messages =
    Array.isArray(requestMessages) && requestMessages.length > 0
      ? requestMessages
      : typeof legacyMessage === 'string' && legacyMessage.trim()
        ? [createLegacyMessage(legacyMessage.trim())]
        : []

  if (messages.length === 0) {
    return NextResponse.json(
      { error: 'At least one message is required' },
      { status: 400 },
    )
  }

  const existingChat = await getChat({ id: chatId, clerkUserId: userId })

  if (!existingChat) {
    const createdChat = await createChat({
      id: chatId,
      clerkUserId: userId,
      title: 'Untitled game',
    })

    if (!createdChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
  }

  const tools = createGameTools({ chatId, clerkUserId: userId })

  const result = streamText({
    model: openai('gpt-5.5'),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(16),
    maxOutputTokens: 24000,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      const lastUserMessage = getLastUserMessage(messages)

      if (lastUserMessage) {
        await addMessage({
          chatId,
          clerkUserId: userId,
          role: lastUserMessage.role,
          content: lastUserMessage,
        })
      }

      await addMessage({
        chatId,
        clerkUserId: userId,
        role: responseMessage.role,
        content: responseMessage,
      })
    },
  })
}
