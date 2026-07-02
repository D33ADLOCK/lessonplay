import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  isClassifyGoal,
  type ExperimentGame,
  type ExperimentVisual,
} from "../model/experimentLab";
import { Beaker } from "./Beaker";
import {
  experimentLabThemeClasses,
  type ExperimentLabThemeInput,
} from "./experimentLabTheme";
import { useExperimentSession } from "./useExperimentSession";

export interface ExperimentLabViewportProps {
  /** The complete, validated discovery game to play. */
  readonly game: ExperimentGame;
  /** Topbar title; defaults to `game.title`. */
  readonly title?: string;
  /** Body copy on the final "case closed" screen. */
  readonly completionMessage?: string;
  /**
   * Optional visual skin. Picks palette (background) / accent (the Tyndall beam
   * colour) / intensity (glow strength). Unknown tokens fall back to the
   * dark-glow default (night-lab / cyan / standard). Omit it for that default.
   */
  readonly theme?: ExperimentLabThemeInput;
}

/** A small default icon per common tool id; unknown tools get a generic one. */
const TOOL_ICON: Record<string, string> = {
  light: "🔦",
  settle: "⏳",
  filter: "🧪",
  heat: "🔥",
  stir: "🥄",
  acid: "💧",
  base: "🧴",
  litmus: "🟪",
  water: "💧",
  magnet: "🧲",
  limewater: "🥛",
  flame: "🔥",
  evaporate: "♨️",
};

/** How a recorded reading reads in a notebook cell, keyed by the stable visual. */
const VISUAL_CELL: Record<ExperimentVisual, { label: string; cls: string }> = {
  beam: { label: "beam", cls: "gcell--beam" },
  settle: { label: "sinks", cls: "gcell--settle" },
  residue: { label: "residue", cls: "gcell--residue" },
  fizz: { label: "fizz", cls: "gcell--fizz" },
  "color-change": { label: "colour", cls: "gcell--colour" },
  gas: { label: "gas", cls: "gcell--gas" },
  precipitate: { label: "milky", cls: "gcell--ppt" },
  conductivity: { label: "bulb", cls: "gcell--conductivity" },
  temperature: { label: "temp", cls: "gcell--temperature" },
  "ph-scale": { label: "pH", cls: "gcell--ph" },
  odour: { label: "smell", cls: "gcell--odour" },
  none: { label: "clear", cls: "gcell--none" },
};

/** How each possible effect reads as a "what will happen?" prediction choice. */
const PREDICT_LABEL: Record<ExperimentVisual, string> = {
  beam: "A beam lights up",
  settle: "It settles and sinks",
  residue: "Residue is left behind",
  fizz: "It fizzes",
  "color-change": "The colour changes",
  gas: "Gas bubbles off",
  precipitate: "It turns milky",
  conductivity: "The bulb glows",
  temperature: "It heats up or cools",
  "ph-scale": "The pH strip changes colour",
  odour: "A smell is released",
  none: "Nothing changes",
};

const DEFAULT_COMPLETION =
  "You sorted every sample by reading the evidence — not by guessing.";

/**
 * The reusable cause→effect discovery surface for an {@link ExperimentGame}.
 *
 * Render a whole game with `<ExperimentLabViewport game={game} />`: it owns the
 * full 9:16 dark-glow frame, the hero {@link Beaker} with its Tyndall beam and
 * settle/residue animations, the live observe-and-record loop, the sample × tool
 * readings grid, and the classify → reveal payoff. All gameplay logic comes from
 * the tested session reducer via {@link useExperimentSession}; this component is
 * presentation only. Skin it with the optional `theme` prop.
 */
