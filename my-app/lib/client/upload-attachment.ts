import {
  ALLOWED_ATTACHMENT_CONTENT_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  isAllowedAttachmentContentType,
} from "@/lib/attachments/schema";

export const ACCEPTED_ATTACHMENT_INPUT_TYPES =
  ALLOWED_ATTACHMENT_CONTENT_TYPES.join(",");

export type AttachmentValidationResult =
  | {
      ok: true;
      file: File;
    }
  | {
      ok: false;
      error: string;
    };

export function validateAttachmentFile(
  file: File,
): AttachmentValidationResult {
  if (!file.type) {
    return {
      ok: false,
      error: "This file type could not be detected.",
    };
  }

  if (!isAllowedAttachmentContentType(file.type)) {
    return {
      ok: false,
      error: "Only PDF, PNG, JPEG, WebP, and GIF files are supported.",
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      error: "This file is empty.",
    };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      ok: false,
      error: "Files must be 20MB or smaller.",
    };
  }

  return {
    ok: true,
    file,
  };
}

export type UploadedAttachment = {
  attachmentId: string;
  status: "uploaded";
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

type PresignResponse = {
  attachmentId: string;
  uploadUrl: string;
  expiresInSeconds: number;
};

type ErrorResponse = {
  error?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ErrorResponse;

  if (!response.ok) {
    throw new Error(body.error ?? "Attachment upload failed.");
  }

  return body as T;
}

export async function uploadAttachment(
  file: File,
  options: { chatId?: string | null } = {},
): Promise<UploadedAttachment> {
  const validation = validateAttachmentFile(file);

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const presignResponse = await fetch("/api/attachments/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      chatId: options.chatId ?? null,
    }),
  });

  const presign = await readJsonResponse<PresignResponse>(presignResponse);

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage.");
  }

  const confirmResponse = await fetch("/api/attachments/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      attachmentId: presign.attachmentId,
    }),
  });

  return readJsonResponse<UploadedAttachment>(confirmResponse);
}
