export const WRITE_LEARN_LOOP_FILES_TOOL = 'writeLearnLoopFiles'

export type GeneratedSourceFile = {
  path: string
  content: string
}

export function readGeneratedSourceFiles(input: unknown): GeneratedSourceFile[] {
  if (!input || typeof input !== 'object' || !('files' in input)) return []

  const files = (input as { files?: unknown }).files
  if (!Array.isArray(files)) return []

  return files.flatMap((file) => {
    if (!file || typeof file !== 'object') return []

    const path = 'path' in file ? file.path : undefined
    const content = 'content' in file ? file.content : undefined

    if (typeof path !== 'string' || path.trim().length === 0) return []

    return [
      {
        path,
        content: typeof content === 'string' ? content : '',
      },
    ]
  })
}
