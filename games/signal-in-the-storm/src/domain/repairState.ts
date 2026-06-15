import type { CircuitGraph } from "../contracts/circuit";
import type { RepairLevelDefinition } from "../contracts/level";

export interface RepairState {
  readonly levelId: string;
  readonly cellPlaced: boolean;
  readonly switchClosed: boolean;
  readonly phase: "editing" | "testing" | "complete";
}

export function createRepairState(level: RepairLevelDefinition): RepairState {
  return {
    levelId: level.id,
    cellPlaced: false,
    switchClosed: false,
    phase: "editing",
  };
}

export function placeCell(state: RepairState): RepairState {
  if (state.phase !== "editing") return state;
  return { ...state, cellPlaced: true };
}

export function closeSwitch(state: RepairState): RepairState {
  if (state.phase !== "editing") return state;
  return { ...state, switchClosed: true };
}

export function beginTest(state: RepairState): RepairState {
  if (state.phase !== "editing") return state;
  return { ...state, phase: "testing" };
}

export function completeRepair(state: RepairState): RepairState {
  return { ...state, phase: "complete" };
}

export function toCircuitGraph(
  level: RepairLevelDefinition,
  state: RepairState,
): CircuitGraph {
  const cell = level.circuit.components.find(
    (component) => component.id === level.interaction.cellComponentId,
  );
  const cellTerminals = new Set(cell?.terminalIds ?? []);

  return {
    components: level.circuit.components.map((component) =>
      component.id === level.interaction.switchComponentId
        ? { ...component, closed: state.switchClosed }
        : component,
    ),
    connections: state.cellPlaced
      ? level.circuit.connections
      : level.circuit.connections.filter(
          (connection) =>
            !cellTerminals.has(connection.from) &&
            !cellTerminals.has(connection.to),
        ),
  };
}

