import { validateUIMessages, type UIMessage } from 'ai'

/**
 * Hard caps for the client-authoritative payload. The browser owns the
 * `messages` array (Architecture 1), so the server must bound it before the
 * model ever sees it: cap the number of turns and the serialized size.
 */
export const MAX_MESSAGES = 200
export const MAX_PAYLOAD_BYTES = 2_000_000 // 2 MB

export type ValidateChatRequestResult =
  | { ok: true; messages: UIMessage[] }
  | { ok: false; error: string }

/**
 * Boundary guard for `POST /api/chat`. Confirms the request carries a
 * well-formed, reasonably-sized `messages` array before it reaches the LLM.
 *
 * Tool schemas are intentionally not passed to `validateUIMessages`: that path
 * only validates tool *inputs* when tools are supplied, and we want prior
 * `publishGame` tool parts from earlier turns to pass structural validation so
 * iteration keeps working. Side-effecting authority (chat ownership, DB/R2
 * writes) stays gated elsewhere by Clerk auth — this guard only shapes input.
 */
export async function validateChatRequest(input: {
  messages: unknown
}): Promise<ValidateChatRequestResult> {
  const { messages } = input

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'At least one message is required' }
  }

  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: 'Too many messages' }
  }

  if (Buffer.byteLength(JSON.stringify(messages)) > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: 'Payload too large' }
  }

  try {
    const validated = await validateUIMessages({ messages })
    return { ok: true, messages: validated }
  } catch {
    return { ok: false, error: 'Invalid message format' }
  }
}
