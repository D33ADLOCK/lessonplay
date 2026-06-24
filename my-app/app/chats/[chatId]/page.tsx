import { auth } from '@clerk/nextjs/server'
import type { UIMessage } from 'ai'

import { ChatDetailClient } from '@/components/chats/chat-detail-client'
import { readPersistedUIMessage } from '@/lib/agent/persisted-ui-message'
import {
  getChatMetadata,
  getLatestGameVersion,
  getMessages,
} from '@/lib/db/queries'

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  const { userId } = await auth()

  // Seed persisted history server-side so iteration survives a reload with no
  // loading flash. Null-tolerant: a brand-new, client-generated chat id with no
  // DB row yet yields empty messages instead of a 404.
  let initialMessages: UIMessage[] = []
  let initialDemoUrl: string | null = null

  if (userId) {
    const [rows, latestGameVersion, chat] = await Promise.all([
      getMessages({ chatId, clerkUserId: userId }),
      getLatestGameVersion({ chatId, clerkUserId: userId }),
      getChatMetadata({ id: chatId, clerkUserId: userId }),
    ])

    initialMessages = rows
      .map((row) => readPersistedUIMessage(row.content, row.id))
      .filter((message): message is UIMessage => message !== null)

    initialDemoUrl = latestGameVersion?.demoUrl ?? chat?.demoUrl ?? null
  }

  return (
    <ChatDetailClient
      chatId={chatId}
      initialMessages={initialMessages}
      initialDemoUrl={initialDemoUrl}
    />
  )
}
