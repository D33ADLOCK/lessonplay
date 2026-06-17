import type { GameEvent } from "../contracts/events";
import type { CircuitGraph } from "../contracts/circuit";
import type { RepairLevelDefinition } from "../contracts/level";
import { evaluateCircuit } from "./circuit";

export function createRepairAttemptEvents(
  level: RepairLevelDefinition,
  graph: CircuitGraph = level.circuit,
): readonly GameEvent[] {
  const evidence = evaluateCircuit(graph);
  const events: GameEvent[] = [
    { type: "attempt-evaluated", levelId: level.id, evidence },
  ];

  if (
    evidence.classification === "complete" &&
    evidence.activatedDeviceIds.includes(level.successDeviceId)
  ) {
    events.push({
      type: "consequence-triggered",
      levelId: level.id,
      consequence: level.consequence,
    });
    events.push({ type: "level-completed", levelId: level.id });
  }
  return events;
}
