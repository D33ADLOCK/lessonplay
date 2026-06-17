import Phaser from "phaser";
import { GameBridge } from "../bridge/GameBridge";
import type { GameCommand, GameEvent } from "../contracts/events";
import type { RepairLevelDefinition } from "../contracts/level";
import { createRepairAttemptEvents } from "../domain/repairAttempt";
import {
  beginTest,
  closeSwitch,
  completeRepair,
  createRepairState,
  placeCell,
  toCircuitGraph,
  type RepairState,
} from "../domain/repairState";

const CELL_HOME = { x: 75, y: 348 };
const CELL_SLOT = { x: 87, y: 226 };
const CIRCUIT_POINTS = [
  new Phaser.Math.Vector2(87, 226),
  new Phaser.Math.Vector2(87, 137),
  new Phaser.Math.Vector2(257, 137),
  new Phaser.Math.Vector2(257, 226),
  new Phaser.Math.Vector2(257, 300),
  new Phaser.Math.Vector2(87, 300),
  new Phaser.Math.Vector2(87, 226),
];

export class RepairScene extends Phaser.Scene {
  private level?: RepairLevelDefinition;
  private state?: RepairState;
  private unsubscribe?: () => void;
  private inputEnabled = true;
  private status?: Phaser.GameObjects.Text;
  private cell?: Phaser.GameObjects.Container;
  private draggingCell = false;
  private switchLever?: Phaser.GameObjects.Rectangle;
  private switchLabel?: Phaser.GameObjects.Text;
  private testButton?: Phaser.GameObjects.Rectangle;
  private testLabel?: Phaser.GameObjects.Text;
  private lampGlow?: Phaser.GameObjects.Arc;
  private roomLight?: Phaser.GameObjects.Rectangle;
  private slotHalo?: Phaser.GameObjects.Arc;
  private lastPointer?: { readonly x: number; readonly y: number };

