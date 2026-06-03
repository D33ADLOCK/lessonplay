import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UIMessage } from 'ai'

import {
  deleteChat,
  getChat,
  getLatestGameVersion,
  getMessages,
  updateChatTitle,
} from '@/lib/db/queries'

function getMessageText(content: unknown) {
  if (typeof content === 'string') {
    return content
  }

  if (!content || typeof content !== 'object') {
    return ''
  }

  const maybeMessage = content as Partial<UIMessage>

  if (Array.isArray(maybeMessage.parts)) {
    return maybeMessage.parts
      .filter((part): part is { type: 'text'; text: string } => {
        return (
          !!part &&
          typeof part === 'object' &&
          'type' in part &&
          part.type === 'text' &&
          'text' in part &&
          typeof part.text === 'string'
        )
      })
      .map((part) => part.text)
      .join('')
  }

  return ''
}

function toResponseMessage(message: Awaited<ReturnType<typeof getMessages>>[number]) {
  const content = message.content as UIMessage | string
  const maybeMessage =
    content && typeof content === 'object' && 'parts' in content
      ? content
      : undefined

  return {
    id: maybeMessage?.id || message.id,
    role: message.role,
    content: getMessageText(content),
    experimental_content: maybeMessage,
    parts: maybeMessage?.parts,
    createdAt: message.created_at.toISOString(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { userId } = await auth()
  const { chatId } = await params

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!chatId) {
    return NextResponse.json(
      { error: 'Chat ID is required' },
      { status: 400 },
    )
  }

  const chat = await getChat({ id: chatId, clerkUserId: userId })

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const [messages, latestGameVersion] = await Promise.all([
    getMessages({ chatId, clerkUserId: userId }),
    getLatestGameVersion({ chatId, clerkUserId: userId }),
  ])

  return NextResponse.json({
    id: chat.id,
    object: 'chat',
    name: chat.title,
    title: chat.title,
    latestHtml: chat.latest_html,
    demoUrl: latestGameVersion?.demoUrl ?? chat.demo_url ?? null,
    createdAt: chat.created_at.toISOString(),
    updatedAt: chat.updated_at.toISOString(),
    messages: messages.map(toResponseMessage),
    latestGameVersion,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { userId } = await auth()
  const { chatId } = await params

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const title =
    typeof body?.title === 'string'
      ? body.title.trim()
      : typeof body?.name === 'string'
        ? body.name.trim()
        : ''

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const chat = await updateChatTitle({ id: chatId, clerkUserId: userId, title })

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: chat.id,
    object: 'chat',
    name: chat.title,
    title: chat.title,
    latestHtml: chat.latest_html,
    demoUrl: chat.demo_url ?? null,
    createdAt: chat.created_at.toISOString(),
    updatedAt: chat.updated_at.toISOString(),
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { userId } = await auth()
  const { chatId } = await params

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const deleted = await deleteChat({ id: chatId, clerkUserId: userId })

  if (!deleted) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
