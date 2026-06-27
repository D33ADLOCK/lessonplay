import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import {
  attachmentConfirmRequestSchema,
  isAllowedAttachmentContentType,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/lib/attachments/schema";
import {
  getAttachmentForUser,
  markAttachmentUploaded,
} from "@/lib/db/queries";
import { getObjectMetadata } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = attachmentConfirmRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid attachment id" },
      { status: 400 },
    );
  }

  const attachment = await getAttachmentForUser({
    id: parsed.data.attachmentId,
    clerkUserId: userId,
  });

  if (!attachment) {
    return NextResponse.json(
      { error: "Attachment not found" },
      { status: 404 },
    );
  }

  if (attachment.status === "uploaded") {
    return NextResponse.json({
      attachmentId: attachment.id,
      status: attachment.status,
      fileName: attachment.original_name,
      contentType: attachment.content_type,
      sizeBytes: attachment.size_bytes,
    });
  }

  if (attachment.status !== "pending") {
    return NextResponse.json(
      { error: "Attachment is not pending upload" },
      { status: 409 },
    );
  }

  const metadata = await getObjectMetadata(attachment.object_key);

  if (!metadata.exists) {
    return NextResponse.json(
      { error: "Uploaded object was not found" },
      { status: 409 },
    );
  }

  if (
    typeof metadata.contentLength !== "number" ||
    metadata.contentLength > MAX_ATTACHMENT_SIZE_BYTES
  ) {
    return NextResponse.json(
      { error: "Uploaded file is too large" },
      { status: 400 },
    );
  }

  if (
    !metadata.contentType ||
    !isAllowedAttachmentContentType(metadata.contentType)
  ) {
    return NextResponse.json(
      { error: "Uploaded file type is not allowed" },
      { status: 400 },
    );
  }

  const uploaded = await markAttachmentUploaded({
    id: attachment.id,
    clerkUserId: userId,
  });

  if (!uploaded) {
    return NextResponse.json(
      { error: "Failed to mark attachment uploaded" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    attachmentId: uploaded.id,
    status: uploaded.status,
    fileName: uploaded.original_name,
    contentType: uploaded.content_type,
    sizeBytes: uploaded.size_bytes,
  });
}
