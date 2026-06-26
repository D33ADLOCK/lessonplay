import "server-only";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

let client: S3Client | null = null;

function getS3Client() {
  if (client) {
    return client;
  }

  const endpoint = process.env.R2_S3_ENDPOINT;
  const region = process.env.R2_S3_REGION ?? "auto";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be configured",
    );
  }

  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

function getBucketName() {
  return process.env.R2_BUCKET_NAME ?? "animeroom";
}

function safeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

// Create object key to save
export function createAttachmentObjectKey({
  clerkUserId,
  fileName,
}: {
  clerkUserId: string;
  fileName: string;
}) {
  const id = nanoid();
  return `attachments/${clerkUserId}/${id}/${safeFileName(fileName)}`;
}

// Create presigned URL
export async function createPresignedPutUrl({
  objectKey,
  contentType,
  expiresInSeconds = 300,
}: {
  objectKey: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    objectKey,
    expiresInSeconds,
  };
}

// Get URL
export async function createPresignedGetUrl({
  objectKey,
  expiresInSeconds = 300,
}: {
  objectKey: string;
  expiresInSeconds?: number;
}) {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
  });

  const downloadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: expiresInSeconds,
  });

  return {
    downloadUrl,
    objectKey,
    expiresInSeconds,
  };
}

export async function objectExists(objectKey: string) {
  try {
    await getS3Client().send(
      new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
      }),
    );

    return true;
  } catch {
    return false;
  }
}

function getPublicUrl(path: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!publicBaseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL must be configured");
  }

  const baseUrl = publicBaseUrl.replace(/\/+$/, "");
  return `${baseUrl}/${path}`;
}

export async function uploadTextObject({
  path,
  body,
  contentType,
}: {
  path: string;
  body: string;
  contentType: string;
}): Promise<{ url: string; path: string }> {
  const s3 = getS3Client();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: path,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload text object to storage: ${message}`);
  }

  return { url: getPublicUrl(path), path };
}

export async function uploadGameHtml({
  chatId,
  html,
}: {
  chatId: string;
  html: string;
}): Promise<{ url: string; path: string }> {
  const path = `${chatId}/${nanoid()}.html`;

  try {
    return await uploadTextObject({
      path,
      body: html,
      contentType: "text/html",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload game HTML to storage: ${message}`);
  }
}
