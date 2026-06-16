import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { acidBaseExperiment } from "../content/acidBase";
import { metalAcidExperiment } from "../content/metalAcid";
import type { Chemical } from "../contracts/chemistry";
import { createLabSession, currentStep, reduce } from "../domain/labSession";
import type { Experiment } from "../contracts/experiment";
import type { LabScene } from "../scene/labRenderer";
import { LabCanvas } from "./LabCanvas";
import { PredictionPanel } from "./PredictionPanel";
import { ReagentShelf } from "./ReagentShelf";

const SCENE_W = 360;
const SCENE_H = 360;

const EXPERIMENTS: readonly Experiment[] = [
  acidBaseExperiment,
  metalAcidExperiment,
];

function chemicalMap(experiment: Experiment): Map<string, Chemical> {
  return new Map(experiment.chemicals.map((c) => [c.id, c]));
}

/** The id of the single station the v2 UI renders (the beaker). */
function beakerId(experiment: Experiment): string {
  return Object.keys(experiment.stations)[0];
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

/** How long the pour stream animates before the reaction resolves (ms). */
const POUR_MS = 600;

function LabSession({ experiment }: { readonly experiment: Experiment }) {
  const [state, dispatch] = useReducer(reduce, experiment, createLabSession);
  const chemicals = useMemo(() => chemicalMap(experiment), [experiment]);

  // The reagent whose pour stream is currently in flight, if any.
  const [pouring, setPouring] = useState<string | null>(null);
  const pourTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (pourTimer.current) window.clearTimeout(pourTimer.current);
    },
    [],
  );

  const bId = beakerId(experiment);
  const initialColor = experiment.stations[bId].color;
  const beaker = state.workspace.stations[bId];
  const result = state.result;
  const step = currentStep(state);

  const startPour = (reagent: string) => {
    if (pouring) return;
    setPouring(reagent);
    pourTimer.current = window.setTimeout(() => {
      dispatch({
        type: "perform",
        action: { type: "pour", reagent, target: bId },
      });
      setPouring(null);
      pourTimer.current = null;
    }, POUR_MS);
  };

  const scene: LabScene = {
    fromColor: initialColor,
    toColor: result?.newColor ?? beaker.color,
    heat: beaker.heat,
    emitting: Boolean(result?.emits?.length),
    pour: pouring ? { color: chemicals.get(pouring)?.color ?? "#cfe6f5" } : null,
    width: SCENE_W,
    height: SCENE_H,
  };
  const target = result?.visibleChange ? 1 : 0;

  const shelf = experiment.shelf
    .map((id) => chemicals.get(id))
    .filter((c): c is Chemical => Boolean(c));

  const stepNumber = Math.min(state.stepIndex + 1, experiment.steps.length);

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
            <ReagentShelf
              reagents={shelf}
              selected={state.selectedReagent}
              onSelect={(id) =>
                dispatch({ type: "select-reagent", reagent: id })
              }
              disabled={Boolean(pouring)}
            />
            <button
              className="primary"
              disabled={!state.selectedReagent || Boolean(pouring)}
              onClick={() =>
                state.selectedReagent && startPour(state.selectedReagent)
              }
            >
              {pouring ? "Pouring…" : "Pour into beaker"}
            </button>
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
