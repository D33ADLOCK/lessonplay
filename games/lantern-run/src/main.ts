import Phaser from "phaser";
import "./style.css";

import { BootScene } from "./game/scenes/BootScene";
import { OverlayShell } from "./platform/overlay/OverlayShell";
import { SettingsStore } from "./platform/settings/Settings";
import { SemanticInput } from "./platform/input/SemanticInput";
import { createDebug } from "./platform/debug/Debug";
import { GameplayEventStream } from "./emotional/events/GameplayEvent";

/**
 * Composition root.
 *
 * Wires the reusable platform + emotional-gameplay services and boots Phaser.
 * Services are created here and will be threaded into scenes as the slices grow;
 * keeping construction in one place keeps the module boundaries honest.
 */
const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

function bootstrap(): void {
  const debug = createDebug();
  const settings = new SettingsStore();
  const overlay = new OverlayShell("overlay");
  const input = new SemanticInput();
  const events = new GameplayEventStream();

  // Expose services for in-scene wiring / debugging without globals leaking
  // into game logic.
  const services = { debug, settings, overlay, input, events } as const;
  (globalThis as Record<string, unknown>).__lanternRun = services;

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#0b1733",
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene],
  });
}

bootstrap();
