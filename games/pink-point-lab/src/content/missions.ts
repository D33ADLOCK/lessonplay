import type {
  GuidedLabMission,
  GuidedLabMissionPresentation,
  Scenario,
} from "@learn-loop/core";

const clearSolution = "#e7f2f7";
const pinkSolution = "#f7a6c8";

export const endpointScenario: Scenario = {
  id: "endpoint-pink",
  title: "Catch the Pink Point",
  concept: "Acid-base indicators — phenolphthalein is colorless in acid and pink in base",
  grade: 7,
  entities: [
    { id: "acid-sample", label: "Acid sample", color: "#b8dff2", kind: "acid", solubility: "soluble" },
    { id: "phenolphthalein", label: "Phenolphthalein", color: "#f8d7e8", kind: "indicator", solubility: "soluble" },
    { id: "acid-indicator", label: "Indicator in acid", color: clearSolution, kind: "indicator", solubility: "soluble" },
    { id: "base-drops", label: "Base drops", color: "#d4f2df", kind: "base", solubility: "soluble" },
    { id: "distilled-water", label: "Distilled water", color: "#b8dff2", kind: "neutral", solubility: "soluble" },
    { id: "basic-mixture", label: "Basic mixture", color: pinkSolution, kind: "base", solubility: "soluble" },
  ],
  shelf: ["phenolphthalein", "base-drops", "distilled-water"],
  stations: {
    flask: { contents: ["acid-sample"], color: clearSolution, heat: "room", phase: "solution" },
    checkTube: { contents: [], color: clearSolution, heat: "room", phase: "empty" },
    notesTray: { contents: [], color: "#f4f0e7", heat: "room", phase: "empty" },
  },
  rules: [
    {
      id: "indicator-in-acid",
      on: "pour",
      requires: ["acid-sample", "phenolphthalein"],
      transform: {
        kind: "react",
        consume: ["phenolphthalein"],
        produce: ["acid-indicator"],
        newColor: clearSolution,
      },
      observation: "The indicator mixes in, but the acid sample stays colorless.",
      explanation: "Phenolphthalein does not turn pink in an acid, so the solution remains colorless.",
    },
    {
      id: "base-reaches-pink",
      on: "pour",
      requires: ["acid-sample", "acid-indicator", "base-drops"],
      transform: {
        kind: "react",
        consume: ["acid-sample", "acid-indicator", "base-drops"],
        produce: ["basic-mixture", "phenolphthalein"],
        newColor: pinkSolution,
      },
      observation: "A pink color spreads through the flask.",
      explanation: "Enough base has been added for phenolphthalein to show its pink form.",
    },
  ],
  steps: [
    {
      id: "add-indicator",
      predictPrompt: "What should phenolphthalein look like in the acid sample?",
      options: [
        { label: "It stays colorless", correct: true, feedback: "Correct. Acid does not make phenolphthalein pink." },
        { label: "It turns pink at once", correct: false, feedback: "Pink appears only when the solution becomes basic." },
      ],
      goal: "Add indicator to the acid sample and watch the color.",
      hints: {
        wait: "Waiting will not add the indicator.",
        heat: "Heating is not part of this indicator test.",
      },
      actionPrompt: "Pour phenolphthalein into the flask.",
      expect: { type: "pour", reagent: "phenolphthalein", target: "flask" },
      explanation: "The indicator is now present, but acid keeps phenolphthalein colorless.",
    },
    {
      id: "add-base",
      predictPrompt: "What should happen when the mixture becomes basic?",
      options: [
        { label: "Pink appears", correct: true, feedback: "Yes. Phenolphthalein turns pink in base." },
        { label: "It must stay colorless", correct: false, feedback: "It stays colorless in acid or neutral solution, not in base." },
      ],
      goal: "Use base drops to reveal the indicator color change.",
      hints: {
        wait: "The indicator is ready. Add the reagent that changes the solution to a base.",
        heat: "Heat is not needed for this acid-base indicator change.",
      },
      actionPrompt: "Pour base drops into the flask.",
      expect: { type: "pour", reagent: "base-drops", target: "flask" },
      explanation: "Phenolphthalein is a useful indicator because a basic solution makes it pink.",
    },
  ],
};

