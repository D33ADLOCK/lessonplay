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
import { validateChatRequest } from '@/lib/agent/validate-chat-request'
import { addMessage, createChat, getChat } from '@/lib/db/queries'

export const maxDuration = 300

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

  const { chatId: requestedChatId, messages: requestMessages } = body as {
    chatId?: string
    messages?: unknown
  }

  const validation = await validateChatRequest({ messages: requestMessages })

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const messages = validation.messages
  const chatId = requestedChatId || crypto.randomUUID()

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
