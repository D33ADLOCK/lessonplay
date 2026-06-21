import { createOpenAI, openai } from "@ai-sdk/openai";

import { codexAuthFetch } from "./codexAuthFetch";

const DEFAULT_OPENAI_MODEL = "gpt-5.5";
const DEFAULT_CODEX_MODEL = "gpt-5.5";
const DEFAULT_CODEX_BASE_URL = "https://chatgpt.com/backend-api";

export async function getModel() {
  if (process.env.AGENT_MODEL_PROVIDER === "chatgpt-codex-oauth") {
    const codexOpenAI = createOpenAI({
      apiKey: "chatgpt-oauth",
      baseURL: process.env.CODEX_OAUTH_BASE_URL ?? DEFAULT_CODEX_BASE_URL,
      fetch: codexAuthFetch,
    });

    return codexOpenAI.responses(
      process.env.CODEX_OAUTH_MODEL ?? DEFAULT_CODEX_MODEL,
    );
  }

  return openai(DEFAULT_OPENAI_MODEL);
}
