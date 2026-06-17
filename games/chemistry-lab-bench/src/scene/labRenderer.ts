/**
 * Canvas renderer for the lab bench — the **fluid and energy** layer.
 *
 * It paints the parts of the scene that move: the liquid fill and its rippling
 * surface, rising bubbles when a gas or vapour is released, a falling pour stream,
 * a soft reaction glint, a warm/cool aura behind the glass, and a flicker of flame
 * under a station being heated. The *static* apparatus — the glass silhouette, the
 * funnel and filter paper, captions, the heat label, the active ring — is drawn by
 * the SVG layer stacked on top; this renderer no longer draws any of it.
 *
 * Placement is not computed here. Both layers import `computeStationLayout` so the
 * liquid and the glass that holds it are derived from the same numbers and cannot
 * drift apart.
 *
 * `anim` (0 → 1) drives the reaction flourish as it resolves; `time` (seconds)
 * drives the looping ambient motion. With `reduced` true (prefers-reduced-motion)
 * the time-based motion is dropped but every end-state still reads.
 *
 * Pure drawing: no DOM lookups, no game state — give it a context and a scene
 * description and it paints one frame.
 */

import type { HeatLevel } from "../contracts/chemistry";
import type { ApparatusKind } from "./apparatus";
import { computeStationLayout, type StationBox } from "./layout";

/** One station in the row. */
export interface StationView {
  readonly id: string;
  /** Short caption drawn under the vessel (e.g. "Mixture", "Filtrate"). */
  readonly label: string;
  /** Which apparatus shape the SVG layer draws this station as. */
  readonly apparatus: ApparatusKind;
  /** Current liquid colour (CSS). */
  readonly color: string;
  /** Current heat level — tints the aura and names the level. */
  readonly heat: HeatLevel;
  /** True when the latest result released a gas/vapour — draw rising bubbles. */
  readonly emitting: boolean;
  /** True for the station the current step acts on — draw a highlight ring. */
  readonly active: boolean;
  /** True when the station is being heated externally — draw a flame beneath. */
  readonly heated: boolean;
  /** True when the station holds nothing — draw it as an empty vessel. */
  readonly empty: boolean;
}

export interface LabScene {
  /** The stations to draw, left to right. */
  readonly stations: readonly StationView[];
  /** Present while a pour is in flight — a falling stream into one station. */
  readonly pour?: { readonly color: string; readonly stationId: string } | null;
  /** Logical scene size; the canvas is scaled to fit its element. */
  readonly width: number;
  readonly height: number;
}

/** Aura tint behind a beaker for a heat level (null = no aura at room temp). */
const HEAT_AURA: Record<HeatLevel, [number, number, number] | null> = {
  cool: [110, 170, 255],
  room: null,
  warm: [255, 150, 90],
  hot: [255, 95, 70],
};

