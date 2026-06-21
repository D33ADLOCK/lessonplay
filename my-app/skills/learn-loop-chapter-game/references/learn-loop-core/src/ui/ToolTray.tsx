/**
 * The bottom **tool tray** — the game's toolkit dock. Domain-agnostic.
 *
 * The bench is open: every tool the scenario owns (entity bottles, the funnel,
 * the burner) is tappable on every step, so *choosing the right tool is the
 * decision*. Nothing is highlighted up front. Only once the learner taps a wrong
 * tool does the correct one start to glow, as a safety net — driven by `hint`.
 *
 * It is pure presentation: it reports *which* tool was tapped and lets the caller
 * adjudicate. The whole tray goes quiet while an action animates and after the
 * step has resolved (`disabled`). A tool in flight shows a working state.
 */

import type { ReactNode } from "react";
import type { Entity } from "../model/entity";
import type { ToolHint } from "../engine/tapGate";
import type { ActionType } from "../model/actions";

type WorkingTool = Exclude<ActionType, "pour" | "transfer" | "stir">;

export interface ToolTrayProps {
  /** Entities offered as pourable tools, in tray order. */
  readonly reagents: readonly Entity[];
  /** Whether this scenario ever filters / heats (shows those tools at all). */
  readonly hasFilter: boolean;
  readonly hasHeat: boolean;
  readonly hasCool?: boolean;
  readonly hasWait?: boolean;
  readonly hasShineLight?: boolean;
  readonly hasChromatograph?: boolean;
  /** Which tool to glow as a hint after a wrong tap, or null for none. */
  readonly hint: ToolHint;
  /** Reagent id whose pour is in flight. */
  readonly pendingReagent: string | null;
  /** Which non-pour tool is working. */
  readonly busy: WorkingTool | null;
  /** Whole tray off while an action animates or the step has resolved. */
  readonly disabled: boolean;
  readonly onPour: (reagentId: string) => void;
  readonly onFilter: () => void;
  readonly onHeat: () => void;
  readonly onCool?: () => void;
  readonly onWait?: () => void;
  readonly onShineLight?: () => void;
  readonly onChromatograph?: () => void;
}

export function ToolTray({
  reagents,
  hasFilter,
  hasHeat,
  hasCool = false,
  hasWait = false,
  hasShineLight = false,
  hasChromatograph = false,
  hint,
  pendingReagent,
  busy,
  disabled,
  onPour,
  onFilter,
  onHeat,
  onCool = () => {},
  onWait = () => {},
  onShineLight = () => {},
  onChromatograph = () => {},
}: ToolTrayProps) {
  const reagentHinted = (id: string) =>
    hint?.kind === "reagent" && hint.reagentId === id;
  const hasStationTools =
    hasFilter ||
    hasHeat ||
    hasCool ||
    hasWait ||
    hasShineLight ||
    hasChromatograph;

  return (
    <div className="tool-tray" role="toolbar" aria-label="Tools">
      <div className="tool-group">
        {reagents.map((r) => {
          const working = pendingReagent === r.id;
          return (
            <button
              key={r.id}
              className={`tool reagent-tool ${reagentHinted(r.id) ? "live" : ""}`}
              disabled={disabled}
              onClick={() => onPour(r.id)}
              title={r.label}
            >
              <BottleGlyph color={r.color} />
              <span className="tool-label">{working ? "Pouring…" : r.label}</span>
            </button>
          );
        })}
      </div>

      {hasStationTools && <span className="tool-divider" aria-hidden="true" />}

      <div className="tool-group">
        {hasFilter && (
          <button
            className={`tool ${hint?.kind === "filter" ? "live" : ""}`}
            disabled={disabled}
            onClick={onFilter}
            title="Filter"
          >
            <FunnelGlyph />
            <span className="tool-label">
              {busy === "filter" ? "Filtering…" : "Filter"}
            </span>
          </button>
        )}
        {hasHeat && (
          <button
            className={`tool ${hint?.kind === "heat" ? "live" : ""}`}
            disabled={disabled}
            onClick={onHeat}
            title="Heat"
          >
            <FlameGlyph />
            <span className="tool-label">
              {busy === "heat" ? "Heating…" : "Heat"}
            </span>
          </button>
        )}
        {hasCool && (
          <ToolButton
            title="Cool"
            label={busy === "cool" ? "Cooling…" : "Cool"}
            hinted={hint?.kind === "cool"}
            disabled={disabled}
            onClick={onCool}
            glyph={<CoolGlyph />}
          />
        )}
        {hasWait && (
          <ToolButton
            title="Wait"
            label={busy === "wait" ? "Waiting…" : "Wait"}
            hinted={hint?.kind === "wait"}
            disabled={disabled}
            onClick={onWait}
            glyph={<WaitGlyph />}
          />
        )}
        {hasShineLight && (
          <ToolButton
            title="Light test"
            label={busy === "shineLight" ? "Testing…" : "Light"}
            hinted={hint?.kind === "shineLight"}
            disabled={disabled}
            onClick={onShineLight}
            glyph={<LightGlyph />}
          />
        )}
        {hasChromatograph && (
          <ToolButton
            title="Chromatograph"
            label={busy === "chromatograph" ? "Running…" : "Chromatograph"}
            hinted={hint?.kind === "chromatograph"}
            disabled={disabled}
            onClick={onChromatograph}
            glyph={<ChromatographGlyph />}
          />
        )}
      </div>
    </div>
  );
}

function ToolButton({
  title,
  label,
  hinted,
  disabled,
  onClick,
  glyph,
}: {
  readonly title: string;
  readonly label: string;
  readonly hinted: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly glyph: ReactNode;
}) {
  return (
    <button
      className={`tool ${hinted ? "live" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {glyph}
      <span className="tool-label">{label}</span>
    </button>
  );
}

function BottleGlyph({ color }: { readonly color: string }) {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M11 3h6v4l3 6v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V13l3-6V3z"
        fill="rgba(255,255,255,0.08)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Reagent level, tinted by the entity's colour. */}
      <path
        d="M8.6 15h10.8v6a2 2 0 0 1-2 2H10.6a2 2 0 0 1-2-2v-6z"
        fill={color}
      />
      <rect x="10.5" y="2" width="7" height="2.4" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function FunnelGlyph() {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M4 5h20l-7 9v8l-6 3v-11L4 5z"
        fill="rgba(255,255,255,0.08)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameGlyph() {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-2 1-3.5 2.5-5 .5 1.5 1.5 2 2.5 2 .5-3-1.5-5-1.5-8 .8.6 1.7 1.4 2.5 3z"
        fill="rgba(255,140,50,0.18)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoolGlyph() {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 3v22M6 8l16 12M22 8 6 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WaitGlyph() {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <circle
        cx="14"
        cy="14"
        r="9"
        fill="rgba(255,255,255,0.08)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M14 8v7l4 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightGlyph() {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M4 15h8l9-6M12 15l9 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="5" cy="15" r="2.6" fill="currentColor" />
    </svg>
  );
}

function ChromatographGlyph() {
  return (
    <svg className="tool-glyph" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M9 3h10v22H9z"
        fill="rgba(255,255,255,0.08)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M11 18h6" stroke="#725ac1" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 14h6" stroke="#2d9cdb" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 10h6" stroke="#f2a541" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
