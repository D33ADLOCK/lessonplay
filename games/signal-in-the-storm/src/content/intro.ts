import type { StorySceneDefinition } from "../contracts/story";

export const introScene: StorySceneDefinition = {
  id: "storm-intro",
  beats: [
    {
      id: "first-signal",
      speaker: "mira",
      expression: "worried",
      textKey: "intro.mira.firstSignal",
      text: "Kabir, the emergency torch went dark. Let's check its circuit.",
      backgroundId: "field-station-blackout",
      transition: "fade",
      next: "repair",
    },
  ],
};

