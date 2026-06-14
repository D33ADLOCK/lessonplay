export type CircuitComponentKind = "cell" | "switch" | "lamp";

export interface CircuitComponent {
  readonly id: string;
  readonly kind: CircuitComponentKind;
  readonly terminalIds: readonly [string, string];
  readonly closed?: boolean;
}

export interface CircuitConnection {
  readonly from: string;
  readonly to: string;
}

export interface CircuitGraph {
  readonly components: readonly CircuitComponent[];
  readonly connections: readonly CircuitConnection[];
}

export type CircuitClassification =
  | "complete"
  | "open"
  | "invalid";

export interface CircuitEvidence {
  readonly classification: CircuitClassification;
  readonly energizedTerminalIds: readonly string[];
  readonly gapTerminalIds: readonly string[];
  readonly activatedDeviceIds: readonly string[];
  readonly reason: string;
}

