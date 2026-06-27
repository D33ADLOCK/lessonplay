import {
  PromptInput,
  PromptInputAttachmentButton,
  PromptInputAttachmentPreview,
  PromptInputMicButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  savePromptToStorage,
  loadPromptFromStorage,
  clearPromptFromStorage,
  type PromptAttachment,
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { uploadAttachment } from '@/lib/client/upload-attachment'
import {
  useState,
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react'

interface ChatInputProps {
  chatId: string
  message: string
  setMessage: (message: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  showSuggestions: boolean
  attachments?: PromptAttachment[]
  onAttachmentsChange?: Dispatch<SetStateAction<PromptAttachment[]>>
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function ChatInput({
  chatId,
  message,
  setMessage,
  onSubmit,
  isLoading,
  showSuggestions,
  attachments = [],
  onAttachmentsChange,
  textareaRef,
}: ChatInputProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleAttachmentFiles = useCallback(
    (files: File[]) => {
      if (!onAttachmentsChange) return

      for (const file of files) {
        const localId = crypto.randomUUID()
        const previewUrl = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined

        onAttachmentsChange((prev) => [
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

        uploadAttachment(file, { chatId })
          .then((uploaded) => {
            onAttachmentsChange((prev) =>
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
            onAttachmentsChange((prev) =>
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
    },
    [chatId, onAttachmentsChange],
  )

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      if (!onAttachmentsChange) return
      const removed = attachments.find((attachment) => attachment.id === id)

      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      onAttachmentsChange(attachments.filter((att) => att.id !== id))
    },
    [attachments, onAttachmentsChange],
  )

  const handleDragOver = useCallback(() => {
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(() => {
    setIsDragOver(false)
  }, [])

  // Save to sessionStorage when message or attachments change
  useEffect(() => {
    if (message.trim()) {
      savePromptToStorage(message, [])
    } else {
      // Clear sessionStorage if both message and attachments are empty
      clearPromptFromStorage()
    }
  }, [message])

  // Restore from sessionStorage on mount (only if no existing data)
  useEffect(() => {
    if (!message && attachments.length === 0) {
      const storedData = loadPromptFromStorage()
      if (storedData) {
        setMessage(storedData.message)
      }
    }
  }, [message, attachments, setMessage])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      // Clear sessionStorage immediately upon submission
      clearPromptFromStorage()
      onSubmit(e)
    },
    [onSubmit],
  )

  const isUploading = attachments.some(
    (attachment) => attachment.status === 'uploading',
  )
  const hasFailedAttachment = attachments.some(
    (attachment) => attachment.status === 'failed',
  )

  return (
    <div className="px-4 md:pb-4">
      <div className="flex gap-2">
        <PromptInput
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mx-auto relative"
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
            className="min-h-[60px]"
            placeholder="Continue the conversation..."
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputAttachmentButton
                onAttachmentSelect={handleAttachmentFiles}
                disabled={isLoading}
              />
            </PromptInputTools>
            <PromptInputTools>
              <PromptInputMicButton
                onTranscript={(transcript) => {
                  setMessage(message + (message ? ' ' : '') + transcript)
                }}
                onError={(error) => {
                  console.error('Speech recognition error:', error)
                }}
              />
              <PromptInputSubmit
                disabled={
                  !message.trim() || isLoading || isUploading || hasFailedAttachment
                }
                status={isLoading ? 'streaming' : 'ready'}
              />
            </PromptInputTools>
          </PromptInputToolbar>
        </PromptInput>
      </div>
      {showSuggestions && (
        <div className="max-w-2xl mx-auto mt-2">
          <Suggestions>
            {[
              'Teach fractions with a game',
              'Turn photosynthesis into an adventure',
              'Build a force and friction challenge',
              'Create a separation-of-mixtures lab',
            ].map((suggestion) => (
              <Suggestion
                key={suggestion}
                onClick={() => {
                  setMessage(suggestion)
                  setTimeout(() => textareaRef?.current?.form?.requestSubmit(), 0)
                }}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>
        </div>
      )}
    </div>
  )
}
