import type { UIMessage } from 'ai'

import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { MessageParts } from '@/components/chat/message-parts'

interface ChatConversationProps {
  messages: UIMessage[]
  isLoading: boolean
}

/**
 * Renders the live `useChat` message list. Each message is drawn by
 * MessageParts, which switches on the typed parts union, so reasoning, text,
 * and the live-streaming generated source each get their own region.
 */
export function ChatConversation({ messages, isLoading }: ChatConversationProps) {
  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              <MessageParts message={message} />
            </MessageContent>
          </Message>
        ))}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </ConversationContent>
    </Conversation>
  )
}
