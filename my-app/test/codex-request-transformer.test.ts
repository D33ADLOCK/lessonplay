import { describe, expect, it } from "vitest";

import {
  sanitizeCodexInput,
  transformCodexRequestBody,
} from "@/lib/codex-oauth/request-transformer";

describe("transformCodexRequestBody", () => {
  it("forces Codex response settings and keeps existing includes", () => {
    const transformed = transformCodexRequestBody(
      {
        model: "gpt-5.1-codex",
        store: true,
        stream: false,
        include: ["file_search_call.results"],
        input: [],
      },
      { model: "gpt-5.1-codex" },
    );

    expect(transformed).toMatchObject({
      model: "gpt-5.1-codex",
      store: false,
      stream: true,
      include: ["file_search_call.results", "reasoning.encrypted_content"],
    });
  });

  it("removes unsupported max-token fields", () => {
    const transformed = transformCodexRequestBody({
      model: "gpt-5.1-codex",
      max_output_tokens: 100,
      max_completion_tokens: 200,
      input: [],
    });

    expect(transformed).not.toHaveProperty("max_output_tokens");
    expect(transformed).not.toHaveProperty("max_completion_tokens");
  });

  it("normalizes non-Codex models to the configured fallback model", () => {
    const transformed = transformCodexRequestBody(
      {
        model: "gpt-5.5",
        input: [],
      },
      { model: "gpt-5.1-codex" },
    );

    expect(transformed).toMatchObject({ model: "gpt-5.1-codex" });
  });
});

describe("sanitizeCodexInput", () => {
  it("strips top-level item IDs and removes item references", () => {
    const input = [
      { id: "msg_1", type: "message", role: "user", content: "hello" },
      { id: "ref_1", type: "item_reference" },
      { id: "tool_1", type: "function_call", call_id: "call_abc" },
    ];

    expect(sanitizeCodexInput(input)).toEqual([
      { type: "message", role: "user", content: "hello" },
      { type: "function_call", call_id: "call_abc" },
    ]);
  });
});