  constructor(private readonly bridge: GameBridge) {
    super("repair");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0b1527");
    this.drawWorkbench();
    this.createCircuitPath();
    this.createCell();
    this.createSwitch();
    this.createTorch();
    this.createTestButton();
    this.createCellInput();

    this.unsubscribe = this.bridge.onCommand((command) => this.handleCommand(command));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private drawWorkbench(): void {
    this.add.rectangle(180, 260, 332, 334, 0x17263d).setStrokeStyle(4, 0x617b9d);
    this.add.rectangle(180, 111, 302, 42, 0x203550);
    this.add
      .text(180, 105, "EMERGENCY TORCH · SAFE LOW-VOLTAGE KIT", {
        color: "#f4c66d",
        fontFamily: "Trebuchet MS",
        fontSize: "12px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(180, 326, "1  PLACE CELL      2  CLOSE SWITCH      3  TEST", {
        color: "#a9bdd6",
        fontFamily: "Trebuchet MS",
        fontSize: "10px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.status = this.add
      .text(180, 482, "Place the cell in its holder.", {
        align: "center",
        color: "#eef5ff",
        fontFamily: "Trebuchet MS",
        fontSize: "15px",
        wordWrap: { width: 310 },
      })
      .setOrigin(0.5);
  }

  private createCircuitPath(): void {
    const path = this.add.graphics();
    path.lineStyle(10, 0x334d69, 1);
    path.beginPath();
    path.moveTo(CIRCUIT_POINTS[0]?.x ?? 0, CIRCUIT_POINTS[0]?.y ?? 0);
    CIRCUIT_POINTS.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.strokePath();

    this.slotHalo = this.add
      .circle(CELL_SLOT.x, CELL_SLOT.y, 45, 0xf4c66d, 0.08)
      .setStrokeStyle(3, 0xf4c66d, 0.65);
    this.add
      .text(CELL_SLOT.x, CELL_SLOT.y, "+\n−", {
        align: "center",
        color: "#f4c66d",
        fontFamily: "Trebuchet MS",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private createCell(): void {
    const body = this.add
      .rectangle(0, 0, 66, 82, 0xdc6c50)
      .setStrokeStyle(4, 0xf8d486);
    const top = this.add.rectangle(0, -47, 26, 12, 0xf4c66d);
    const label = this.add
      .text(0, 3, "CELL\n3V", {
        align: "center",
        color: "#17243a",
        fontFamily: "Trebuchet MS",
        fontSize: "15px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.cell = this.add
      .container(CELL_HOME.x, CELL_HOME.y, [body, top, label])
      .setSize(92, 108);
  }

  private createCellInput(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.lastPointer = { x: pointer.worldX, y: pointer.worldY };
      this.updateDebugState();
      if (!this.canEdit() || !this.cell) return;
      const withinCell =
        Math.abs(pointer.worldX - this.cell.x) <= 46 &&
        Math.abs(pointer.worldY - this.cell.y) <= 54;
      if (!withinCell) return;
      this.draggingCell = true;
      this.cell.setScale(1.06);
      this.slotHalo?.setFillStyle(0xf4c66d, 0.18);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingCell || !this.canEdit() || !this.cell) return;
      this.cell.setPosition(
        Phaser.Math.Clamp(pointer.worldX, 48, 312),
        Phaser.Math.Clamp(pointer.worldY, 188, 360),
      );
    });
    this.input.on("pointerup", () => {
      if (!this.draggingCell) return;
      this.draggingCell = false;
      this.finishCellDrag();
    });
  }

  private finishCellDrag(): void {
    if (!this.cell || !this.state || !this.canEdit()) return;
    this.cell.setScale(1);
    const distance = Phaser.Math.Distance.Between(
      this.cell.x,
      this.cell.y,
      CELL_SLOT.x,
      CELL_SLOT.y,
    );
    if (distance <= 72) {
      this.cell.setPosition(CELL_SLOT.x, CELL_SLOT.y);
      this.state = placeCell(this.state);
      this.slotHalo?.setFillStyle(0x58b2aa, 0.2).setStrokeStyle(4, 0x7be0d3, 1);
      this.status?.setText("Cell seated. Now close the switch.");
      this.updateDebugState();
      return;
    }
    this.cell.setPosition(CELL_HOME.x, CELL_HOME.y);
    this.slotHalo?.setFillStyle(0xf4c66d, 0.08);
  }

  private createSwitch(): void {
    this.add
      .rectangle(257, 226, 82, 90, 0x263b55)
      .setStrokeStyle(3, 0x7c98b8)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.toggleSwitch());
    this.add.circle(232, 226, 8, 0xf4c66d);
    this.add.circle(282, 226, 8, 0xf4c66d);
    this.switchLever = this.add
      .rectangle(255, 207, 58, 10, 0xe6b358)
      .setOrigin(0.12, 0.5)
      .setRotation(-0.55);
    this.switchLabel = this.add
      .text(257, 267, "OPEN", {
        color: "#ef8d72",
        fontFamily: "Trebuchet MS",
        fontSize: "13px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private toggleSwitch(): void {
    if (!this.state || !this.canEdit() || this.state.switchClosed) return;
    this.state = closeSwitch(this.state);
    this.tweens.add({
      targets: this.switchLever,
      rotation: 0,
      duration: 180,
      ease: "Back.Out",
    });
    this.switchLabel?.setText("CLOSED").setColor("#7be0d3");
    this.status?.setText(
      this.state.cellPlaced
        ? "The path is arranged. Press Test."
        : "Switch closed. The cell still needs its holder.",
    );
    this.updateDebugState();
  }

  private createTorch(): void {
    this.add.rectangle(180, 270, 92, 46, 0x334a63).setStrokeStyle(3, 0x7894b4);
    this.add.rectangle(214, 270, 38, 64, 0x4a6178);
    this.add.circle(235, 270, 23, 0xd8dde5).setStrokeStyle(5, 0x6b7f95);
    this.lampGlow = this.add
      .circle(235, 270, 26, 0xffdc78, 1)
      .setAlpha(0)
      .setDepth(25);
    this.add
      .text(153, 270, "TORCH", {
        color: "#d9e5f4",
        fontFamily: "Trebuchet MS",
        fontSize: "11px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.roomLight = this.add
      .rectangle(180, 260, 352, 500, 0xffd97d, 1)
      .setAlpha(0);
    this.roomLight.setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
  }

  private createTestButton(): void {
    this.testButton = this.add
      .rectangle(180, 420, 278, 58, 0xe5aa4f)
      .setStrokeStyle(4, 0x6c432f)
      .setInteractive({ useHandCursor: true });
    this.testLabel = this.add
      .text(180, 420, "TEST CIRCUIT", {
        color: "#17243a",
        fontFamily: "Trebuchet MS",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.testButton.on("pointerdown", () => this.testCircuit());
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
    this.state = createRepairState(command.level);
    this.status.setText("Place the cell in its holder.");
    this.updateDebugState();
    this.bridge.emit({ type: "board-ready", levelId: command.level.id });
  }

  private testCircuit(): void {
    if (!this.level || !this.state || !this.canEdit()) return;
    this.state = beginTest(this.state);
    this.setEditingEnabled(false);
    const events = createRepairAttemptEvents(
      this.level,
      toCircuitGraph(this.level, this.state),
    );
    const attempt = events.find((event) => event.type === "attempt-evaluated");
    if (attempt?.type !== "attempt-evaluated") return;
    this.bridge.emit(attempt);

    if (attempt.evidence.classification !== "complete") {
      this.status?.setText("The torch stays dark. The path is still open.");
      this.time.delayedCall(650, () => {
        if (!this.state) return;
        this.state = { ...this.state, phase: "editing" };
        this.setEditingEnabled(true);
        this.updateDebugState();
      });
      return;
    }

    this.runSuccessSequence(events);
  }

  private runSuccessSequence(events: readonly GameEvent[]): void {
    if (!this.level || !this.state) return;
    this.emitStage("current");
    this.status?.setText("Current pulses around the closed path...");
    this.animateCurrent();

    this.time.delayedCall(950, () => {
      this.emitStage("device");
      this.status?.setText("The torch filament brightens.");
      this.tweens.add({
        targets: this.lampGlow,
        alpha: 0.72,
        scale: 1.18,
        duration: 420,
        ease: "Sine.Out",
      });
    });

    this.time.delayedCall(1550, () => {
      this.emitStage("room");
      this.status?.setText("Light spills across the repair bench.");
      this.tweens.add({
        targets: this.roomLight,
        alpha: 0.1,
        duration: 500,
        ease: "Sine.Out",
      });
    });

    this.time.delayedCall(2250, () => {
      if (!this.state) return;
      this.state = completeRepair(this.state);
      this.emitStage("response");
      events
        .filter((event) => event.type !== "attempt-evaluated")
        .forEach((event) => this.bridge.emit(event));
      this.status?.setText("Complete circuit observed. The torch is restored.");
      this.updateDebugState();
    });
  }

  private animateCurrent(): void {
    const curve = new Phaser.Curves.Spline(CIRCUIT_POINTS);
    for (let index = 0; index < 5; index += 1) {
      const pulse = this.add.circle(CELL_SLOT.x, CELL_SLOT.y, 6, 0x8df5dd, 0.95);
      const progress = { value: 0 };
      this.tweens.add({
        targets: progress,
        value: 1,
        delay: index * 150,
        duration: 1150,
        ease: "Linear",
        onUpdate: () => {
          const point = curve.getPoint(progress.value);
          pulse.setPosition(point.x, point.y);
        },
        onComplete: () => pulse.destroy(),
      });
    }
  }

  private emitStage(stage: Extract<GameEvent, { type: "sequence-stage" }>["stage"]): void {
    if (!this.level) return;
    this.bridge.emit({ type: "sequence-stage", levelId: this.level.id, stage });
  }

  private setEditingEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (enabled) {
      this.testButton?.setInteractive({ useHandCursor: true });
      this.testButton?.setFillStyle(0xe5aa4f);
      this.testLabel?.setAlpha(1);
      return;
    }
    this.draggingCell = false;
    this.testButton?.disableInteractive().setFillStyle(0x6c7480);
    this.testLabel?.setAlpha(0.65);
  }

  private canEdit(): boolean {
    return Boolean(
      this.inputEnabled && this.state && this.state.phase === "editing",
    );
  }

  private updateDebugState(): void {
    if (!this.state) return;
    (globalThis as typeof globalThis & {
      __signalStormDebug?: RepairState & {
        readonly lastPointer?: { readonly x: number; readonly y: number };
      };
    }).__signalStormDebug = { ...this.state, lastPointer: this.lastPointer };
  }
}
