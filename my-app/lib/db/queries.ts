import "server-only";

import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";

import db, { type Database } from "./connection";
import { attachments, chats, game_versions, messages } from "./schema";

function requireDb(): Database {
  if (!db) {
    throw new Error("POSTGRES_URL is not configured");
  }

  return db;
}

export async function createChat({
  id,
  clerkUserId,
  title,
}: {
  id?: string;
  clerkUserId: string;
  title?: string | null;
}) {
  try {
    const values = {
      ...(id ? { id } : {}),
      clerk_user_id: clerkUserId,
      title,
    };

    const [chat] = id
      ? await requireDb()
          .insert(chats)
          .values(values)
          .onConflictDoNothing({ target: chats.id })
          .returning()
      : await requireDb().insert(chats).values(values).returning();

    return chat ?? (id ? getChatMetadata({ id, clerkUserId }) : undefined);
  } catch (error) {
    console.error("Failed to create chat in database");
    throw error;
  }
}

export async function getChatMetadata({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}) {
  try {
    const [chat] = await requireDb()
      .select({
        id: chats.id,
        title: chats.title,
        demoUrl: chats.demo_url,
        createdAt: chats.created_at,
        updatedAt: chats.updated_at,
      })
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)));

    return chat;
  } catch (error) {
    console.error("Failed to get chat metadata from database");
    throw error;
  }
}

export async function getChatsByUserId({
  clerkUserId,
}: {
  clerkUserId: string;
}) {
  try {
    return await requireDb()
      .select({
        title: chats.title,
        id: chats.id,
        createdAt: chats.created_at,
        updatedAt: chats.updated_at,
      })
      .from(chats)
      .where(eq(chats.clerk_user_id, clerkUserId))
      .orderBy(desc(chats.updated_at));
  } catch (error) {
    console.error("Failed to get chats from database");
    throw error;
  }
}

export async function updateChatTitle({
  id,
  clerkUserId,
  title,
}: {
  id: string;
  clerkUserId: string;
  title: string;
}) {
  try {
    const [chat] = await requireDb()
      .update(chats)
      .set({ title })
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))
      .returning({
        id: chats.id,
        title: chats.title,
        demoUrl: chats.demo_url,
        createdAt: chats.created_at,
        updatedAt: chats.updated_at,
      });

    return chat;
  } catch (error) {
    console.error("Failed to update chat title in database");
    throw error;
  }
}

export async function updateChatLatestHtml({
  id,
  clerkUserId,
  latestHtml,
}: {
  id: string;
  clerkUserId: string;
  latestHtml: string;
}) {
  try {
    const [chat] = await requireDb()
      .update(chats)
      .set({ latest_html: latestHtml })
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))
      .returning({ id: chats.id });

    return chat;
  } catch (error) {
    console.error("Failed to update chat HTML in database");
    throw error;
  }
}

export async function deleteChat({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}) {
  try {
    const [deleted] = await requireDb()
      .delete(chats)
      .where(and(eq(chats.id, id), eq(chats.clerk_user_id, clerkUserId)))
      .returning({ id: chats.id });

    return deleted;
  } catch (error) {
    console.error("Failed to delete chat from database");
    throw error;
  }
}

export async function addMessage({
  chatId,
  clerkUserId,
  role,
  content,
}: {
  chatId: string;
  clerkUserId: string;
  role: string;
  content: unknown;
}) {
  try {
    const chat = await getChatMetadata({ id: chatId, clerkUserId });

    if (!chat) {
      return undefined;
    }

    const [message] = await requireDb()
      .insert(messages)
      .values({
        chat_id: chatId,
        role,
        content,
      })
      .returning({
        id: messages.id,
        chat_id: messages.chat_id,
        role: messages.role,
        content: messages.content,
        created_at: messages.created_at,
      });

    await requireDb()
      .update(chats)
      .set({ updated_at: new Date() })
      .where(eq(chats.id, chatId));

    return message;
  } catch (error) {
    console.error("Failed to add message to database");
    throw error;
  }
}

