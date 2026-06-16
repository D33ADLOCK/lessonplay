/**
 * Metal + acid → hydrogen gas, authored purely as data on the v2 workspace
 * schema. This is the forcing experiment: it exercises everything the v1 engine
 * could not — a real product, a released gas modelled as a separate emission,
 * and a lasting heat change — with zero engine changes from acid–base.
 *
 * NCERT Class 9 — Metals & Non-metals / Acids, Bases & Salts. A beaker holds
 * dilute hydrochloric acid. Dropping in zinc granules makes the mixture fizz:
 * zinc + acid are consumed, zinc chloride is produced in solution, hydrogen gas
 * bubbles out of the liquid, and the beaker warms. Copper is a distractor — it
 * is below hydrogen in the reactivity series and does not react with dilute HCl.
 */

import type { Experiment } from "../contracts/experiment";

const COLORLESS = "#dfe9f5";

export const metalAcidExperiment: Experiment = {
  id: "metal-acid-hydrogen",
  title: "Reacting a metal with an acid",
  concept: "Metals & Acids — hydrogen gas",
  grade: 9,
  chemicals: [
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
        "zinc + dilute hydrochloric acid → zinc chloride + hydrogen gas. " +
        "The gas leaves the liquid as bubbles; a burning splint gives a " +
        "squeaky pop, confirming hydrogen.",
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
      actionPrompt: "Drop the zinc into the beaker.",
      expect: { type: "pour", reagent: "zinc", target: "beaker" },
      explanation:
        "A metal above hydrogen in the reactivity series displaces hydrogen " +
        "from a dilute acid: Zn + 2HCl → ZnCl₂ + H₂. The hydrogen leaves as " +
        "bubbles and the reaction warms the beaker.",
    },
  ],
};
