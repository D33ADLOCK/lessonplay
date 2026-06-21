import "server-only";

import { z } from "zod";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const SCOPE = "openid profile email offline_access";
const ACCOUNT_CLAIM = "https://api.openai.com/auth";

type BuildAuthorizationUrlInput = {
  redirectUri: string;
  challenge: string;
  state: string;
};

export function buildAuthorizationUrl({
  redirectUri,
  challenge,
  state,
}: BuildAuthorizationUrlInput) {
  const url = new URL(AUTHORIZE_URL);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);

  // Codex-compatible OAuth flow params used by Codex/OpenCode-style auth.
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", "codex_cli_rs");

  return url.toString();
}

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
});

const JwtPayloadSchema = z.object({
  [ACCOUNT_CLAIM]: z
    .object({
      chatgpt_account_id: z.string().min(1),
    })
    .optional(),
});

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("OAuth access token is not a valid JWT");
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export function decodeChatGptAccountId(accessToken: string) {
  const parsed = JwtPayloadSchema.safeParse(decodeJwtPayload(accessToken));
  const accountId = parsed.success
    ? parsed.data[ACCOUNT_CLAIM]?.chatgpt_account_id
    : null;

  if (!accountId) {
    throw new Error("OAuth access token is missing ChatGPT account id");
  }

  return accountId;
}

export async function exchangeAuthorizationCode({
  code,
  verifier,
  redirectUri,
}: {
  code: string;
  verifier: string;
  redirectUri: string;
}) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth code exchange failed with ${response.status}`);
  }

  const parsed = TokenResponseSchema.parse(await response.json());
  const accountId = decodeChatGptAccountId(parsed.access_token);

  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    expiresAt: Date.now() + parsed.expires_in * 1000,
    accountId,
  };
}

export async function refreshCodexTokens(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token refresh failed with ${response.status}`);
  }

  const parsed = TokenResponseSchema.parse(await response.json());
  const accountId = decodeChatGptAccountId(parsed.access_token);

  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    expiresAt: Date.now() + parsed.expires_in * 1000,
    accountId,
  };
}
