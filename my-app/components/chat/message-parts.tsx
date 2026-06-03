import {
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from 'ai'

import { CodeBlock } from '@/components/ai-elements/code-block'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import { Tool, ToolContent, ToolHeader } from '@/components/ai-elements/tool'

const PUBLISH_GAME_TOOL = 'publishGame'

/**
 * Renders a single chat message by switching on the typed `parts` union that
 * AI SDK v5 produces. Each branch narrows a part to its concrete type via the
 * SDK guards, so adding a future tool/agent region is a new `if`, not a rewrite.
 *
 * The `publishGame` code view binds to `part.input.html` — the text the model
 * is *writing* — never `part.output`, so the code types in live as it streams.
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

        if (isToolUIPart(part) && getToolName(part) === PUBLISH_GAME_TOOL) {
          const html = (part.input as { html?: string } | undefined)?.html ?? ''
          const building =
            part.state !== 'output-available' && part.state !== 'output-error'
          // While the model is still typing the HTML, show it as plain text.
          // Syntax-highlighting the whole growing document on every streamed
          // token is O(n^2) and freezes the main thread, so we highlight only
          // once the code is complete.
          const isTypingCode = part.state === 'input-streaming'

          return (
            <Tool key={key} defaultOpen={building}>
              <ToolHeader type={part.type} state={part.state} />
              <ToolContent>
                {isTypingCode ? (
                  <pre className="max-h-80 overflow-auto rounded-md border bg-background p-4 font-mono text-sm whitespace-pre-wrap break-words">
                    {html}
                  </pre>
                ) : (
                  <CodeBlock code={html} language="html" />
                )}
              </ToolContent>
            </Tool>
          )
        }

        // step-start and any other part types render nothing.
        return null
      })}
    </>
  )
}
