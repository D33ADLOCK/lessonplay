import type { SandboxLabMission } from "../../src";
import { acidBaseScenario } from "./acidBase";

const indicatorInvestigationScenario = {
  ...acidBaseScenario,
  title: "Classify Unknown A",
  concept: "Use indicator and temperature evidence to classify an unknown",
};

export const sandboxIndicatorMission: SandboxLabMission = {
  scenario: indicatorInvestigationScenario,
  presentation: {
    scenarioId: indicatorInvestigationScenario.id,
    mode: "investigation",
    badge: "Indicator mystery",
    question: "What can the reagent evidence tell you about Unknown A?",
    materials: [
      {
        id: "unknown-a",
        label: "Unknown A",
        stationId: "beaker",
        description: "A clear solution with an identity you must infer.",
        hiddenIdentity: {
          revealLabel: "Dilute hydrochloric acid",
          forbiddenTerms: ["Dilute HCl"],
        },
      },
    ],
    tools: [
      {
        id: "add-base",
        label: "Sodium hydroxide",
        action: { type: "pour", reagent: "sodium-hydroxide" },
      },
      {
        id: "add-water",
        label: "Distilled water",
        action: { type: "pour", reagent: "distilled-water" },
      },
    ],
    interactions: [
      {
        id: "neutralisation-result",
        materialId: "unknown-a",
        toolId: "add-base",
        evidenceId: "pink-and-warm",
        feedbackCard: {
          action: "You added sodium hydroxide to Unknown A.",
          result: "The indicator turns pink and the beaker becomes warmer.",
          why: "A neutralisation reaction can release heat while the indicator changes.",
          next: "Record the observation, then use it to classify the unknown.",
          notebook:
            "Unknown A + sodium hydroxide -> pink indicator and a warmer beaker.",
        },
        soundCue: "pour",
        reactionEffect: "color-change",
        effectTags: ["color-change"],
      },
      {
        id: "water-control",
        materialId: "unknown-a",
        toolId: "add-water",
        evidenceId: "water-no-answer",
        feedbackCard: {
          action: "You diluted Unknown A with distilled water.",
          result: "The solution stays clear and gives no useful classification clue.",
          why: "Water does not provide a distinctive acid-base indicator result here.",
          next: "Try a reagent that can produce diagnostic evidence.",
          notebook: "Distilled water produced no useful classification evidence.",
        },
        soundCue: "wrong-tool",
        reactionEffect: "dissolve",
      },
    ],
    stages: [
      {
        id: "test-unknown",
        title: "Test the unknown",
        goal: "Choose a reagent that can produce useful classification evidence.",
        materialIds: ["unknown-a"],
        toolIds: ["add-base", "add-water"],
        requiredEvidence: ["pink-and-warm"],
        nextPrompt: "Compare what each available reagent can tell you.",
      },
    ],
    conclusions: [
      {
        id: "acid",
        label: "Unknown A was an acid.",
        correct: true,
        requiresEvidence: ["pink-and-warm"],
        feedback:
          "Correct. The indicator and temperature evidence support neutralisation.",
      },
      {
        id: "neutral",
        label: "Unknown A was neutral.",
        correct: false,
        requiresEvidence: ["pink-and-warm"],
        feedback: "That conclusion does not explain the neutralisation evidence.",
      },
    ],
    notebook: {
      goal: "Identify Unknown A from an observable reaction, not its label.",
      hints: ["Choose the test that can produce a diagnostic colour or heat change."],
      explanation:
        "The collected colour and temperature evidence supports the final classification.",
    },
    stationVisuals: [
      {
        stationId: "beaker",
        kind: "beaker",
        label: "Unknown A",
        effectTags: ["color-change"],
      },
    ],
    completionMessage: "Unknown A identified from evidence.",
  },
};
