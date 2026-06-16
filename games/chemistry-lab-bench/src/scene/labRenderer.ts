/**
 * Canvas renderer for the lab bench. Draws a beaker with a liquid level and a
 * thermometer. Colour and temperature are interpolated by an `anim` progress
 * value (0 → 1) so the UI can tween a pour without the renderer holding state.
 *
 * Pure drawing: no DOM lookups, no game state — give it a context and a scene
 * description and it paints one frame. Particles/bubbles are out of scope.
 */

export interface LabScene {
  /** Liquid colour at anim=0 (before the reaction). */
  readonly fromColor: string;
  /** Liquid colour at anim=1 (after the reaction); same as from if no change. */
  readonly toColor: string;
  /** Direction the thermometer moves as the reaction resolves; null = steady. */
  readonly tempTrend: "rising" | "falling" | null;
  /** Logical scene size; the canvas is scaled to fit its element. */
  readonly width: number;
  readonly height: number;
}

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

/** Paint one frame of the lab scene. `anim` is the tween progress, 0 → 1. */
export function draw(
  ctx: CanvasRenderingContext2D,
  scene: LabScene,
  anim: number,
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

  // Liquid fill (most of the beaker).
  const liquidTop = beakerY + beakerH * 0.32;
  const liquidH = beakerY + beakerH - liquidTop;
  ctx.fillStyle = liquidColor;
  ctx.fillRect(beakerX + 4, liquidTop, beakerW - 8, liquidH);

  // Liquid surface highlight.
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(beakerX + 4, liquidTop, beakerW - 8, 6);

  // Beaker glass outline.
  ctx.strokeStyle = "#9fc2e8";
  ctx.lineWidth = 4;
  ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);
  // Pour lip.
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

  // Tube outline.
  ctx.strokeStyle = "#9fc2e8";
  ctx.lineWidth = 3;
  ctx.strokeRect(tx, tubeTop, tubeW, tubeH);
  ctx.beginPath();
  ctx.arc(tx + tubeW / 2, tubeTop + tubeH + bulbR - 2, bulbR, 0, Math.PI * 2);
  ctx.stroke();

  // Mercury column: a baseline level that visibly rises (warmer) or falls
  // (cooler). We show direction, not a numeric reading.
  const baseFrac = 0.45;
  const targetFrac =
    scene.tempTrend === "rising"
      ? 0.78
      : scene.tempTrend === "falling"
        ? 0.18
        : baseFrac;
  const frac = lerp(baseFrac, targetFrac, t);
  const colH = Math.max(0, Math.min(1, frac)) * (tubeH - 6);
  ctx.fillStyle = "#e8508f";
  ctx.beginPath();
  ctx.arc(
    tx + tubeW / 2,
    tubeTop + tubeH + bulbR - 2,
    bulbR - 4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillRect(tx + 4, tubeTop + tubeH - colH, tubeW - 8, colH);

  // Direction label instead of a (fabricated) exact value.
  if (scene.tempTrend) {
    ctx.fillStyle = scene.tempTrend === "rising" ? "#ff9d6b" : "#7fbfff";
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    const label = scene.tempTrend === "rising" ? "▲ Warmer" : "▼ Cooler";
    ctx.fillText(label, tx + tubeW / 2, tubeTop - 10);
  }
}
