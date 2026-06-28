import { auth } from '@clerk/nextjs/server'
import {
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { NextRequest, NextResponse } from 'next/server'

import { SYSTEM_PROMPT } from '@/lib/agent/skills'
import { createGameTools } from '@/lib/agent/tools'
import { validateChatRequest } from '@/lib/agent/validate-chat-request'
import {
  addAttachmentPartsToMessages,
  AttachmentResolutionError,
} from '@/lib/agent/resolve-message-attachments'
import { getModel } from '@/lib/codex-oauth/getModel'
import { addMessage, createChat, getChatMetadata } from '@/lib/db/queries'

export const maxDuration = 300

const generateMessageId = createIdGenerator({
  prefix: 'msg',
  size: 16,
})

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

  const existingChat = await getChatMetadata({
    id: chatId,
    clerkUserId: userId,
  })

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
  const lastUserMessage = getLastUserMessage(messages)
  let messagesWithAttachmentParts: UIMessage[]

  try {
    messagesWithAttachmentParts = await addAttachmentPartsToMessages({
      messages,
      chatId,
      clerkUserId: userId,
      hydrateMessageId: lastUserMessage?.id,
    })
  } catch (error) {
    if (error instanceof AttachmentResolutionError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    throw error
  }

  const modelMessages = convertToModelMessages(messagesWithAttachmentParts)

  const result = streamText({
    model: await getModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(64),
    maxOutputTokens: 24000,
    providerOptions: {
      openai: {
        store: false,
        reasoningEffort: 'medium',
      },
    },
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId,
    onFinish: async ({ responseMessage }) => {
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
