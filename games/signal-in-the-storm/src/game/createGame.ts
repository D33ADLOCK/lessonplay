import Phaser from "phaser";
import { GameBridge } from "../bridge/GameBridge";
import { RepairScene } from "./RepairScene";

export interface MountedGame {
  readonly game: Phaser.Game;
  destroy(): void;
}

export function createGame(parent: HTMLElement, bridge: GameBridge): MountedGame {
  const scene = new RepairScene(bridge);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#101b32",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 360,
      height: 520,
    },
    input: {
      activePointers: 1,
      touch: true,
      mouse: true,
      keyboard: true,
    },
    scene: [scene],
  });
  return {
    game,
    destroy(): void {
      scene.dispose();
      game.destroy(true);
    },
  };
}
