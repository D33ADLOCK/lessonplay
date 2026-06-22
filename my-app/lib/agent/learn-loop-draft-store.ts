import 'server-only'

const ALLOWED_ROOT_FILES = new Set(['index.html', 'README.md'])
const ALLOWED_EXTENSIONS = new Set(['.css', '.html', '.json', '.md', '.ts', '.tsx'])

export type LearnLoopDraftFile = {
  path: string
  content: string
  updatedAt: string
}

const draftsByChatId = new Map<string, Map<string, LearnLoopDraftFile>>()

export function normalizeLearnLoopDraftPath(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, '/').trim()

  if (!normalizedPath) {
    throw new Error('Learn Loop draft path is required')
  }

  if (normalizedPath.startsWith('/') || /^[a-zA-Z]:\//.test(normalizedPath)) {
    throw new Error('Learn Loop draft path must be relative')
  }

  const segments = normalizedPath.split('/')

  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Learn Loop draft path must not contain empty, current, or parent segments')
  }

  if (segments.some((segment) => segment.startsWith('.'))) {
    throw new Error('Learn Loop draft path must not contain hidden file or directory segments')
  }

  const extension = normalizedPath.includes('.')
    ? normalizedPath.slice(normalizedPath.lastIndexOf('.'))
    : ''

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported Learn Loop draft file extension: ${extension || '(none)'}`)
  }

  const rootSegment = segments[0]

  if (rootSegment !== 'src' && rootSegment !== 'tests' && !ALLOWED_ROOT_FILES.has(normalizedPath)) {
    throw new Error('Learn Loop draft files must live under src/, tests/, or be allowed root files')
  }

  return normalizedPath
}

export function writeLearnLoopDraftFiles({
  chatId,
  files,
}: {
  chatId: string
  files: Array<{ path: string; content: string }>
}) {
  const existingFiles = draftsByChatId.get(chatId) ?? new Map<string, LearnLoopDraftFile>()
  const updatedAt = new Date().toISOString()

  for (const file of files) {
    const normalizedPath = normalizeLearnLoopDraftPath(file.path)

    existingFiles.set(normalizedPath, {
      path: normalizedPath,
      content: file.content,
      updatedAt,
    })
  }

  draftsByChatId.set(chatId, existingFiles)

  return listLearnLoopDraftFiles(chatId)
}

export function listLearnLoopDraftFiles(chatId: string) {
  return Array.from(draftsByChatId.get(chatId)?.values() ?? [])
    .map(({ path, updatedAt }) => ({ path, updatedAt }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

export function getLearnLoopDraftFileMap(chatId: string) {
  return Object.fromEntries(
    Array.from(draftsByChatId.get(chatId)?.entries() ?? [])
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([filePath, file]) => [filePath, file.content]),
  )
}

export function clearLearnLoopDraftFiles(chatId: string) {
  draftsByChatId.delete(chatId)
}
