import "server-only";

import { createServer, type Server, type ServerResponse } from "node:http";

import {
  CODEX_CALLBACK_ORIGIN,
  CODEX_CALLBACK_PATH,
  CODEX_CALLBACK_PORT,
  CODEX_CALLBACK_REDIRECT_URI,
} from "./constants";

type CompleteLoginFromCallback = (input: {
  code: string;
  state: string;
  redirectUri: string;
}) => Promise<void>;

type CallbackServerConfig = {
  appOrigin: string;
  completeLogin: CompleteLoginFromCallback;
};

let callbackServer: Server | null = null;
let activeConfig: CallbackServerConfig | null = null;
let closeTimer: NodeJS.Timeout | null = null;

const CALLBACK_SERVER_TTL_MS = 10 * 60 * 1000;

export async function ensureCodexCallbackServer(config: CallbackServerConfig) {
  activeConfig = config;

  if (callbackServer?.listening) {
    scheduleCodexCallbackServerClose(CALLBACK_SERVER_TTL_MS);
    return;
  }

  callbackServer = createServer(async (request, response) => {
    const currentConfig = activeConfig;

    if (!currentConfig) {
      response.writeHead(503);
      response.end("Codex callback server is not ready");
      closeCodexCallbackServerSoon();
      return;
    }

    const requestUrl = new URL(request.url ?? "/", CODEX_CALLBACK_ORIGIN);

    if (request.method !== "GET" || requestUrl.pathname !== CODEX_CALLBACK_PATH) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthError = requestUrl.searchParams.get("error");

    if (oauthError) {
      redirectToApp(response, currentConfig.appOrigin, "failed");
      closeCodexCallbackServerSoon();
      return;
    }

    if (!code || !state) {
      redirectToApp(response, currentConfig.appOrigin, "missing-code");
      closeCodexCallbackServerSoon();
      return;
    }

    try {
      await currentConfig.completeLogin({
        code,
        state,
        redirectUri: CODEX_CALLBACK_REDIRECT_URI,
      });

      redirectToApp(response, currentConfig.appOrigin, "connected");
    } catch {
      redirectToApp(response, currentConfig.appOrigin, "failed");
    } finally {
      closeCodexCallbackServerSoon();
    }
  });

  await new Promise<void>((resolve, reject) => {
    const server = callbackServer;

    if (!server) {
      reject(new Error("Codex callback server was not created"));
      return;
    }

    const onError = (error: Error) => {
      callbackServer = null;
      activeConfig = null;
      reject(error);
    };

    server.once("error", onError);
    server.listen(CODEX_CALLBACK_PORT, () => {
      server.off("error", onError);
      scheduleCodexCallbackServerClose(CALLBACK_SERVER_TTL_MS);
      resolve();
    });
  });
}

function redirectToApp(
  response: ServerResponse,
  appOrigin: string,
  status: string,
) {
  response.writeHead(302, {
    Location: `${appOrigin}/?codexAuth=${status}`,
  });
  response.end();
}

function closeCodexCallbackServerSoon() {
  scheduleCodexCallbackServerClose(500);
}

function scheduleCodexCallbackServerClose(delayMs: number) {
  if (closeTimer) {
    clearTimeout(closeTimer);
  }

  closeTimer = setTimeout(() => {
    callbackServer?.close();
    callbackServer = null;
    activeConfig = null;
    closeTimer = null;
  }, delayMs);
}
