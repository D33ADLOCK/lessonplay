import 'server-only'

import { and, desc, eq } from 'drizzle-orm'

import db from './connection'
import { chats, game_versions, messages } from './schema'

function requireDb() {
  if (!db) {
    throw new Error('POSTGRES_URL is not configured')
  }

  return db
}

export async function createChat({
  id,
  clerkUserId,
  title,
}: {
  id?: string
  clerkUserId: string
  title?: string | null
}) {
  try {
    const values = {
      ...(id ? { id } : {}),
      clerk_user_id: clerkUserId,
      title,
    }

    const [chat] = id
      ? await requireDb()
          .insert(chats)
          .values(values)
          .onConflictDoNothing({ target: chats.id })
          .returning()
      : await requireDb().insert(chats).values(values).returning()

    return chat ?? (id ? getChat({ id, clerkUserId }) : undefined)
  } catch (error) {
    console.error('Failed to create chat in database')
    throw error
  }
}

export async function getChat({
  id,
  clerkUserId,
}: {
  id: string
  clerkUserId: string
}) {
  try {
    const [chat] = await requireDb()
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))

    return chat
  } catch (error) {
    console.error('Failed to get chat from database')
    throw error
  }
}

export async function getChatsByUserId({
  clerkUserId,
}: {
  clerkUserId: string
}) {
  try {
    return await requireDb()
      .select()
      .from(chats)
      .where(eq(chats.clerk_user_id, clerkUserId))
      .orderBy(desc(chats.updated_at))
  } catch (error) {
    console.error('Failed to get chats from database')
    throw error
  }
}

export async function updateChatTitle({
  id,
  clerkUserId,
  title,
}: {
  id: string
  clerkUserId: string
  title: string
}) {
  try {
    const [chat] = await requireDb()
      .update(chats)
      .set({ title })
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))
      .returning()

    return chat
  } catch (error) {
    console.error('Failed to update chat title in database')
    throw error
  }
}

export async function updateChatLatestHtml({
  id,
  clerkUserId,
  latestHtml,
}: {
  id: string
  clerkUserId: string
  latestHtml: string
}) {
  try {
    const [chat] = await requireDb()
      .update(chats)
      .set({ latest_html: latestHtml })
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))
      .returning()

    return chat
  } catch (error) {
    console.error('Failed to update chat HTML in database')
    throw error
  }
}

export async function deleteChat({
  id,
  clerkUserId,
}: {
  id: string
  clerkUserId: string
}) {
  try {
    const [deleted] = await requireDb()
      .delete(chats)
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))
      .returning()

    return deleted
  } catch (error) {
    console.error('Failed to delete chat from database')
    throw error
  }
}

export async function addMessage({
  chatId,
  clerkUserId,
  role,
  content,
}: {
  chatId: string
  clerkUserId: string
  role: string
  content: unknown
}) {
  try {
    const chat = await getChat({ id: chatId, clerkUserId })

    if (!chat) {
      return undefined
    }

    const [message] = await requireDb()
      .insert(messages)
      .values({
        chat_id: chatId,
        role,
        content,
      })
      .returning()

    await requireDb()
      .update(chats)
      .set({ updated_at: new Date() })
      .where(eq(chats.id, chatId))

    return message
  } catch (error) {
    console.error('Failed to add message to database')
    throw error
  }
}

export async function getMessages({
  chatId,
  clerkUserId,
}: {
  chatId: string
  clerkUserId: string
}) {
  try {
    const chat = await getChat({ id: chatId, clerkUserId })

    if (!chat) {
      return []
    }

    return await requireDb()
      .select()
      .from(messages)
      .where(eq(messages.chat_id, chatId))
      .orderBy(messages.created_at)
  } catch (error) {
    console.error('Failed to get messages from database')
    throw error
  }
}

export async function addGameVersion({
  chatId,
  clerkUserId,
  title,
  html,
  demoUrl,
}: {
  chatId: string
  clerkUserId: string
  title: string
  html: string
  demoUrl?: string | null
}) {
  try {
    const chat = await getChat({ id: chatId, clerkUserId })

    if (!chat) {
      return undefined
    }

    const [version] = await requireDb()
      .insert(game_versions)
      .values({
        chat_id: chatId,
        title,
        html,
        ...(demoUrl !== undefined ? { demo_url: demoUrl } : {}),
      })
      .returning()

    await requireDb()
      .update(chats)
      .set({
        title,
        latest_html: html,
        ...(demoUrl !== undefined ? { demo_url: demoUrl } : {}),
        updated_at: new Date(),
      })
      .where(eq(chats.id, chatId))

    return version ? { ...version, demoUrl: version.demo_url } : version
  } catch (error) {
    console.error('Failed to add game version to database')
    throw error
  }
}

export async function setGameVersionDemoUrl({
  versionId,
  chatId,
  clerkUserId,
  demoUrl,
}: {
  versionId: string
  chatId: string
  clerkUserId: string
  demoUrl: string
}) {
  try {
    const chat = await getChat({ id: chatId, clerkUserId })

    if (!chat) {
      return undefined
    }

    const [version] = await requireDb()
      .update(game_versions)
      .set({ demo_url: demoUrl })
      .where(eq(game_versions.id, versionId))
      .returning()

    await requireDb()
      .update(chats)
      .set({ demo_url: demoUrl })
      .where(eq(chats.id, chatId))

    return version ? { ...version, demoUrl: version.demo_url } : version
  } catch (error) {
    console.error('Failed to update game version demo URL in database')
    throw error
  }
}

export async function getLatestGameVersion({
  chatId,
  clerkUserId,
}: {
  chatId: string
  clerkUserId: string
}) {
  try {
    const chat = await getChat({ id: chatId, clerkUserId })

    if (!chat) {
      return undefined
    }

    const [version] = await requireDb()
      .select()
      .from(game_versions)
      .where(eq(game_versions.chat_id, chatId))
      .orderBy(desc(game_versions.created_at))
      .limit(1)

    return version ? { ...version, demoUrl: version.demo_url } : version
  } catch (error) {
    console.error('Failed to get latest game version from database')
    throw error
  }
}
