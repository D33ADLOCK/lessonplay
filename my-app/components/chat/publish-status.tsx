'use client'

import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { PublishViewModel } from '@/lib/agent/publish-view-model'
import { cn } from '@/lib/utils'

export function PublishStatus({ publish }: { publish: PublishViewModel }) {
  const isRunning = publish.status === 'running'
  const isFailed = publish.status === 'failed'

  return (
    <section
      className={cn(
        'not-prose mb-4 w-full overflow-hidden rounded-md border bg-background',
        isFailed && 'border-destructive/35',
      )}
      aria-live="polite"
    >
      <div className="flex min-h-11 items-center justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {isRunning ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : isFailed ? (
            <AlertCircle className="size-4 shrink-0 text-destructive" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          )}
          <span
            className={cn(
              'truncate text-sm font-medium',
              isFailed && 'text-destructive',
            )}
          >
            {publish.title}
          </span>
        </div>

        {publish.status === 'succeeded' && publish.demoUrl ? (
          <Button asChild variant="ghost" size="sm">
            <a href={publish.demoUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Open
            </a>
          </Button>
        ) : null}
      </div>

      {publish.error ? (
        <pre className="max-h-72 overflow-auto border-t bg-destructive/5 p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-destructive">
          {publish.error}
        </pre>
      ) : null}
    </section>
  )
}
