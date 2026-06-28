/**
 * The rule engine. Pure: `applyAction(workspace, action, rules)` returns the next
 * workspace and a result, with no React, no Canvas, no mutation.
 *
 * Pattern adapted to TypeScript from the MIT-licensed nsriram/chem_lab (see
 * NOTICE): iterate a declarative, first-match-wins rule registry. One action
 * resolves at most one transform (no auto-cascade): the first rule whose `on`
 * matches the action and whose `requires` are all present in the acted-on
 * station fires. Four transforms are implemented: `react` (consume inputs,
 * produce outputs, emit, set colour + heat), `split` (filtration — route a
 * station's contents to a residue + filtrate by solubility), `evaporate` (boil
 * down to the entities that `leaves`, driving the rest off as vapour), and
 * `distil` (boil the `volatile` entities off and recover them as liquid in a
 * collector — like evaporate, but the vapour is kept, not lost). Emitted
 * gases/vapours go to a separate emissions list — they leave the station, never
 * added to contents. Multi-step behaviour emerges from the learner taking
 * multiple actions, never from cascading here.
 */

import type { Action } from "../model/actions";
import type {
  Emission,
  Entity,
  Station,
  StationId,
  StepResult,
  Workspace,
} from "../model/entity";
import type { Rule } from "../model/scenario";

export interface ApplyResult {
  readonly workspace: Workspace;
  readonly result: StepResult;
}

/** The station a rule reads/writes for a given action. */
function stationIdFor(action: Action, rule: Rule): StationId | null {
  const where = rule.at ?? "target";
  if (where === "source" && "source" in action) return action.source;
  if (where === "target" && "target" in action) return action.target;
  // Fall back to whichever station the action carries, so a `filter` rule (no
  // target) resolves to its `source` even when `at` is left at its default.
  return primaryStationId(action);
}

/** The station an action primarily lands on (for empty / pour handling). */
function primaryStationId(action: Action): StationId | null {
  if ("target" in action) return action.target;
  if ("source" in action) return action.source;
  return null;
}

function requiresMet(
  station: Station,
  requires: readonly string[],
  pouredReagent: string | null,
): boolean {
  const present = new Set(station.contents);
  if (pouredReagent) present.add(pouredReagent);
  return requires.every((id) => present.has(id));
}

/**
 * Apply an action to the workspace.
 *
 * `entities` (the scenario's entity list) is optional and only used to give an
 * emitted gas its label in the emission note and to look up colours/solubility;
 * the engine works without it (rules carry everything they need).
 */
export function applyAction(
  workspace: Workspace,
  action: Action,
  rules: readonly Rule[],
  entities: readonly Entity[] = [],
): ApplyResult {
  const targetId = primaryStationId(action);
  const target = targetId ? workspace.stations[targetId] : undefined;

  // A pour drops its reagent into the target station; the reagent counts as
  // present for the rest of this action.
  const pouredReagent = action.type === "pour" ? action.reagent : null;

  for (const rule of rules) {
    if (rule.on !== action.type) continue;
    const sid = stationIdFor(action, rule);
    if (!sid) continue;
    const station = workspace.stations[sid];
    if (!station) continue;
    const poured = sid === targetId ? pouredReagent : null;
    if (!requiresMet(station, rule.requires, poured)) continue;

    return fire(workspace, rule, sid, poured, entities);
  }

  // No rule matched. Drop the poured reagent in so the learner sees it landed,
  // and return a gentle "nothing visible" nudge — or an empty-station note.
  if (action.type === "pour" && targetId) {
    const base = target ?? emptyStation();
    const wasEmpty = base.contents.length === 0;
    const contents = base.contents.includes(action.reagent)
      ? base.contents
      : [...base.contents, action.reagent];
    const nextWorkspace = withStation(workspace, targetId, {
      ...base,
      contents,
    });
    return {
      workspace: nextWorkspace,
      result: {
        observation: wasEmpty
          ? "The reagent settles in an otherwise empty vessel. Nothing reacts."
          : "No visible change. Try a different reagent.",
        visibleChange: false,
      },
    };
  }

  return {
    workspace,
    result: { observation: "Nothing happened.", visibleChange: false },
  };
}