/**
 * Paint one frame of the lab scene. `anim` is the reaction-flourish progress
 * (0 → 1); `time` is a free-running clock in seconds; `reduced` drops ambient
 * motion.
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
  const { width, height, stations } = scene;

  ctx.clearRect(0, 0, width, height);

  const layout = computeStationLayout(width, height, stations.length);

  stations.forEach((station, i) => {
    const box = layout.stations[i];
    drawStation(ctx, station, box, t, clock, reduced);
    if (scene.pour && scene.pour.stationId === station.id) {
      drawPour(ctx, box, scene.pour.color, clock, reduced);
    }
  });
}

function drawStation(
  ctx: CanvasRenderingContext2D,
  station: StationView,
  box: StationBox,
  t: number,
  clock: number,
  reduced: boolean,
): void {
  const { cx, vessel, liquid, baseY } = box;

  // A funnel holds caught residue (drawn as a static mound by the SVG layer),
  // not an animated liquid column — so the fluid layer leaves it alone.
  const holdsLiquid = station.apparatus !== "funnel";

  // --- Heat aura behind the glass (warm/cool), strength tied to the flourish. ---
  const aura = HEAT_AURA[station.heat];
  if (aura && t > 0.02 && holdsLiquid) {
    const [r, g, b] = aura;
    const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 2);
    const radius = vessel.w * 0.95;
    const acy = liquid.y + liquid.h * 0.5;
    const grad = ctx.createRadialGradient(cx, acy, 0, cx, acy, radius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.32 * t * pulse})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(
      vessel.x - radius,
      liquid.y - radius,
      vessel.w + radius * 2,
      liquid.h + radius * 2,
    );
  }

  // --- Flame beneath a station being heated. ---
  if (station.heated) {
    drawFlame(ctx, cx, baseY, clock, reduced);
  }

  // --- Liquid fill (skipped for an empty vessel or a residue funnel). ---
  if (!station.empty && holdsLiquid) {
    ctx.fillStyle = station.color;
    ctx.fillRect(liquid.x, liquid.y, liquid.w, liquid.h);

    // Rippling surface highlight keeps the liquid alive.
    const ripple = reduced ? 0 : Math.sin(clock * 1.6 + cx) * 1.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(liquid.x, liquid.y + ripple, liquid.w, 6);

    if (station.emitting) {
      drawBubbles(ctx, liquid.x, liquid.y, liquid.w, liquid.h, clock, t);
    }

    // Reaction glint: a soft reward bloom on the active, resolving station.
    if (station.active && t > 0.15) {
      const sheen = reduced ? 0.18 : 0.12 + 0.06 * Math.sin(clock * 3);
      const gy = liquid.y + liquid.h * 0.4;
      const glint = ctx.createRadialGradient(cx, gy, 0, cx, gy, vessel.w * 0.5);
      glint.addColorStop(0, `rgba(255, 255, 255, ${sheen * t})`);
      glint.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glint;
      ctx.fillRect(liquid.x, liquid.y, liquid.w, liquid.h);
    }
  }
}

/** A flickering flame drawn under a vessel's base. */
function drawFlame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  clock: number,
  reduced: boolean,
): void {
  const flicker = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 12);
  const fh = 22 * flicker;
  const top = baseY + 6;
  // Outer orange flame.
  ctx.fillStyle = "rgba(255, 140, 50, 0.92)";
  ctx.beginPath();
  ctx.moveTo(cx, top + fh);
  ctx.quadraticCurveTo(cx - 11, top + fh * 0.5, cx, top);
  ctx.quadraticCurveTo(cx + 11, top + fh * 0.5, cx, top + fh);
  ctx.fill();
  // Inner yellow core.
  ctx.fillStyle = "rgba(255, 220, 120, 0.95)";
  ctx.beginPath();
  ctx.moveTo(cx, top + fh);
  ctx.quadraticCurveTo(cx - 5, top + fh * 0.6, cx, top + fh * 0.25);
  ctx.quadraticCurveTo(cx + 5, top + fh * 0.6, cx, top + fh);
  ctx.fill();
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
    const life = 1 - phase;
    const r = (1.6 + (i % 3)) * intensity * (0.5 + life * 0.5);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * (0.4 + life * 0.6)})`;
    ctx.beginPath();
    ctx.arc(colX, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A falling stream of reagent droplets from above the vessel lip. */
function drawPour(
  ctx: CanvasRenderingContext2D,
  box: StationBox,
  color: string,
  time: number,
  reduced: boolean,
): void {
  const streamX = box.vessel.x - 6;
  const fromY = box.vessel.y - 26;
  const landY = box.liquid.y;
  ctx.fillStyle = color;
  if (reduced) {
    ctx.fillRect(streamX - 2, fromY, 4, landY - fromY);
    return;
  }
  const drops = 5;
  for (let i = 0; i < drops; i++) {
    const phase = (time * 1.8 + i / drops) % 1;
    const y = fromY + phase * (landY - fromY);
    const r = 3;
    ctx.beginPath();
    ctx.ellipse(streamX, y, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    const sp = (time * 4 + i * 0.4) % 1;
    const sx = streamX + (i - 1) * 5 * sp;
    const sy = landY - 4 * Math.sin(sp * Math.PI);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.6 * (1 - sp), 0, Math.PI * 2);
    ctx.fill();
  }
}