export const compareSamplesScenario: Scenario = {
  id: "compare-samples",
  title: "Compare Clear and Basic Samples",
  concept: "Indicator evidence — neutral stays colorless; base turns phenolphthalein pink",
  grade: 7,
  entities: [
    { id: "neutral-sample", label: "Neutral sample", color: clearSolution, kind: "neutral", solubility: "soluble" },
    { id: "base-sample", label: "Base sample", color: "#d4f2df", kind: "base", solubility: "soluble" },
    { id: "phenolphthalein", label: "Phenolphthalein", color: "#f8d7e8", kind: "indicator", solubility: "soluble" },
    { id: "neutral-confirmed", label: "Still colorless", color: clearSolution, kind: "observation", solubility: "soluble" },
    { id: "base-confirmed", label: "Pink base", color: pinkSolution, kind: "observation", solubility: "soluble" },
  ],
  shelf: ["phenolphthalein"],
  stations: {
    neutralTube: { contents: ["neutral-sample"], color: clearSolution, heat: "room", phase: "solution" },
    baseTube: { contents: ["base-sample"], color: "#d4f2df", heat: "room", phase: "solution" },
    resultTray: { contents: [], color: "#f4f0e7", heat: "room", phase: "empty" },
  },
  rules: [
    {
      id: "indicator-neutral",
      on: "pour",
      requires: ["neutral-sample", "phenolphthalein"],
      transform: {
        kind: "react",
        consume: [],
        produce: [],
        newColor: clearSolution,
      },
      observation: "The neutral sample stays colorless after the indicator is added.",
      explanation: "Phenolphthalein is colorless in neutral solution, so no pink appears.",
    },
    {
      id: "wait-neutral",
      on: "wait",
      requires: ["neutral-sample", "phenolphthalein"],
      transform: {
        kind: "react",
        consume: [],
        produce: ["neutral-confirmed"],
        newColor: clearSolution,
      },
      observation: "The neutral tube remains colorless even after waiting.",
      explanation: "Waiting does not make phenolphthalein pink; the solution must be basic.",
    },
    {
      id: "indicator-base",
      on: "pour",
      requires: ["base-sample", "phenolphthalein"],
      transform: {
        kind: "react",
        consume: ["base-sample"],
        produce: ["base-confirmed"],
        newColor: pinkSolution,
      },
      observation: "The base tube turns pink.",
      explanation: "The pink color is evidence that the sample is basic.",
    },
  ],
  steps: [
    {
      id: "neutral-indicator",
      predictPrompt: "What should the neutral sample do with phenolphthalein?",
      options: [
        { label: "Stay colorless", correct: true, feedback: "Correct. Neutral solution keeps phenolphthalein colorless." },
        { label: "Turn strong pink", correct: false, feedback: "Pink points to a basic solution, not a neutral one." },
      ],
      goal: "Check the neutral sample with indicator.",
      hints: {
        wait: "Add the indicator before waiting to confirm the result.",
        heat: "Heating is not needed for this indicator test.",
      },
      actionPrompt: "Pour phenolphthalein into the neutral tube.",
      expect: { type: "pour", reagent: "phenolphthalein", target: "neutralTube" },
      explanation: "Neutral solution does not trigger phenolphthalein's pink color.",
    },
    {
      id: "wait-neutral",
      predictPrompt: "Will waiting make the neutral tube pink?",
      options: [
        { label: "No, it stays colorless", correct: true, feedback: "Correct. Time alone is not the cause." },
        { label: "Yes, it slowly turns pink", correct: false, feedback: "The color change needs a base." },
      ],
      goal: "Wait and confirm the neutral tube still has no pink color.",
      hints: {
        pour: "The indicator is already in the neutral tube. Now observe it for a moment.",
        heat: "Heating would not be a fair indicator check here.",
      },
      actionPrompt: "Wait at the neutral tube.",
      expect: { type: "wait", target: "neutralTube" },
      explanation: "Phenolphthalein staying colorless supports that the sample is neutral, not basic.",
    },
    {
      id: "base-indicator",
      predictPrompt: "Which tube should finally show the pink indicator color?",
      options: [
        { label: "The base tube", correct: true, feedback: "Correct. A base turns phenolphthalein pink." },
        { label: "The neutral tube", correct: false, feedback: "The neutral tube has already stayed colorless." },
      ],
      goal: "Test the basic sample and compare it with the neutral result.",
      hints: {
        wait: "Waiting showed the neutral result. Add indicator to the basic sample now.",
        heat: "Heat is not the reason phenolphthalein turns pink.",
      },
      actionPrompt: "Pour phenolphthalein into the base tube.",
      expect: { type: "pour", reagent: "phenolphthalein", target: "baseTube" },
      explanation: "The base tube turns pink, while the neutral tube stays colorless.",
    },
  ],
};

export const missions = [endpointScenario, compareSamplesScenario] as const;

export const missionPresentations: readonly GuidedLabMissionPresentation[] = [
  {
    scenarioId: "endpoint-pink",
    badge: "Indicator",
    stationVisuals: [
      { stationId: "flask", kind: "distillation", label: "Acid flask", effectTags: ["color-change"] },
      { stationId: "checkTube", kind: "test-tube", label: "Check tube" },
      { stationId: "notesTray", kind: "paper", label: "Result notes" },
    ],
    completionMessage: "Pink marks the basic endpoint.",
  },
  {
    scenarioId: "compare-samples",
    badge: "Compare",
    stationVisuals: [
      { stationId: "neutralTube", kind: "test-tube", label: "Neutral tube" },
      { stationId: "baseTube", kind: "test-tube", label: "Base tube", effectTags: ["color-change"] },
      { stationId: "resultTray", kind: "paper", label: "Compare notes" },
    ],
    completionMessage: "Colorless means acid or neutral; pink means base.",
  },
];

export const guidedLabMissions: readonly GuidedLabMission[] = missions.map(
  (scenario, index) => ({
    scenario,
    presentation: missionPresentations[index],
  }),
);
