import React from 'react'

// Function to preprocess message content and remove V0_FILE markers and shell placeholders
function preprocessMessageContent(content: unknown): string {
  if (typeof content === 'string') return content

  if (!Array.isArray(content)) return JSON.stringify(content, null, 2)

  return content
    .map((row) => {
      if (!Array.isArray(row)) return row

      // Process text content to remove V0_FILE markers and shell placeholders
      return row.map((item) => {
        if (typeof item === 'string') {
          // Remove V0_FILE markers with various patterns
          let processed = item.replace(/\[V0_FILE\][^:]*:file="[^"]*"\n?/g, '')
          processed = processed.replace(/\[V0_FILE\][^\n]*\n?/g, '')

          // Remove shell placeholders with various patterns
          processed = processed.replace(/\.\.\. shell \.\.\./g, '')
          processed = processed.replace(/\.\.\.\s*shell\s*\.\.\./g, '')

          // Remove empty lines that might be left behind
          processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n')
          processed = processed.replace(/^\s*\n+/g, '') // Remove leading empty lines
          processed = processed.replace(/\n+\s*$/g, '') // Remove trailing empty lines
          processed = processed.trim()

          // If the processed string is empty or only whitespace, return empty string
          if (!processed || processed.match(/^\s*$/)) {
            return ''
          }

          return processed
        }
        return item
      })
    })
    .flat(2)
    .filter((item) => typeof item === 'string' && item.length > 0)
    .join('\n\n')
}

interface MessageRendererProps {
  content: unknown
  messageId?: string
  role: 'user' | 'assistant'
  className?: string
}

export function MessageRenderer({
  content,
  messageId,
  role,
  className,
}: MessageRendererProps) {
  const processedContent = preprocessMessageContent(content)

  return (
    <div className={className} data-message-id={messageId} data-role={role}>
      <p className="mb-4 whitespace-pre-wrap text-gray-700 leading-relaxed dark:text-gray-200">
        {processedContent}
      </p>
    </div>
  )
}
