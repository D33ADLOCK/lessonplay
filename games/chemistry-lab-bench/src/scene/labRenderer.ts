/**
 * Canvas renderer for the lab bench. Draws a row of one to three labelled
 * beakers — a single-station experiment is just a row of one — with the tactile
 * beats that make an action feel alive: a falling pour stream, a soft reaction
 * glint, rising bubbles when a gas or vapour is released, a warm/cool aura behind
 * the glass, a flicker of flame under a station being heated, and a gently
 * rippling liquid surface. The active station (the one the current step acts on)
 * gets a highlight ring.
 *
 * `anim` (0 → 1) drives the reaction flourish as it resolves; `time` (seconds)
 * drives the looping ambient motion. With `reduced` true (prefers-reduced-motion)
 * the time-based motion is dropped but every end-state still reads.
 *
 * Pure drawing: no DOM lookups, no game state — give it a context and a scene
 * description and it paints one frame.
 */

import type { HeatLevel } from "../contracts/chemistry";

/** One beaker in the row. */
export interface StationView {
  readonly id: string;
  /** Short caption drawn under the beaker (e.g. "Mixture", "Filtrate"). */
  readonly label: string;
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
  /** The beakers to draw, left to right. */
  readonly stations: readonly StationView[];
  /** Present while a pour is in flight — a falling stream into one station. */
  readonly pour?: { readonly color: string; readonly stationId: string } | null;
  /** Logical scene size; the canvas is scaled to fit its element. */
  readonly width: number;
  readonly height: number;
}

/** Geometry of one beaker, derived from its column. */
interface BeakerGeo {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly cx: number;
  readonly liquidTop: number;
  readonly liquidH: number;
}

const HEAT_LABEL: Record<HeatLevel, string> = {
  cool: "Cool",
  room: "Room temp",
  warm: "Warm",
  hot: "Hot",
};

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

  const n = Math.max(1, stations.length);
  const colW = width / n;

  stations.forEach((station, i) => {
    const geo = beakerGeo(width, height, colW, i, n);
    drawStation(ctx, station, geo, t, clock, reduced);
    if (scene.pour && scene.pour.stationId === station.id) {
      drawPour(ctx, geo, scene.pour.color, clock, reduced);
    }
  });
}

/** Lay one beaker out within its column. */
function beakerGeo(
  width: number,
  height: number,
  colW: number,
  i: number,
  n: number,
): BeakerGeo {
  const cx = colW * (i + 0.5);
  // Single beaker reads large; a row of three sits tighter.
  const w = Math.min(colW * 0.62, width * 0.42);
  const h = height * (n > 1 ? 0.4 : 0.5);
  const y = height * 0.24;
  const x = cx - w / 2;
  const liquidTop = y + h * 0.34;
  const liquidH = y + h - liquidTop;
  return { x, y, w, h, cx, liquidTop, liquidH };
}

function drawStation(
  ctx: CanvasRenderingContext2D,
  station: StationView,
  geo: BeakerGeo,
  t: number,
  clock: number,
  reduced: boolean,
): void {
  const { x, y, w, h, cx, liquidTop, liquidH } = geo;

  // --- Heat aura behind the glass (warm/cool), strength tied to the flourish. ---
  const aura = HEAT_AURA[station.heat];
  if (aura && t > 0.02) {
    const [r, g, b] = aura;
    const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 2);
    const radius = w * 0.95;
    const acy = liquidTop + liquidH * 0.5;
    const grad = ctx.createRadialGradient(cx, acy, 0, cx, acy, radius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.32 * t * pulse})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, liquidTop - radius, w + radius * 2, liquidH + radius * 2);
  }

  // --- Flame beneath a station being heated. ---
  if (station.heated) {
    drawFlame(ctx, cx, y + h, clock, reduced);
  }

  // --- Liquid fill (skipped for an empty vessel). ---
  if (!station.empty) {
    ctx.fillStyle = station.color;
    ctx.fillRect(x + 4, liquidTop, w - 8, liquidH);

    // Rippling surface highlight keeps the liquid alive.
    const ripple = reduced ? 0 : Math.sin(clock * 1.6 + cx) * 1.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(x + 4, liquidTop + ripple, w - 8, 6);

    if (station.emitting) {
      drawBubbles(ctx, x + 4, liquidTop, w - 8, liquidH, clock, t);
    }

    // Reaction glint: a soft reward bloom on the active, resolving station.
    if (station.active && t > 0.15) {
      const sheen = reduced ? 0.18 : 0.12 + 0.06 * Math.sin(clock * 3);
      const gy = liquidTop + liquidH * 0.4;
      const glint = ctx.createRadialGradient(cx, gy, 0, cx, gy, w * 0.5);
      glint.addColorStop(0, `rgba(255, 255, 255, ${sheen * t})`);
      glint.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glint;
      ctx.fillRect(x + 4, liquidTop, w - 8, liquidH);
    }
  }

  // --- Beaker glass outline (over the liquid so the rim reads cleanly). ---
  ctx.strokeStyle = station.active ? "#6fa8e8" : "#9fc2e8";
  ctx.lineWidth = station.active ? 5 : 4;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10, y - 8);
  ctx.stroke();

  // --- Active highlight ring. ---
  if (station.active) {
    ctx.strokeStyle = "rgba(111, 168, 232, 0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 7, y - 7, w + 14, h + 14);
  }

  // --- Caption below the beaker. ---
  ctx.fillStyle = station.active ? "#d7e8fb" : "#9fc2e8";
  ctx.font = "600 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(station.label, cx, y + h + 26);

  // --- Named heat level above the beaker (never a numeric reading). ---
  if (station.heat !== "room" && t > 0.05) {
    const warm = station.heat === "warm" || station.heat === "hot";
    ctx.fillStyle = warm ? "#ff9d6b" : "#7fbfff";
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillText(HEAT_LABEL[station.heat], cx, y - 14);
  }
}

/** A flickering flame drawn under a beaker's base. */
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

/** A falling stream of reagent droplets from above the beaker lip. */
function drawPour(
  ctx: CanvasRenderingContext2D,
  geo: BeakerGeo,
  color: string,
  time: number,
  reduced: boolean,
): void {
  const streamX = geo.x - 6;
  const fromY = geo.y - 26;
  ctx.fillStyle = color;
  if (reduced) {
    ctx.fillRect(streamX - 2, fromY, 4, geo.liquidTop - fromY);
    return;
  }
  const drops = 5;
  for (let i = 0; i < drops; i++) {
    const phase = (time * 1.8 + i / drops) % 1;
    const y = fromY + phase * (geo.liquidTop - fromY);
    const r = 3;
    ctx.beginPath();
    ctx.ellipse(streamX, y, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    const sp = (time * 4 + i * 0.4) % 1;
    const sx = streamX + (i - 1) * 5 * sp;
    const sy = geo.liquidTop - 4 * Math.sin(sp * Math.PI);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.6 * (1 - sp), 0, Math.PI * 2);
    ctx.fill();
  }
}
