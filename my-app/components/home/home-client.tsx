'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PromptInput,
  PromptInputImageButton,
  PromptInputImagePreview,
  PromptInputMicButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  createImageAttachment,
  createImageAttachmentFromStored,
  savePromptToStorage,
  loadPromptFromStorage,
  clearPromptFromStorage,
  saveInitialPrompt,
  type ImageAttachment,
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { AppHeader } from '@/components/shared/app-header'

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler({ onReset }: { onReset: () => void }) {
  const searchParams = useSearchParams()

  // Reset UI when reset parameter is present
  useEffect(() => {
    const reset = searchParams.get('reset')
    if (reset === 'true') {
      onReset()

      // Remove the reset parameter from URL without triggering navigation
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('reset')
      window.history.replaceState({}, '', newUrl.pathname)
    }
  }, [searchParams, onReset])

  return null
}

export function HomeClient() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleReset = () => {
    setMessage('')
    setAttachments([])
    setIsSubmitting(false)
    clearPromptFromStorage()

    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  // Auto-focus the textarea on page load and restore from sessionStorage
  useEffect(() => {
    textareaRef.current?.focus()

    const storedData = loadPromptFromStorage()
    if (storedData) {
      setMessage(storedData.message)
      if (storedData.attachments.length > 0) {
        setAttachments(storedData.attachments.map(createImageAttachmentFromStored))
      }
    }
  }, [])

  // Save prompt data to sessionStorage whenever message or attachments change
  useEffect(() => {
    if (message.trim() || attachments.length > 0) {
      savePromptToStorage(message, attachments)
    } else {
      clearPromptFromStorage()
    }
  }, [message, attachments])

  const handleImageFiles = async (files: File[]) => {
    try {
      const newAttachments = await Promise.all(
        files.map((file) => createImageAttachment(file)),
      )
      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Error processing image files:', error)
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleDragOver = () => setIsDragOver(true)
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = () => setIsDragOver(false)

  // Approach X: generate the chat id on the client, stash the first prompt, and
  // navigate. The detail page's useChat picks up the stash and fires the first
  // message, so the detail view is the single place that talks to /api/chat.
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const text = message.trim()
    if (!text || isSubmitting) return

    setIsSubmitting(true)
    const chatId = crypto.randomUUID()
    clearPromptFromStorage()
    saveInitialPrompt(chatId, text)
    router.push(`/chats/${chatId}`)
  }

  const handleSuggestion = (suggestion: string) => {
    setMessage(suggestion)
    setTimeout(() => {
      textareaRef.current?.form?.requestSubmit()
    }, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      {/* Handle search params with Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler onReset={handleReset} />
      </Suspense>

      <AppHeader />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8 md:mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              AI game creation for educators
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-950 dark:text-white mb-4">
              Turn any lesson into a playable game.
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
              Describe a concept or textbook chapter. LessonPlay helps you
              choose a game idea, builds it, and publishes a playable experience.
            </p>
          </div>

          {/* Prompt Input */}
          <div className="max-w-2xl mx-auto">
            <PromptInput
              onSubmit={handleSendMessage}
              className="w-full relative"
              onImageDrop={handleImageFiles}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <PromptInputImagePreview
                attachments={attachments}
                onRemove={handleRemoveAttachment}
              />
              <PromptInputTextarea
                ref={textareaRef}
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                placeholder="What do you want your students to learn?"
                className="min-h-[80px] text-base"
                disabled={isSubmitting}
              />
              <PromptInputToolbar>
                <PromptInputTools>
                  <PromptInputImageButton
                    onImageSelect={handleImageFiles}
                    disabled={isSubmitting}
                  />
                </PromptInputTools>
                <PromptInputTools>
                  <PromptInputMicButton
                    onTranscript={(transcript) => {
                      setMessage((prev) => prev + (prev ? ' ' : '') + transcript)
                    }}
                    onError={(error) => {
                      console.error('Speech recognition error:', error)
                    }}
                    disabled={isSubmitting}
                  />
                  <PromptInputSubmit
                    disabled={!message.trim() || isSubmitting}
                    status={isSubmitting ? 'streaming' : 'ready'}
                  />
                </PromptInputTools>
              </PromptInputToolbar>
            </PromptInput>
          </div>

          {/* Suggestions */}
          <div className="mt-4 max-w-2xl mx-auto">
            <Suggestions>
              {[
                'Teach fractions with a game',
                'Turn photosynthesis into an adventure',
                'Build a force and friction challenge',
                'Create a separation-of-mixtures lab',
              ].map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  suggestion={suggestion}
                />
              ))}
            </Suggestions>
          </div>

          {/* Footer */}
          <div className="mt-8 md:mt-16 text-center text-sm text-muted-foreground">
            <p>
              Built for teachers and educational creators.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
