import { describe, expect, it } from "vitest";
import { torchLevel } from "../src/content/levels";
import { evaluateCircuit } from "../src/domain/circuit";
import {
  closeSwitch,
  createRepairState,
  placeCell,
  toCircuitGraph,
} from "../src/domain/repairState";

describe("Level 1 repair state", () => {
  it("starts with the cell out of its holder and the switch open", () => {
    const state = createRepairState(torchLevel);

    expect(state).toEqual({
      levelId: torchLevel.id,
      cellPlaced: false,
      switchClosed: false,
      phase: "editing",
    });
    expect(evaluateCircuit(toCircuitGraph(torchLevel, state)).classification).toBe(
      "open",
    );
  });

  it("requires both cell placement and a closed switch to activate the torch", () => {
    const withCell = placeCell(createRepairState(torchLevel));
    const cellOnlyEvidence = evaluateCircuit(toCircuitGraph(torchLevel, withCell));

    expect(cellOnlyEvidence.classification).toBe("open");
    expect(cellOnlyEvidence.activatedDeviceIds).toEqual([]);

    const ready = closeSwitch(withCell);
    const readyEvidence = evaluateCircuit(toCircuitGraph(torchLevel, ready));

    expect(readyEvidence.classification).toBe("complete");
    expect(readyEvidence.activatedDeviceIds).toEqual(["torch-lamp"]);
  });
});

