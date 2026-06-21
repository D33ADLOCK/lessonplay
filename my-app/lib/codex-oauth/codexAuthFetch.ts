import "server-only";

import { getValidAccessToken } from "./sessions";
import { transformCodexRequestBody } from "./request-transformer";

const DEFAULT_CODEX_MODEL = "gpt-5.5";

function getRequestUrl(input: RequestInfo | URL) {
  if (input instanceof Request) {
    return input.url;
  }

  return input.toString();
}

function rewriteCodexUrl(input: RequestInfo | URL) {
  const url = new URL(getRequestUrl(input));

  if (url.pathname.endsWith("/responses")) {
    url.pathname = url.pathname.replace(/\/responses$/, "/codex/responses");
  }

  return url.toString();
}

function buildCodexHeaders(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  auth: { accessToken: string; accountId: string },
) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);

  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  headers.delete("authorization");
  headers.delete("x-api-key");
  headers.delete("openai-organization");
  headers.delete("openai-project");

  headers.set("authorization", `Bearer ${auth.accessToken}`);
  headers.set("chatgpt-account-id", auth.accountId);
  headers.set("content-type", "application/json");
  headers.set("accept", "text/event-stream");
  headers.set("originator", "codex_cli_rs");

  return headers;
}

function transformBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return body;
  }

  const parsedBody = JSON.parse(body) as unknown;
  const transformedBody = transformCodexRequestBody(parsedBody, {
    model: process.env.CODEX_OAUTH_MODEL ?? DEFAULT_CODEX_MODEL,
  });

  return JSON.stringify(transformedBody);
}

export async function codexAuthFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const auth = await getValidAccessToken();

  return fetch(rewriteCodexUrl(input), {
    ...init,
    headers: buildCodexHeaders(input, init, auth),
    body: transformBody(init?.body),
  });
}
