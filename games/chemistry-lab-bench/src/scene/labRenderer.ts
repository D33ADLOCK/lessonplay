/**
 * Canvas renderer for the lab bench. Draws one beaker with a liquid level and a
 * thermometer, plus bubbles when a reaction releases gas. Colour and heat are
 * interpolated by an `anim` progress value (0 → 1) so the UI can tween a pour
 * without the renderer holding state; `time` (seconds) drives the looping
 * bubble motion.
 *
 * Pure drawing: no DOM lookups, no game state — give it a context and a scene
 * description and it paints one frame.
 */

import type { HeatLevel } from "../contracts/chemistry";

export interface LabScene {
  /** Liquid colour at anim=0 (before the reaction). */
  readonly fromColor: string;
  /** Liquid colour at anim=1 (after the reaction); same as from if no change. */
  readonly toColor: string;
  /** Heat level the thermometer settles to as the reaction resolves. */
  readonly heat: HeatLevel;
  /** True when the latest result released a gas — draw rising bubbles. */
  readonly emitting: boolean;
  /** Logical scene size; the canvas is scaled to fit its element. */
  readonly width: number;
  readonly height: number;
}

/** Mercury column height (fraction of the tube) for each named heat level. */
const HEAT_FRACTION: Record<HeatLevel, number> = {
  cool: 0.2,
  room: 0.45,
  warm: 0.72,
  hot: 0.9,
};

const HEAT_LABEL: Record<HeatLevel, string> = {
  cool: "Cool",
  room: "Room temp",
  warm: "Warm",
  hot: "Hot",
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Parse `#rrggbb` to [r,g,b]. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Paint one frame of the lab scene. `anim` is the tween progress (0 → 1);
 * `time` is a free-running clock in seconds used for the bubble animation.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  scene: LabScene,
  anim: number,
  time = 0,
): void {
  const t = Math.max(0, Math.min(1, anim));
  const { width, height } = scene;

  ctx.clearRect(0, 0, width, height);

  // --- Beaker geometry ---
  const beakerW = width * 0.42;
  const beakerH = height * 0.5;
  const beakerX = width * 0.16;
  const beakerY = height * 0.28;
  const liquidColor = mixColor(scene.fromColor, scene.toColor, t);

  const liquidTop = beakerY + beakerH * 0.32;
  const liquidH = beakerY + beakerH - liquidTop;
  ctx.fillStyle = liquidColor;
  ctx.fillRect(beakerX + 4, liquidTop, beakerW - 8, liquidH);

  // Liquid surface highlight.
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(beakerX + 4, liquidTop, beakerW - 8, 6);

  // --- Bubbles (gas leaving the liquid) ---
  if (scene.emitting) {
    drawBubbles(ctx, beakerX + 4, liquidTop, beakerW - 8, liquidH, time, t);
  }

  // Beaker glass outline (drawn over the liquid so the rim reads cleanly).
  ctx.strokeStyle = "#9fc2e8";
  ctx.lineWidth = 4;
  ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);
  ctx.beginPath();
  ctx.moveTo(beakerX, beakerY);
  ctx.lineTo(beakerX - 12, beakerY - 10);
  ctx.stroke();

  // --- Thermometer ---
  const tx = width * 0.74;
  const tubeTop = height * 0.22;
  const tubeH = height * 0.5;
  const tubeW = 18;
  const bulbR = 18;

  ctx.strokeStyle = "#9fc2e8";
  ctx.lineWidth = 3;
  ctx.strokeRect(tx, tubeTop, tubeW, tubeH);
  ctx.beginPath();
  ctx.arc(tx + tubeW / 2, tubeTop + tubeH + bulbR - 2, bulbR, 0, Math.PI * 2);
  ctx.stroke();

  // Mercury column tweens from room temperature to the scene's heat level. We
  // show a named level, never a fabricated numeric reading.
  const targetFrac = HEAT_FRACTION[scene.heat];
  const frac = lerp(HEAT_FRACTION.room, targetFrac, t);
  const colH = Math.max(0, Math.min(1, frac)) * (tubeH - 6);
  ctx.fillStyle = "#e8508f";
  ctx.beginPath();
  ctx.arc(tx + tubeW / 2, tubeTop + tubeH + bulbR - 2, bulbR - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(tx + 4, tubeTop + tubeH - colH, tubeW - 8, colH);

  // Named level label (only once the reaction has visibly moved the level).
  if (scene.heat !== "room" && t > 0.05) {
    ctx.fillStyle = targetFrac > HEAT_FRACTION.room ? "#ff9d6b" : "#7fbfff";
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(HEAT_LABEL[scene.heat], tx + tubeW / 2, tubeTop - 10);
  }
}

/** A handful of bubbles rising and looping inside the liquid column. */
function drawBubbles(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  w: number,
  h: number,
  time: number,
  intensity: number,
): void {
  if (intensity <= 0.02) return;
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  const count = 7;
  for (let i = 0; i < count; i++) {
    const seed = i * 0.618;
    const colX = x + ((seed * 7.3) % 1) * w;
    // Each bubble loops up the column at its own speed/phase.
    const speed = 0.35 + (i % 3) * 0.15;
    const phase = (time * speed + seed) % 1;
    const by = top + h - phase * h;
    const r = (1.6 + (i % 3)) * intensity;
    ctx.beginPath();
    ctx.arc(colX, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
