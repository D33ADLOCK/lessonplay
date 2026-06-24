import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getChatsByUserId } from '@/lib/db/queries'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const chats = await getChatsByUserId({ clerkUserId: userId })

  return NextResponse.json({
    object: 'list',
    data: chats.map((chat) => ({
      id: chat.id,
      object: 'chat',
      name: chat.title ?? 'Untitled game',
      title: chat.title ?? 'Untitled game',
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    })),
  })
}