export function ExperimentLabViewport({
  game,
  title,
  completionMessage = DEFAULT_COMPLETION,
  theme,
}: ExperimentLabViewportProps) {
  const session = useExperimentSession(game);
  const { state, level } = session;
  const goal = level.goal;

  // Hints are shown in a dismissible modal so they never cover the bench and can
  // always be closed. Local UI state — revealed-hint count still lives in the
  // session reducer; this only tracks whether the panel is open.
  const [hintsOpen, setHintsOpen] = useState(false);

  const categoryById = useMemo(
    () => new Map(game.categories.map((c) => [c.id, c])),
    [game.categories],
  );

  const toolShort = (toolId: string): string => {
    const tool = game.definition.tools.find((t) => t.id === toolId);
    if (!tool) return toolId;
    // Last word of the label reads well as a column header ("Side light" →
    // "light", "Let it stand" → "stand", "Filter" → "filter").
    return tool.label.split(" ").pop()?.toLowerCase() ?? toolId;
  };

  return (
    <div className={`experiment-lab-app ${experimentLabThemeClasses(theme)}`}>
      <header className="topbar">
        <span className="topbar__title">{title ?? game.title}</span>
        <span className="topbar__level">
          {state.phase === "complete"
            ? "Solved"
            : `Case ${state.levelIndex + 1} / ${game.levels.length}`}
        </span>
      </header>

      <main className="stage">
        <div className="stage__label">{session.selectedSample?.label ?? "—"}</div>
        {session.goalKind === "reach-target-state" && session.targetLabel && (
          <div className="stage__objective">🎯 {session.targetLabel}</div>
        )}
        {session.goalKind === "predict-outcome" &&
          session.promptProgress.total > 0 && (
            <div className="stage__objective">
              Prediction{" "}
              {Math.min(
                session.promptProgress.index + 1,
                session.promptProgress.total,
              )}{" "}
              of {session.promptProgress.total}
            </div>
          )}
        <Beaker
          visual={session.activeVisual}
          cloudy={session.cloudy}
          animating={session.busy}
          gasLabel={session.activeGasLabel}
        />
        <p className={`reading ${session.busy ? "is-live" : ""}`}>
          {session.reading ?? "Pick a tool below to test this sample."}
        </p>
        {session.predictionOutcome && (
          <p className={`predict-verdict is-${session.predictionOutcome}`}>
            {session.predictionOutcome === "correct"
              ? "✓ You called it."
              : "✗ Not what you predicted — now you know."}
          </p>
        )}
      </main>

      {/* Free-probe tools. A predict-outcome level is prompt-driven (the tool is
          named by each prompt), so its bench hides the picker. */}
      {session.goalKind !== "predict-outcome" && (
      <section className="tools" aria-label="Tools">
        {level.toolIds.map((id) => {
          const t = game.definition.tools.find((tool) => tool.id === id);
          if (!t) return null;
          return (
            <button
              key={id}
              className="tool"
              disabled={!session.interactive || !state.selectedSampleId}
              onClick={() => session.selectTool(id)}
            >
              <span className="tool__icon" aria-hidden>
                {TOOL_ICON[id] ?? "🔬"}
              </span>
              <span className="tool__label">{t.label}</span>
            </button>
          );
        })}
      </section>
      )}

      {/* The readings grid — the surface you reason from. */}
      <section
        className="grid"
        aria-label="Lab notebook"
        style={{ ["--cols" as string]: level.toolIds.length }}
      >
        <div className="grid__row grid__row--head">
          <span className="grid__name">Lab notes</span>
          {level.toolIds.map((tid) => (
            <span key={tid} className="grid__col">
              {toolShort(tid)}
            </span>
          ))}
        </div>
        {level.sampleIds.map((sid) => {
          const s = session.sampleById.get(sid);
          if (!s) return null;
          return (
            <button
              key={sid}
              className={`grid__row ${
                sid === state.selectedSampleId ? "is-active" : ""
              }`}
              disabled={!session.interactive}
              onClick={() => session.selectSample(sid)}
            >
              <span className="grid__name">{s.label}</span>
              {level.toolIds.map((tid) => {
                const r = session.readingFor(sid, tid);
                const cell = r ? VISUAL_CELL[r.visual] : null;
                // Prefer the structured reading (the actual clue: "red", "pH 2",
                // "on", "H₂") over the generic visual label when the effect
                // carries one, so the notebook shows real evidence.
                const cellText = r
                  ? (r.readout?.value ?? r.gasLabel ?? cell?.label ?? "·")
                  : "·";
                return (
                  <span
                    key={tid}
                    className={`gcell ${cell ? cell.cls : "gcell--empty"}`}
                  >
                    {cellText}
                  </span>
                );
              })}
            </button>
          );
        })}
      </section>

      <footer className="actions">
        {level.hints.length > 0 && (
          <button
            className="btn btn--ghost"
            disabled={!session.interactive}
            onClick={() => {
              // Reveal the first hint on the first open; reopening just re-shows
              // what's already been unlocked.
              if (state.hintsRevealed === 0) session.requestHint();
              setHintsOpen(true);
            }}
          >
            Hint
          </button>
        )}
        {session.goalKind === "classify" && (
          <button
            className="btn btn--primary"
            disabled={!session.interactive || !session.canClassify}
            onClick={session.openClassify}
          >
            {session.canClassify ? "Make the call" : "Test every unknown first"}
          </button>
        )}
        {session.goalKind === "reach-target-state" && (
          <span className="actions__status">
            Keep acting until the goal is met.
          </span>
        )}
        {session.goalKind === "predict-outcome" && (
          <span className="actions__status">
            {session.predictionScore.correct} right so far
          </span>
        )}
      </footer>

      {hintsOpen && session.interactive && state.hintsRevealed > 0 && (
        <Overlay>
          <h2 className="card__title">Hints</h2>
          <div className="hints">
            {level.hints.slice(0, state.hintsRevealed).map((h) => (
              <p key={h.id} className="hints__line">
                💡 {h.text}
              </p>
            ))}
          </div>
          {state.hintsRevealed < level.hints.length && (
            <button
              className="btn btn--ghost btn--block"
              onClick={session.requestHint}
            >
              Show another hint
            </button>
          )}
          <button
            className="btn btn--primary btn--block"
            onClick={() => setHintsOpen(false)}
          >
            Got it
          </button>
        </Overlay>
      )}

      {/* ---- Overlays: framing, the call, and the payoff (no quiz) ---- */}
      {state.phase === "intro" && (
        <Overlay>
          <h1 className="card__title">{level.title}</h1>
          <p className="card__body">{level.intro}</p>
          <button
            className="btn btn--primary btn--block"
            onClick={session.startLevel}
          >
            {state.levelIndex === 0 ? "Enter the lab" : "Open the case"}
          </button>
        </Overlay>
      )}

      {state.phase === "predicting" && (
        <Overlay>
          <h2 className="card__title">Predict first</h2>
          <p className="card__hint">
            What will <strong>{session.selectedTool?.label}</strong> do to{" "}
            {session.selectedSample?.label}?
          </p>
          <div className="predict">
            {session.predictChoices.map((v) => (
              <button
                key={v}
                className="pill pill--predict"
                onClick={() => session.predict(v)}
              >
                {PREDICT_LABEL[v]}
              </button>
            ))}
          </div>
        </Overlay>
      )}

      {state.phase === "classifying" && isClassifyGoal(goal) && (
        <Overlay wide>
          <h2 className="card__title">What is each one?</h2>
          <p className="card__hint">Read your notes and decide.</p>
          <div className="classify">
            {goal.classifyIds.map((id) => {
              const s = session.sampleById.get(id);
              if (!s) return null;
              const wrong =
                state.classificationResult?.perSample[id] === false;
              return (
                <div
                  key={id}
                  className={`classify__row ${wrong ? "is-wrong" : ""}`}
                >
                  <span className="classify__name">{s.label}</span>
                  <div className="classify__opts">
                    {goal.categoryIds.map((cid) => (
                      <button
                        key={cid}
                        className={`pill ${
                          state.assignments[id] === cid ? "is-chosen" : ""
                        }`}
                        onClick={() => session.assignCategory(id, cid)}
                      >
                        {categoryById.get(cid)?.label ?? cid}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {state.classificationResult?.correct === false && (
            <p className="verdict is-surprise">
              Not quite. The highlighted ones don&apos;t fit yet — check your
              notes.
            </p>
          )}
          <button
            className="btn btn--primary btn--block"
            disabled={goal.classifyIds.some((id) => !state.assignments[id])}
            onClick={session.submitClassification}
          >
            Submit
          </button>
        </Overlay>
      )}

      {state.phase === "revealed" && isClassifyGoal(goal) && (
        <Overlay wide>
          <h2 className="card__title">Right!</h2>
          {level.outro && <p className="card__body">{level.outro}</p>}
          <div className="reveal">
            {goal.classifyIds.map((id) => {
              const s = session.sampleById.get(id);
              if (!s) return null;
              const cat = categoryById.get(s.categoryId);
              return (
                <div key={id} className="reveal__row">
                  <div className="reveal__head">
                    <strong>{s.label}</strong>
                    <span className="reveal__real">{s.revealLabel}</span>
                  </div>
                  <div className="reveal__cat">{cat?.label}</div>
                  {cat?.definition && (
                    <p className="reveal__def">{cat.definition}</p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            className="btn btn--primary btn--block"
            onClick={session.nextLevel}
          >
            {state.levelIndex >= game.levels.length - 1 ? "Finish" : "Next case"}
          </button>
        </Overlay>
      )}

      {state.phase === "revealed" && session.goalKind === "predict-outcome" && (
        <Overlay wide>
          <h2 className="card__title">
            {session.predictionScore.correct === session.predictionScore.total
              ? "Perfect read!"
              : "Predictions in"}
          </h2>
          <p className="card__body">
            You called <strong>{session.predictionScore.correct}</strong> of{" "}
            {session.predictionScore.total} right.
          </p>
          {level.outro && <p className="card__body">{level.outro}</p>}
          <button
            className="btn btn--primary btn--block"
            onClick={session.nextLevel}
          >
            {state.levelIndex >= game.levels.length - 1 ? "Finish" : "Next case"}
          </button>
        </Overlay>
      )}

      {state.phase === "revealed" &&
        session.goalKind === "reach-target-state" && (
          <Overlay wide>
            <h2 className="card__title">Target reached</h2>
            {session.targetLabel && (
              <p className="card__hint">{session.targetLabel} ✓</p>
            )}
            {level.outro && <p className="card__body">{level.outro}</p>}
            <button
              className="btn btn--primary btn--block"
              onClick={session.nextLevel}
            >
              {state.levelIndex >= game.levels.length - 1
                ? "Finish"
                : "Next case"}
            </button>
          </Overlay>
        )}

      {state.phase === "complete" && (
        <Overlay>
          <div className="complete">
            <div className="complete__beam" aria-hidden>
              🔦
            </div>
            <h1 className="card__title">Case closed</h1>
            <p className="card__body">{completionMessage}</p>
            <button
              className="btn btn--primary btn--block"
              onClick={session.reset}
            >
              Play again
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({
  children,
  wide,
}: {
  readonly children: ReactNode;
  readonly wide?: boolean;
}) {
  return (
    <div className="overlay">
      <div className={`card ${wide ? "card--wide" : ""}`}>{children}</div>
    </div>
  );
}
