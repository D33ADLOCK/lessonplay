import { randomUUID } from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { attachmentPresignRequestSchema } from "@/lib/attachments/schema";
import {
  createPendingAttachment,
  getChatMetadata,
} from "@/lib/db/queries";
import {
  createAttachmentObjectKey,
  createPresignedPutUrl,
} from "@/lib/storage";

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300;

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

  const parsed = attachmentPresignRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid attachment metadata" },
      { status: 400 },
    );
  }

  const { fileName, contentType, sizeBytes, chatId } = parsed.data;

  if (chatId) {
    const chat = await getChatMetadata({
      id: chatId,
      clerkUserId: userId,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
  }

  const attachmentId = randomUUID();
  const objectKey = createAttachmentObjectKey({
    clerkUserId: userId,
    attachmentId,
    fileName,
  });

  const attachment = await createPendingAttachment({
    id: attachmentId,
    clerkUserId: userId,
    chatId: chatId ?? null,
    objectKey,
    originalName: fileName,
    contentType,
    sizeBytes,
  });

  if (!attachment) {
    return NextResponse.json(
      { error: "Failed to create attachment" },
      { status: 500 },
    );
  }

  try {
    const { uploadUrl } = await createPresignedPutUrl({
      objectKey,
      contentType,
      expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
    });

    return NextResponse.json({
      attachmentId: attachment.id,
      uploadUrl,
      expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }
}
