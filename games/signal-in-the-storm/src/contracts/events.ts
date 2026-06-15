import type { CircuitEvidence } from "./circuit";
import type { RepairLevelDefinition, WorldConsequence } from "./level";

export type GameCommand =
  | { readonly type: "load-level"; readonly level: RepairLevelDefinition }
  | { readonly type: "set-input-enabled"; readonly enabled: boolean };

export type GameEvent =
  | { readonly type: "board-ready"; readonly levelId: string }
  | {
      readonly type: "sequence-stage";
      readonly levelId: string;
      readonly stage: "current" | "device" | "room" | "response";
    }
  | {
      readonly type: "attempt-evaluated";
      readonly levelId: string;
      readonly evidence: CircuitEvidence;
    }
  | {
      readonly type: "consequence-triggered";
      readonly levelId: string;
      readonly consequence: WorldConsequence;
    }
  | { readonly type: "level-completed"; readonly levelId: string };
