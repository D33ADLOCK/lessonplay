import { useState } from "react";
import {
  type LearnLoopTemplateConfigInput,
  createLearnLoopTemplatePresentation,
  LearnLoopGame,
} from "@learn-loop/template";
import {
  missionPresentations,
  missions,
} from "../content/missions";

export function App() {
  const [missionIndex, setMissionIndex] = useState(0);
  const scenario = missions[missionIndex];
  const missionTitles = missions.map((entry) => entry.title);
  const presentation = createLearnLoopTemplatePresentation(
    missionPresentations[missionIndex],
  );

  return (
    <div className="mixture-template-app">
      <LearnLoopGame
        key={scenario.id}
        title="Mixture Methods Lab"
        eyebrow={`Chapter 5 · Class ${scenario.grade}`}
        scenario={scenario}
        config={templateConfigForScenario(scenario.id)}
        presentation={presentation}
        missionIndex={missionIndex}
        missionCount={missions.length}
        missionTitles={missionTitles}
        onSelectMission={setMissionIndex}
      />
    </div>
  );
}

function templateConfigForScenario(
  scenarioId: string,
): LearnLoopTemplateConfigInput {
  if (scenarioId === "distillation") {
    return {
      theme: { palette: "night-lab", accent: "amber", intensity: "standard" },
      variants: { header: "standard", stage: "process-flow", feedback: "inline" },
    };
  }

  if (scenarioId === "chromatography") {
    return {
      theme: { palette: "field-notes", accent: "rose", intensity: "standard" },
      variants: { header: "compact", stage: "bench", feedback: "inline" },
    };
  }

  return {
    theme: { palette: "clean-lab", accent: "blue", intensity: "standard" },
    variants: { header: "standard", stage: "split-bench", feedback: "inline" },
  };
}
