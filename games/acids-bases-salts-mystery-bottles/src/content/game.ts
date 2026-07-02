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
 * Two transformation Activities ride the same world: titrating base into the acid
 * (Activity 2.6) and heating/rehydrating copper sulphate crystals (Activity 2.15,
 * water of crystallisation), both driven by persistent `setState`.
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
    {
      // A solid on the same bench for the water-of-crystallisation activity. It
      // never joins a classify level (no `nature`/`ionic`/`carbonate`), so the
      // identity tools default to "nothing" on it; only heat and water act on its
      // `hydration`. `categoryId` is required structurally but never graded here.
      id: "crystals-cuso4",
      label: "Blue crystals",
      properties: { hydration: "hydrated" },
      categoryId: "hydrated-salt",
      revealLabel: "copper sulphate crystals",
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
    {
      id: "add-base",
      label: "Add base",
      description: "Titrate in base drop by drop to cancel the acid.",
    },
    { id: "heat", label: "Heat", description: "Warm the crystals over a flame and watch." },
    {
      id: "water",
      label: "Add water",
      description: "Drip a little water onto the crystals and watch.",
    },
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
      // --- Add base: titrating base into an acid cancels it (Activity 2.6) ---
      // A persistent `setState` flips the sample to neutral, so this is a genuine
      // transformation the learner can *drive* toward a target, not just observe.
      {
        toolId: "add-base",
        when: { nature: "acid" },
        effect: {
          observationId: "titrate-neutral",
          observation: "The fierce colour eases back to a calm middle green.",
          visual: "color-change",
          readout: { kind: "color", value: "green" },
          setState: { nature: "neutral" },
        },
      },
      // --- Heat / water: water of crystallisation (Activity 2.15) ---
      // Heating drives the water of crystallisation off (blue → white); adding it
      // back floods the blue in again. The `everHeated` marker records that the
      // round-trip has happened, so the goal state (blue *after* heating) is
      // distinct from the untouched blue start — the target can only be met by
      // completing the full reversible loop, never by standing still.
      {
        toolId: "heat",
        when: { hydration: "hydrated" },
        effect: {
          observationId: "cuso4-dehydrate",
          observation: "The blue drains away and the crystals crumble to a chalky white.",
          visual: "color-change",
          readout: { kind: "color", value: "white" },
          setState: { hydration: "anhydrous", everHeated: "yes" },
        },
      },
      {
        toolId: "water",
        when: { hydration: "anhydrous" },
        effect: {
          observationId: "cuso4-rehydrate",
          observation: "A few drops soak in and the deep blue floods back.",
          visual: "color-change",
          readout: { kind: "color", value: "blue" },
          setState: { hydration: "hydrated" },
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
 * The full "Mystery Bottles" chapter game on {@link acidsBasesSaltsBench}: a
 * guided → hinted → open classify ladder, then two transformation activities on
 * the same world that use the other goal kinds.
 *
 *   1. `meet-the-indicators` (guided, classify)  — one clue, two tools: read a
 *      colour and a pH value on a single acidic bottle to teach the beat.
 *   2. `the-lookalikes`      (hinted, classify)  — all five bottles; two pairs
 *      look identical to litmus and pH paper, so you must bring in acid and the
 *      tester. Hints on.
 *   3. `open-bench`          (open, classify)    — all bottles, every tool, no hints.
 *   4. `call-the-reaction`   (predict-outcome)   — predict whether zinc bubbles a
 *      gas on each bottle before it lands (Activities 2.3/2.4).
 *   5. `neutralise-it`       (reach-target-state) — titrate base into the acid
 *      until it reaches neutral (Activity 2.6).
 *   6. `water-of-crystallisation` (reach-target-state) — heat blue crystals white,
 *      then add water to bring the blue back; the target is the post-heat blue, so
 *      only the full reversible loop wins (Activity 2.15).
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
    {
      id: "hydrated-salt",
      label: "Hydrated salt",
      definition:
        "Its crystals lock in water of crystallisation — heat drives the water off and turns them white, water takes it back up and the blue returns.",
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
    {
      // predict-outcome (Activities 2.3/2.4): the reaction, not the identity, is
      // the lesson. A metal fizzes hydrogen on an acid but does nothing on a base
      // or a neutral solution — so "will it bubble?" is a real, evidence-bound
      // call, not a coin flip. Two different answers keep it from being guessable.
      id: "call-the-reaction",
      title: "Call the reaction",
      intro:
        "Drop zinc into each bottle in turn. Before it lands, call it: will the metal bubble a gas, or sit there doing nothing?",
      outro:
        "Only the sharp, reactive liquid fed the metal a gas — the others left it untouched.",
      sampleIds: ["bottle-hcl", "bottle-naoh", "bottle-nacl"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [
          { sampleId: "bottle-hcl", toolId: "zinc" }, // gas (H₂)
          { sampleId: "bottle-naoh", toolId: "zinc" }, // nothing
          { sampleId: "bottle-nacl", toolId: "zinc" }, // nothing
        ],
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
    {
      // reach-target-state (Activity 2.6): neutralisation as a goal to achieve.
      // Adding base drives the acid to neutral; litmus and pH paper let the
      // learner check progress toward the target without changing the state.
      id: "neutralise-it",
      title: "Cancel the acid",
      intro:
        "This bottle bites — strong red, low on the scale. Titrate base into it drop by drop until it lands neutral. Check with the strips as you go.",
      outro:
        "Acid met base and cancelled out — the reading settled square in the middle.",
      sampleIds: ["bottle-hcl"],
      toolIds: ["litmus", "ph-paper", "add-base"],
      goal: {
        kind: "reach-target-state",
        sampleId: "bottle-hcl",
        target: { nature: "neutral" },
        targetLabel: "Bring the bottle to neutral",
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
    {
      // reach-target-state (Activity 2.15): water of crystallisation as a round
      // trip. The crystals start blue; heating drives off the water (white);
      // adding water back restores the blue. The target — blue *after* heating —
      // can only be met by completing the full reversible loop, so it is neither
      // trivially satisfied at the start nor a one-click win. This is the reversible
      // `setState` chain end-to-end.
      id: "water-of-crystallisation",
      title: "The colour that comes back",
      intro:
        "These blue crystals hide water inside them. Heat them and watch the colour go — then find a way to bring the blue back.",
      outro:
        "The water you drove off with heat soaked straight back in, and the blue returned — the crystals had been holding it all along.",
      sampleIds: ["crystals-cuso4"],
      toolIds: ["heat", "water"],
      goal: {
        kind: "reach-target-state",
        sampleId: "crystals-cuso4",
        target: { hydration: "hydrated", everHeated: "yes" },
        targetLabel: "Drive the blue out, then bring it back",
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
  ],
};
