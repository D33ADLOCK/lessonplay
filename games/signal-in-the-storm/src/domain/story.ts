import type {
  StorySceneDefinition,
  StoryState,
} from "../contracts/story";

export function createStoryState(scene: StorySceneDefinition): StoryState {
  if (scene.beats.length === 0) {
    throw new Error(`Story scene "${scene.id}" must contain at least one beat.`);
  }
  return { sceneId: scene.id, beatIndex: 0, mode: "story" };
}

export function advanceStory(
  state: StoryState,
  scene: StorySceneDefinition,
): StoryState {
  if (state.mode !== "story") return state;
  const beat = scene.beats[state.beatIndex];
  if (!beat) throw new Error(`Missing beat ${state.beatIndex} in "${scene.id}".`);
  if (beat.next === "repair") return { ...state, mode: "repair" };
  return {
    ...state,
    beatIndex: Math.min(state.beatIndex + 1, scene.beats.length - 1),
  };
}

export function applyConsequence(
  state: StoryState,
  description: string,
): StoryState {
  return { ...state, mode: "consequence", consequenceText: description };
}

