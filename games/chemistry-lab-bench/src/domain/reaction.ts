/**
 * The reaction engine. Pure: `applyAction(workspace, action, rules)` returns the
 * next workspace and a result, with no React, no Canvas, no mutation.
 *
 * Pattern adapted to TypeScript from the MIT-licensed nsriram/chem_lab (see
 * NOTICE): iterate a declarative, first-match-wins rule registry. One action
 * resolves at most one reaction (no auto-cascade): the first rule whose `on`
 * matches the action and whose `requires` are all present in the acted-on
 * station fires. A `react` transform consumes reagents, produces persistent
 * products in the station, routes emitted gases into a separate emissions list
 * (gas leaves the liquid — it is not added to contents), and sets the station's
 * colour and heat level. Multi-step chemistry emerges from the student taking
 * multiple actions, never from cascading here.
 */

import type { Action } from "../contracts/actions";
import type {
  Chemical,
  Emission,
  ReactionResult,
  Station,
  StationId,
  Workspace,
} from "../contracts/chemistry";
import type { ReactionRule } from "../contracts/experiment";

export interface ApplyResult {
  readonly workspace: Workspace;
  readonly result: ReactionResult;
}

/** The station a rule reads/writes for a given action. */
function stationIdFor(action: Action, rule: ReactionRule): StationId | null {
  const where = rule.at ?? "target";
  if (where === "target") {
    return "target" in action ? action.target : null;
  }
  return "source" in action ? action.source : null;
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
 * `chemicals` (the experiment's chemical list) is optional and only used to give
 * an emitted gas its label in the emission note; the engine works without it.
 */
export function applyAction(
  workspace: Workspace,
  action: Action,
  rules: readonly ReactionRule[],
  chemicals: readonly Chemical[] = [],
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

    return fire(workspace, rule, sid, poured, chemicals);
  }

  // No rule matched. Drop the poured reagent in so the student sees it landed,
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
          ? "The reagent settles in an otherwise empty beaker. Nothing reacts."
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
  rule: ReactionRule,
  stationId: StationId,
  pouredReagent: string | null,
  chemicals: readonly Chemical[],
): ApplyResult {
  const transform = rule.transform;
  const station = workspace.stations[stationId] ?? emptyStation();

  // Only `react` is implemented; the validator guarantees we never reach here
  // with another kind, but we guard defensively.
  if (transform.kind !== "react") {
    return {
      workspace,
      result: {
        observation: rule.observation,
        visibleChange: false,
        ...(rule.explanation ? { explanation: rule.explanation } : {}),
      },
    };
  }

  // New contents: station + poured reagent, minus consumed, plus produced.
  // Emitted gases never go in — they leave the liquid.
  const next = new Set(station.contents);
  if (pouredReagent) next.add(pouredReagent);
  for (const id of transform.consume) next.delete(id);
  for (const id of transform.produce) next.add(id);

  const emits: Emission[] = (transform.emits ?? []).map((gasId) => ({
    gas: gasId,
    observation: gasObservation(gasId, chemicals),
  }));

  const nextStation: Station = {
    ...station,
    contents: [...next],
    color: transform.newColor ?? station.color,
    heat: transform.heat ?? station.heat,
  };

  const result: ReactionResult = {
    observation: rule.observation,
    visibleChange: true,
    ...(transform.newColor ? { newColor: transform.newColor } : {}),
    ...(transform.heat ? { heat: transform.heat } : {}),
    ...(emits.length ? { emits } : {}),
    ...(rule.explanation ? { explanation: rule.explanation } : {}),
  };

  return { workspace: withStation(workspace, stationId, nextStation), result };
}

function gasObservation(
  gasId: string,
  chemicals: readonly Chemical[],
): string {
  const label = chemicals.find((c) => c.id === gasId)?.label ?? gasId;
  return `${label} gas bubbles out of the liquid.`;
}