export async function getMessages({
  chatId,
  clerkUserId,
}: {
  chatId: string;
  clerkUserId: string;
}) {
  try {
    return await requireDb()
      .select({
        id: messages.id,
        chat_id: messages.chat_id,
        role: messages.role,
        content: messages.content,
        created_at: messages.created_at,
      })
      .from(messages)
      .innerJoin(
        chats,
        and(
          eq(messages.chat_id, chats.id),
          eq(chats.clerk_user_id, clerkUserId),
        ),
      )
      .where(eq(messages.chat_id, chatId))
      .orderBy(messages.created_at);
  } catch (error) {
    console.error("Failed to get messages from database");
    throw error;
  }
}

export async function createPendingAttachment({
  id,
  clerkUserId,
  chatId,
  objectKey,
  originalName,
  contentType,
  sizeBytes,
}: {
  id?: string;
  clerkUserId: string;
  chatId?: string | null;
  objectKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}) {
  try {
    const [attachment] = await requireDb()
      .insert(attachments)
      .values({
        ...(id ? { id } : {}),
        clerk_user_id: clerkUserId,
        chat_id: chatId ?? null,
        object_key: objectKey,
        original_name: originalName,
        content_type: contentType,
        size_bytes: sizeBytes,
        status: "pending",
      })
      .returning();

    return attachment;
  } catch (error) {
    console.error("Failed to create pending attachment in database");
    throw error;
  }
}

export async function markAttachmentUploaded({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}) {
  try {
    const [attachment] = await requireDb()
      .update(attachments)
      .set({
        status: "uploaded",
        updated_at: new Date(),
      })
      .where(
        and(
          eq(attachments.id, id),
          eq(attachments.clerk_user_id, clerkUserId),
          eq(attachments.status, "pending"),
        ),
      )
      .returning();

    return attachment;
  } catch (error) {
    console.error("Failed to mark attachment uploaded in database");
    throw error;
  }
}

export async function getAttachmentForUser({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}) {
  try {
    const [attachment] = await requireDb()
      .select()
      .from(attachments)
      .where(
        and(eq(attachments.id, id), eq(attachments.clerk_user_id, clerkUserId)),
      )
      .limit(1);

    return attachment;
  } catch (error) {
    console.error("Failed to get attachment from database");
    throw error;
  }
}

export async function getAttachmentsForUser({
  clerkUserId,
  ids,
  chatId,
  status,
}: {
  clerkUserId: string;
  ids?: string[];
  chatId?: string;
  status?: string;
}) {
  try {
    if (ids && ids.length === 0) {
      return [];
    }

    const filters = [
      eq(attachments.clerk_user_id, clerkUserId),
      ...(ids ? [inArray(attachments.id, ids)] : []),
      ...(chatId ? [eq(attachments.chat_id, chatId)] : []),
      ...(status ? [eq(attachments.status, status)] : []),
    ];

    return await requireDb()
      .select()
      .from(attachments)
      .where(and(...filters))
      .orderBy(desc(attachments.created_at));
  } catch (error) {
    console.error("Failed to get attachments from database");
    throw error;
  }
}

export async function attachAttachmentsToChat({
  ids,
  clerkUserId,
  chatId,
}: {
  ids: string[];
  clerkUserId: string;
  chatId: string;
}) {
  if (ids.length === 0) {
    return [];
  }

  const updated = await requireDb()
    .update(attachments)
    .set({
      chat_id: chatId,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(attachments.clerk_user_id, clerkUserId),
        eq(attachments.status, "uploaded"),
        inArray(attachments.id, ids),
        or(isNull(attachments.chat_id), eq(attachments.chat_id, chatId)),
      ),
    )
    .returning();

  return updated;
}

