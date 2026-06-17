import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { acidBaseExperiment } from "../content/acidBase";
import { metalAcidExperiment } from "../content/metalAcid";
import { saltSandExperiment } from "../content/saltSand";
import type { Chemical } from "../contracts/chemistry";
import { createLabSession, currentStep, reduce } from "../domain/labSession";
import { gateTap, hintTargetFor } from "../domain/tapGate";
import type { Experiment, Step } from "../contracts/experiment";
import type { LabScene, StationView } from "../scene/labRenderer";
import { apparatusFor } from "../scene/apparatus";
import { LabCanvas } from "./LabCanvas";
import { Apparatus } from "./Apparatus";
import { LabDiorama } from "./LabDiorama";
import { ToolTray } from "./ToolTray";

const SCENE_W = 360;
const SCENE_H = 360;

const EXPERIMENTS: readonly Experiment[] = [
  acidBaseExperiment,
  metalAcidExperiment,
  saltSandExperiment,
];

function chemicalMap(experiment: Experiment): Map<string, Chemical> {
  return new Map(experiment.chemicals.map((c) => [c.id, c]));
}

/** The station the current step acts on (a pour/heat target, or a filter source). */
function activeStationOf(step: Step | null): string | undefined {
  if (!step) return undefined;
  return step.expect.target ?? step.expect.source;
}

