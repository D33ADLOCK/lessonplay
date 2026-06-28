/**
 * The single source of truth for *where things sit* in the bench scene.
 *
 * Two render layers draw the bench: a static SVG apparatus layer (vessel
 * silhouettes, funnel, burner, captions) and the animated Canvas fluid/energy
 * layer beneath it (liquid, bubbles, flame, pour stream). If each computed its
 * own placement they would inevitably drift apart — liquid sloshing outside its
 * glass on one device, a flame missing its vessel on another. So both layers
 * import this one pure function and derive their shapes from the *same* numbers.
 *
 * It is deliberately **apparatus-agnostic**: it emits neutral per-station boxes
 * (vessel rect, the liquid rect inside it, and the anchor points a layer needs to
 * hang a caption, a heat label, a flame). Each layer turns a box into whatever it
 * must draw — a beaker outline, a funnel cone, a burner — on its own.
 *
 * Coordinates are in the scene's fixed logical space (e.g. 360×360). No pixels,
 * no device-pixel-ratio: the Canvas applies its own `setTransform` scale and the
 * SVG its own `viewBox`, so this math maps identically through both.
 */

/** A rectangle in logical scene coordinates. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Neutral placement for one station — no apparatus shape implied. */
export interface StationBox {
  /** Column centre x (where a flame, funnel spout, or caption is centred). */
  readonly cx: number;
  /** The vessel's bounding box. */
  readonly vessel: Rect;
  /** The liquid rect inside the vessel (inset from the glass walls). */
  readonly liquid: Rect;
  /** y of the vessel base — where a burner/flame sits beneath it. */
  readonly baseY: number;
  /** y for the caption drawn under the vessel. */
  readonly labelY: number;
  /** y for the named heat label drawn above the vessel. */
  readonly heatLabelY: number;
}

/** The full scene layout: one box per station, left to right. */
export interface StageLayout {
  readonly width: number;
  readonly height: number;
  readonly stations: readonly StationBox[];
}

/** Glass-wall inset: the liquid column sits this far inside each side wall. */
const WALL = 4;

/**
 * Lay out `count` stations as an evenly spaced row within a `width`×`height`
 * scene. Reproduces the renderer's per-vessel geometry exactly, so the fluid
 * layer keeps painting in the same place once the glass moves to SVG.
 *
 * `count` is clamped to at least 1, so a single-station scenario is a row of one
 * (and reads larger than one column of three — the size rule).
 */
export function computeStationLayout(
  width: number,
  height: number,
  count: number,
): StageLayout {
  const n = Math.max(1, Math.floor(count));
  const colW = width / n;

  const stations: StationBox[] = [];
  for (let i = 0; i < n; i++) {
    const cx = colW * (i + 0.5);
    // A single vessel reads large; a row of three sits tighter.
    const w = Math.min(colW * 0.62, width * 0.42);
    const h = height * (n > 1 ? 0.4 : 0.5);
    const y = height * 0.24;
    const x = cx - w / 2;

    const liquidTop = y + h * 0.34;
    const liquidH = y + h - liquidTop;

    stations.push({
      cx,
      vessel: { x, y, w, h },
      liquid: { x: x + WALL, y: liquidTop, w: w - WALL * 2, h: liquidH },
      baseY: y + h,
      labelY: y + h + 26,
      heatLabelY: y - 14,
    });
  }

  return { width, height, stations };
}
