import type {
  ExperimentDefinition,
  ExperimentGame,
} from "@learn-loop/core";

/**
 * "Mystery Bottles" — the Class 10 NCERT chapter *Acids, Bases and Salts*, framed
 * as a discovery bench: five unlabelled bottles, and the chapter's hands-on
 * Activities recast as diagnostic **tools** that all feed a single "identify each
 * bottle" classification.
 *
 *   - litmus strip (Activity 2.1)              → a colour readout
 *   - pH paper (Activities 2.11–2.14)          → a point on the 0–14 scale
 *   - a conductivity tester (Activity 2.8)     → a bulb that glows or stays dark
 *   - dilute acid on the sample (Activity 2.5) → a gas from carbonates only
 *   - a strip of zinc (Activities 2.3, 2.4)    → hydrogen gas from acids only
 *
 * Nothing here is authored per bottle × tool: every outcome is computed from the
 * bottle's hidden `properties` (`nature`, `ionic`, `carbonate`) through the
 * first-match-wins `ruleSet`, so the world is consistent and the learner can
 * reason instead of memorise.
 *
 * The design is a genuine "combine causes" experiment — **no single tool
 * separates all five** — because two pairs look identical to the obvious tests:
 *
 *   - sodium hydroxide and washing soda are both basic (blue litmus, high pH,
 *     both conduct); only dropping in acid tells them apart — the carbonate
 *     fizzes.
 *   - common salt and sugar are both neutral (no litmus change, pH 7); only the
 *     conductivity tester splits them — the salt's ions carry a current.
 *
 * Every different-category pair is still distinguishable once the right tools are
 * combined, so the analyzer proves the level winnable by reasoning but not by a
 * single click or a guess. Colour, pH value, bulb state, and the escaping-gas
 * label are all carried as structured `readout` / `gasLabel` tokens — the visible
 * evidence the analyzer reasons over.
 *
 * Observation text is strictly *what is seen* (never "acid" / "base" /
 * "carbonate"): the learner names the concept only at the reveal.
 */
