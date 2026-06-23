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
  it("strips message IDs and removes item references for store false requests", () => {
    const input = [
      { id: "msg_1", type: "message", role: "user", content: "hello" },
      { id: "ref_1", type: "item_reference" },
      { type: "item_reference" },
      { id: "reasoning_1", type: "reasoning", encrypted_content: "encrypted" },
    ];

    expect(sanitizeCodexInput(input)).toEqual([
      { type: "message", role: "user", content: "hello" },
      { id: "reasoning_1", type: "reasoning", encrypted_content: "encrypted" },
    ]);
  });

  it("preserves paired function calls and outputs", () => {
    const input = [
      {
        id: "tool_1",
        type: "function_call",
        call_id: "call_abc",
        name: "readLearnLoopReference",
      },
      {
        id: "output_1",
        type: "function_call_output",
        call_id: "call_abc",
        output: "done",
      },
    ];

    expect(sanitizeCodexInput(input)).toEqual([
      {
        id: "tool_1",
        type: "function_call",
        call_id: "call_abc",
        name: "readLearnLoopReference",
      },
      {
        id: "output_1",
        type: "function_call_output",
        call_id: "call_abc",
        output: "done",
      },
    ]);
  });

  it("drops orphaned function call outputs", () => {
    const input = [
      {
        id: "output_1",
        type: "function_call_output",
        call_id: "call_missing",
        output: "done",
      },
    ];

    expect(sanitizeCodexInput(input)).toEqual([]);
  });
});
