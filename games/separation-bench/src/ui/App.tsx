import { useMemo, useState } from "react";
import type { Scenario } from "@learn-loop/core";
import {
  CompletePanel,
  CuePanel,
  ResultPanel,
  Stage,
  StepCounter,
  titleCase,
  ToolTray,
  useGuidedSession,
} from "@learn-loop/core/ui";
import { saltSandScenario } from "../content/saltSand";
import { distillationScenario } from "../content/distillation";
import { crystallizationScenario } from "../content/crystallization";
import type { LabScene, StationView } from "../scene/labRenderer";
import { apparatusFor } from "../scene/apparatus";
import { LabCanvas } from "./LabCanvas";
import { Apparatus } from "./Apparatus";
import { LabDiorama } from "./LabDiorama";

const SCENE_W = 360;
const SCENE_H = 360;

const SCENARIOS: readonly Scenario[] = [
  saltSandScenario,
  distillationScenario,
  crystallizationScenario,
];

export function App() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);

  return (
    <main className="app">
      <header className="app-header">
        <h1>{scenario.title}</h1>
        <p className="concept">
          {scenario.concept} · Class {scenario.grade}
        </p>
        <nav className="experiment-picker" aria-label="Choose an experiment">
          {SCENARIOS.map((entry) => (
            <button
              key={entry.id}
              className={`picker-tab ${entry.id === scenario.id ? "active" : ""}`}
              onClick={() => setScenario(entry)}
            >
              {entry.concept.split("—")[0].trim()}
            </button>
          ))}
        </nav>
      </header>

      {/* Remount on scenario change to reset the session cleanly. */}
      <LabSession key={scenario.id} scenario={scenario} />
    </main>
  );
}

function LabSession({ scenario }: { readonly scenario: Scenario }) {
  const session = useGuidedSession(scenario);
  const {
    state,
    step,
    activeId,
    result,
    working,
    resolved,
    nudgeText,
    stepNumber,
    totalSteps,
    hasFilter,
    hasHeat,
    shelf,
    pouring,
    busy,
    inFlight,
    animTarget,
    hint,
    entity,
    onTap,
    finishStep,
  } = session;
  const stationOrder = useMemo(
    () => Object.keys(scenario.stations),
    [scenario],
  );

  const stations: StationView[] = stationOrder.map((id) => {
    const st = state.workspace.stations[id];
    const isActive = id === activeId;
    return {
      id,
      label: titleCase(id),
      apparatus: apparatusFor(scenario.id, id),
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
        ? { color: entity(pouring)?.color ?? "#cfe6f5", stationId: activeId }
        : null,
    width: SCENE_W,
    height: SCENE_H,
  };

  return (
    <>
      <Stage
        backdrop={<LabDiorama scene={scene} />}
        foreground={<Apparatus scene={scene} />}
      >
        <LabCanvas scene={scene} target={animTarget} />
      </Stage>

      {state.phase !== "complete" && step && (
        <StepCounter current={stepNumber} total={totalSteps} />
      )}

      <div className="workbench">
        {working && step && (
          <CuePanel prompt={step.goal ?? step.actionPrompt} nudge={nudgeText} />
        )}

        {resolved && step && (
          <ResultPanel
            observation={result?.observation ?? ""}
            emissions={result?.emits}
            explanation={result?.explanation ?? step.explanation}
            isLast={state.stepIndex + 1 >= scenario.steps.length}
            onAdvance={finishStep}
          />
        )}

        {state.phase === "complete" && (
          <CompletePanel
            title="Experiment complete"
            message="Nicely done — you worked through every step. Pick another experiment above to keep exploring."
          />
        )}
      </div>

      {step && state.phase !== "complete" && (
        <ToolTray
          reagents={shelf}
          hasFilter={hasFilter}
          hasHeat={hasHeat}
          hint={hint}
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
