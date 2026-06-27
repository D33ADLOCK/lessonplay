'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PromptInput,
  PromptInputAttachmentButton,
  PromptInputAttachmentPreview,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  savePromptToStorage,
  loadPromptFromStorage,
  clearPromptFromStorage,
  saveInitialPrompt,
  type PromptAttachment,
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { AppHeader } from '@/components/shared/app-header'
import { uploadAttachment } from '@/lib/client/upload-attachment'

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
  const [attachments, setAttachments] = useState<PromptAttachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const attachmentsRef = useRef<PromptAttachment[]>([])

  const revokeAttachmentPreviews = (items: PromptAttachment[]) => {
    for (const attachment of items) {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
    }
  }

  const handleReset = () => {
    setMessage('')
    setAttachments((prev) => {
      revokeAttachmentPreviews(prev)
      return []
    })
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
    }
  }, [])

  // Save text drafts only; uploaded attachments use the initial prompt handoff.
  useEffect(() => {
    if (message.trim()) {
      savePromptToStorage(message)
    } else {
      clearPromptFromStorage()
    }
  }, [message])

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    return () => {
      revokeAttachmentPreviews(attachmentsRef.current)
    }
  }, [])

  const handleAttachmentFiles = (files: File[]) => {
    for (const file of files) {
      const localId = crypto.randomUUID()
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined

      setAttachments((prev) => [
        ...prev,
        {
          id: localId,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          previewUrl,
          status: 'uploading',
        },
      ])

      uploadAttachment(file)
        .then((uploaded) => {
          setAttachments((prev) =>
            prev.map((attachment) =>
              attachment.id === localId
                ? {
                    ...attachment,
                    attachmentId: uploaded.attachmentId,
                    fileName: uploaded.fileName,
                    contentType: uploaded.contentType,
                    sizeBytes: uploaded.sizeBytes,
                    status: 'uploaded',
                    error: undefined,
                  }
                : attachment,
            ),
          )
        })
        .catch((error) => {
          setAttachments((prev) =>
            prev.map((attachment) =>
              attachment.id === localId
                ? {
                    ...attachment,
                    status: 'failed',
                    error:
                      error instanceof Error ? error.message : 'Upload failed',
                  }
                : attachment,
            ),
          )
        })
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((attachment) => attachment.id === id)
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      return prev.filter((att) => att.id !== id)
    })
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
    const uploadedAttachments = attachments.filter(
      (attachment) => attachment.status === 'uploaded' && attachment.attachmentId,
    )
    const attachmentIds = uploadedAttachments.map(
      (attachment) => attachment.attachmentId!,
    )
    const attachmentMetadata = uploadedAttachments.map((attachment) => ({
      id: attachment.attachmentId!,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
    }))

    clearPromptFromStorage()
    saveInitialPrompt(chatId, {
      text,
      attachmentIds,
      attachments: attachmentMetadata,
    })
    router.push(`/chats/${chatId}`)
  }

  const isUploading = attachments.some(
    (attachment) => attachment.status === 'uploading',
  )
  const hasFailedAttachment = attachments.some(
    (attachment) => attachment.status === 'failed',
  )

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
              onAttachmentDrop={handleAttachmentFiles}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <PromptInputAttachmentPreview
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
                  <PromptInputAttachmentButton
                    onAttachmentSelect={handleAttachmentFiles}
                    disabled={isSubmitting}
                  />
                </PromptInputTools>
                <PromptInputTools>
                  <PromptInputSubmit
                    disabled={
                      !message.trim() ||
                      isSubmitting ||
                      isUploading ||
                      hasFailedAttachment
                    }
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
