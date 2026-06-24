import type { ActionType } from "./actions";
import type { EntityId, StationId } from "./entity";
import type { Scenario, ValidationResult } from "./scenario";
import {
  GUIDED_LAB_EFFECT_TAGS,
  STATION_VISUAL_KINDS,
  type GuidedLabEffectTag,
  type StationVisual,
  type StationVisualKind,
} from "./guidedLabPresentation";

export const SANDBOX_LAB_EFFECT_TAGS = [
  ...GUIDED_LAB_EFFECT_TAGS,
] as const;

export type SandboxLabEffectTag = (typeof SANDBOX_LAB_EFFECT_TAGS)[number];

export const SANDBOX_LAB_REACTION_EFFECTS = [
  "dissolve",
  "settle",
  "filter-residue",
  "heat",
  "vapour",
  "gas",
  "gas-bubbles",
  "crystals",
  "light-scatter",
  "chromatography-bands",
  "color-change",
  "magnetic-pull",
] as const;

export type SandboxLabReactionEffect =
  (typeof SANDBOX_LAB_REACTION_EFFECTS)[number];

export const SANDBOX_LAB_SOUND_CUES = [
  "pour",
  "filter",
  "heat",
  "cool",
  "wait",
  "light",
  "chromatograph",
  "success",
  "wrong-tool",
  "stage-complete",
] as const;

export type SandboxLabSoundCue = (typeof SANDBOX_LAB_SOUND_CUES)[number];

export interface SandboxLabMaterial {
  readonly id: string;
  /** Public label shown before the learner reaches a supported conclusion. */
  readonly label: string;
  readonly stationId: StationId;
  readonly description?: string;
  /**
   * Private authoring metadata for mystery samples. The UI must not display
   * this value until the investigation has been concluded successfully.
   */
  readonly hiddenIdentity?: {
    readonly revealLabel: string;
    /** Additional answer phrases that must not appear in pre-conclusion copy. */
    readonly forbiddenTerms?: readonly string[];
  };
}

export type SandboxLabToolAction =
  | { readonly type: "pour"; readonly reagent: EntityId; readonly target?: StationId }
  | { readonly type: "filter"; readonly source?: StationId }
  | {
      readonly type: Extract<
        ActionType,
        "heat" | "cool" | "wait" | "shineLight" | "chromatograph"
      >;
      readonly target?: StationId;
    };

export interface SandboxLabTool {
  readonly id: string;
  readonly label: string;
  readonly action: SandboxLabToolAction;
  readonly description?: string;
}

export interface SandboxLabInteraction {
  readonly id: string;
  readonly materialId: string;
  readonly toolId: string;
  readonly evidenceId: string;
  readonly feedbackCard: SandboxLabFeedbackCard;
  readonly soundCue: SandboxLabSoundCue;
  readonly reactionEffect: SandboxLabReactionEffect;
  readonly observation?: string;
  readonly explanation?: string;
  readonly effectTags?: readonly SandboxLabEffectTag[];
  readonly gasLabel?: string;
}

export interface SandboxLabFeedbackCard {
  readonly action: string;
  readonly result: string;
  readonly why: string;
  readonly next: string;
  readonly notebook: string;
}

export interface SandboxLabConclusion {
  readonly id: string;
  readonly label: string;
  readonly correct: boolean;
  readonly requiresEvidence: readonly string[];
  readonly feedback: string;
}

export interface SandboxLabNotebook {
  readonly goal: string;
  readonly hints?: readonly string[];
  readonly explanation?: string;
}

export interface SandboxLabStage {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
  readonly materialIds: readonly string[];
  readonly toolIds: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly nextPrompt: string;
}

export interface SandboxLabMissionPresentation {
  readonly scenarioId: string;
  /**
   * Investigation mode enables the stronger mystery -> evidence -> conclusion
   * contract. Guided process labs remain supported for procedural activities.
   */
  readonly mode?: "guided-process" | "investigation";
  readonly badge?: string;
  readonly question: string;
  readonly materials: readonly SandboxLabMaterial[];
  readonly tools: readonly SandboxLabTool[];
  readonly interactions: readonly SandboxLabInteraction[];
  readonly stages: readonly SandboxLabStage[];
  readonly conclusions: readonly SandboxLabConclusion[];
  readonly notebook: SandboxLabNotebook;
  readonly stationVisuals: readonly StationVisual[];
  readonly completionMessage?: string;
}

