/**
 * Canvas renderer for the lab bench. Draws one beaker with a liquid level and a
 * thermometer, plus the tactile beats that make a pour feel alive: a falling
 * pour stream, a soft reaction glint, rising bubbles when gas is released, a
 * warm/cool aura behind the glass, and a gently rippling liquid surface.
 *
 * `anim` (0 → 1) tweens colour + heat as the reaction resolves; `time` (seconds)
 * drives the looping ambient motion. With `reduced` true (prefers-reduced-
 * motion) the time-based motion is dropped but every end-state still reads.
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
  /** Present while a pour is in flight — draws a falling stream of this colour. */
  readonly pour?: { readonly color: string } | null;
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

/** Aura tint behind the beaker for a heat level (null = no aura at room temp). */
const HEAT_AURA: Record<HeatLevel, [number, number, number] | null> = {
  cool: [110, 170, 255],
  room: null,
  warm: [255, 150, 90],
  hot: [255, 95, 70],
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
 * `time` is a free-running clock in seconds; `reduced` drops ambient motion.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  scene: LabScene,
  anim: number,
  time = 0,
  reduced = false,
): void {
  const t = Math.max(0, Math.min(1, anim));
  const clock = reduced ? 0 : time;
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
  const cx = beakerX + beakerW / 2;

  // --- Heat aura behind the glass (warm/cool), strength tied to the tween. ---
  const aura = HEAT_AURA[scene.heat];
  if (aura && t > 0.02) {
    const [r, g, b] = aura;
    const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 2);
    const radius = beakerW * 0.95;
    const grad = ctx.createRadialGradient(cx, liquidTop + liquidH * 0.5, 0, cx, liquidTop + liquidH * 0.5, radius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.32 * t * pulse})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(beakerX - radius, liquidTop - radius, beakerW + radius * 2, liquidH + radius * 2);
  }

  // --- Liquid fill ---
  ctx.fillStyle = liquidColor;
  ctx.fillRect(beakerX + 4, liquidTop, beakerW - 8, liquidH);

  // Rippling surface highlight (a gentle sine wobble keeps the liquid alive).
  const ripple = reduced ? 0 : Math.sin(clock * 1.6) * 1.5;
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(beakerX + 4, liquidTop + ripple, beakerW - 8, 6);

  // --- Bubbles (gas leaving the liquid) ---
  if (scene.emitting) {
    drawBubbles(ctx, beakerX + 4, liquidTop, beakerW - 8, liquidH, clock, t);
  }

  // --- Reaction glint: a soft reward bloom once the change has resolved. ---
  if (scene.toColor !== scene.fromColor && t > 0.15) {
    const sheen = reduced ? 0.18 : 0.12 + 0.06 * Math.sin(clock * 3);
    const glint = ctx.createRadialGradient(
      cx,
      liquidTop + liquidH * 0.4,
      0,
      cx,
      liquidTop + liquidH * 0.4,
      beakerW * 0.5,
    );
    glint.addColorStop(0, `rgba(255, 255, 255, ${sheen * t})`);
    glint.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glint;
    ctx.fillRect(beakerX + 4, liquidTop, beakerW - 8, liquidH);
  }

  // Beaker glass outline (over the liquid so the rim reads cleanly).
  ctx.strokeStyle = "#9fc2e8";
  ctx.lineWidth = 4;
  ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);
  ctx.beginPath();
  ctx.moveTo(beakerX, beakerY);
  ctx.lineTo(beakerX - 12, beakerY - 10);
  ctx.stroke();

  // --- Pour stream (anticipation: reagent falling in before it reacts). ---
  if (scene.pour) {
    drawPour(ctx, beakerX, beakerY, liquidTop, scene.pour.color, clock, reduced);
  }

  // --- Thermometer ---
  drawThermometer(ctx, width, height, scene.heat, t);
}

function drawThermometer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  heat: HeatLevel,
  t: number,
): void {
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
  const targetFrac = HEAT_FRACTION[heat];
  const frac = lerp(HEAT_FRACTION.room, targetFrac, t);
  const colH = Math.max(0, Math.min(1, frac)) * (tubeH - 6);
  ctx.fillStyle = "#e8508f";
  ctx.beginPath();
  ctx.arc(tx + tubeW / 2, tubeTop + tubeH + bulbR - 2, bulbR - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(tx + 4, tubeTop + tubeH - colH, tubeW - 8, colH);

  // Named level label (only once the reaction has visibly moved the level).
  if (heat !== "room" && t > 0.05) {
    ctx.fillStyle = targetFrac > HEAT_FRACTION.room ? "#ff9d6b" : "#7fbfff";
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(HEAT_LABEL[heat], tx + tubeW / 2, tubeTop - 10);
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
  const count = 7;
  for (let i = 0; i < count; i++) {
    const seed = i * 0.618;
    const colX = x + ((seed * 7.3) % 1) * w;
    const speed = 0.35 + (i % 3) * 0.15;
    const phase = (time * speed + seed) % 1;
    const by = top + h - phase * h;
    // Shrink and fade as the bubble nears the surface (a soft "pop").
    const life = 1 - phase;
    const r = (1.6 + (i % 3)) * intensity * (0.5 + life * 0.5);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * (0.4 + life * 0.6)})`;
    ctx.beginPath();
    ctx.arc(colX, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A falling stream of reagent droplets from above the beaker lip. */
function drawPour(
  ctx: CanvasRenderingContext2D,
  beakerX: number,
  beakerY: number,
  liquidTop: number,
  color: string,
  time: number,
  reduced: boolean,
): void {
  const streamX = beakerX - 6;
  const fromY = beakerY - 26;
  ctx.fillStyle = color;
  if (reduced) {
    ctx.fillRect(streamX - 2, fromY, 4, liquidTop - fromY);
    return;
  }
  // Several droplets staggered down the stream, looping.
  const drops = 5;
  for (let i = 0; i < drops; i++) {
    const phase = (time * 1.8 + i / drops) % 1;
    const y = fromY + phase * (liquidTop - fromY);
    const r = 3;
    ctx.beginPath();
    ctx.ellipse(streamX, y, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Splash dots at the surface.
  for (let i = 0; i < 3; i++) {
    const sp = (time * 4 + i * 0.4) % 1;
    const sx = streamX + (i - 1) * 5 * sp;
    const sy = liquidTop - 4 * Math.sin(sp * Math.PI);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.6 * (1 - sp), 0, Math.PI * 2);
    ctx.fill();
  }
}
