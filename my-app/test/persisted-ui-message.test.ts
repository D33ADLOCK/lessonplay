import { describe, expect, it } from "vitest";

import { readPersistedUIMessage } from "@/lib/agent/persisted-ui-message";

describe("readPersistedUIMessage", () => {
  it("preserves a valid UI message id", () => {
    expect(
      readPersistedUIMessage(
        {
          id: "msg-existing",
          role: "assistant",
          parts: [{ type: "text", text: "Done" }],
        },
        "database-id",
      ),
    ).toMatchObject({ id: "msg-existing" });
  });

  it("uses the database row id when the persisted UI id is blank", () => {
    expect(
      readPersistedUIMessage(
        {
          id: "",
          role: "assistant",
          parts: [{ type: "text", text: "Done" }],
        },
        "database-id",
      ),
    ).toMatchObject({ id: "database-id" });
  });

  it("rejects content that is not a persisted UI message", () => {
    expect(readPersistedUIMessage("legacy text", "database-id")).toBeNull();
    expect(
      readPersistedUIMessage(
        { id: "broken", role: "assistant", parts: "not-an-array" },
        "database-id",
      ),
    ).toBeNull();
  });
});
