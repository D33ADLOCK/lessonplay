/**
 * Distilling acetone from water, as a core `Scenario` fixture. The forcing case
 * for the `distil` transform: a heat-only, multi-receiver flow where first-match-
 * wins sends the lower-boiling acetone over first, then the water.
 */

import type { Scenario } from "../../src/model/scenario";

const MIXTURE = "#cfd8dc";
const ACETONE = "#e9eef3";
const WATER_BLUE = "#bcd7ef";
const EMPTY = "#dfe9f5";

export const distillationScenario: Scenario = {
  id: "distillation-acetone-water",
  title: "Distilling acetone from water",
  concept: "Distillation — recovering both liquids",
  grade: 9,
  entities: [
    {
      id: "acetone",
      label: "Acetone",
      color: ACETONE,
      kind: "neutral",
      solubility: "soluble",
    },
    {
      id: "water",
      label: "Water",
      color: WATER_BLUE,
      kind: "neutral",
      solubility: "soluble",
    },
  ],
  // No reagent tray: distillation is a heat-only scenario.
  shelf: [],
  stations: {
    flask: {
      contents: ["acetone", "water"],
      color: MIXTURE,
      heat: "room",
      phase: "solution",
    },
    acetoneJar: { contents: [], color: EMPTY, heat: "room", phase: "empty" },
    waterJar: { contents: [], color: EMPTY, heat: "room", phase: "empty" },
  },
  rules: [
    {
      id: "distil-acetone",
      on: "heat",
      requires: ["acetone", "water"],
      transform: {
        kind: "distil",
        volatile: ["acetone"],
        collectTo: "acetoneJar",
        newColor: WATER_BLUE,
        heat: "hot",
      },
      observation:
        "The acetone boils off first, travels through the condenser, cools, " +
        "and drips into the first receiver as a clear liquid. The water stays " +
        "in the flask.",
      explanation:
        "Acetone boils at about 56 °C, far below water's 100 °C. Heating the " +
        "mixture vaporises the acetone well before the water, so it is the " +
        "first to come over and condense — recovered pure, not lost.",
    },
    {
      id: "distil-water",
      on: "heat",
      requires: ["water"],
      transform: {
        kind: "distil",
        volatile: ["water"],
        collectTo: "waterJar",
        newColor: EMPTY,
        heat: "hot",
      },
      observation:
        "With the acetone gone, keep heating and the water now boils over, " +
        "condenses, and collects in the second receiver. The flask is left empty.",
      explanation:
        "Once the acetone has all distilled away, only water remains. Heating " +
        "past 100 °C boils it over too, so the two liquids end up cleanly " +
        "separated in two receivers.",
    },
  ],
  steps: [
    {
      id: "distil-acetone",
      predictPrompt:
        "You heat the acetone–water mixture. Acetone boils at 56 °C, water at " +
        "100 °C. Which liquid comes over into the receiver first?",
      options: [
        {
          label: "Acetone — it has the lower boiling point",
          correct: true,
          feedback:
            "Correct — the lower-boiling liquid vaporises first, so acetone " +
            "distils over before the water.",
        },
        {
          label: "Water — there is more of it",
          correct: false,
          feedback:
            "Not quite — what matters is the boiling point, not the amount.",
        },
        {
          label: "Both come over together, still mixed",
          correct: false,
          feedback:
            "Not quite — the 44 °C gap in boiling points lets the acetone " +
            "vaporise well before the water does.",
        },
      ],
      goal: "Separate the acetone and water — start the distillation.",
      hints: {
        pour: "There's nothing to add — distillation works by heating, not pouring.",
        filter:
          "Filtering can't separate two liquids that are fully mixed together. " +
          "You need a boiling-point difference — heat it.",
      },
      actionPrompt: "Heat the flask to boil off the acetone.",
      expect: { type: "heat", target: "flask" },
      explanation:
        "Acetone's lower boiling point sends it over the condenser first, " +
        "where it cools back to a pure liquid in the receiver.",
    },
    {
      id: "distil-water",
      predictPrompt:
        "The acetone is collected and only water is left in the flask. How do " +
        "you recover the water too?",
      options: [
        {
          label: "Keep heating — boil the water over as well",
          correct: true,
          feedback:
            "Correct — with the acetone gone, more heat boils the water over " +
            "into the second receiver.",
        },
        {
          label: "Let it cool down",
          correct: false,
          feedback:
            "Not quite — cooling won't move the water out of the flask.",
        },
        {
          label: "Filter the flask",
          correct: false,
          feedback:
            "Not quite — there's nothing solid to catch. The water leaves only " +
            "as vapour when heated.",
        },
      ],
      goal: "Now recover the water that stayed in the flask.",
      hints: {
        pour: "Adding anything would just re-mix the flask. Keep heating instead.",
        filter:
          "Nothing to filter — the water leaves only by boiling over the " +
          "condenser. Heat it.",
      },
      actionPrompt: "Heat the flask again to distil the water over.",
      expect: { type: "heat", target: "flask" },
      explanation:
        "Heating past 100 °C boils the remaining water over and condenses it " +
        "in the second receiver — both liquids are now recovered, pure and apart.",
    },
  ],
};
