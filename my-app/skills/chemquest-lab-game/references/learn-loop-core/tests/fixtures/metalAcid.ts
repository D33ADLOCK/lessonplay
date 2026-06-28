/**
 * Metal + acid → hydrogen gas, as a core `Scenario` fixture. Exercises a `react`
 * transform with a separate emission (gas leaves the station) and an unreactive
 * distractor metal.
 */

import type { Scenario } from "../../src/model/scenario";

const COLORLESS = "#dfe9f5";

export const metalAcidScenario: Scenario = {
  id: "metal-acid-hydrogen",
  title: "Reacting a metal with an acid",
  concept: "Metals & Acids — hydrogen gas",
  grade: 9,
  entities: [
    { id: "dilute-acid", label: "Dilute HCl", color: COLORLESS, kind: "acid" },
    {
      id: "zinc",
      label: "Zinc granules",
      color: "#b9c3cc",
      kind: "metal",
      solubility: "insoluble",
    },
    {
      id: "copper",
      label: "Copper turnings",
      color: "#c9762f",
      kind: "metal",
      solubility: "insoluble",
    },
    {
      id: "zinc-chloride",
      label: "Zinc chloride",
      color: COLORLESS,
      kind: "salt",
      solubility: "soluble",
    },
    { id: "hydrogen", label: "Hydrogen", color: "#eef4ff", kind: "gas" },
  ],
  shelf: ["zinc", "copper"],
  stations: {
    beaker: {
      contents: ["dilute-acid"],
      color: COLORLESS,
      heat: "room",
      phase: "solution",
    },
  },
  rules: [
    {
      id: "zinc-acid",
      on: "pour",
      requires: ["dilute-acid", "zinc"],
      transform: {
        kind: "react",
        consume: ["zinc", "dilute-acid"],
        produce: ["zinc-chloride"],
        emits: ["hydrogen"],
        heat: "warm",
      },
      observation:
        "The zinc fizzes, bubbles of gas stream up, and the beaker warms.",
      explanation:
        "Zinc is more reactive than hydrogen, so it displaces it: " +
        "zinc + dilute hydrochloric acid → zinc chloride + hydrogen gas.",
    },
  ],
  steps: [
    {
      id: "add-zinc",
      predictPrompt: "What will happen when you drop zinc into the dilute acid?",
      options: [
        {
          label: "It fizzes and gives off a gas",
          correct: true,
          feedback:
            "Correct — zinc displaces hydrogen, which bubbles out as a gas.",
        },
        {
          label: "It turns deep blue",
          correct: false,
          feedback:
            "Not quite — that is a copper-salt colour, not a zinc–acid reaction.",
        },
        {
          label: "Nothing happens",
          correct: false,
          feedback:
            "Not quite — zinc is above hydrogen in the reactivity series, so it reacts.",
        },
      ],
      goal: "Get the dilute acid to react with a metal.",
      actionPrompt: "Drop the zinc into the beaker.",
      expect: { type: "pour", reagent: "zinc", target: "beaker" },
      explanation:
        "A metal above hydrogen in the reactivity series displaces hydrogen " +
        "from a dilute acid: Zn + 2HCl → ZnCl₂ + H₂.",
    },
  ],
};
