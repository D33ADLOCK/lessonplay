import { convertToModelMessages, type UIMessage } from "ai";
import { describe, expect, it } from "vitest";

describe("AI SDK attachment file parts", () => {
  it("converts PDF and image UI file parts into model file parts", () => {
    const messages: UIMessage[] = [
      {
        id: "msg_1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "application/pdf",
            filename: "chapter.pdf",
            url: "https://example.com/chapter.pdf?signature=abc",
          },
          {
            type: "file",
            mediaType: "image/png",
            filename: "diagram.png",
            url: "https://example.com/diagram.png?signature=abc",
          },
          {
            type: "text",
            text: "Use these attachments.",
          },
        ],
      },
    ];

    expect(convertToModelMessages(messages)).toEqual([
      {
        role: "user",
        content: [
          {
            type: "file",
            mediaType: "application/pdf",
            filename: "chapter.pdf",
            data: "https://example.com/chapter.pdf?signature=abc",
          },
          {
            type: "file",
            mediaType: "image/png",
            filename: "diagram.png",
            data: "https://example.com/diagram.png?signature=abc",
          },
          {
            type: "text",
            text: "Use these attachments.",
          },
        ],
      },
    ]);
  });
});
