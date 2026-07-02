import type {
  ExperimentDefinition,
  ExperimentGame,
} from "../../src/model/experimentLab";

/**
 * Worked example for the ExperimentLab template expansion (issue #89):
 * Class 10 "Acids, Bases and Salts" framed as *identify the mystery bottles*.
 *
 * The chapter's hands-on Activities become diagnostic **tools** that all feed a
 * single classification — the PRD's dominant "classify" framing for an
 * identity-heavy chapter:
 *
 *   - litmus / phenolphthalein (Activity 2.1)  → a colour readout
 *   - pH paper (Activities 2.11–2.14)           → a point on the 0–14 scale
 *   - a conductivity tester (Activity 2.8)      → a bulb that glows or not
 *   - a strip of zinc (Activities 2.3, 2.4)     → hydrogen gas from acids only
 *
 * Four bottles span four categories. The design is a genuine "combine causes"
 * experiment: **no single tool separates all four**, because the neutral salt
 * solution and the sugar solution are optically and pH-identical and differ
 * only in whether they conduct. Every different-category pair is still
 * distinguishable once the right tools are combined, so the level is winnable by
 * reasoning. Colour, pH value, and bulb state are all carried as structured
 * `readout` tokens — the evidence the analyzer reasons over.
 *
 * Observation text is strictly *what is seen* (never "acid"/"base"): the learner
 * names the concept only at the reveal.
 */
export const acidsBasesSaltsBench: ExperimentDefinition = {
  samples: [
    {
      id: "bottle-hcl",
      label: "Bottle 1",
      // ionic → conducts; reacts with metal; turns indicators the "acid" way
      properties: { nature: "acid", ionic: "yes" },
      categoryId: "acid",
      revealLabel: "dilute hydrochloric acid",
    },
    {
      id: "bottle-naoh",
      label: "Bottle 2",
      properties: { nature: "base", ionic: "yes" },
      categoryId: "base",
      revealLabel: "sodium hydroxide solution",
    },
    {
      id: "bottle-nacl",
      label: "Bottle 3",
      properties: { nature: "neutral", ionic: "yes" },
      categoryId: "neutral-salt",
      revealLabel: "common salt solution",
    },
    {
      id: "bottle-sugar",
      label: "Bottle 4",
      properties: { nature: "neutral", ionic: "no" },
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
          observation: "The strip turns a strong red.",
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
      // --- Zinc: hydrogen gas from acids (Activities 2.3, 2.4) ---
      {
        toolId: "zinc",
        when: { nature: "acid" },
        effect: {
          observationId: "zinc-gas",
          observation: "Bubbles stream off the metal.",
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
 * The full "Mystery Bottles" chapter game on {@link acidsBasesSaltsBench}: four
 * categories to discover and a guided → hinted → open ladder.
 *
 *   1. `meet-the-litmus` (guided) — one clue, one tool: read a colour.
 *   2. `four-bottles`    (hinted) — the salt and sugar look identical; you must
 *      bring in the conductivity tester to split them. Hints on.
 *   3. `open-bench`      (open)   — all bottles, all tools, no hints.
 */
export const acidsBasesSaltsGame: ExperimentGame = {
  id: "acids-bases-salts-mystery-bottles",
  title: "Mystery Bottles: Acids, Bases and Salts",
  conceptName: "Acids, Bases and Salts (Class 10)",
  definition: acidsBasesSaltsBench,
  categories: [
    { id: "acid", label: "Acid", definition: "Turns blue litmus red, low on the pH scale, gives off hydrogen with a metal." },
    { id: "base", label: "Base", definition: "Turns red litmus blue and sits high on the pH scale." },
    {
      id: "neutral-salt",
      label: "Neutral salt",
      definition: "A neutral solution that still conducts — its ions carry the current.",
    },
    {
      id: "non-conductor",
      label: "Non-conductor",
      definition: "A neutral solution that does not conduct — it has no free ions.",
    },
  ],
  levels: [
    {
      id: "meet-the-litmus",
      title: "Meet the litmus strip",
      intro:
        "One bottle, one tool. Dip the litmus strip and read the colour. Predict first, then test.",
      outro: "A strong red means the liquid is on the sour, reactive side of things.",
      sampleIds: ["bottle-hcl", "bottle-naoh"],
      toolIds: ["litmus", "ph-paper"],
      goal: { classifyIds: ["bottle-hcl"], categoryIds: ["acid", "base"] },
      scaffolding: "guided",
      predictionRequired: true,
      hints: [{ id: "h1", text: "Red and blue are opposite ends of the litmus story." }],
    },
    {
      id: "four-bottles",
      title: "Four bottles",
      intro:
        "Two of these look identical to litmus and pH paper. One test won't be enough — combine causes to tell them apart.",
      sampleIds: ["bottle-hcl", "bottle-naoh", "bottle-nacl", "bottle-sugar"],
      toolIds: ["litmus", "ph-paper", "conductivity"],
      goal: {
        classifyIds: ["bottle-hcl", "bottle-naoh", "bottle-nacl", "bottle-sugar"],
        categoryIds: ["acid", "base", "neutral-salt", "non-conductor"],
      },
      scaffolding: "hinted",
      predictionRequired: false,
      hints: [
        { id: "h1", text: "Litmus and pH paper agree the last two are in the middle — neutral." },
        { id: "h2", text: "Only one of those two lights the bulb. That's the difference." },
      ],
    },
    {
      id: "open-bench",
      title: "The open bench",
      intro: "All four bottles, every tool, no hints. Identify each one.",
      sampleIds: ["bottle-hcl", "bottle-naoh", "bottle-nacl", "bottle-sugar"],
      toolIds: ["litmus", "ph-paper", "conductivity", "zinc"],
      goal: {
        classifyIds: ["bottle-hcl", "bottle-naoh", "bottle-nacl", "bottle-sugar"],
        categoryIds: ["acid", "base", "neutral-salt", "non-conductor"],
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
  ],
};
