import { describe, expect, it } from "vitest";

import {
  createLearnLoopStationPresentation,
  createLearnLoopTemplatePresentation,
} from "../src";
import type { StationVisualKind } from "@learn-loop/core";

describe("Learn Loop template presentation adapters", () => {
  it("converts guided lab station visuals into template presentation", () => {
    const presentation = createLearnLoopTemplatePresentation({
      stationVisuals: [
        {
          stationId: "testTube",
          kind: "test-tube",
          label: "Test tube",
        },
        {
          stationId: "residue",
          kind: "filter",
          label: "Residue",
        },
        {
          stationId: "filtrate",
          kind: "evaporating-dish",
          label: "Salt water",
        },
      ],
    });

    expect(presentation).toEqual({
      stations: [
        {
          stationId: "testTube",
          label: "Test tube",
          kind: "tube",
          role: "source",
        },
        {
          stationId: "residue",
          label: "Residue",
          kind: "filter",
          role: "process",
        },
        {
          stationId: "filtrate",
          label: "Salt water",
          kind: "dish",
          role: "output",
        },
      ],
    });
  });

  it("maps legacy guided apparatus kinds into approved template kinds", () => {
    expect(
      [
        "receiver",
        "distillation",
        "paper",
        "condenser",
        "burner",
        "magnet",
      ].map((kind, index) =>
        createLearnLoopStationPresentation(
          {
            stationId: `station-${kind}`,
            kind: kind as StationVisualKind,
          },
          index,
          6,
        ),
      ),
    ).toEqual([
      expect.objectContaining({ kind: "jar", role: "source" }),
      expect.objectContaining({ kind: "flask", role: "process" }),
      expect.objectContaining({ kind: "tray", role: "process" }),
      expect.objectContaining({ kind: "tube", role: "process" }),
      expect.objectContaining({ kind: "tray", role: "process" }),
      expect.objectContaining({ kind: "tray", role: "output" }),
    ]);
  });
});
