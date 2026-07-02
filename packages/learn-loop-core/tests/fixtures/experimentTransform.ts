import type {
  ExperimentDefinition,
  ExperimentGame,
} from "../../src/model/experimentLab";

/**
 * A small *transformation* bench used to exercise the two non-classify goal
 * kinds added in Slice 2:
 *
 *   - `predict-outcome` — a metal (zinc) bubbles (gas) on an acid but does
 *     nothing on a base/neutral, so predicting "gas vs nothing" is a real,
 *     evidence-bound call (Activities 2.3/2.4).
 *   - `reach-target-state` — adding base drives an acid to `nature: "neutral"`
 *     via `setState`, so "make it neutral" is a goal to achieve, not just observe
 *     (neutralisation, Activity 2.6).
 *
 * The world is deliberately tiny; the fixtures below assemble whole levels/goals
 * on top of it in the tests.
 */
export const transformBench: ExperimentDefinition = {
  samples: [
    {
      id: "acid-x",
      label: "Beaker A",
      properties: { nature: "acid" },
      categoryId: "acid",
      revealLabel: "dilute acid",
    },
    {
      id: "base-y",
      label: "Beaker B",
      properties: { nature: "base" },
      categoryId: "base",
      revealLabel: "dilute base",
    },
    {
      id: "neutral-z",
      label: "Beaker C",
      properties: { nature: "neutral" },
      categoryId: "neutral",
      revealLabel: "salt water",
    },
  ],
  tools: [
    { id: "litmus", label: "Litmus strip" },
    { id: "zinc", label: "Zinc granule" },
    { id: "add-base", label: "Add base" },
  ],
  ruleSet: {
    rules: [
      {
        toolId: "litmus",
        when: { nature: "acid" },
        effect: {
          observationId: "litmus-red",
          observation: "The strip flushes red.",
          visual: "color-change",
          readout: { kind: "color", value: "red" },
        },
      },
      {
        toolId: "litmus",
        when: { nature: "base" },
        effect: {
          observationId: "litmus-blue",
          observation: "The strip turns blue.",
          visual: "color-change",
          readout: { kind: "color", value: "blue" },
        },
      },
      {
        toolId: "litmus",
        when: { nature: "neutral" },
        effect: {
          observationId: "litmus-none",
          observation: "The strip barely changes.",
          visual: "none",
        },
      },
      // Zinc bubbles hydrogen on an acid only.
      {
        toolId: "zinc",
        when: { nature: "acid" },
        effect: {
          observationId: "zinc-gas",
          observation: "Bubbles rise off the metal.",
          visual: "gas",
          gasLabel: "H₂",
        },
      },
      // Adding base neutralises an acid — the persistent state change.
      {
        toolId: "add-base",
        when: { nature: "acid" },
        effect: {
          observationId: "neutralise",
          observation: "The sharp colour fades to a flat middle tint.",
          visual: "color-change",
          readout: { kind: "color", value: "green" },
          setState: { nature: "neutral" },
        },
      },
    ],
    defaultEffect: {
      observationId: "no-change",
      observation: "Nothing observable happens.",
      visual: "none",
    },
  },
};

/** Categories the samples reference, so structural validation passes. */
export const transformCategories: ExperimentGame["categories"] = [
  { id: "acid", label: "Acid" },
  { id: "base", label: "Base" },
  { id: "neutral", label: "Neutral" },
];
