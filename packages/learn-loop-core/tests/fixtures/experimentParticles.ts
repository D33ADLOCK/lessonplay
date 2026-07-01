import type {
  ExperimentDefinition,
  ExperimentGame,
} from "../../src/model/experimentLab";

/**
 * Reference ExperimentLab physics: the "Invisible Particle Detective" bench.
 *
 * Three unknown samples plus a water control are classified as solution,
 * suspension, or colloid using a side light, a stand-and-wait, and a filter.
 * The single hidden property `particleSize` drives every outcome, encoding the
 * deliberate ambiguity that makes it an experiment rather than a quiz:
 *
 *   - `light`  shows a beam for BOTH `fine` (colloid) and `coarse` (suspension),
 *     so light alone cannot separate them — the learner must combine causes.
 *   - `settle` and `filter` only act on `coarse`, isolating the suspension.
 *
 * Observation text is strictly what is *seen*; no inference is given.
 */
export const particleExperiment: ExperimentDefinition = {
  samples: [
    {
      id: "control",
      label: "Water control",
      properties: { particleSize: "tiny" },
      category: "control",
      revealLabel: "pure water",
    },
    {
      id: "unknown-a",
      label: "Unknown A",
      properties: { particleSize: "tiny" },
      category: "solution",
      revealLabel: "salt water",
    },
    {
      id: "unknown-b",
      label: "Unknown B",
      properties: { particleSize: "coarse" },
      category: "suspension",
      revealLabel: "chalk water",
    },
    {
      id: "unknown-c",
      label: "Unknown C",
      properties: { particleSize: "fine" },
      category: "colloid",
      revealLabel: "diluted milk",
    },
  ],
  tools: [
    { id: "light", label: "Side light", description: "Shine a beam from the side." },
    { id: "settle", label: "Let it stand", description: "Wait and watch for settling." },
    { id: "filter", label: "Filter", description: "Pour it through filter paper." },
  ],
  ruleSet: {
    rules: [
      // light
      {
        toolId: "light",
        when: { particleSize: "tiny" },
        effect: {
          observationId: "light-no-beam",
          observation: "The beam passes straight through; no path is visible.",
          visual: "none",
        },
      },
      {
        toolId: "light",
        when: { particleSize: "fine" },
        effect: {
          observationId: "light-beam-clean",
          observation: "A bright beam path glows across the evenly cloudy liquid.",
          visual: "beam",
        },
      },
      {
        toolId: "light",
        when: { particleSize: "coarse" },
        effect: {
          observationId: "light-beam-gritty",
          observation: "A beam shows, but the liquid looks gritty and uneven.",
          visual: "beam",
        },
      },
      // settle
      {
        toolId: "settle",
        when: { particleSize: "coarse" },
        effect: {
          observationId: "settle-layer",
          observation: "A solid layer slowly sinks and collects at the bottom.",
          visual: "settle",
          setState: { settled: "yes" },
        },
      },
      {
        toolId: "settle",
        when: { particleSize: "fine" },
        effect: {
          observationId: "settle-none-cloudy",
          observation: "Nothing sinks; it stays evenly cloudy.",
          visual: "none",
        },
      },
      {
        toolId: "settle",
        when: { particleSize: "tiny" },
        effect: {
          observationId: "settle-none-clear",
          observation: "Nothing sinks; the liquid stays clear.",
          visual: "none",
        },
      },
      // filter
      {
        toolId: "filter",
        when: { particleSize: "coarse" },
        effect: {
          observationId: "filter-residue",
          observation: "Solid residue stays on the paper; clearer liquid drips through.",
          visual: "residue",
        },
      },
      {
        toolId: "filter",
        when: { particleSize: "fine" },
        effect: {
          observationId: "filter-passes-cloudy",
          observation: "The cloudy liquid passes straight through the paper.",
          visual: "none",
        },
      },
      {
        toolId: "filter",
        when: { particleSize: "tiny" },
        effect: {
          observationId: "filter-passes-clear",
          observation: "The clear liquid passes through the paper unchanged.",
          visual: "none",
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
 * The full "Invisible Particle Detective" game built on {@link particleExperiment}:
 * the categories to discover and a three-rung level ladder.
 *
 *   1. `learn-the-light` (guided)  — one mystery, one cause: meet the side light.
 *   2. `combine-causes`  (hinted)  — three unknowns; light alone can't separate
 *      the cloudy two, so the learner must add settling/filtering. Hints on.
 *   3. `open-case`       (open)    — same physics, hints removed: the real test.
 */
export const particleGame: ExperimentGame = {
  id: "invisible-particle-detective",
  title: "Invisible Particle Detective",
  conceptName: "Solutions, suspensions, and colloids (Class 6)",
  definition: particleExperiment,
  categories: [
    { id: "control", label: "Control", definition: "The pure reference liquid." },
    {
      id: "solution",
      label: "Solution",
      definition: "Particles too small to see or trap; the mix stays clear.",
    },
    {
      id: "suspension",
      label: "Suspension",
      definition: "Large particles that settle out and can be filtered.",
    },
    {
      id: "colloid",
      label: "Colloid",
      definition: "Particles that scatter light but never settle or filter out.",
    },
  ],
  levels: [
    {
      id: "learn-the-light",
      title: "Meet the side light",
      intro:
        "Shine the side light through a sample and watch for a glowing path. Predict first, then test.",
      sampleIds: ["control", "unknown-b"],
      toolIds: ["light", "settle"],
      goal: { classifyIds: ["unknown-b"], categoryIds: ["solution", "suspension", "colloid"] },
      scaffolding: "guided",
      predictionRequired: true,
      hints: [
        { id: "h1", text: "A glowing beam means something is floating in the liquid." },
      ],
    },
    {
      id: "combine-causes",
      title: "Three unknowns",
      intro:
        "Two of these scatter the light the same way. One test will not be enough — combine causes to tell them apart.",
      sampleIds: ["control", "unknown-a", "unknown-b", "unknown-c"],
      toolIds: ["light", "settle", "filter"],
      goal: {
        classifyIds: ["unknown-a", "unknown-b", "unknown-c"],
        categoryIds: ["solution", "suspension", "colloid"],
      },
      scaffolding: "hinted",
      predictionRequired: true,
      hints: [
        { id: "h1", text: "Use the light first to spot which samples hold floating particles." },
        { id: "h2", text: "Of the two that scatter light, only one settles or filters out." },
      ],
    },
    {
      id: "open-case",
      title: "The open case",
      intro: "No hints this time. Identify all three unknowns.",
      sampleIds: ["control", "unknown-a", "unknown-b", "unknown-c"],
      toolIds: ["light", "settle", "filter"],
      goal: {
        classifyIds: ["unknown-a", "unknown-b", "unknown-c"],
        categoryIds: ["solution", "suspension", "colloid"],
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
  ],
};
