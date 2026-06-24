'use client'

import { useState } from 'react'
import { Check, Copy, FileCode2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { GeneratedSourceFile } from '@/lib/agent/generated-file-view-model'
import { cn } from '@/lib/utils'

interface GeneratedFilesProps {
  files: GeneratedSourceFile[]
  status: 'writing' | 'saving' | 'complete' | 'failed'
  error?: string
}

const statusLabels = {
  writing: 'Writing files...',
  saving: 'Saving generated files...',
  complete: 'Generated files',
  failed: 'Could not save generated files',
} as const

function CopySourceButton({
  content,
  path,
}: {
  content: string
  path: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) return

    await navigator.clipboard.writeText(content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={handleCopy}
      aria-label={`Copy ${path}`}
      title={`Copy ${path}`}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

export function GeneratedFiles({
  files,
  status,
  error,
}: GeneratedFilesProps) {
  const isWorking = status === 'writing' || status === 'saving'

  return (
    <section className="not-prose mb-4 w-full overflow-hidden rounded-md border bg-background">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {isWorking ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <FileCode2
              className={cn(
                'size-4 shrink-0',
                status === 'failed'
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            />
          )}
          <span className="truncate text-sm font-medium">
            {statusLabels[status]}
          </span>
        </div>
        {files.length > 0 ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        ) : null}
      </div>

      {error ? (
        <pre className="overflow-auto bg-destructive/5 p-3 font-mono text-xs whitespace-pre-wrap text-destructive">
          {error}
        </pre>
      ) : null}

      {files.length > 0 ? (
        <div className="divide-y">
          {files.map((file, index) => (
            <article key={`${file.path}-${index}`}>
              <div className="flex min-h-9 items-center justify-between gap-3 bg-muted/35 px-3 py-1">
                <code className="min-w-0 truncate font-mono text-xs text-foreground">
                  {file.path}
                </code>
                <CopySourceButton content={file.content} path={file.path} />
              </div>
              <pre className="max-h-[32rem] overflow-auto p-3 font-mono text-xs leading-5 whitespace-pre-wrap break-words text-foreground">
                {file.content}
              </pre>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          Waiting for file contents...
        </div>
      )}
    </section>
  )
}
