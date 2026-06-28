import 'server-only'

import type { FileUIPart, UIMessage } from 'ai'

import {
  attachAttachmentsToChat,
  getAttachmentsForUser,
} from '@/lib/db/queries'
import { createPresignedGetUrl } from '@/lib/storage'

const ATTACHMENT_GET_URL_EXPIRES_IN_SECONDS = 30 * 60

export class AttachmentResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttachmentResolutionError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getAttachmentIds(message: UIMessage): string[] {
  if (!isRecord(message.metadata)) {
    return []
  }

  const { attachmentIds } = message.metadata

  if (attachmentIds == null) {
    return []
  }

  if (!Array.isArray(attachmentIds)) {
    throw new AttachmentResolutionError('Invalid attachment IDs')
  }

  return attachmentIds.map((id) => {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new AttachmentResolutionError('Invalid attachment IDs')
    }

    return id
  })
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

export async function addAttachmentPartsToMessages({
  messages,
  chatId,
  clerkUserId,
  hydrateMessageId,
}: {
  messages: UIMessage[]
  chatId: string
  clerkUserId: string
  hydrateMessageId?: string
}): Promise<UIMessage[]> {
  const attachmentIdsByMessage = new Map<string, string[]>()
  const allAttachmentIds: string[] = []

  for (const message of messages) {
    if (message.role !== 'user') {
      continue
    }

    if (hydrateMessageId && message.id !== hydrateMessageId) {
      continue
    }

    const attachmentIds = unique(getAttachmentIds(message))

    if (attachmentIds.length === 0) {
      continue
    }

    attachmentIdsByMessage.set(message.id, attachmentIds)
    allAttachmentIds.push(...attachmentIds)
  }

  const uniqueAttachmentIds = unique(allAttachmentIds)

  if (uniqueAttachmentIds.length === 0) {
    return messages
  }

  await attachAttachmentsToChat({
    ids: uniqueAttachmentIds,
    chatId,
    clerkUserId,
  })

  const attachments = await getAttachmentsForUser({
    clerkUserId,
    ids: uniqueAttachmentIds,
    chatId,
    status: 'uploaded',
  })

  if (attachments.length !== uniqueAttachmentIds.length) {
    throw new AttachmentResolutionError('One or more attachments were not found')
  }

  const filePartsByAttachmentId = new Map<string, FileUIPart>()

  await Promise.all(
    attachments.map(async (attachment) => {
      const { downloadUrl } = await createPresignedGetUrl({
        objectKey: attachment.object_key,
        expiresInSeconds: ATTACHMENT_GET_URL_EXPIRES_IN_SECONDS,
      })

      filePartsByAttachmentId.set(attachment.id, {
        type: 'file',
        mediaType: attachment.content_type,
        filename: attachment.original_name,
        url: downloadUrl,
      })
    }),
  )

  return messages.map((message) => {
    const attachmentIds = attachmentIdsByMessage.get(message.id)

    if (!attachmentIds) {
      return message
    }

    const fileParts = attachmentIds.map((attachmentId) => {
      const filePart = filePartsByAttachmentId.get(attachmentId)

      if (!filePart) {
        throw new AttachmentResolutionError(
          'One or more attachments were not found',
        )
      }

      return filePart
    })

    return {
      ...message,
      parts: [...fileParts, ...message.parts],
    }
  })
}
