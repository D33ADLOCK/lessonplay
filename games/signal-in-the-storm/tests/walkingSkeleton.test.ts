import { describe, expect, it, vi } from "vitest";
import { GameBridge } from "../src/bridge/GameBridge";
import { introScene } from "../src/content/intro";
import { torchLevel } from "../src/content/levels";
import {
  advanceStory,
  applyConsequence,
  createStoryState,
  skipStory,
} from "../src/domain/story";
import { createRepairAttemptEvents } from "../src/domain/repairAttempt";

describe("walking skeleton", () => {
  it("flows from a typed story beat through repair events to a world consequence", () => {
    const bridge = new GameBridge();
    const commandListener = vi.fn();
    bridge.onCommand(commandListener);

    let story = createStoryState(introScene);
    for (const _beat of introScene.beats) {
      story = advanceStory(story, introScene);
    }
    bridge.send({ type: "load-level", level: torchLevel });

    const events = createRepairAttemptEvents(torchLevel);
    const consequence = events.find(
      (event) => event.type === "consequence-triggered",
    );
    if (consequence?.type === "consequence-triggered") {
      story = applyConsequence(story, consequence.consequence.description);
    }

    expect(commandListener).toHaveBeenCalledWith({
      type: "load-level",
      level: torchLevel,
    });
    expect(events.map((event) => event.type)).toEqual([
      "attempt-evaluated",
      "consequence-triggered",
      "level-completed",
    ]);
    expect(story).toMatchObject({
      mode: "consequence",
      consequenceText: torchLevel.consequence.description,
    });
  });

  it("follows typed beat references and can skip directly to repair", () => {
    let story = createStoryState(introScene);
    story = advanceStory(story, introScene);
    expect(introScene.beats[story.beatIndex]?.id).toBe("mira-checks-in");
    expect(skipStory(story).mode).toBe("repair");
  });

  it("delivers commands sent before the Phaser adapter is ready", () => {
    const bridge = new GameBridge();
    const commandListener = vi.fn();

    bridge.send({ type: "load-level", level: torchLevel });
    bridge.onCommand(commandListener);

    expect(commandListener).toHaveBeenCalledOnce();
    expect(commandListener).toHaveBeenCalledWith({
      type: "load-level",
      level: torchLevel,
    });
  });

  it("delivers events emitted before the React shell is ready", () => {
    const bridge = new GameBridge();
    const eventListener = vi.fn();

    bridge.emit({ type: "board-ready", levelId: torchLevel.id });
    bridge.onEvent(eventListener);

    expect(eventListener).toHaveBeenCalledWith({
      type: "board-ready",
      levelId: torchLevel.id,
    });
  });
});
