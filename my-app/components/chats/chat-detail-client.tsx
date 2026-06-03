'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'

import { AppHeader } from '@/components/shared/app-header'
import { ChatConversation } from '@/components/chat/chat-conversation'
import { ChatInput } from '@/components/chat/chat-input'
import { PreviewPanel } from '@/components/chat/preview-panel'
import { ResizableLayout } from '@/components/shared/resizable-layout'
import { BottomToolbar } from '@/components/shared/bottom-toolbar'
import { selectDemoUrl } from '@/lib/agent/select-demo-url'
import { cn } from '@/lib/utils'
import {
  type ImageAttachment,
  clearPromptFromStorage,
  takeInitialPrompt,
} from '@/components/ai-elements/prompt-input'

interface ChatDetailClientProps {
  chatId: string
  initialMessages: UIMessage[]
  initialDemoUrl: string | null
}

export function ChatDetailClient({
  chatId,
  initialMessages,
  initialDemoUrl,
}: ChatDetailClientProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [activePanel, setActivePanel] = useState<'chat' | 'preview'>('chat')
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { chatId } }),
    [chatId],
  )

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // The preview always reflects the latest completed game derived from the live
  // message stream, falling back to the server-seeded url before any new game.
  const demoUrl = selectDemoUrl(messages) ?? initialDemoUrl ?? undefined
  const currentChat = { id: chatId, demoUrl }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const text = message.trim()
    if (!text || isLoading) return

    clearPromptFromStorage()
    setAttachments([])
    setMessage('')
    sendMessage({ text })
  }

  // Approach X handoff: the home page stashed the first prompt and navigated
  // here. Fire it once on mount for a brand-new chat. takeInitialPrompt clears
  // the key, and the ref guards against a double-invoked effect.
  const sentInitialRef = useRef(false)
  useEffect(() => {
    if (sentInitialRef.current || initialMessages.length > 0) return

    const text = takeInitialPrompt(chatId)
    if (text) {
      sentInitialRef.current = true
      sendMessage({ text })
    }
  }, [chatId, initialMessages.length, sendMessage])

  // Handle fullscreen keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Auto-focus the textarea on page load
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50 dark:bg-black',
        isFullscreen && 'fixed inset-0 z-50',
      )}
    >
      <AppHeader />

      <div className="flex flex-col h-[calc(100vh-64px-1px)] md:h-[calc(100vh-64px-1px)]">
        <ResizableLayout
          className="flex-1 min-h-0"
          singlePanelMode={false}
          activePanel={activePanel === 'chat' ? 'left' : 'right'}
          leftPanel={
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                <ChatConversation messages={messages} isLoading={isLoading} />
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                showSuggestions={false}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                textareaRef={textareaRef}
              />
            </div>
          }
          rightPanel={
            <PreviewPanel
              currentChat={currentChat}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              refreshKey={refreshKey}
              setRefreshKey={setRefreshKey}
            />
          }
        />

        <div className="md:hidden">
          <BottomToolbar
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            hasPreview={Boolean(demoUrl)}
          />
        </div>
      </div>
    </div>
  )
}
