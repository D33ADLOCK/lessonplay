import { createHash, randomBytes } from "node:crypto";

export function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createVerifier() {
  return base64Url(randomBytes(32));
}

export function createChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export function createState() {
  return randomBytes(16).toString("hex");
}