export interface SandboxLabMission {
  readonly scenario: Scenario;
  readonly presentation: SandboxLabMissionPresentation;
}

export interface SandboxLabGame {
  readonly title: string;
  readonly eyebrow?: string;
  readonly missions: readonly SandboxLabMission[];
}

const stationVisualKinds = new Set<string>(STATION_VISUAL_KINDS);
const effectTags = new Set<string>(SANDBOX_LAB_EFFECT_TAGS);
const reactionEffects = new Set<string>(SANDBOX_LAB_REACTION_EFFECTS);
const soundCues = new Set<string>(SANDBOX_LAB_SOUND_CUES);

export function validateSandboxLabPresentation(
  scenario: Scenario,
  presentation: SandboxLabMissionPresentation,
): ValidationResult {
  const errors: string[] = [];

  if (presentation.scenarioId !== scenario.id) {
    errors.push(
      `presentation.scenarioId "${presentation.scenarioId}" must match scenario "${scenario.id}"`,
    );
  }

  const stationIds = new Set(Object.keys(scenario.stations));
  const entityIds = new Set(scenario.entities.map((entity) => entity.id));
  const materialIds = new Set<string>();
  const toolIds = new Set<string>();
  const interactionEvidence = new Set<string>();
  const interactionsByEvidence = new Map<string, SandboxLabInteraction>();
  const investigation = presentation.mode === "investigation";
  const hiddenMaterials = presentation.materials.filter(
    (material) => material.hiddenIdentity,
  );

  if (!presentation.materials.length) {
    errors.push("presentation.materials must include at least one material");
  }
  if (!presentation.tools.length) {
    errors.push("presentation.tools must include at least one tool");
  }
  if (!presentation.interactions.length) {
    errors.push("presentation.interactions must include at least one interaction");
  }
  if (!presentation.question?.trim()) {
    errors.push("presentation.question must ask one simple mission question");
  }
  if (!presentation.stages.length) {
    errors.push("presentation.stages must include at least one stage");
  }
  if (presentation.stages.length > 4) {
    errors.push("presentation.stages should include no more than four stages");
  }
  if (!presentation.conclusions.length) {
    errors.push("presentation.conclusions must include at least one conclusion");
  }
  if (investigation && !hiddenMaterials.length) {
    errors.push(
      "investigation presentations must include at least one material with hiddenIdentity",
    );
  }

  for (const material of presentation.materials) {
    if (materialIds.has(material.id)) {
      errors.push(`material "${material.id}" is duplicated`);
    }
    materialIds.add(material.id);
    if (!stationIds.has(material.stationId)) {
      errors.push(`material "${material.id}" uses unknown station "${material.stationId}"`);
    }
    if (material.hiddenIdentity) {
      const revealLabel = material.hiddenIdentity.revealLabel.trim();
      if (!revealLabel) {
        errors.push(`material "${material.id}" hiddenIdentity must include a revealLabel`);
      }
      if (containsTerm(material.label, revealLabel)) {
        errors.push(
          `material "${material.id}" public label must not reveal "${revealLabel}"`,
        );
      }
    }
  }

  for (const tool of presentation.tools) {
    if (toolIds.has(tool.id)) {
      errors.push(`tool "${tool.id}" is duplicated`);
    }
    toolIds.add(tool.id);
    if (tool.action.type === "pour" && !entityIds.has(tool.action.reagent)) {
      errors.push(`tool "${tool.id}" pours unknown entity "${tool.action.reagent}"`);
    }
    if ("target" in tool.action && tool.action.target && !stationIds.has(tool.action.target)) {
      errors.push(`tool "${tool.id}" uses unknown target "${tool.action.target}"`);
    }
    if ("source" in tool.action && tool.action.source && !stationIds.has(tool.action.source)) {
      errors.push(`tool "${tool.id}" uses unknown source "${tool.action.source}"`);
    }
  }

  for (const interaction of presentation.interactions) {
    if (!materialIds.has(interaction.materialId)) {
      errors.push(
        `interaction "${interaction.id}" uses unknown material "${interaction.materialId}"`,
      );
    }
    if (!toolIds.has(interaction.toolId)) {
      errors.push(`interaction "${interaction.id}" uses unknown tool "${interaction.toolId}"`);
    }
    interactionEvidence.add(interaction.evidenceId);
    interactionsByEvidence.set(interaction.evidenceId, interaction);
    if (!interaction.feedbackCard) {
      errors.push(`interaction "${interaction.id}" must include a feedback card`);
    } else {
      if (!interaction.feedbackCard.action.trim()) {
        errors.push(`interaction "${interaction.id}" feedback must include an action`);
      }
      if (!interaction.feedbackCard.result.trim()) {
        errors.push(`interaction "${interaction.id}" feedback must include a result`);
      }
      if (!interaction.feedbackCard.why.trim()) {
        errors.push(`interaction "${interaction.id}" feedback must include why it matters`);
      }
      if (!interaction.feedbackCard.next.trim()) {
        errors.push(`interaction "${interaction.id}" feedback must include a next step`);
      }
      if (!interaction.feedbackCard.notebook.trim()) {
        errors.push(`interaction "${interaction.id}" feedback must include notebook evidence`);
      }
    }
    if (!soundCues.has(interaction.soundCue)) {
      errors.push(
        `interaction "${interaction.id}" uses unknown sound cue "${interaction.soundCue}"`,
      );
    }
    if (!reactionEffects.has(interaction.reactionEffect)) {
      errors.push(
        `interaction "${interaction.id}" uses unknown reaction effect "${interaction.reactionEffect}"`,
      );
    }
    for (const tag of interaction.effectTags ?? []) {
      if (!effectTags.has(tag)) {
        errors.push(`interaction "${interaction.id}" uses unknown effect tag "${tag}"`);
      }
    }
  }

  const stageIds = new Set<string>();
  for (const stage of presentation.stages) {
    if (stageIds.has(stage.id)) {
      errors.push(`stage "${stage.id}" is duplicated`);
    }
    stageIds.add(stage.id);
    if (!stage.title.trim()) {
      errors.push(`stage "${stage.id}" must include a title`);
    }
    if (!stage.goal.trim()) {
      errors.push(`stage "${stage.id}" must include a simple goal`);
    }
    if (!stage.nextPrompt.trim()) {
      errors.push(`stage "${stage.id}" must include a next prompt`);
    }
    if (!stage.materialIds.length) {
      errors.push(`stage "${stage.id}" must show at least one material`);
    }
    if (!stage.toolIds.length) {
      errors.push(`stage "${stage.id}" must show at least one tool`);
    }
    if (!stage.requiredEvidence.length) {
      errors.push(`stage "${stage.id}" must require at least one evidence id`);
    }
    if (
      investigation &&
      stage.materialIds.length * stage.toolIds.length < 2
    ) {
      errors.push(
        `investigation stage "${stage.id}" must offer at least two material/tool choices`,
      );
    }
    for (const materialId of stage.materialIds) {
      if (!materialIds.has(materialId)) {
        errors.push(`stage "${stage.id}" uses unknown material "${materialId}"`);
      }
    }
    for (const toolId of stage.toolIds) {
      if (!toolIds.has(toolId)) {
        errors.push(`stage "${stage.id}" uses unknown tool "${toolId}"`);
      }
    }
    for (const evidenceId of stage.requiredEvidence) {
      if (!interactionEvidence.has(evidenceId)) {
        errors.push(
          `stage "${stage.id}" requires evidence "${evidenceId}" that cannot be collected`,
        );
      } else if (investigation) {
        const interaction = interactionsByEvidence.get(evidenceId);
        if (
          interaction &&
          (!stage.materialIds.includes(interaction.materialId) ||
            !stage.toolIds.includes(interaction.toolId))
        ) {
          errors.push(
            `investigation stage "${stage.id}" requires evidence "${evidenceId}" from a choice that is not visible in that stage`,
          );
        }
      }
    }
  }

  for (const conclusion of presentation.conclusions) {
    for (const evidenceId of conclusion.requiresEvidence) {
      if (!interactionEvidence.has(evidenceId)) {
        errors.push(
          `conclusion "${conclusion.id}" requires unknown evidence "${evidenceId}"`,
        );
      }
    }
  }

  if (!presentation.conclusions.some((conclusion) => conclusion.correct)) {
    errors.push("presentation.conclusions must include at least one correct conclusion");
  }
  if (investigation) {
    const correctConclusions = presentation.conclusions.filter(
      (conclusion) => conclusion.correct,
    );
    if (presentation.conclusions.length < 2) {
      errors.push(
        "investigation presentations must include at least two conclusion choices",
      );
    }
    if (correctConclusions.length !== 1) {
      errors.push(
        `investigation presentations must include exactly one correct conclusion (found ${correctConclusions.length})`,
      );
    }

    const requiredEvidence = new Set(
      presentation.stages.flatMap((stage) => stage.requiredEvidence),
    );
    for (const conclusion of correctConclusions) {
      const conclusionEvidence = new Set(conclusion.requiresEvidence);
      for (const evidenceId of requiredEvidence) {
        if (!conclusionEvidence.has(evidenceId)) {
          errors.push(
            `correct conclusion "${conclusion.id}" must require stage evidence "${evidenceId}"`,
          );
        }
      }
    }

    const authoredWrongChoice = presentation.interactions.some(
      (interaction) =>
        !presentation.stages.some((stage) =>
          stage.requiredEvidence.includes(interaction.evidenceId),
        ),
    );
    if (!authoredWrongChoice) {
      errors.push(
        "investigation presentations must author at least one specific non-solution interaction",
      );
    }

    for (const material of hiddenMaterials) {
      const identity = material.hiddenIdentity!;
      const forbiddenTerms = [
        identity.revealLabel,
        ...(identity.forbiddenTerms ?? []),
      ].filter((term) => term.trim().length > 0);
      for (const entry of preConclusionCopy(scenario, presentation)) {
        for (const term of forbiddenTerms) {
          if (containsTerm(entry.text, term)) {
            errors.push(
              `${entry.path} reveals hidden answer "${term}" for material "${material.id}"`,
            );
          }
        }
      }
    }
  }

  if (!presentation.stationVisuals.length) {
    errors.push("presentation.stationVisuals must include at least one station");
  }

  const seenStations = new Set<string>();
  for (const visual of presentation.stationVisuals) {
    if (!stationIds.has(visual.stationId)) {
      errors.push(
        `station visual "${visual.stationId}" does not exist in scenario.stations`,
      );
    }
    if (seenStations.has(visual.stationId)) {
      errors.push(`station visual "${visual.stationId}" is duplicated`);
    }
    seenStations.add(visual.stationId);
    if (!stationVisualKinds.has(visual.kind as StationVisualKind)) {
      errors.push(`station visual "${visual.stationId}" uses unknown kind "${visual.kind}"`);
    }
    for (const tag of visual.effectTags ?? []) {
      if (!effectTags.has(tag as GuidedLabEffectTag)) {
        errors.push(`station visual "${visual.stationId}" uses unknown effect tag "${tag}"`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function containsTerm(text: string | undefined, term: string): boolean {
  if (!text?.trim() || !term.trim()) return false;
  return text.toLocaleLowerCase().includes(term.trim().toLocaleLowerCase());
}

function preConclusionCopy(
  scenario: Scenario,
  presentation: SandboxLabMissionPresentation,
): readonly { readonly path: string; readonly text: string | undefined }[] {
  return [
    { path: "scenario.title", text: scenario.title },
    { path: "scenario.concept", text: scenario.concept },
    { path: "presentation.question", text: presentation.question },
    { path: "presentation.notebook.goal", text: presentation.notebook.goal },
    ...(presentation.notebook.hints ?? []).map((text, index) => ({
      path: `presentation.notebook.hints[${index}]`,
      text,
    })),
    ...presentation.materials.flatMap((material) => [
      {
        path: `material "${material.id}" label`,
        text: material.label,
      },
      {
        path: `material "${material.id}" description`,
        text: material.description,
      },
    ]),
    ...presentation.stages.flatMap((stage) => [
      { path: `stage "${stage.id}" title`, text: stage.title },
      { path: `stage "${stage.id}" goal`, text: stage.goal },
      { path: `stage "${stage.id}" nextPrompt`, text: stage.nextPrompt },
    ]),
    ...presentation.stationVisuals.map((visual) => ({
      path: `station visual "${visual.stationId}" label`,
      text: visual.label,
    })),
  ];
}
