import { describe, expect, it } from "vitest";

import { loadContent } from "../src/platform/content/ContentLoader";
import { LEVELS, validateLevel } from "../src/game/content/LevelContent";
import { createSurfaceResolver } from "../src/game/course/Course";
import { classifyOutcome, predictionAccuracy } from "../src/game/outcome/Outcome";
import { simulateLaunch } from "../src/game/sim/LanternSim";
import { scoreResult } from "../src/platform/progression/Progression";
import { createGameSaveService, DEFAULT_SAVE } from "../src/game/save/GameSave";

describe("deterministic launch simulation", () => {
  it("repeats the same result for the same input", () => {
    const level = LEVELS[0];
    const route = level.routes[0];
    const course = { ...level.course, segments: route.segments };
    const resolve = createSurfaceResolver(course);
    const first = simulateLaunch(course.start, 0.62, resolve);
    const second = simulateLaunch(course.start, 0.62, resolve);
    expect(first.position).toBe(second.position);
    expect(first.elapsed).toBe(second.elapsed);
  });

  it("travels farther on lower-friction ice than grass or wood", () => {
    const stops = ["grass", "wood", "ice"].map((surfaceId) =>
      simulateLaunch(0, 0.5, () => ({
        id: surfaceId,
        friction: surfaceId === "grass" ? 0.6 : surfaceId === "wood" ? 0.9 : 0.15,
      })).position,
    );
    expect(stops[2]).toBeGreaterThan(stops[0]);
    expect(stops[0]).toBeGreaterThan(stops[1]);
  });
});

describe("prediction and outcome", () => {
  const target = { center: 50, radius: 8, perfectRadius: 2 };

  it("classifies all outcome boundaries", () => {
    expect(classifyOutcome(50, target, 100).quality).toBe("perfect");
    expect(classifyOutcome(56, target, 100).quality).toBe("success");
    expect(classifyOutcome(62, target, 100).quality).toBe("nearMiss");
    expect(classifyOutcome(20, target, 100).quality).toBe("undershoot");
    expect(classifyOutcome(90, target, 100).quality).toBe("overshoot");
    expect(classifyOutcome(110, target, 100).quality).toBe("crash");
  });

  it("scores closer predictions more highly", () => {
    expect(predictionAccuracy(49, 50, 100)).toBeGreaterThan(
      predictionAccuracy(20, 50, 100),
    );
  });
});

describe("content, scoring, and persistence", () => {
  it("loads all authored levels through validation", () => {
    LEVELS.forEach((level) => expect(loadContent(level, validateLevel, level.id)).toBe(level));
  });

  it("rejects invalid geometry and thresholds with actionable paths", () => {
    const invalid = {
      ...LEVELS[0],
      course: { ...LEVELS[0].course, target: { center: 50, radius: 2, perfectRadius: 5 } },
      scoreThresholds: [700, 600, 900],
    };
    expect(() => loadContent(invalid, validateLevel, "broken-level")).toThrow(
      /course\.target\.perfectRadius/,
    );
  });

  it("rewards accuracy, mastery, and efficient completion", () => {
    const weak = scoreResult(
      {
        levelId: "x",
        predictionAccuracy: 0.2,
        deliveryAccuracy: 0.4,
        optionalGoalMet: false,
        attempts: 4,
      },
      [350, 650, 850],
    );
    const strong = scoreResult(
      {
        levelId: "x",
        predictionAccuracy: 0.95,
        deliveryAccuracy: 1,
        optionalGoalMet: true,
        attempts: 1,
      },
      [350, 650, 850],
    );
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.stars).toBe(3);
  });

  it("migrates, persists, resets, and recovers corrupt saves", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    };
    const service = createGameSaveService(storage);
    store.set(
      "lantern-run-save",
      JSON.stringify({
        version: 1,
        data: { ...DEFAULT_SAVE, settings: undefined, completedLevelIds: ["first-light"] },
      }),
    );
    expect(service.load().completedLevelIds).toEqual(["first-light"]);
    service.save({ ...DEFAULT_SAVE, completedLevelIds: ["first-light"] });
    expect(service.load().completedLevelIds).toEqual(["first-light"]);
    store.set("lantern-run-save", "{bad");
    expect(service.load()).toEqual(DEFAULT_SAVE);
    expect(service.reset()).toEqual(DEFAULT_SAVE);
  });
});
