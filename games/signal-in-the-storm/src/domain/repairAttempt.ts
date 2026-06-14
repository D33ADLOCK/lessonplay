import type { GameEvent } from "../contracts/events";
import type { RepairLevelDefinition } from "../contracts/level";
import { evaluateCircuit } from "./circuit";

export function createRepairAttemptEvents(
  level: RepairLevelDefinition,
): readonly GameEvent[] {
  const evidence = evaluateCircuit(level.circuit);
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

