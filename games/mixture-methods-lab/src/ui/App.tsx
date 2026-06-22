import { useState } from "react";
import { SandboxLabViewport } from "@learn-loop/core/ui";
import { sandboxLabMissions } from "../content/missions";

export function App() {
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = sandboxLabMissions[missionIndex];
  const missionTitles = sandboxLabMissions.map((entry) => entry.scenario.title);

  return (
    <SandboxLabViewport
      key={mission.scenario.id}
      title="Mixture Methods Lab"
      eyebrow={`Chapter 5 · Class ${mission.scenario.grade}`}
      mission={mission}
      missionIndex={missionIndex}
      missionCount={sandboxLabMissions.length}
      missionTitles={missionTitles}
      onSelectMission={setMissionIndex}
    />
  );
}
