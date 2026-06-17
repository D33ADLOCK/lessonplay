/**
 * The bottom **tool tray** — the game's toolkit dock.
 *
 * The bench is open: every tool the experiment owns (reagent bottles, the funnel,
 * the burner) is tappable on every step, so *choosing the right tool is the
 * decision*. Nothing is highlighted up front. Only once the student taps a wrong
 * tool does the correct one start to glow, as a safety net — driven by `hint`.
 *
 * It is pure presentation: it reports *which* tool was tapped and lets the caller
 * adjudicate the chemistry. The whole tray goes quiet while an action animates and
 * after the step has resolved (`disabled`). A tool in flight shows a working state.
 */

import type { Chemical } from "../contracts/chemistry";
import type { ToolHint } from "../domain/tapGate";

interface ToolTrayProps {
  readonly reagents: readonly Chemical[];
  /** Whether this experiment ever filters / heats (shows those tools at all). */
  readonly hasFilter: boolean;
  readonly hasHeat: boolean;
  /** Which tool to glow as a hint after a wrong tap, or null for none. */
  readonly hint: ToolHint;
  /** Reagent id whose pour is in flight. */
  readonly pendingReagent: string | null;
  /** Which non-pour tool is working. */
  readonly busy: "filter" | "heat" | null;
  /** Whole tray off while an action animates or the step has resolved. */
  readonly disabled: boolean;
  readonly onPour: (reagentId: string) => void;
  readonly onFilter: () => void;
  readonly onHeat: () => void;
}

export function ToolTray({
  reagents,
  hasFilter,
  hasHeat,
  hint,
  pendingReagent,
  busy,
  disabled,
  onPour,
  onFilter,
  onHeat,
}: ToolTrayProps) {
  const reagentHinted = (id: string) =>
    hint?.kind === "reagent" && hint.reagentId === id;

  return (
    <div className="tool-tray" role="toolbar" aria-label="Lab tools">
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

      {(hasFilter || hasHeat) && <span className="tool-divider" aria-hidden="true" />}

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
      </div>
    </div>
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
      {/* Reagent level, tinted by the chemical's colour. */}
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