/** A station id turned into a short caption: "mixture" → "Mixture". */
function titleCase(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function App() {
  const [experiment, setExperiment] = useState<Experiment>(EXPERIMENTS[0]);

  return (
    <main className="app">
      <header className="app-header">
        <h1>{experiment.title}</h1>
        <p className="concept">
          {experiment.concept} · Class {experiment.grade}
        </p>
        <nav className="experiment-picker" aria-label="Choose an experiment">
          {EXPERIMENTS.map((exp) => (
            <button
              key={exp.id}
              className={`picker-tab ${exp.id === experiment.id ? "active" : ""}`}
              onClick={() => setExperiment(exp)}
            >
              {exp.concept.split("—")[0].trim()}
            </button>
          ))}
        </nav>
      </header>

      {/* Remount on experiment change to reset the session cleanly. */}
      <LabSession key={experiment.id} experiment={experiment} />
    </main>
  );
}

/** How long a pour stream / filter / heat animates before it resolves (ms). */
const POUR_MS = 600;
const ACT_MS = 700;

function LabSession({ experiment }: { readonly experiment: Experiment }) {
  const [state, dispatch] = useReducer(reduce, experiment, createLabSession);
  const chemicals = useMemo(() => chemicalMap(experiment), [experiment]);
  const stationOrder = useMemo(
    () => Object.keys(experiment.stations),
    [experiment],
  );

  // The reagent whose pour stream is in flight, and any in-flight filter/heat.
  const [pouring, setPouring] = useState<string | null>(null);
  const [busy, setBusy] = useState<"filter" | "heat" | null>(null);
  // The nudge shown after the student taps a wrong tool (off-family). Resets per step.
  const [errNudge, setErrNudge] = useState<string | null>(null);
  const actTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (actTimer.current) window.clearTimeout(actTimer.current);
    },
    [],
  );

  const result = state.result;
  const step = currentStep(state);
  const activeId = activeStationOf(step);
  const inFlight = Boolean(pouring) || Boolean(busy);

  // The action is the decision: never show a guess screen — auto-advance out of
  // the predict phase so the student lands straight on the live bench.
  useEffect(() => {
    if (state.phase === "predict") dispatch({ type: "advance-phase" });
  }, [state.phase]);

  // A fresh step clears any lingering wrong-tap nudge (the reducer clears result).
  useEffect(() => {
    setErrNudge(null);
  }, [state.stepIndex]);

  /** Run any action after a short animation beat, then resolve it. */
  const runAfter = (action: Parameters<typeof dispatch>[0], delay: number) => {
    actTimer.current = window.setTimeout(() => {
      dispatch(action);
      setPouring(null);
      setBusy(null);
      actTimer.current = null;
    }, delay);
  };

  const startPour = (reagent: string, target: string) => {
    if (inFlight) return;
    setPouring(reagent);
    runAfter({ type: "perform", action: { type: "pour", reagent, target } }, POUR_MS);
  };

  const startFilter = (source: string) => {
    if (inFlight) return;
    setBusy("filter");
    runAfter({ type: "perform", action: { type: "filter", source } }, ACT_MS);
  };

  const startHeat = (target: string) => {
    if (inFlight) return;
    setBusy("heat");
    runAfter({ type: "perform", action: { type: "heat", target } }, ACT_MS);
  };

  // The step has produced its visible effect — show the merged effect + why panel.
  const resolved = state.phase === "observe" && Boolean(result?.visibleChange);
  // Still choosing a move (predict is transient; observe before a visible change).
  const working = !resolved && state.phase !== "complete";
  // The student has erred this step (an off-family nudge, or an in-family pour
  // that the engine judged inert) — the safety-net hint kicks in.
  const errored = errNudge !== null || Boolean(result && !result.visibleChange);
  // The cue's secondary line: the wrong-tap nudge, if any.
  const nudgeText =
    errNudge ?? (result && !result.visibleChange ? result.observation : null);

  const stations: StationView[] = stationOrder.map((id) => {
    const st = state.workspace.stations[id];
    const isActive = id === activeId;
    return {
      id,
      label: titleCase(id),
      apparatus: apparatusFor(experiment.id, id),
      color: st.color,
      heat: st.heat,
      empty: st.contents.length === 0,
      emitting: Boolean(result?.emits?.length) && isActive,
      active: isActive,
      heated:
        step?.expect.type === "heat" &&
        step.expect.target === id &&
        state.phase !== "predict",
    };
  });

  const scene: LabScene = {
    stations,
    pour:
      pouring && activeId
        ? { color: chemicals.get(pouring)?.color ?? "#cfe6f5", stationId: activeId }
        : null,
    width: SCENE_W,
    height: SCENE_H,
  };
  const target = result?.visibleChange ? 1 : 0;

  const shelf = experiment.shelf
    .map((id) => chemicals.get(id))
    .filter((c): c is Chemical => Boolean(c));

  const stepNumber = Math.min(state.stepIndex + 1, experiment.steps.length);

  // The experiment's full toolkit.
  const hasFilter = experiment.steps.some((s) => s.expect.type === "filter");
  const hasHeat = experiment.steps.some((s) => s.expect.type === "heat");

  /** Tapping a tool is the decision: gate it, then run the engine or nudge. */
  const onTap = (action: "pour" | "filter" | "heat", reagentId?: string) => {
    if (!step || inFlight) return;
    const outcome = gateTap(step, action);
    if (outcome.kind === "nudge") {
      setErrNudge(outcome.text);
      return;
    }
    setErrNudge(null);
    if (action === "pour") {
      startPour(reagentId ?? "", step.expect.target ?? activeId ?? "");
    } else if (action === "filter" && step.expect.source) {
      startFilter(step.expect.source);
    } else if (action === "heat" && step.expect.target) {
      startHeat(step.expect.target);
    }
  };

  /** Resolved → advance across observe → explain → next step in one beat. */
  const finishStep = () => {
    dispatch({ type: "advance-phase" });
    dispatch({ type: "advance-phase" });
  };

  return (
    <>
      <div className="stage">
        <LabDiorama scene={scene} />
        <LabCanvas scene={scene} target={target} />
        <Apparatus scene={scene} />
      </div>

      {state.phase !== "complete" && step && (
        <p className="step-counter">
          Step {stepNumber} of {experiment.steps.length}
        </p>
      )}

      <div className="workbench">
        {working && step && (
          <section className="panel cue">
            <p className="prompt">{step.goal ?? step.actionPrompt}</p>
            {nudgeText && <p className="observation nudge">{nudgeText}</p>}
          </section>
        )}

        {resolved && step && (
          <section className="panel result">
            <p className="observation">{result?.observation}</p>
            {result?.emits?.map((e) => (
              <p key={e.gas} className="emission">
                {e.observation}
              </p>
            ))}
            <p className="explanation">{result?.explanation ?? step.explanation}</p>
            <button className="primary" onClick={finishStep}>
              {state.stepIndex + 1 < experiment.steps.length
                ? "Next step"
                : "Finish"}
            </button>
          </section>
        )}

        {state.phase === "complete" && (
          <section className="panel">
            <h2>Experiment complete</h2>
            <p className="explanation">
              Nicely done — you worked through every step. Pick another experiment
              above to keep exploring.
            </p>
          </section>
        )}
      </div>

      {step && state.phase !== "complete" && (
        <ToolTray
          reagents={shelf}
          hasFilter={hasFilter}
          hasHeat={hasHeat}
          hint={errored ? hintTargetFor(step) : null}
          pendingReagent={pouring}
          busy={busy}
          disabled={inFlight || resolved}
          onPour={(id) => onTap("pour", id)}
          onFilter={() => onTap("filter")}
          onHeat={() => onTap("heat")}
        />
      )}
    </>
  );
}
