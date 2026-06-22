/**
 * Separating a salt + sand mixture, authored purely as data on the workspace
 * schema. This is the forcing experiment for the separation toolkit: it is the
 * first to use more than one apparatus and to run the `split` (filtration) and
 * `evaporate` transforms — with no engine changes beyond those two branches.
 *
 * NCERT Class 9 — "Is Matter Around Us Pure" / separation of mixtures. A beaker
 * holds a salt-and-sand mixture. Stirring it into water dissolves the salt but
 * not the sand. Filtering routes the insoluble sand onto the filter paper (the
 * residue) while the clear salt solution passes through (the filtrate). Heating
 * the filtrate boils the water off as vapour, leaving the salt as crystals.
 *
 * Routing is driven entirely by each chemical's `solubility`: sand is insoluble,
 * salt is soluble, water is the solvent — the engine never hard-codes ids.
 */

import type { Scenario } from "@learn-loop/core";

const SANDY = "#cdb892";
const SOLUTION = "#d9d2c0";
const SALT_WHITE = "#e8eaed";
const WATER_BLUE = "#bcd7ef";
const EMPTY = "#dfe9f5";

export const saltSandScenario: Scenario = {
  id: "salt-sand-separation",
  title: "Separating salt from sand",
  concept: "Separation of Mixtures — filtration & evaporation",
  grade: 9,
  entities: [
    {
      id: "salt",
      label: "Salt",
      color: SALT_WHITE,
      kind: "salt",
      solubility: "soluble",
    },
    {
      id: "sand",
      label: "Sand",
      color: SANDY,
      kind: "neutral",
      solubility: "insoluble",
    },
    {
      id: "water",
      label: "Water",
      color: WATER_BLUE,
      kind: "neutral",
      solubility: "soluble",
    },
    { id: "water-vapour", label: "Water vapour", color: "#eef4ff", kind: "gas" },
  ],
  shelf: ["water"],
  stations: {
    mixture: {
      contents: ["salt", "sand"],
      color: SANDY,
      heat: "room",
      phase: "solid",
    },
    filtrate: { contents: [], color: EMPTY, heat: "room", phase: "empty" },
    residue: { contents: [], color: EMPTY, heat: "room", phase: "empty" },
  },
  rules: [
    {
      id: "dissolve",
      on: "pour",
      requires: ["salt", "sand"],
      transform: {
        kind: "react",
        consume: [],
        produce: [],
        newColor: SOLUTION,
      },
      observation:
        "The salt dissolves into a cloudy solution; the sand stays as " +
        "undissolved grains.",
      explanation:
        "Salt is soluble in water, so it disappears into solution. Sand is " +
        "insoluble, so it does not dissolve — it just sits as solid grains. " +
        "That difference in solubility is what lets us separate them.",
    },
    {
      id: "filter",
      on: "filter",
      at: "source",
      requires: ["sand"],
      transform: { kind: "split", solidTo: "residue", liquidTo: "filtrate" },
      observation:
        "The sand stays behind on the filter paper while the clear salt " +
        "solution drips through into the second beaker.",
      explanation:
        "Filtration separates an insoluble solid from a liquid. The sand " +
        "grains are too large to pass through the filter paper (they become " +
        "the residue), but the dissolved salt and water flow through as the " +
        "filtrate.",
    },
    {
      id: "evaporate",
      on: "heat",
      requires: ["salt", "water"],
      transform: {
        kind: "evaporate",
        leaves: ["salt"],
        emits: ["water-vapour"],
        newColor: SALT_WHITE,
        heat: "hot",
      },
      observation:
        "The water boils away as steam, leaving white salt crystals behind " +
        "in the dish.",
      explanation:
        "Evaporation recovers a dissolved solid from its solution. Heating " +
        "drives the water off as vapour, but the salt has a far higher boiling " +
        "point, so it is left behind as solid crystals.",
    },
  ],
  steps: [
    {
      id: "add-water",
      predictPrompt:
        "You stir the salt-and-sand mixture into water. What happens?",
      options: [
        {
          label: "The salt dissolves but the sand does not",
          correct: true,
          feedback:
            "Correct — salt is soluble in water, sand is not. That is the key " +
            "to separating them.",
        },
        {
          label: "Both dissolve completely",
          correct: false,
          feedback:
            "Not quite — sand is insoluble, so it stays as solid grains.",
        },
        {
          label: "Neither dissolves",
          correct: false,
          feedback:
            "Not quite — salt is soluble and does dissolve into the water.",
        },
      ],
      goal: "Separate the salt from the sand — what's your first move?",
      hints: {
        filter:
          "Nothing to filter yet — the salt and sand are still dry grains. " +
          "Wet the mixture first so they can come apart.",
        heat:
          "Heating the dry mixture won't separate it. Try dissolving it first.",
      },
      actionPrompt: "Pour the water into the mixture.",
      expect: { type: "pour", reagent: "water", target: "mixture" },
      explanation:
        "Salt dissolves in water; sand does not. Now one component is in " +
        "solution and the other is a suspended solid — ready to be separated.",
    },
    {
      id: "filter",
      predictPrompt:
        "How can you separate the undissolved sand from the salt solution?",
      options: [
        {
          label: "Filter the mixture",
          correct: true,
          feedback:
            "Correct — the filter paper traps the sand and lets the solution " +
            "pass through.",
        },
        {
          label: "Heat it straight away",
          correct: false,
          feedback:
            "Not yet — heating now would leave the sand mixed in with the " +
            "salt. Remove the sand first.",
        },
        {
          label: "Add more water",
          correct: false,
          feedback:
            "Not quite — more water cannot separate the insoluble sand.",
        },
      ],
      goal: "The salt's dissolved but the sand isn't. Get the sand out.",
      hints: {
        pour:
          "Adding more water won't remove the sand — you need to separate the " +
          "solid from the liquid.",
        heat:
          "Heating now would boil off the water and leave the sand mixed back " +
          "in with the salt. Remove the sand first.",
      },
      actionPrompt: "Filter the mixture to catch the sand.",
      expect: { type: "filter", source: "mixture" },
      explanation:
        "Filtration keeps the insoluble sand on the filter paper as residue, " +
        "while the dissolved salt and water pass through as the filtrate.",
    },
    {
      id: "evaporate",
      predictPrompt:
        "The salt is dissolved in the filtrate. How do you get it back as a solid?",
      options: [
        {
          label: "Heat the filtrate to evaporate the water",
          correct: true,
          feedback:
            "Correct — boiling off the water leaves the salt behind as " +
            "crystals.",
        },
        {
          label: "Filter the filtrate again",
          correct: false,
          feedback:
            "Not quite — the salt is dissolved, so it would pass straight " +
            "through the filter paper.",
        },
        {
          label: "Let it cool down",
          correct: false,
          feedback:
            "Not quite — cooling alone will not drive off the water.",
        },
      ],
      goal: "Now recover the dissolved salt as a solid.",
      hints: {
        pour:
          "Adding water just dilutes the salt further — you need to get the " +
          "water out, not in.",
        filter:
          "The salt is dissolved, so it would pass straight through the filter " +
          "paper. Filtering can't catch it.",
      },
      actionPrompt: "Heat the filtrate to recover the salt.",
      expect: { type: "heat", target: "filtrate" },
      explanation:
        "Heating evaporates the water as vapour, leaving the salt as solid " +
        "crystals — the salt is fully separated from the sand.",
    },
  ],
};
