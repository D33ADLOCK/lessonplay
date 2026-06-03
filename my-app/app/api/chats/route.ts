import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getChatsByUserId } from '@/lib/db/queries'
import type { Chat } from '@/lib/db/schema'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const chats = await getChatsByUserId({ clerkUserId: userId })

  return NextResponse.json({
    object: 'list',
    data: chats.map((chat: Chat) => ({
      id: chat.id,
      object: 'chat',
      name: chat.title,
      title: chat.title,
      latestHtml: chat.latest_html,
      createdAt: chat.created_at.toISOString(),
      updatedAt: chat.updated_at.toISOString(),
    })),
  })
}
