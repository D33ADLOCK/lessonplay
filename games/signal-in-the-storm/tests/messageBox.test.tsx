import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { introScene } from "../src/content/intro";
import { MessageBox } from "../src/ui/MessageBox";
import { Portrait } from "../src/ui/Portrait";

describe("MessageBox", () => {
  it("shows the full line before advancing", async () => {
    const onAdvance = vi.fn();
    const user = userEvent.setup();
    const beat = introScene.beats[1];
    if (!beat) throw new Error("Missing Mira introduction beat.");

    render(
      <MessageBox
        beat={beat}
        onAdvance={onAdvance}
        onSkip={vi.fn()}
        textSpeedMs={10_000}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show full text" }));
    expect(screen.getByText(beat.text)).toBeVisible();
    expect(onAdvance).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onAdvance).toHaveBeenCalledOnce();
  });

  it("supports keyboard completion and exposes portrait expression semantics", () => {
    const beat = introScene.beats[2];
    if (!beat) throw new Error("Missing Kabir introduction beat.");
    const onAdvance = vi.fn();

    render(
      <MessageBox
        beat={beat}
        onAdvance={onAdvance}
        onSkip={vi.fn()}
        textSpeedMs={10_000}
      />,
    );

    const dialogue = screen.getByLabelText("Kabir dialogue");
    fireEvent.keyDown(dialogue, { key: "Enter" });
    expect(screen.getByRole("img", { name: "Kabir, thinking" })).toBeVisible();
    fireEvent.keyDown(dialogue, { key: " " });
    expect(onAdvance).toHaveBeenCalledOnce();
  });

  it("renders the radio variant and skip control", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const beat = introScene.beats[3];
    if (!beat) throw new Error("Missing Ms. Rao radio beat.");

    render(
      <MessageBox
        beat={beat}
        onAdvance={vi.fn()}
        onSkip={onSkip}
        textSpeedMs={10_000}
      />,
    );

    expect(screen.getByLabelText("Ms. Rao · Radio dialogue")).toHaveClass("radio");
    expect(
      screen.getByRole("img", { name: "Ms. Rao speaking over the field radio" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("supports all five reusable expressions for both friends", () => {
    const expressions = [
      "neutral",
      "worried",
      "thinking",
      "excited",
      "relieved",
    ] as const;

    for (const expression of expressions) {
      const { unmount } = render(
        <>
          <Portrait speaker="mira" expression={expression} />
          <Portrait speaker="kabir" expression={expression} />
        </>,
      );
      expect(screen.getByRole("img", { name: `Mira, ${expression}` })).toBeVisible();
      expect(screen.getByRole("img", { name: `Kabir, ${expression}` })).toBeVisible();
      unmount();
    }
  });
});
