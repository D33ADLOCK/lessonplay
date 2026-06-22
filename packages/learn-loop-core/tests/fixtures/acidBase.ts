/**
 * Acid + base neutralisation, as a core `Scenario` fixture (a chemistry skin's
 * data, used here to exercise the `react` transform, a colour + heat change, and
 * an in-family distractor pour). De-chemistry'd field name: `entities`.
 */

import type { Scenario } from "../../src/model/scenario";

const COLORLESS = "#dfe9f5";
const PINK = "#e8508f";

export const acidBaseScenario: Scenario = {
  id: "acid-base-neutralisation",
  title: "Neutralising an acid with a base",
  concept: "Acids, Bases & Salts — neutralisation",
  grade: 9,
  entities: [
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
