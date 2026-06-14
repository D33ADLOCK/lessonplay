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
  const nextIndex = scene.beats.findIndex((candidate) => candidate.id === beat.next);
  if (nextIndex < 0) {
    throw new Error(`Beat "${beat.id}" points to missing beat "${beat.next}".`);
  }
  return {
    ...state,
    beatIndex: nextIndex,
  };
}

export function skipStory(state: StoryState): StoryState {
  if (state.mode !== "story") return state;
  return { ...state, mode: "repair" };
}

export function applyConsequence(
  state: StoryState,
  description: string,
): StoryState {
  return { ...state, mode: "consequence", consequenceText: description };
}
