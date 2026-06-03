'use client'

import { useEffect, useState } from 'react'
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
} from '@/components/ai-elements/web-preview'
import {
  RefreshCw,
  Maximize,
  Minimize,
  ExternalLink,
  Play,
  Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Chat {
  id: string
  demo?: string
  url?: string
  demoUrl?: string
}

interface PreviewPanelProps {
  currentChat: Chat | null
  isFullscreen: boolean
  setIsFullscreen: (fullscreen: boolean) => void
  refreshKey: number
  setRefreshKey: (key: number | ((prev: number) => number)) => void
}

export function PreviewPanel({
  currentChat,
  isFullscreen,
  setIsFullscreen,
  refreshKey,
  setRefreshKey,
}: PreviewPanelProps) {
  const demoUrl = currentChat?.demoUrl
  const hasPreview = Boolean(demoUrl)

  // The game is arbitrary JS in a sandboxed iframe, so we can't pause its
  // animation loop from outside. "Stop" unmounts the iframe (tearing down its
  // JS context, which halts the game); "Run" remounts it for a fresh start.
  const [isRunning, setIsRunning] = useState(true)

  // A newly published game should start running even if the previous one was
  // stopped.
  useEffect(() => {
    setIsRunning(true)
  }, [demoUrl])

  return (
    <div
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-black' : 'flex-1',
      )}
    >
      <WebPreview
        defaultUrl={demoUrl || ''}
        onUrlChange={(url) => {
          // Optional: Handle URL changes if needed
          console.log('Preview URL changed:', url)
        }}
      >
        <WebPreviewNavigation>
          <WebPreviewNavigationButton
            onClick={() => setIsRunning((prev) => !prev)}
            tooltip={isRunning ? 'Stop game' : 'Run game'}
            disabled={!hasPreview}
          >
            {isRunning ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </WebPreviewNavigationButton>
          <WebPreviewNavigationButton
            onClick={() => {
              // Force a fresh start: remount the iframe and ensure it runs.
              setIsRunning(true)
              setRefreshKey((prev) => prev + 1)
            }}
            tooltip="Restart preview"
            disabled={!hasPreview}
          >
            <RefreshCw className="h-4 w-4" />
          </WebPreviewNavigationButton>
          <WebPreviewUrl
            readOnly
            placeholder="Your app will appear here..."
            value={demoUrl || ''}
          />
          {demoUrl ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              title="Open game in a new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
          <WebPreviewNavigationButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            tooltip={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            disabled={!hasPreview}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </WebPreviewNavigationButton>
        </WebPreviewNavigation>
        {hasPreview && isRunning ? (
          <WebPreviewBody key={refreshKey} src={demoUrl} />
        ) : hasPreview ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Game stopped
              </p>
              <p className="text-xs text-gray-700/50 dark:text-gray-200/50">
                Press Run to start it again
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                No preview available
              </p>
              <p className="text-xs text-gray-700/50 dark:text-gray-200/50">
                Start a conversation to see your app here
              </p>
            </div>
          </div>
        )}
      </WebPreview>
    </div>
  )
}
