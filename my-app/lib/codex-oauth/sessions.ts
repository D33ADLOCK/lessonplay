import "server-only";

import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  refreshCodexTokens,
} from "./oauth";
import { ensureCodexCallbackServer } from "./callback-server";
import { CODEX_CALLBACK_REDIRECT_URI } from "./constants";
import { createChallenge, createState, createVerifier } from "./pkce";
import {
  clearPendingLogins,
  deletePendingLogin,
  getPendingLogin,
  savePendingLogin,
} from "./pending-login-store";
import { deleteTokens, getTokens, saveTokens } from "./token-store";

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;

export async function startCodexLogin({ origin }: { origin: string }) {
  const verifier = createVerifier();
  const challenge = createChallenge(verifier);
  const state = createState();

  await savePendingLogin({
    state,
    verifier,
    createdAt: Date.now(),
  });

  await ensureCodexCallbackServer({
    appOrigin: origin,
    completeLogin: completeCodexLoginWithRedirectUri,
  });

  const authorizationUrl = buildAuthorizationUrl({
    redirectUri: CODEX_CALLBACK_REDIRECT_URI,
    challenge,
    state,
  });

  return {
    authorizationUrl,
    state,
  };
}

export async function completeCodexLogin({
  code,
  state,
  origin,
}: {
  code: string;
  state: string;
  origin: string;
}) {
  await completeCodexLoginWithRedirectUri({
    code,
    state,
    redirectUri: `${origin}/api/codex-auth/callback`,
  });
}

export async function completeCodexLoginWithRedirectUri({
  code,
  state,
  redirectUri,
}: {
  code: string;
  state: string;
  redirectUri: string;
}) {
  const pendingLogin = await getPendingLogin(state);

  if (!pendingLogin) {
    throw new Error("OAuth login state is missing or expired");
  }

  const tokens = await exchangeAuthorizationCode({
    code,
    verifier: pendingLogin.verifier,
    redirectUri,
  });

  await saveTokens(tokens);
  await deletePendingLogin(state);
}

export async function getCodexAuthStatus() {
  const tokens = await getTokens();

  return {
    connected: Boolean(tokens),
  } as const;
}

export async function getValidAccessToken(now = Date.now()) {
  const tokens = await getTokens();

  if (!tokens) {
    throw new Error("ChatGPT Codex OAuth is not connected");
  }

  if (tokens.expiresAt > now + ACCESS_TOKEN_REFRESH_WINDOW_MS) {
    return {
      accessToken: tokens.accessToken,
      accountId: tokens.accountId,
    };
  }

  try {
    const refreshedTokens = await refreshCodexTokens(tokens.refreshToken);
    await saveTokens(refreshedTokens);

    return {
      accessToken: refreshedTokens.accessToken,
      accountId: refreshedTokens.accountId,
    };
  } catch (error) {
    await deleteTokens();
    throw error;
  }
}

export async function logoutCodexAuth() {
  await Promise.all([deleteTokens(), clearPendingLogins()]);
}
