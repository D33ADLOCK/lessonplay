import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const PendingCodexLoginSchema = z.object({
  state: z.string().min(1),
  verifier: z.string().min(1),
  createdAt: z.number().int().positive(),
});

export type PendingCodexLogin = z.infer<typeof PendingCodexLoginSchema>;

const STORE_DIR = path.join(process.cwd(), ".local");
const STORE_PATH = path.join(STORE_DIR, "codex-oauth-pending-logins.json");
const PENDING_LOGIN_TTL_MS = 10 * 60 * 1000;

const PendingLoginStoreSchema = z.record(
  z.string(),
  PendingCodexLoginSchema,
);

type PendingLoginStore = z.infer<typeof PendingLoginStoreSchema>;

async function readStore(): Promise<PendingLoginStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = PendingLoginStoreSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return {};
    }

    return parsed.data;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT" || error instanceof SyntaxError) {
      return {};
    }

    throw error;
  }
}

async function writeStore(store: PendingLoginStore) {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function pruneExpired(store: PendingLoginStore, now = Date.now()) {
  return Object.fromEntries(
    Object.entries(store).filter(
      ([, login]) => now - login.createdAt <= PENDING_LOGIN_TTL_MS,
    ),
  );
}

export async function savePendingLogin(login: PendingCodexLogin) {
  const store = pruneExpired(await readStore());
  store[login.state] = login;

  await writeStore(store);
}

export async function getPendingLogin(state: string) {
  const store = pruneExpired(await readStore());
  const login = store[state] ?? null;

  if (!login || Date.now() - login.createdAt > PENDING_LOGIN_TTL_MS) {
    delete store[state];
    await writeStore(store);
    return null;
  }

  await writeStore(store);
  return login;
}

export async function deletePendingLogin(state: string) {
  const store = await readStore();
  delete store[state];

  await writeStore(store);
}

export async function clearPendingLogins() {
  await writeStore({});
}
