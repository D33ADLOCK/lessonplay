import type {
  GuidedLabMissionPresentation,
  Scenario,
  StationId,
  StationVisual,
  StationVisualKind,
} from "@learn-loop/core";

export const LEARN_LOOP_STATION_VISUAL_KINDS = [
  "beaker",
  "flask",
  "filter",
  "dish",
  "tube",
  "jar",
  "tray",
] as const;

export type LearnLoopStationVisualKind =
  (typeof LEARN_LOOP_STATION_VISUAL_KINDS)[number];

export interface LearnLoopStationPresentation {
  readonly stationId: StationId;
  readonly label?: string;
  readonly kind?: unknown;
  readonly role?: unknown;
}

export interface LearnLoopPresentationInput {
  readonly stations?: readonly LearnLoopStationPresentation[];
}

export type LearnLoopStationRole = "source" | "process" | "output";

export interface NormalizedLearnLoopStationPresentation {
  readonly stationId: StationId;
  readonly label: string;
  readonly kind: LearnLoopStationVisualKind;
  readonly role: LearnLoopStationRole;
}

export interface LearnLoopPresentationDiagnostic {
  readonly path: string;
  readonly received: unknown;
  readonly fallback: string;
  readonly allowed: readonly string[];
}

export interface NormalizedLearnLoopPresentation {
  readonly stations: readonly NormalizedLearnLoopStationPresentation[];
  readonly diagnostics: readonly LearnLoopPresentationDiagnostic[];
}

const STATION_ROLES = ["source", "process", "output"] as const;

export function createLearnLoopTemplatePresentation(
  presentation: Pick<GuidedLabMissionPresentation, "stationVisuals">,
): LearnLoopPresentationInput {
  return {
    stations: presentation.stationVisuals.map((station, index) => ({
      stationId: station.stationId,
      label: station.label,
      kind: toLearnLoopStationKind(station.kind),
      role: inferVisualRole(index, presentation.stationVisuals.length),
    })),
  };
}

export function createLearnLoopStationPresentation(
  station: Pick<StationVisual, "stationId" | "kind" | "label">,
  index = 0,
  total = 1,
): LearnLoopStationPresentation {
  return {
    stationId: station.stationId,
    label: station.label,
    kind: toLearnLoopStationKind(station.kind),
    role: inferVisualRole(index, total),
  };
}

export function normalizeLearnLoopPresentation(
  scenario: Scenario,
  input: LearnLoopPresentationInput = {},
): NormalizedLearnLoopPresentation {
  const diagnostics: LearnLoopPresentationDiagnostic[] = [];
  const stationInputs = new Map(
    (input.stations ?? []).map((station) => [station.stationId, station]),
  );
  const stationIds = Object.keys(scenario.stations);

  return {
    stations: stationIds.map((stationId, index) => {
      const stationInput = stationInputs.get(stationId);
      const fallbackKind = inferStationKind(stationId);
      const fallbackRole = inferStationRole(stationId, index, stationIds.length);

      return {
        stationId,
        label: stationInput?.label?.trim() || labelFromId(stationId),
        kind: normalizePresentationToken({
          path: `stations.${stationId}.kind`,
          received: stationInput?.kind,
          allowed: LEARN_LOOP_STATION_VISUAL_KINDS,
          fallback: fallbackKind,
          diagnostics,
        }),
        role: normalizePresentationToken({
          path: `stations.${stationId}.role`,
          received: stationInput?.role,
          allowed: STATION_ROLES,
          fallback: fallbackRole,
          diagnostics,
        }),
      };
    }),
    diagnostics,
  };
}

function normalizePresentationToken<const TToken extends string>(options: {
  readonly path: string;
  readonly received: unknown;
  readonly allowed: readonly TToken[];
  readonly fallback: TToken;
  readonly diagnostics: LearnLoopPresentationDiagnostic[];
}): TToken {
  if (options.received === undefined) {
    return options.fallback;
  }

  if (
    typeof options.received === "string" &&
    (options.allowed as readonly string[]).includes(options.received)
  ) {
    return options.received as TToken;
  }

  options.diagnostics.push({
    path: options.path,
    received: options.received,
    fallback: options.fallback,
    allowed: options.allowed,
  });

  return options.fallback;
}

function inferStationKind(stationId: StationId): LearnLoopStationVisualKind {
  const normalized = stationId.toLowerCase();
  if (normalized.includes("filter") || normalized.includes("residue")) return "filter";
  if (normalized.includes("dish") || normalized.includes("filtrate")) return "dish";
  if (normalized.includes("flask")) return "flask";
  if (normalized.includes("tube")) return "tube";
  if (normalized.includes("jar")) return "jar";
  if (normalized.includes("tray")) return "tray";
  return "beaker";
}

function toLearnLoopStationKind(
  kind: StationVisualKind,
): LearnLoopStationVisualKind {
  if (kind === "test-tube") return "tube";
  if (kind === "evaporating-dish") return "dish";
  if (kind === "receiver") return "jar";
  if (kind === "distillation") return "flask";
  if (kind === "paper") return "tray";
  if (kind === "condenser") return "tube";
  if (kind === "burner") return "tray";
  if (kind === "magnet") return "tray";
  return kind;
}

function inferVisualRole(
  index: number,
  total: number,
): LearnLoopStationRole {
  if (index === 0) return "source";
  if (index === total - 1) return "output";
  return "process";
}

function inferStationRole(
  stationId: StationId,
  index: number,
  total: number,
): LearnLoopStationRole {
  const normalized = stationId.toLowerCase();
  if (
    normalized.includes("residue") ||
    normalized.includes("filtrate") ||
    normalized.includes("receiver") ||
    normalized.includes("output")
  ) {
    return "output";
  }
  if (index === 0) return "source";
  if (index === total - 1) return "output";
  return "process";
}

function labelFromId(id: string): string {
  return id
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}
