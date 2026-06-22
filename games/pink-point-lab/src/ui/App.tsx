import { useState } from "react";
import {
  type LearnLoopTemplateConfigInput,
  createLearnLoopTemplatePresentation,
  LearnLoopGame,
} from "@learn-loop/template";
import { missionPresentations, missions } from "../content/missions";

const templateConfig: LearnLoopTemplateConfigInput = {
  theme: { palette: "clean-lab", accent: "rose", intensity: "standard" },
  variants: { header: "compact", stage: "split-bench", feedback: "inline" },
};

export function App() {
  const [missionIndex, setMissionIndex] = useState(0);
  const scenario = missions[missionIndex];
  const missionTitles = missions.map((mission) => mission.title);
  const presentation = createLearnLoopTemplatePresentation(
    missionPresentations[missionIndex],
  );

  return (
    <div className="pink-point-app">
      <LearnLoopGame
        key={scenario.id}
        title="Pink Point Lab"
        eyebrow={`Indicators · Class ${scenario.grade}`}
        scenario={scenario}
        config={templateConfig}
        presentation={presentation}
        missionIndex={missionIndex}
        missionCount={missions.length}
        missionTitles={missionTitles}
        onSelectMission={setMissionIndex}
      />
    </div>
  );
}
