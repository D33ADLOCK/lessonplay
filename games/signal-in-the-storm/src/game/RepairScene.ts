import Phaser from "phaser";
import type { GameCommand } from "../contracts/events";
import type { RepairLevelDefinition } from "../contracts/level";
import { GameBridge } from "../bridge/GameBridge";
import { createRepairAttemptEvents } from "../domain/repairAttempt";

export class RepairScene extends Phaser.Scene {
  private level?: RepairLevelDefinition;
  private unsubscribe?: () => void;
  private inputEnabled = true;
  private status?: Phaser.GameObjects.Text;

  constructor(private readonly bridge: GameBridge) {
    super("repair");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#101b32");
    this.add
      .text(180, 70, "REPAIR BOARD", {
        color: "#f5c76f",
        fontFamily: "system-ui",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.status = this.add
      .text(180, 155, "Story briefing active", {
        align: "center",
        color: "#dbe9ff",
        fontFamily: "system-ui",
        fontSize: "19px",
        wordWrap: { width: 290 },
      })
      .setOrigin(0.5);

    const testButton = this.add
      .rectangle(180, 360, 270, 72, 0xe5a847)
      .setStrokeStyle(3, 0x6b3e1f)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(180, 360, "TEST CIRCUIT", {
        color: "#1d2538",
        fontFamily: "system-ui",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    testButton.on("pointerdown", () => this.testCircuit());
    this.unsubscribe = this.bridge.onCommand((command) => this.handleCommand(command));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private handleCommand(command: GameCommand): void {
    if (!this.sys.isActive() || !this.status?.active) {
      this.dispose();
      return;
    }
    if (command.type === "set-input-enabled") {
      this.inputEnabled = command.enabled;
      return;
    }
    this.level = command.level;
    this.status?.setText(`${command.level.title}\n${command.level.objective}`);
    this.bridge.emit({ type: "board-ready", levelId: command.level.id });
  }

  private testCircuit(): void {
    if (!this.level || !this.inputEnabled) return;
    this.inputEnabled = false;
    const events = createRepairAttemptEvents(this.level);
    const attempt = events.find((event) => event.type === "attempt-evaluated");
    if (attempt?.type === "attempt-evaluated") {
      this.status?.setText(attempt.evidence.reason);
    }
    events.forEach((event) => this.bridge.emit(event));
  }
}
