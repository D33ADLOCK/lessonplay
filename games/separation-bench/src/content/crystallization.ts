/**
 * Crystallisation of copper sulfate, authored purely as data on the workspace
 * schema. It reuses the implemented `react` (dissolve) and `evaporate` (boil
 * down) transforms — no engine change — but reframes them around the chapter's
 * crystallisation idea: recovering a dissolved solid back as well-formed crystals.
 *
 * NCERT Class 9 / Grade 9 — "Exploring Mixtures and their Separation" §5.3.1
 * (Activity 5.3). Copper sulfate is stirred into water to make a blue solution.
 * Gently heating that solution drives the water off until it is saturated; the
 * copper sulfate can no longer stay dissolved and separates out as blue crystals.
 *
 * Solubility drives the story: copper sulfate is highly soluble in warm water,
 * so it dissolves; as the water evaporates there is too little solvent left to
 * hold it, so it crystallises out — the same principle as recovering salt from
 * seawater, made vivid by copper sulfate's deep blue.
 */

import type { Scenario } from "@learn-loop/core";

const CRYSTAL_BLUE = "#2f6fc0"; // deep blue copper sulfate crystals
const SOLUTION_BLUE = "#7aa9dd"; // dissolved, lighter blue solution

export const crystallizationScenario: Scenario = {
  id: "crystallization-copper-sulfate",
  title: "Crystallising copper sulfate",
  concept: "Crystallisation — recovering a dissolved solid",
  grade: 9,
  entities: [
    {
      id: "copper-sulfate",
      label: "Copper sulfate",
      color: CRYSTAL_BLUE,
      kind: "salt",
      solubility: "soluble",
    },
    {
      id: "water",
      label: "Water",
      color: "#bcd7ef",
      kind: "neutral",
      solubility: "soluble",
    },
    {
      id: "water-vapour",
      label: "Water vapour",
      color: "#eef4ff",
      kind: "gas",
    },
  ],
  shelf: ["water"],
  stations: {
    dish: {
      contents: ["copper-sulfate"],
      color: CRYSTAL_BLUE,
      heat: "room",
      phase: "solid",
    },
  },
  rules: [
    {
      id: "dissolve",
      on: "pour",
      requires: ["copper-sulfate", "water"],
      transform: {
        kind: "react",
        consume: [],
        produce: [],
        newColor: SOLUTION_BLUE,
      },
      observation:
        "The copper sulfate dissolves completely into a clear blue solution.",
      explanation:
        "Copper sulfate is very soluble in water, so the solid disappears into " +
        "solution — the blue colour spreads evenly through the liquid. Nothing " +
        "is lost; the copper sulfate is just dispersed among the water.",
    },
    {
      id: "crystallise",
      on: "heat",
      requires: ["copper-sulfate", "water"],
      transform: {
        kind: "evaporate",
        leaves: ["copper-sulfate"],
        emits: ["water-vapour"],
        newColor: CRYSTAL_BLUE,
        heat: "hot",
      },
      observation:
        "As the water boils away the solution turns deep blue and well-shaped " +
        "blue crystals of copper sulfate grow in the dish.",
      explanation:
        "Heating drives the water off as vapour. With less and less water to " +
        "dissolve it, the solution becomes saturated and the copper sulfate can " +
        "no longer stay dissolved — it separates out as solid crystals. Cooling " +
        "the saturated solution slowly grows the largest, purest crystals.",
    },
  ],
  steps: [
    {
      id: "dissolve",
      predictPrompt:
        "You stir solid copper sulfate into water. What happens to it?",
      options: [
        {
          label: "It dissolves into a clear blue solution",
          correct: true,
          feedback:
            "Correct — copper sulfate is very soluble, so it disappears into a " +
            "blue solution.",
        },
        {
          label: "It sinks and stays as solid grains",
          correct: false,
          feedback:
            "Not quite — unlike sand, copper sulfate dissolves readily in water.",
        },
        {
          label: "It floats on top of the water",
          correct: false,
          feedback:
            "Not quite — it doesn't float; it dissolves and spreads through the " +
            "water.",
        },
      ],
      goal: "Get the copper sulfate into solution first.",
      hints: {
        heat:
          "Heating the dry solid won't make crystals. Dissolve it in water " +
          "first so it can recrystallise later.",
      },
      actionPrompt: "Pour the water onto the copper sulfate.",
      expect: { type: "pour", reagent: "water", target: "dish" },
      explanation:
        "Copper sulfate dissolves easily in water. Now it is in solution — " +
        "ready to be recovered as crystals.",
    },
    {
      id: "crystallise",
      predictPrompt:
        "You have a blue copper sulfate solution. How do you get the copper " +
        "sulfate back as solid crystals?",
      options: [
        {
          label: "Heat it to evaporate the water",
          correct: true,
          feedback:
            "Correct — boiling the water off saturates the solution and the " +
            "copper sulfate crystallises out.",
        },
        {
          label: "Add even more water",
          correct: false,
          feedback:
            "Not quite — more water keeps it dissolved. You need to remove " +
            "water, not add it.",
        },
        {
          label: "Filter the solution",
          correct: false,
          feedback:
            "Not quite — the copper sulfate is dissolved, so it would pass " +
            "straight through the filter paper.",
        },
      ],
      goal: "Now recover the dissolved copper sulfate as crystals.",
      hints: {
        pour:
          "Adding more water just keeps it dissolved — you need to drive water " +
          "off, not add it.",
        filter:
          "The copper sulfate is dissolved, so filtering can't catch it. Heat " +
          "the solution instead.",
      },
      actionPrompt: "Heat the solution to crystallise the copper sulfate.",
      expect: { type: "heat", target: "dish" },
      explanation:
        "As the water evaporates the solution becomes saturated and the copper " +
        "sulfate separates out as deep-blue crystals — recovered as a pure solid.",
    },
  ],
};
