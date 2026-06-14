import { describe, expect, it } from "vitest";
import { torchLevel } from "../src/content/levels";
import { evaluateCircuit } from "../src/domain/circuit";

describe("evaluateCircuit", () => {
  it("classifies the closed torch loop and activates its load", () => {
    expect(evaluateCircuit(torchLevel.circuit)).toMatchObject({
      classification: "complete",
      activatedDeviceIds: ["torch-lamp"],
    });
  });

  it("reports an open circuit when the switch is open", () => {
    const graph = {
      ...torchLevel.circuit,
      components: torchLevel.circuit.components.map((component) =>
        component.kind === "switch" ? { ...component, closed: false } : component,
      ),
    };
    expect(evaluateCircuit(graph)).toMatchObject({
      classification: "open",
      activatedDeviceIds: [],
    });
  });
});