export const acidsBasesSaltsBench: ExperimentDefinition = {
  samples: [
    {
      id: "bottle-hcl",
      label: "Bottle 1",
      // ionic → conducts; reacts with metal; turns indicators the "acid" way.
      properties: { nature: "acid", ionic: "yes", carbonate: "no" },
      categoryId: "acid",
      revealLabel: "dilute hydrochloric acid",
    },
    {
      id: "bottle-naoh",
      label: "Bottle 2",
      properties: { nature: "base", ionic: "yes", carbonate: "no" },
      categoryId: "base",
      revealLabel: "sodium hydroxide solution",
    },
    {
      id: "bottle-washing-soda",
      label: "Bottle 3",
      // Basic like NaOH, but a carbonate: it fizzes when acid is added.
      properties: { nature: "base", ionic: "yes", carbonate: "yes" },
      categoryId: "carbonate",
      revealLabel: "washing soda solution",
    },
    {
      id: "bottle-nacl",
      label: "Bottle 4",
      properties: { nature: "neutral", ionic: "yes", carbonate: "no" },
      categoryId: "neutral-salt",
      revealLabel: "common salt solution",
    },
    {
      id: "bottle-sugar",
      label: "Bottle 5",
      properties: { nature: "neutral", ionic: "no", carbonate: "no" },
      categoryId: "non-conductor",
      revealLabel: "sugar solution",
    },
  ],
  tools: [
    { id: "litmus", label: "Litmus strip", description: "Dip a strip and read the colour." },
    { id: "ph-paper", label: "pH paper", description: "Read the colour against the 0–14 scale." },
    {
      id: "conductivity",
      label: "Conductivity tester",
      description: "Dip the electrodes and watch the bulb.",
    },
    { id: "acid", label: "Dilute acid", description: "Add a few drops of acid and watch." },
    { id: "zinc", label: "Zinc granule", description: "Drop in a piece of zinc and watch." },
  ],
  ruleSet: {
    rules: [
      // --- Litmus: colour readout (Activity 2.1) ---
      {
        toolId: "litmus",
        when: { nature: "acid" },
        effect: {
          observationId: "litmus-red",
          observation: "The strip flushes a strong red.",
          visual: "color-change",
          readout: { kind: "color", value: "red" },
        },
      },
      {
        toolId: "litmus",
        when: { nature: "base" },
        effect: {
          observationId: "litmus-blue",
          observation: "The strip turns a deep blue.",
          visual: "color-change",
          readout: { kind: "color", value: "blue" },
        },
      },
      {
        toolId: "litmus",
        when: { nature: "neutral" },
        effect: {
          observationId: "litmus-none",
          observation: "The strip barely changes colour.",
          visual: "none",
        },
      },
      // --- pH paper: 0–14 scale readout (Activities 2.11–2.14) ---
      {
        toolId: "ph-paper",
        when: { nature: "acid" },
        effect: {
          observationId: "ph-2",
          observation: "The paper flushes toward the warm end of the scale.",
          visual: "ph-scale",
          readout: { kind: "ph-scale", value: "2" },
        },
      },
      {
        toolId: "ph-paper",
        when: { nature: "base" },
        effect: {
          observationId: "ph-12",
          observation: "The paper shifts toward the cool end of the scale.",
          visual: "ph-scale",
          readout: { kind: "ph-scale", value: "12" },
        },
      },
      {
        toolId: "ph-paper",
        when: { nature: "neutral" },
        effect: {
          observationId: "ph-7",
          observation: "The paper lands squarely in the middle of the scale.",
          visual: "ph-scale",
          readout: { kind: "ph-scale", value: "7" },
        },
      },
      // --- Conductivity: bulb readout (Activity 2.8) ---
      {
        toolId: "conductivity",
        when: { ionic: "yes" },
        effect: {
          observationId: "bulb-on",
          observation: "The bulb lights up brightly.",
          visual: "conductivity",
          readout: { kind: "conductivity", value: "on" },
        },
      },
      {
        toolId: "conductivity",
        when: { ionic: "no" },
        effect: {
          observationId: "bulb-off",
          observation: "The bulb stays dark.",
          visual: "conductivity",
          readout: { kind: "conductivity", value: "off" },
        },
      },
      // --- Dilute acid: carbon dioxide from carbonates (Activity 2.5) ---
      {
        toolId: "acid",
        when: { carbonate: "yes" },
        effect: {
          observationId: "carbonate-fizz",
          observation: "The liquid fizzes hard and bubbles stream up.",
          visual: "gas",
          gasLabel: "CO₂",
        },
      },
      // --- Zinc: hydrogen gas from acids (Activities 2.3, 2.4) ---
      {
        toolId: "zinc",
        when: { nature: "acid" },
        effect: {
          observationId: "zinc-fizz",
          observation: "Bubbles cling to the metal and rise steadily.",
          visual: "gas",
          gasLabel: "H₂",
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

/**
 * The full "Mystery Bottles" chapter game on {@link acidsBasesSaltsBench}: five
 * categories to discover across a guided → hinted → open ladder.
 *
 *   1. `meet-the-indicators` (guided) — one clue, two tools: read a colour and a
 *      pH value on a single acidic bottle, with prediction on to teach the beat.
 *   2. `the-lookalikes`      (hinted) — all five bottles; two pairs look identical
 *      to litmus and pH paper, so you must bring in acid and the tester. Hints on.
 *   3. `open-bench`          (open)   — all bottles, every tool, no hints.
 */
export const game: ExperimentGame = {
  id: "acids-bases-salts-mystery-bottles",
  title: "Mystery Bottles: Acids, Bases and Salts",
  conceptName: "Acids, Bases and Salts (Class 10)",
  definition: acidsBasesSaltsBench,
  categories: [
    {
      id: "acid",
      label: "Acid",
      definition:
        "Turns blue litmus red and sits low on the pH scale; gives off hydrogen when a metal is dropped in.",
    },
    {
      id: "base",
      label: "Base",
      definition: "Turns red litmus blue and sits high on the pH scale.",
    },
    {
      id: "carbonate",
      label: "Carbonate",
      definition:
        "A basic solution that fizzes when acid is added — the escaping gas is the giveaway.",
    },
    {
      id: "neutral-salt",
      label: "Neutral salt",
      definition:
        "Neutral to indicators, yet it still conducts — its dissolved ions carry the current.",
    },
    {
      id: "non-conductor",
      label: "Non-conductor",
      definition:
        "Neutral and does not conduct — it dissolves without free ions to carry a current.",
    },
  ],
  levels: [
    {
      id: "meet-the-indicators",
      title: "Meet the indicators",
      intro:
        "One bottle, two tools. Dip the litmus strip and the pH paper and read what they say — notice how the two readings agree.",
      outro:
        "A strong red and a low number both point the same way — toward the sour, reactive end of the range.",
      sampleIds: ["bottle-hcl", "bottle-naoh"],
      toolIds: ["litmus", "ph-paper"],
      goal: { classifyIds: ["bottle-hcl"], categoryIds: ["acid", "base"] },
      scaffolding: "guided",
      predictionRequired: false,
      hints: [{ id: "h1", text: "Red and blue are opposite ends of the litmus story." }],
    },
    {
      id: "the-lookalikes",
      title: "The lookalikes",
      intro:
        "Five bottles now. Two of them fool the litmus strip and the pH paper — one test will never be enough. Combine causes to tell every pair apart.",
      sampleIds: [
        "bottle-hcl",
        "bottle-naoh",
        "bottle-washing-soda",
        "bottle-nacl",
        "bottle-sugar",
      ],
      toolIds: ["litmus", "ph-paper", "conductivity", "acid"],
      goal: {
        classifyIds: [
          "bottle-hcl",
          "bottle-naoh",
          "bottle-washing-soda",
          "bottle-nacl",
          "bottle-sugar",
        ],
        categoryIds: ["acid", "base", "carbonate", "neutral-salt", "non-conductor"],
      },
      scaffolding: "hinted",
      predictionRequired: false,
      hints: [
        {
          id: "h1",
          text: "Two bottles read blue and high — both basic. Only one of them fizzes when you add acid.",
        },
        {
          id: "h2",
          text: "Two more sit in the middle — both neutral. Only one of them lights the bulb.",
        },
      ],
    },
    {
      id: "open-bench",
      title: "The open bench",
      intro: "All five bottles, every tool, no hints. Identify each one.",
      sampleIds: [
        "bottle-hcl",
        "bottle-naoh",
        "bottle-washing-soda",
        "bottle-nacl",
        "bottle-sugar",
      ],
      toolIds: ["litmus", "ph-paper", "conductivity", "acid", "zinc"],
      goal: {
        classifyIds: [
          "bottle-hcl",
          "bottle-naoh",
          "bottle-washing-soda",
          "bottle-nacl",
          "bottle-sugar",
        ],
        categoryIds: ["acid", "base", "carbonate", "neutral-salt", "non-conductor"],
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
  ],
};