function emptyStation(): Station {
  return { contents: [], color: "#dfe9f5", heat: "room" };
}

function withStation(
  workspace: Workspace,
  id: StationId,
  station: Station,
): Workspace {
  return { stations: { ...workspace.stations, [id]: station } };
}

function fire(
  workspace: Workspace,
  rule: Rule,
  stationId: StationId,
  pouredReagent: string | null,
  entities: readonly Entity[],
): ApplyResult {
  const transform = rule.transform;
  const station = workspace.stations[stationId] ?? emptyStation();

  switch (transform.kind) {
    case "react":
      return fireReact(workspace, rule, stationId, station, pouredReagent, entities);
    case "split":
      return fireSplit(workspace, rule, stationId, station, entities);
    case "evaporate":
      return fireEvaporate(workspace, rule, stationId, station, entities);
    case "distil":
      return fireDistil(workspace, rule, stationId, station, entities);
    default:
      // The validator guarantees we never reach here with a reserved kind, but
      // we guard defensively rather than throw.
      return {
        workspace,
        result: {
          observation: rule.observation,
          visibleChange: false,
          ...(rule.explanation ? { explanation: rule.explanation } : {}),
        },
      };
  }
}

/** `react`: consume inputs, produce outputs, emit, set colour + heat. */
function fireReact(
  workspace: Workspace,
  rule: Rule,
  stationId: StationId,
  station: Station,
  pouredReagent: string | null,
  entities: readonly Entity[],
): ApplyResult {
  const transform = rule.transform;
  if (transform.kind !== "react") return { workspace, result: nudge(rule) };

  // New contents: station + poured reagent, minus consumed, plus produced.
  // Emitted entities never go in — they leave the station.
  const next = new Set(station.contents);
  if (pouredReagent) next.add(pouredReagent);
  for (const id of transform.consume) next.delete(id);
  for (const id of transform.produce) next.add(id);

  const emits = emissionsFor(transform.emits, entities);

  const nextStation: Station = {
    ...station,
    contents: [...next],
    color: transform.newColor ?? station.color,
    heat: transform.heat ?? station.heat,
  };

  const result: StepResult = {
    observation: rule.observation,
    visibleChange: true,
    ...(transform.newColor ? { newColor: transform.newColor } : {}),
    ...(transform.heat ? { heat: transform.heat } : {}),
    ...(emits.length ? { emits } : {}),
    ...(rule.explanation ? { explanation: rule.explanation } : {}),
  };

  return { workspace: withStation(workspace, stationId, nextStation), result };
}

/**
 * `split` (filtration): route the source station's contents by solubility —
 * insoluble entities collect in `solidTo` (residue), everything else passes to
 * `liquidTo` (filtrate). Destination contents are merged, not overwritten, and
 * the source empties.
 */
function fireSplit(
  workspace: Workspace,
  rule: Rule,
  sourceId: StationId,
  source: Station,
  entities: readonly Entity[],
): ApplyResult {
  const transform = rule.transform;
  if (transform.kind !== "split") return { workspace, result: nudge(rule) };

  const solubilityOf = (id: string) =>
    entities.find((e) => e.id === id)?.solubility;

  const toSolid: string[] = [];
  const toLiquid: string[] = [];
  for (const id of source.contents) {
    if (solubilityOf(id) === "insoluble") toSolid.push(id);
    else toLiquid.push(id);
  }

  const solidStation = workspace.stations[transform.solidTo] ?? emptyStation();
  const liquidStation = workspace.stations[transform.liquidTo] ?? emptyStation();

  const stations: Record<StationId, Station> = {
    ...workspace.stations,
    [sourceId]: { ...source, contents: [], phase: "empty" },
    [transform.solidTo]: {
      ...solidStation,
      contents: mergeContents(solidStation.contents, toSolid),
      phase: "solid",
    },
    [transform.liquidTo]: {
      ...liquidStation,
      // The filtrate takes on the source's liquid colour so the solution reads.
      color: source.color,
      contents: mergeContents(liquidStation.contents, toLiquid),
      phase: "solution",
    },
  };

  const result: StepResult = {
    observation: rule.observation,
    visibleChange: true,
    ...(rule.explanation ? { explanation: rule.explanation } : {}),
  };

  return { workspace: { stations }, result };
}

