import 'server-only'

import { nanoid } from 'nanoid'

import { uploadTextObject } from '@/lib/storage'
import { getLearnLoopDraftFileMap } from './learn-loop-draft-store'

type PersistedSourceFile = {
  path: string
  key: string
  url: string
  contentType: string
  size: number
}

export type LearnLoopSourceSnapshot = {
  chatId: string
  snapshotId: string
  createdAt: string
  manifestKey: string
  manifestUrl: string
  files: PersistedSourceFile[]
}

function getContentType(filePath: string) {
  if (filePath.endsWith('.css')) {
    return 'text/css; charset=utf-8'
  }

  if (filePath.endsWith('.html')) {
    return 'text/html; charset=utf-8'
  }

  if (filePath.endsWith('.json')) {
    return 'application/json; charset=utf-8'
  }

  if (filePath.endsWith('.md')) {
    return 'text/markdown; charset=utf-8'
  }

  return 'text/plain; charset=utf-8'
}

export function getLearnLoopSourceSnapshotPrefix({
  chatId,
  snapshotId,
}: {
  chatId: string
  snapshotId: string
}) {
  return `learn-loop-sources/${chatId}/${snapshotId}`
}

export async function persistLearnLoopSourceDraft({
  chatId,
  snapshotId = nanoid(),
}: {
  chatId: string
  snapshotId?: string
}): Promise<LearnLoopSourceSnapshot> {
  const fileMap = getLearnLoopDraftFileMap(chatId)
  const sourceEntries = Object.entries(fileMap)

  if (sourceEntries.length === 0) {
    throw new Error('Cannot persist Learn Loop source draft with no files')
  }

  const createdAt = new Date().toISOString()
  const prefix = getLearnLoopSourceSnapshotPrefix({ chatId, snapshotId })

  const files = await Promise.all(
    sourceEntries.map(async ([filePath, content]) => {
      const key = `${prefix}/${filePath}`
      const contentType = getContentType(filePath)
      const upload = await uploadTextObject({
        path: key,
        body: content,
        contentType,
      })

      return {
        path: filePath,
        key: upload.path,
        url: upload.url,
        contentType,
        size: Buffer.byteLength(content, 'utf8'),
      }
    }),
  )

  const manifest = {
    chatId,
    snapshotId,
    createdAt,
    files,
  }
  const manifestUpload = await uploadTextObject({
    path: `${prefix}/manifest.json`,
    body: `${JSON.stringify(manifest, null, 2)}\n`,
    contentType: 'application/json; charset=utf-8',
  })

  return {
    chatId,
    snapshotId,
    createdAt,
    manifestKey: manifestUpload.path,
    manifestUrl: manifestUpload.url,
    files,
  }
}