export async function addGameVersion({
  chatId,
  clerkUserId,
  title,
  html,
  demoUrl,
  sourceSnapshotId,
  sourceManifestKey,
  sourceManifestUrl,
}: {
  chatId: string;
  clerkUserId: string;
  title: string;
  html: string;
  demoUrl?: string | null;
  sourceSnapshotId?: string | null;
  sourceManifestKey?: string | null;
  sourceManifestUrl?: string | null;
}) {
  try {
    const chat = await getChatMetadata({ id: chatId, clerkUserId });

    if (!chat) {
      return undefined;
    }

    const [version] = await requireDb()
      .insert(game_versions)
      .values({
        chat_id: chatId,
        title,
        html,
        ...(demoUrl !== undefined ? { demo_url: demoUrl } : {}),
        ...(sourceSnapshotId !== undefined
          ? { source_snapshot_id: sourceSnapshotId }
          : {}),
        ...(sourceManifestKey !== undefined
          ? { source_manifest_key: sourceManifestKey }
          : {}),
        ...(sourceManifestUrl !== undefined
          ? { source_manifest_url: sourceManifestUrl }
          : {}),
      })
      .returning({
        id: game_versions.id,
        chat_id: game_versions.chat_id,
        title: game_versions.title,
        demo_url: game_versions.demo_url,
        source_snapshot_id: game_versions.source_snapshot_id,
        source_manifest_key: game_versions.source_manifest_key,
        source_manifest_url: game_versions.source_manifest_url,
        created_at: game_versions.created_at,
      });

    await requireDb()
      .update(chats)
      .set({
        title,
        latest_html: html,
        ...(demoUrl !== undefined ? { demo_url: demoUrl } : {}),
        ...(sourceSnapshotId !== undefined
          ? { source_snapshot_id: sourceSnapshotId }
          : {}),
        ...(sourceManifestKey !== undefined
          ? { source_manifest_key: sourceManifestKey }
          : {}),
        ...(sourceManifestUrl !== undefined
          ? { source_manifest_url: sourceManifestUrl }
          : {}),
        updated_at: new Date(),
      })
      .where(eq(chats.id, chatId));

    return version
      ? {
          ...version,
          demoUrl: version.demo_url,
          sourceSnapshotId: version.source_snapshot_id,
          sourceManifestKey: version.source_manifest_key,
          sourceManifestUrl: version.source_manifest_url,
        }
      : version;
  } catch (error) {
    console.error("Failed to add game version to database");
    throw error;
  }
}

export async function setGameVersionDemoUrl({
  versionId,
  chatId,
  clerkUserId,
  demoUrl,
}: {
  versionId: string;
  chatId: string;
  clerkUserId: string;
  demoUrl: string;
}) {
  try {
    const chat = await getChatMetadata({ id: chatId, clerkUserId });

    if (!chat) {
      return undefined;
    }

    const [version] = await requireDb()
      .update(game_versions)
      .set({ demo_url: demoUrl })
      .where(eq(game_versions.id, versionId))
      .returning({
        id: game_versions.id,
        chat_id: game_versions.chat_id,
        title: game_versions.title,
        demo_url: game_versions.demo_url,
        source_snapshot_id: game_versions.source_snapshot_id,
        source_manifest_key: game_versions.source_manifest_key,
        source_manifest_url: game_versions.source_manifest_url,
        created_at: game_versions.created_at,
      });

    await requireDb()
      .update(chats)
      .set({ demo_url: demoUrl })
      .where(eq(chats.id, chatId));

    return version
      ? {
          ...version,
          demoUrl: version.demo_url,
          sourceSnapshotId: version.source_snapshot_id,
          sourceManifestKey: version.source_manifest_key,
          sourceManifestUrl: version.source_manifest_url,
        }
      : version;
  } catch (error) {
    console.error("Failed to update game version demo URL in database");
    throw error;
  }
}

export async function getLatestGameVersion({
  chatId,
  clerkUserId,
}: {
  chatId: string;
  clerkUserId: string;
}) {
  try {
    const [version] = await requireDb()
      .select({
        id: game_versions.id,
        title: game_versions.title,
        demoUrl: game_versions.demo_url,
        sourceSnapshotId: game_versions.source_snapshot_id,
        sourceManifestKey: game_versions.source_manifest_key,
        sourceManifestUrl: game_versions.source_manifest_url,
        createdAt: game_versions.created_at,
      })
      .from(game_versions)
      .innerJoin(
        chats,
        and(
          eq(game_versions.chat_id, chats.id),
          eq(chats.clerk_user_id, clerkUserId),
        ),
      )
      .where(eq(game_versions.chat_id, chatId))
      .orderBy(desc(game_versions.created_at))
      .limit(1);

    return version;
  } catch (error) {
    console.error("Failed to get latest game version from database");
    throw error;
  }
}
