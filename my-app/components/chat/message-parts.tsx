import {
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from 'ai'

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
    </>
  )
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
