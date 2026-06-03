import { auth } from '@clerk/nextjs/server'
import type { UIMessage } from 'ai'

import { ChatDetailClient } from '@/components/chats/chat-detail-client'
import { getChat, getLatestGameVersion, getMessages } from '@/lib/db/queries'

/**
 * A persisted message stores the full UIMessage (with `parts`) in `content`.
 * Older rows may hold a bare string; those are skipped rather than rendered as
 * a malformed message.
 */
function toUIMessage(content: unknown): UIMessage | null {
  if (
    content &&
    typeof content === 'object' &&
    'parts' in content &&
    Array.isArray((content as { parts: unknown }).parts)
  ) {
    return content as UIMessage
  }

  return null
}

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
      getChat({ id: chatId, clerkUserId: userId }),
    ])

    initialMessages = (rows as Array<{ content: unknown }>)
      .map((row) => toUIMessage(row.content))
      .filter((message): message is UIMessage => message !== null)

    initialDemoUrl = latestGameVersion?.demoUrl ?? chat?.demo_url ?? null
  }

  return (
    <ChatDetailClient
      chatId={chatId}
      initialMessages={initialMessages}
      initialDemoUrl={initialDemoUrl}
    />
  )
}
