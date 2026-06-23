import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { acidBaseExperiment } from "../content/acidBase";
import { metalAcidExperiment } from "../content/metalAcid";
import { saltSandExperiment } from "../content/saltSand";
import type { Chemical } from "../contracts/chemistry";
import { createLabSession, currentStep, reduce } from "../domain/labSession";
import type { Experiment, Step } from "../contracts/experiment";
import type { LabScene, StationView } from "../scene/labRenderer";
import { LabCanvas } from "./LabCanvas";
import { PredictionPanel } from "./PredictionPanel";
import { ReagentShelf } from "./ReagentShelf";

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

  const stations: StationView[] = stationOrder.map((id) => {
    const st = state.workspace.stations[id];
    const isActive = id === activeId;
    return {
      id,
      label: titleCase(id),
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
  const activeLabel = activeId ? titleCase(activeId) : "beaker";

  return (
    <>
      <div className="stage">
        <LabCanvas scene={scene} target={target} />
      </div>

      {state.phase !== "complete" && step && (
        <p className="step-counter">
          Step {stepNumber} of {experiment.steps.length}
        </p>
      )}

      {state.phase === "predict" && step && (
        <PredictionPanel
          prompt={step.predictPrompt}
          options={step.options}
          chosen={state.prediction}
          onChoose={(option) =>
            dispatch({ type: "submit-prediction", option })
          }
          onContinue={() => dispatch({ type: "advance-phase" })}
        />
      )}

      {state.phase === "observe" &&
        step &&
        (result?.visibleChange ? (
          <section className="panel">
            <p className="observation">{result.observation}</p>
            {result.emits?.map((e) => (
              <p key={e.gas} className="emission">
                {e.observation}
              </p>
            ))}
            <button
              className="primary"
              onClick={() => dispatch({ type: "advance-phase" })}
            >
              Why did this happen?
            </button>
          </section>
        ) : (
          <section className="panel">
            <p className={result ? "observation nudge" : "prompt"}>
              {result ? result.observation : step.actionPrompt}
            </p>

            {step.expect.type === "pour" && (
              <>
                <ReagentShelf
                  reagents={shelf}
                  selected={state.selectedReagent}
                  onSelect={(id) =>
                    dispatch({ type: "select-reagent", reagent: id })
                  }
                  disabled={inFlight}
                />
                <button
                  className="primary"
                  disabled={!state.selectedReagent || inFlight}
                  onClick={() =>
                    state.selectedReagent &&
                    startPour(state.selectedReagent, step.expect.target ?? activeId ?? "")
                  }
                >
                  {pouring ? "Pouring…" : `Pour into the ${activeLabel}`}
                </button>
              </>
            )}

            {step.expect.type === "filter" && (
              <button
                className="primary"
                disabled={inFlight}
                onClick={() =>
                  step.expect.source && startFilter(step.expect.source)
                }
              >
                {busy === "filter" ? "Filtering…" : "Filter the mixture"}
              </button>
            )}

            {step.expect.type === "heat" && (
              <button
                className="primary"
                disabled={inFlight}
                onClick={() =>
                  step.expect.target && startHeat(step.expect.target)
                }
              >
                {busy === "heat" ? "Heating…" : `Heat the ${activeLabel}`}
              </button>
            )}
          </section>
        ))}

      {state.phase === "explain" && step && (
        <section className="panel">
          <h2>Explanation</h2>
          <p className="explanation">
            {result?.explanation ?? step.explanation}
          </p>
          <button
            className="primary"
            onClick={() => dispatch({ type: "advance-phase" })}
          >
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
    </>
  );
}
