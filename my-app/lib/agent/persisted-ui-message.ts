import type { UIMessage } from "ai";

export function readPersistedUIMessage(
  content: unknown,
  fallbackId: string,
): UIMessage | null {
  if (
    !content ||
    typeof content !== "object" ||
    !("parts" in content) ||
    !Array.isArray((content as { parts: unknown }).parts)
  ) {
    return null;
  }

  const message = content as UIMessage;
  const id =
    typeof message.id === "string" && message.id.trim().length > 0
      ? message.id
      : fallbackId;

  return { ...message, id };
}
