/**
 * The static **apparatus** layer — crisp SVG glassware stacked over the animated
 * Canvas fluid layer.
 *
 * This draws the parts that must stay sharp and never move within a frame: the
 * beaker silhouette and its pour spout, the funnel and its filter paper with the
 * caught sand mound, the station caption, the named heat label, and the active
 * highlight ring. The liquid, bubbles, flame, and pour stream are painted beneath
 * by the Canvas; the two layers share `computeStationLayout`, so a glass outline
 * always lands exactly around its liquid.
 *
 * The SVG uses the same logical scene coordinates as the Canvas and a `viewBox`
 * with `preserveAspectRatio="none"`, so on the square stage both layers map
 * identically regardless of device size.
 */

import { computeStationLayout, type HeatLevel, type StationBox } from "@learn-loop/core";
import type { LabScene, StationView } from "../scene/labRenderer";

const HEAT_LABEL: Record<HeatLevel, string> = {
  cool: "Cool",
  room: "Room temp",
  warm: "Warm",
  hot: "Hot",
};

const GLASS = "#9fc2e8";
const GLASS_ACTIVE = "#bcd8ff";
const PAPER = "#e7e0cf";

/** Linear interpolation. */
const lerp = (a: number, b: number, f: number): number => a + (b - a) * f;

export function Apparatus({ scene }: { readonly scene: LabScene }) {
  const { width, height, stations } = scene;
  const layout = computeStationLayout(width, height, stations.length);

  return (
    <svg
      className="apparatus-layer"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {stations.map((station, i) => (
        <Station key={station.id} view={station} box={layout.stations[i]} />
      ))}
    </svg>
  );
}

function Station({
  view,
  box,
}: {
  readonly view: StationView;
  readonly box: StationBox;
}) {
  const stroke = view.active ? GLASS_ACTIVE : GLASS;
  return (
    <g>
      {/* Contact shadow grounding the vessel on the bench. */}
      <ellipse
        cx={box.cx}
        cy={box.baseY + 6}
        rx={box.vessel.w * 0.55}
        ry={7}
        fill="rgba(0, 0, 0, 0.28)"
      />

      {view.apparatus === "funnel" ? (
        <Funnel view={view} box={box} stroke={stroke} />
      ) : (
        <Beaker view={view} box={box} stroke={stroke} />
      )}

      {/* Active highlight ring around the vessel. */}
      {view.active && (
        <rect
          x={box.vessel.x - 7}
          y={box.vessel.y - 7}
          width={box.vessel.w + 14}
          height={box.vessel.h + 14}
          rx={12}
          fill="none"
          stroke="rgba(111, 168, 232, 0.55)"
          strokeWidth={2}
        />
      )}

      {/* Caption under the vessel. */}
      <text
        x={box.cx}
        y={box.labelY}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill={view.active ? "#d7e8fb" : "#9fc2e8"}
      >
        {view.label}
      </text>

      {/* Named heat level above the vessel (never a numeric reading). */}
      {view.heat !== "room" && (
        <text
          x={box.cx}
          y={box.heatLabelY}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          fill={
            view.heat === "warm" || view.heat === "hot" ? "#ff9d6b" : "#7fbfff"
          }
        >
          {HEAT_LABEL[view.heat]}
        </text>
      )}
    </g>
  );
}

/** A classic lab beaker: straight walls, rounded base, a pour spout and ticks. */
function Beaker({
  view,
  box,
  stroke,
}: {
  readonly view: StationView;
  readonly box: StationBox;
  readonly stroke: string;
}) {
  const { x, y, w, h } = box.vessel;
  const r = Math.min(10, w * 0.14);
  const lw = view.active ? 5 : 4;

  // Body: down the left wall, round the base, up the right wall (open top).
  const body =
    `M ${x} ${y} L ${x} ${y + h - r} ` +
    `Q ${x} ${y + h} ${x + r} ${y + h} ` +
    `L ${x + w - r} ${y + h} ` +
    `Q ${x + w} ${y + h} ${x + w} ${y + h - r} ` +
    `L ${x + w} ${y}`;

  // Three graduation ticks down the right interior wall.
  const ticks = [0.42, 0.58, 0.74].map((f) => {
    const ty = y + h * f;
    return (
      <line
        key={f}
        x1={x + w - 1}
        y1={ty}
        x2={x + w - w * 0.18}
        y2={ty}
        stroke={stroke}
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
    );
  });

  return (
    <g>
      {/* Faint glass volume so the beaker reads as a vessel, not an outline. */}
      <path d={`${body} Z`} fill="rgba(175, 205, 240, 0.06)" />
      {/* Open rim with a pour spout at the top-left. */}
      <path
        d={`M ${x - 10} ${y - 8} L ${x} ${y} L ${x + w} ${y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={lw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={body}
        fill="none"
        stroke={stroke}
        strokeWidth={lw}
        strokeLinejoin="round"
      />
      {ticks}
    </g>
  );
}

/**
 * A funnel holding a folded filter paper, with the caught residue (sand) drawn as
 * a mound when the station is non-empty. The mound is tinted by the station's
 * colour so it reads as whatever was separated out.
 */
function Funnel({
  view,
  box,
  stroke,
}: {
  readonly view: StationView;
  readonly box: StationBox;
  readonly stroke: string;
}) {
  const { x, y, w, h } = box.vessel;
  const { cx, baseY } = box;
  const lw = view.active ? 5 : 4;

  const coneBottom = y + h * 0.52;
  const stemHalf = w * 0.09;
  const pad = 7;

  // Funnel outline: wide mouth → narrow stem → down to the base (open top).
  const funnel =
    `M ${x} ${y} ` +
    `L ${cx - stemHalf} ${coneBottom} ` +
    `L ${cx - stemHalf} ${baseY} ` +
    `L ${cx + stemHalf} ${baseY} ` +
    `L ${cx + stemHalf} ${coneBottom} ` +
    `L ${x + w} ${y}`;

  // Filter paper: a cone folded inside the funnel mouth.
  const paperLeft = x + pad;
  const paperRight = x + w - pad;
  const paperTip = coneBottom - 2;
  const paper = `M ${paperLeft} ${y + pad} L ${cx} ${paperTip} L ${paperRight} ${y + pad} Z`;

  // Sand mound caught in the paper cone, tinted by the station colour.
  let mound = null;
  if (!view.empty) {
    const f = 0.5; // how far down the cone the mound's top sits
    const topY = lerp(y + pad, paperTip, f);
    const left = lerp(paperLeft, cx, f);
    const right = lerp(paperRight, cx, f);
    const sand =
      `M ${left} ${topY} ` +
      `Q ${cx} ${topY - (right - left) * 0.18} ${right} ${topY} ` +
      `L ${cx} ${paperTip} Z`;
    mound = (
      <g>
        <path d={sand} fill={view.color} stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
        {/* A few grains for grit. */}
        {[-0.3, 0.05, 0.32].map((dx, k) => (
          <circle
            key={k}
            cx={cx + dx * (right - left)}
            cy={lerp(topY, paperTip, 0.35 + k * 0.12)}
            r={1.4}
            fill="rgba(0,0,0,0.28)"
          />
        ))}
      </g>
    );
  }

  return (
    <g>
      <path d={paper} fill={PAPER} fillOpacity={0.9} stroke={stroke} strokeOpacity={0.5} strokeWidth={1.5} />
      {mound}
      <path
        d={funnel}
        fill="rgba(175, 205, 240, 0.06)"
        stroke={stroke}
        strokeWidth={lw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}
