import { describe, it, expect } from "vitest";

import { GameplayEventStream } from "../src/emotional/events/GameplayEvent";
import { celebrationFor } from "../src/emotional/celebration/CelebrationIntensity";
import { SaveService } from "../src/platform/save/SaveService";
import { SemanticInput } from "../src/platform/input/SemanticInput";
import { SURFACES } from "../src/game/sim/SurfaceModel";
import { ReactionDirector } from "../src/emotional/reactions/ReactionDirector";
import { WorldTransformer } from "../src/emotional/world/WorldTransformer";

/**
 * Slice 1 smoke tests: prove the reusable contracts compose and are pure
 * (no Phaser, no DOM). Deeper per-system suites land with their slices.
 */
describe("walking skeleton contracts", () => {
  it("event stream delivers typed events to subscribers", () => {
    const stream = new GameplayEventStream();
    const seen: string[] = [];
    stream.on("launch", (e) => seen.push(`${e.type}:${e.force}`));
    stream.on("*", (e) => seen.push(`any:${e.type}`));
    stream.emit({ type: "launch", force: 0.5, from: 0 });
    expect(seen).toEqual(["launch:0.5", "any:launch"]);
  });

  it("celebration intensity scales with outcome quality", () => {
    expect(celebrationFor("perfect")).toBe("grand");
    expect(celebrationFor("success")).toBe("large");
    expect(celebrationFor("crash")).toBe("none");
  });

  it("save service round-trips and recovers from corruption", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const save = new SaveService({
      key: "lr-test",
      version: 1,
      defaults: { coins: 0 },
      storage,
    });
    save.save({ coins: 3 });
    expect(save.load()).toEqual({ coins: 3 });
    store.set("lr-test", "not json");
    expect(save.load()).toEqual({ coins: 0 }); // graceful recovery
  });

  it("semantic input routes actions to listeners", () => {
    const input = new SemanticInput();
    let got = 0;
    input.on("launch", () => (got += 1));
    input.emit({ action: "launch", source: "keyboard" });
    expect(got).toBe(1);
  });

  it("maps touch, pointer, and keyboard into the same semantic launch", () => {
    const input = new SemanticInput();
    const sources: string[] = [];
    input.on("launch", (event) => sources.push(event.source));
    (["touch", "pointer", "keyboard"] as const).forEach((source) =>
      input.emit({ action: "launch", source }),
    );
    expect(sources).toEqual(["touch", "pointer", "keyboard"]);
  });

  it("drives reactions and world changes from game-neutral events", () => {
    const events = new GameplayEventStream();
    const reactions = new ReactionDirector();
    const world = new WorldTransformer();
    reactions.attach(events);
    world.attach(events, () => [{ id: "area-one", kind: "light" }]);
    events.emit({ type: "launch", force: 0.6, from: 0 });
    expect(reactions.reaction.kind).toBe("hope");
    events.emit({
      type: "success",
      position: 0.7,
      quality: "perfect",
      deliveryAccuracy: 1,
    });
    expect(reactions.reaction.kind).toBe("celebration");
    expect(world.restored).toEqual(["area-one"]);
  });

  it("defines three distinct surfaces with different friction", () => {
    const frictions = Object.values(SURFACES).map((s) => s.friction);
    expect(new Set(frictions).size).toBe(3);
  });
});
