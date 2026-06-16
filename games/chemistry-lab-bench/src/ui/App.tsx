import { useMemo, useReducer } from "react";
import { acidBaseExperiment } from "../content/acidBase";
import type { Chemical } from "../contracts/chemistry";
import {
  createLabSession,
  reduce,
  type LabSessionState,
} from "../domain/labSession";
import type { LabScene } from "../scene/labRenderer";
import { LabCanvas } from "./LabCanvas";
import { PredictionPanel } from "./PredictionPanel";
import { ReagentShelf } from "./ReagentShelf";

const SCENE_W = 360;
const SCENE_H = 360;
const DEFAULT_COLOR = "#dfe9f5";
const DEFAULT_TEMP = 25;

function lookup(experiment: LabSessionState["experiment"]) {
  const byId = new Map<string, Chemical>(
    experiment.chemicals.map((c) => [c.id, c]),
  );
  return byId;
}

export function App() {
  const experiment = acidBaseExperiment;
  const [state, dispatch] = useReducer(reduce, experiment, createLabSession);
  const chemicals = useMemo(() => lookup(experiment), [experiment]);
  const shelf = experiment.shelf
    .map((id) => chemicals.get(id))
    .filter((c): c is Chemical => Boolean(c));

  // The scene tweens from the starting (colourless, 25°C) state to the
  // reaction result. Target is 1 once a visible reaction has resolved.
  const result = state.result;
  const scene: LabScene = {
    fromColor: DEFAULT_COLOR,
    toColor: result?.newColor ?? DEFAULT_COLOR,
    fromTemp: result?.temperature?.from ?? DEFAULT_TEMP,
    toTemp: result?.temperature?.to ?? DEFAULT_TEMP,
    width: SCENE_W,
    height: SCENE_H,
  };
  const target = result?.visibleChange ? 1 : 0;

  return (
    <main className="app">
      <header className="app-header">
        <h1>{experiment.title}</h1>
        <p className="concept">{experiment.concept} · Class {experiment.grade}</p>
      </header>

      <div className="stage">
        <LabCanvas scene={scene} target={target} />
      </div>

      {state.phase === "predict" && (
        <PredictionPanel
          prompt={experiment.task.predictPrompt}
          options={experiment.task.options}
          chosen={state.prediction}
          onChoose={(option) =>
            dispatch({ type: "submit-prediction", option })
          }
          onContinue={() => dispatch({ type: "advance-phase" })}
        />
      )}

      {state.phase === "observe" &&
        (result?.visibleChange ? (
          <section className="panel">
            <p className="observation">{result.observation}</p>
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
              {result ? result.observation : experiment.task.actionPrompt}
            </p>
            <ReagentShelf
              reagents={shelf}
              selected={state.selectedReagent}
              onSelect={(id) =>
                dispatch({ type: "select-reagent", reagent: id })
              }
              disabled={false}
            />
            <button
              className="primary"
              disabled={!state.selectedReagent}
              onClick={() => dispatch({ type: "pour" })}
            >
              Pour into beaker
            </button>
          </section>
        ))}

      {state.phase === "explain" && (
        <section className="panel">
          <h2>Explanation</h2>
          <p className="explanation">
            {result?.explanation ?? experiment.task.explanation}
          </p>
        </section>
      )}
    </main>
  );
}
