/**
 * The lab **diorama** — the static back wall and bench the apparatus sits on.
 *
 * It gives the scene a sense of place: a back wall, a counter top, and a few
 * calm, low-contrast props (a reagent shelf, a window, a wall chart) so the
 * workspace reads as a real lab rather than a flat panel. It is deliberately
 * quiet — everything here sits *behind* the glassware and never competes with it
 * for attention, and it stays identical across steps and experiments so the bench
 * feels like one recurring lab.
 *
 * Built as original SVG in the scene's logical coordinate space, confined to the
 * stage. No external assets, so it works offline and is fully redistributable.
 *
 * The bench surface is placed just beneath the vessels' computed bases (from the
 * shared layout), so glassware always rests *on* the counter whether the
 * experiment shows one beaker or a row of three.
 */

import type { LabScene } from "../scene/labRenderer";
import { computeStationLayout } from "../scene/layout";

export function LabDiorama({ scene }: { readonly scene: LabScene }) {
  const layout = computeStationLayout(
    scene.width,
    scene.height,
    scene.stations.length,
  );
  const baseY = layout.stations[0]?.baseY ?? scene.height * 0.7;
  const benchTop = Math.round(baseY + 4);

  return (
    <svg
      className="diorama-layer"
      viewBox="0 0 360 360"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16273f" />
          <stop offset="0.7" stopColor="#13223a" />
        </linearGradient>
        <linearGradient id="bench" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3454" />
          <stop offset="0.12" stopColor="#172a45" />
          <stop offset="1" stopColor="#0e1c30" />
        </linearGradient>
        <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a4a72" />
          <stop offset="1" stopColor="#1b3454" />
        </linearGradient>
      </defs>

      {/* Back wall. */}
      <rect x="0" y="0" width="360" height="360" fill="url(#wall)" />

      {/* Window with soft daylight, upper right. */}
      <g opacity="0.55">
        <rect x="250" y="34" width="86" height="78" rx="4" fill="url(#window)" />
        <rect
          x="250"
          y="34"
          width="86"
          height="78"
          rx="4"
          fill="none"
          stroke="#3c5e8a"
          strokeWidth="3"
        />
        <line x1="293" y1="34" x2="293" y2="112" stroke="#3c5e8a" strokeWidth="2.5" />
        <line x1="250" y1="73" x2="336" y2="73" stroke="#3c5e8a" strokeWidth="2.5" />
      </g>

      {/* Reagent shelf with a row of bottles, upper left. */}
      <g opacity="0.5">
        <rect x="20" y="92" width="150" height="6" rx="2" fill="#2a4063" />
        {[
          { x: 30, c: "#3e6ea0" },
          { x: 58, c: "#4f8f7d" },
          { x: 86, c: "#8a6da8" },
          { x: 116, c: "#a87d5a" },
          { x: 142, c: "#3e6ea0" },
        ].map((b) => (
          <g key={b.x}>
            <rect x={b.x} y={64} width="18" height="28" rx="3" fill={b.c} />
            <rect x={b.x + 5} y={58} width="8" height="8" rx="2" fill={b.c} />
          </g>
        ))}
      </g>

      {/* A faint wall chart, upper left of the window. */}
      <g opacity="0.32">
        <rect x="196" y="40" width="44" height="56" rx="3" fill="#1b2f4c" stroke="#33507b" strokeWidth="1.5" />
        {[48, 58, 68, 78, 88].map((cy) =>
          [202, 214, 226].map((cx) => (
            <rect key={`${cx}-${cy}`} x={cx} y={cy} width="8" height="7" rx="1" fill="#33507b" />
          )),
        )}
      </g>

      {/* Bench: a counter the glassware stands on, placed under the vessels. */}
      <rect x="0" y={benchTop} width="360" height={360 - benchTop} fill="url(#bench)" />
      <rect x="0" y={benchTop} width="360" height="3" fill="#33517d" opacity="0.7" />
    </svg>
  );
}
