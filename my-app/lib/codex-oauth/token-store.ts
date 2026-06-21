import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const CodexTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
  accountId: z.string().min(1),
});

export type CodexTokens = z.infer<typeof CodexTokensSchema>;

const STORE_DIR = path.join(process.cwd(), ".local");
const STORE_PATH = path.join(STORE_DIR, "codex-oauth-tokens.json");

export async function getTokens() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = CodexTokensSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT" || error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

export async function saveTokens(tokens: CodexTokens) {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(tokens, null, 2), "utf8");
}

export async function deleteTokens() {
  await rm(STORE_PATH, { force: true });
}
