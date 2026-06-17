import type { RepairLevelDefinition } from "../contracts/level";

export const torchLevel: RepairLevelDefinition = {
  id: "emergency-torch",
  title: "Emergency Torch",
  objective: "Test the closed low-voltage torch circuit.",
  successDeviceId: "torch-lamp",
  interaction: {
    cellComponentId: "cell",
    switchComponentId: "switch",
  },
  circuit: {
    components: [
      { id: "cell", kind: "cell", terminalIds: ["cell-positive", "cell-negative"] },
      {
        id: "switch",
        kind: "switch",
        terminalIds: ["switch-in", "switch-out"],
        closed: true,
      },
      {
        id: "torch-lamp",
        kind: "lamp",
        terminalIds: ["lamp-in", "lamp-out"],
      },
    ],
    connections: [
      { from: "cell-positive", to: "switch-in" },
      { from: "switch-out", to: "lamp-in" },
      { from: "lamp-out", to: "cell-negative" },
    ],
  },
  consequence: {
    id: "torch-restored",
    kind: "device-restored",
    targetId: "emergency-torch",
    description: "The emergency torch glows, revealing the repair bench.",
  },
};
