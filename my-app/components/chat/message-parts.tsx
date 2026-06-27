import {
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from 'ai'
import { FileIcon } from 'lucide-react'

import { GeneratedFiles } from '@/components/chat/generated-files'
import { PublishStatus } from '@/components/chat/publish-status'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import {
  readGeneratedSourceFiles,
  WRITE_LEARN_LOOP_FILES_TOOL,
} from '@/lib/agent/generated-file-view-model'
import {
  PUBLISH_GAME_TOOL,
  toPublishViewModel,
} from '@/lib/agent/publish-view-model'

type MessageAttachmentMetadata = {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
}

/**
 * Renders a single chat message by switching on the typed `parts` union.
 * Reference-reading tools intentionally fall through so internal preparation
 * does not crowd the conversation.
 */
export function MessageParts({ message }: { message: UIMessage }) {
  return (
    <>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`

        if (isReasoningUIPart(part)) {
          return (
            <Reasoning
              key={key}
              className="w-full"
              isStreaming={part.state === 'streaming'}
            >
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          )
        }

        if (isTextUIPart(part)) {
          return <Response key={key}>{part.text}</Response>
        }

        if (isToolUIPart(part)) {
          const toolName = getToolName(part)

          if (toolName === WRITE_LEARN_LOOP_FILES_TOOL) {
            return (
              <GeneratedFiles
                key={key}
                files={readGeneratedSourceFiles(part.input)}
                status={getGeneratedFilesStatus(part)}
                error={part.state === 'output-error' ? part.errorText : undefined}
              />
            )
          }

          const publish = toPublishViewModel(part)
          if (publish) {
            return (
              <div key={key}>
                {toolName === PUBLISH_GAME_TOOL ? (
                  <GeneratedFiles
                    files={readPublishedHtml(part.input)}
                    status={getPublishedHtmlStatus(part)}
                  />
                ) : null}
                <PublishStatus publish={publish} />
              </div>
            )
          }
        }

        // step-start and any other part types render nothing.
        return null
      })}
      {message.role === 'user' ? (
        <MessageAttachmentBadges message={message} />
      ) : null}
    </>
  )
}

function MessageAttachmentBadges({ message }: { message: UIMessage }) {
  const attachments = readMessageAttachments(message.metadata)

  if (attachments.length === 0) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex max-w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-muted-foreground"
        >
          <FileIcon className="size-3.5 shrink-0" />
          <span className="truncate">{attachment.fileName}</span>
          <span className="shrink-0">· {formatAttachmentSize(attachment.sizeBytes)}</span>
        </div>
      ))}
    </div>
  )
}

function readMessageAttachments(metadata: UIMessage['metadata']) {
  if (!metadata || typeof metadata !== 'object') {
    return []
  }

  const attachments = (metadata as { attachments?: unknown }).attachments

  if (!Array.isArray(attachments)) {
    return []
  }

  return attachments.filter(
    (attachment): attachment is MessageAttachmentMetadata =>
      typeof attachment === 'object' &&
      attachment !== null &&
      typeof (attachment as MessageAttachmentMetadata).id === 'string' &&
      typeof (attachment as MessageAttachmentMetadata).fileName === 'string' &&
      typeof (attachment as MessageAttachmentMetadata).contentType === 'string' &&
      typeof (attachment as MessageAttachmentMetadata).sizeBytes === 'number',
  )
}

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

function getGeneratedFilesStatus(
  part: ToolUIPart,
): 'writing' | 'saving' | 'complete' | 'failed' {
  if (part.state === 'output-error') return 'failed'
  if (part.state === 'output-available') return 'complete'
  if (part.state === 'input-available') return 'saving'
  return 'writing'
}

function readPublishedHtml(input: unknown) {
  if (!input || typeof input !== 'object') return []

  const html = 'html' in input ? input.html : undefined
  if (typeof html !== 'string') return []

  return [{ path: 'index.html', content: html }]
}

function getPublishedHtmlStatus(
  part: ToolUIPart,
): 'writing' | 'complete' {
  return part.state === 'input-streaming' ? 'writing' : 'complete'
}
