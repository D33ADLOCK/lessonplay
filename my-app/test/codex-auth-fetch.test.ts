import { beforeEach, describe, expect, it, vi } from "vitest";

const { getValidAccessTokenMock } = vi.hoisted(() => ({
  getValidAccessTokenMock: vi.fn(),
}));

vi.mock("@/lib/codex-oauth/sessions", () => ({
  getValidAccessToken: getValidAccessTokenMock,
}));

describe("codexAuthFetch", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    delete process.env.CODEX_OAUTH_MODEL;
    getValidAccessTokenMock.mockResolvedValue({
      accessToken: "access-token",
      accountId: "account-id",
    });
  });

  it("rewrites responses requests, injects OAuth headers, and transforms the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    const { codexAuthFetch } = await import("@/lib/codex-oauth/codexAuthFetch");

    await codexAuthFetch("https://chatgpt.com/backend-api/responses", {
      method: "POST",
      headers: {
        authorization: "Bearer placeholder",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        store: true,
        stream: false,
        max_output_tokens: 100,
        include: ["file_search_call.results"],
        input: [
          { id: "msg_1", type: "message", role: "user", content: "hello" },
          { id: "ref_1", type: "item_reference" },
          { type: "item_reference" },
          { id: "tool_1", type: "function_call", call_id: "call_abc" },
          {
            id: "output_1",
            type: "function_call_output",
            call_id: "call_abc",
            output: "done",
          },
        ],
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(url).toBe("https://chatgpt.com/backend-api/codex/responses");
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("chatgpt-account-id")).toBe("account-id");
    expect(headers.get("accept")).toBe("text/event-stream");
    expect(headers.get("originator")).toBe("codex_cli_rs");
    expect(body).toMatchObject({
      model: "gpt-5.5",
      store: false,
      stream: true,
      include: ["file_search_call.results", "reasoning.encrypted_content"],
      input: [
        { type: "message", role: "user", content: "hello" },
        { id: "tool_1", type: "function_call", call_id: "call_abc" },
        {
          id: "output_1",
          type: "function_call_output",
          call_id: "call_abc",
          output: "done",
        },
      ],
    });
    expect(body).not.toHaveProperty("max_output_tokens");
  });
});
