import { z } from "zod";

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type AttachmentContentType =
  (typeof ALLOWED_ATTACHMENT_CONTENT_TYPES)[number];

export const ALLOWED_ATTACHMENT_CONTENT_TYPE_SET = new Set<string>(
  ALLOWED_ATTACHMENT_CONTENT_TYPES,
);

export function isAllowedAttachmentContentType(
  contentType: string,
): contentType is AttachmentContentType {
  return ALLOWED_ATTACHMENT_CONTENT_TYPE_SET.has(contentType);
}

export const attachmentPresignRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(ALLOWED_ATTACHMENT_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_SIZE_BYTES),
  chatId: z.string().uuid().nullable().optional(),
});

export type AttachmentPresignRequest = z.infer<
  typeof attachmentPresignRequestSchema
>;

export const attachmentConfirmRequestSchema = z.object({
  attachmentId: z.string().uuid(),
});

export type AttachmentConfirmRequest = z.infer<
  typeof attachmentConfirmRequestSchema
>;
