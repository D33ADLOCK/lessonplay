import type { CircuitGraph } from "./circuit";

export interface RepairLevelDefinition {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly circuit: CircuitGraph;
  readonly successDeviceId: string;
  readonly consequence: WorldConsequence;
}

export interface WorldConsequence {
  readonly id: string;
  readonly kind: "device-restored";
  readonly targetId: string;
  readonly description: string;
}

