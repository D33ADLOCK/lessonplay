/**
 * The acid + base neutralisation experiment, authored purely as data on the v2
 * workspace schema.
 *
 * NCERT Class 9 — Acids, Bases & Salts. A beaker holds dilute acid with
 * phenolphthalein (colourless). Adding the base neutralises the acid: the base
 * and acid are consumed, salt + water are produced, the indicator turns the
 * solution pink, and the beaker warms (the reaction is exothermic). Distilled
 * water is a distractor — pouring it produces no visible change.
 */

import type { Experiment } from "../contracts/experiment";

const COLORLESS = "#dfe9f5";
const PINK = "#e8508f";

export const acidBaseExperiment: Experiment = {
  id: "acid-base-neutralisation",
  title: "Neutralising an acid with a base",
  concept: "Acids, Bases & Salts — neutralisation",
  grade: 9,
  chemicals: [
    { id: "dilute-acid", label: "Dilute HCl", color: COLORLESS, kind: "acid" },
    {
      id: "phenolphthalein",
      label: "Phenolphthalein",
      color: COLORLESS,
      kind: "indicator",
    },
    {
      id: "sodium-hydroxide",
      label: "Sodium hydroxide",
      color: "#d8f0d8",
      kind: "base",
    },
    {
      id: "distilled-water",
      label: "Distilled water",
      color: "#cfe6f5",
      kind: "neutral",
    },
    { id: "sodium-chloride", label: "Salt (NaCl)", color: COLORLESS, kind: "salt" },
    { id: "water", label: "Water", color: COLORLESS, kind: "neutral" },
  ],
  shelf: ["sodium-hydroxide", "distilled-water"],
  stations: {
    beaker: {
      contents: ["dilute-acid", "phenolphthalein"],
      color: COLORLESS,
      heat: "room",
      phase: "solution",
    },
  },
  rules: [
    {
      id: "neutralisation",
      on: "pour",
      requires: ["dilute-acid", "phenolphthalein", "sodium-hydroxide"],
      transform: {
        kind: "react",
        consume: ["dilute-acid", "sodium-hydroxide"],
        produce: ["sodium-chloride", "water"],
        newColor: PINK,
        heat: "warm",
      },
      observation: "The liquid turns pink and the beaker feels warmer.",
      explanation:
        "The base neutralised the acid to form a salt and water. " +
        "Phenolphthalein is pink in a basic/neutral solution, and the " +
        "reaction releases heat, so it is exothermic.",
    },
  ],
  steps: [
    {
      id: "add-base",
      predictPrompt: "What will happen when you pour the base into the acid?",
      options: [
        {
          label: "It turns pink and warms up",
          correct: true,
          feedback:
            "Correct — neutralisation turns the indicator pink and releases heat.",
        },
        {
          label: "It stays colourless and cools down",
          correct: false,
          feedback:
            "Not quite — watch the colour and the thermometer when you pour.",
        },
        {
          label: "Nothing happens",
          correct: false,
          feedback:
            "Not quite — a base added to an acid does react. Pour it and see.",
        },
      ],
      goal: "Neutralise the acid in the beaker.",
      actionPrompt: "Pour the base into the beaker.",
      expect: { type: "pour", reagent: "sodium-hydroxide", target: "beaker" },
      explanation:
        "Acid + base → salt + water. The phenolphthalein turns the " +
        "neutralised solution pink, and the temperature rises because " +
        "neutralisation is exothermic.",
    },
  ],
};
