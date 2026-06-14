import Phaser from "phaser";
import { SceneKeys } from "../../platform/lifecycle/scenes";
import { SURFACES } from "../sim/SurfaceModel";

/**
 * Boot scene — the walking skeleton's single rendered scene (Slice 1).
 *
 * It establishes the storm-cool palette, draws the three readable surface
 * materials as a preview strip, and a glowing lantern, then signals readiness
 * to the DOM (used by the Playwright smoke spec). Slices 2+ replace this with
 * the real opening/level/hub flow.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    const { width, height } = this.scale;

    // Storm-darkened sky.
    this.add
      .rectangle(0, 0, width, height, 0x0b1733)
      .setOrigin(0, 0);
    this.add
      .rectangle(0, height * 0.72, width, height * 0.28, 0x09122a)
      .setOrigin(0, 0);

    // Surface preview strip — proves the three materials are readable.
    const surfaces = Object.values(SURFACES);
    const segW = width / surfaces.length;
    surfaces.forEach((s, i) => {
      this.add
        .rectangle(i * segW, height * 0.74, segW, height * 0.1, s.color)
        .setOrigin(0, 0);
      this.add
        .text(i * segW + segW / 2, height * 0.74 + height * 0.05, s.name, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${Math.round(height * 0.022)}px`,
          color: "#10203b",
        })
        .setOrigin(0.5);
    });

    // A lantern that gently pulses — first hint of festival warmth.
    const lantern = this.add.circle(width * 0.5, height * 0.42, height * 0.05, 0xffb547);
    lantern.setStrokeStyle(3, 0xff8a3d);
    this.add
      .circle(width * 0.5, height * 0.42, height * 0.09, 0xffb547, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: lantern,
      scale: 1.12,
      yoyo: true,
      repeat: -1,
      duration: 1100,
      ease: "Sine.inOut",
    });

    this.add
      .text(width * 0.5, height * 0.2, "Lantern Run", {
        fontFamily: "system-ui, sans-serif",
        fontSize: `${Math.round(height * 0.07)}px`,
        color: "#f6e7c1",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(width * 0.5, height * 0.2 + height * 0.08, "Light the Festival", {
        fontFamily: "system-ui, sans-serif",
        fontSize: `${Math.round(height * 0.03)}px`,
        color: "#ffb547",
      })
      .setOrigin(0.5);

    // Signal readiness for the e2e smoke test.
    this.game.events.emit("lantern-run:ready");
    document.documentElement.setAttribute("data-lr-ready", "true");
  }
}
