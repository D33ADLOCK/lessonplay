import type { Scenario, ValidationResult } from "./scenario";

export const STATION_VISUAL_KINDS = [
  "test-tube",
  "beaker",
  "dish",
  "evaporating-dish",
  "filter",
  "distillation",
  "condenser",
  "burner",
  "paper",
  "receiver",
  "magnet",
] as const;

export type StationVisualKind = (typeof STATION_VISUAL_KINDS)[number];

export const GUIDED_LAB_EFFECT_TAGS = [
  "scatter-light",
  "settle-particles",
  "trap-residue",
  "grow-crystals",
  "distil-vapour",
  "chromatography-bands",
  "gas-bubbles",
  "gas-up-arrow",
  "dissolve",
  "heat",
  "vapour",
  "filter-residue",
  "color-change",
  "magnetic-pull",
] as const;

export type GuidedLabEffectTag = (typeof GUIDED_LAB_EFFECT_TAGS)[number];

export const GUIDED_LAB_APPARATUS_LABELS = {
  "test-tube": "Test tube",
  beaker: "Beaker",
  dish: "Dish",
  "evaporating-dish": "Evaporating dish",
  filter: "Filter",
  distillation: "Distillation flask",
  condenser: "Condenser",
  burner: "Burner",
  paper: "Chromatography paper",
  receiver: "Receiver",
  magnet: "Magnet",
} as const satisfies Record<StationVisualKind, string>;

export const GUIDED_LAB_REACTION_LABELS = {
  "scatter-light": "Light scatters",
  "settle-particles": "Particles settle",
  "trap-residue": "Residue is trapped",
  "grow-crystals": "Crystals grow",
  "distil-vapour": "Vapour condenses",
  "chromatography-bands": "Bands separate",
  "gas-bubbles": "Gas bubbles form",
  "gas-up-arrow": "Gas rises",
  dissolve: "Solid dissolves",
  heat: "Heat is applied",
  vapour: "Vapour rises",
  "filter-residue": "Filter catches residue",
  "color-change": "Colour changes",
  "magnetic-pull": "Magnet pulls metal",
} as const satisfies Record<GuidedLabEffectTag, string>;

export interface StationVisual {
  readonly stationId: string;
  readonly kind: StationVisualKind;
  readonly label?: string;
  readonly effectTags?: readonly GuidedLabEffectTag[];
}

export interface GuidedLabMissionPresentation {
  readonly scenarioId: string;
  readonly badge?: string;
  readonly stationVisuals: readonly StationVisual[];
  readonly completionMessage?: string;
}

export interface GuidedLabMission {
  readonly scenario: Scenario;
  readonly presentation: GuidedLabMissionPresentation;
}

export interface GuidedLabGame {
  readonly title: string;
  readonly eyebrow?: string;
  readonly missions: readonly GuidedLabMission[];
}

const stationVisualKinds = new Set<string>(STATION_VISUAL_KINDS);
const effectTags = new Set<string>(GUIDED_LAB_EFFECT_TAGS);

export function validateGuidedLabPresentation(
  scenario: Scenario,
  presentation: GuidedLabMissionPresentation,
): ValidationResult {
  const errors: string[] = [];

  if (presentation.scenarioId !== scenario.id) {
    errors.push(
      `presentation.scenarioId "${presentation.scenarioId}" must match scenario "${scenario.id}"`,
    );
  }

  if (!presentation.stationVisuals.length) {
    errors.push("presentation.stationVisuals must include at least one station");
  }

  const scenarioStations = new Set(Object.keys(scenario.stations));
  const seenStations = new Set<string>();

  for (const visual of presentation.stationVisuals) {
    if (!scenarioStations.has(visual.stationId)) {
      errors.push(
        `station visual "${visual.stationId}" does not exist in scenario.stations`,
      );
    }
    if (seenStations.has(visual.stationId)) {
      errors.push(`station visual "${visual.stationId}" is duplicated`);
    }
    seenStations.add(visual.stationId);

    if (!stationVisualKinds.has(visual.kind)) {
      errors.push(`station visual "${visual.stationId}" uses unknown kind "${visual.kind}"`);
    }

    for (const tag of visual.effectTags ?? []) {
      if (!effectTags.has(tag)) {
        errors.push(`station visual "${visual.stationId}" uses unknown effect tag "${tag}"`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