/**
 * `evaporate`: keep only the `leaves` entities (e.g. salt crystals); drive off
 * everything else, routing `emits` to the result's emissions (the solvent
 * leaving as vapour). Sets the station's colour and heat.
 */
function fireEvaporate(
  workspace: Workspace,
  rule: Rule,
  stationId: StationId,
  station: Station,
  entities: readonly Entity[],
): ApplyResult {
  const transform = rule.transform;
  if (transform.kind !== "evaporate") return { workspace, result: nudge(rule) };

  const leaves = new Set(transform.leaves);
  const kept = station.contents.filter((id) => leaves.has(id));
  const emits = emissionsFor(transform.emits, entities);

  const nextStation: Station = {
    ...station,
    contents: kept,
    color: transform.newColor ?? station.color,
    heat: transform.heat ?? station.heat,
    phase: "solid",
  };

  const result: StepResult = {
    observation: rule.observation,
    visibleChange: true,
    ...(transform.newColor ? { newColor: transform.newColor } : {}),
    ...(transform.heat ? { heat: transform.heat } : {}),
    ...(emits.length ? { emits } : {}),
    ...(rule.explanation ? { explanation: rule.explanation } : {}),
  };

  return { workspace: withStation(workspace, stationId, nextStation), result };
}

/**
 * `distil`: heat a still pot so the `volatile` entities boil off and **condense
 * as a liquid** in the `collectTo` receiver — the distillate is recovered, not
 * lost. Everything else (a higher-boiling liquid, a dissolved solid) stays in
 * the source. The receiver takes the distillate's colour; the source takes its
 * `newColor`. Destination contents merge, never overwrite.
 */
function fireDistil(
  workspace: Workspace,
  rule: Rule,
  sourceId: StationId,
  source: Station,
  entities: readonly Entity[],
): ApplyResult {
  const transform = rule.transform;
  if (transform.kind !== "distil") return { workspace, result: nudge(rule) };

  const volatile = new Set(transform.volatile);
  const overTheTop = source.contents.filter((id) => volatile.has(id));
  const stayBehind = source.contents.filter((id) => !volatile.has(id));

  const receiver = workspace.stations[transform.collectTo] ?? emptyStation();
  // The receiver reads as the distillate's own liquid colour unless overridden.
  const distillateColor =
    transform.collectColor ??
    entities.find((e) => e.id === overTheTop[0])?.color ??
    receiver.color;

  const stations: Record<StationId, Station> = {
    ...workspace.stations,
    [sourceId]: {
      ...source,
      contents: stayBehind,
      color: transform.newColor ?? source.color,
      heat: transform.heat ?? "hot",
    },
    [transform.collectTo]: {
      ...receiver,
      contents: mergeContents(receiver.contents, overTheTop),
      color: distillateColor,
      phase: "solution",
    },
  };

  const result: StepResult = {
    observation: rule.observation,
    visibleChange: true,
    ...(transform.heat ? { heat: transform.heat } : {}),
    ...(rule.explanation ? { explanation: rule.explanation } : {}),
  };

  return { workspace: { stations }, result };
}

/** Map a transform's emitted ids into labelled emissions. */
function emissionsFor(
  gases: readonly string[] | undefined,
  entities: readonly Entity[],
): Emission[] {
  return (gases ?? []).map((gasId) => ({
    gas: gasId,
    observation: gasObservation(gasId, entities),
  }));
}

/** Add ids to a station's contents without duplicating what is already there. */
function mergeContents(
  existing: readonly string[],
  added: readonly string[],
): string[] {
  const set = new Set(existing);
  for (const id of added) set.add(id);
  return [...set];
}

/** A non-visible fallback result (used only on the defensive guard paths). */
function nudge(rule: Rule): StepResult {
  return {
    observation: rule.observation,
    visibleChange: false,
    ...(rule.explanation ? { explanation: rule.explanation } : {}),
  };
}

function gasObservation(gasId: string, entities: readonly Entity[]): string {
  const label = entities.find((e) => e.id === gasId)?.label ?? gasId;
  return `${label} gas bubbles out of the liquid.`;
}
