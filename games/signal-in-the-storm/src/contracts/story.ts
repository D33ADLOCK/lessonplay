export type SpeakerId = "mira" | "kabir" | "narrator";
export type ExpressionId =
  | "neutral"
  | "worried"
  | "thinking"
  | "excited"
  | "relieved";

export interface StoryBeat {
  readonly id: string;
  readonly speaker: SpeakerId;
  readonly expression?: ExpressionId;
  readonly textKey: string;
  readonly text: string;
  readonly backgroundId: string;
  readonly transition?: "cut" | "fade";
  readonly next: "repair" | string;
}

export interface StorySceneDefinition {
  readonly id: string;
  readonly beats: readonly StoryBeat[];
}

export interface StoryState {
  readonly sceneId: string;
  readonly beatIndex: number;
  readonly mode: "story" | "repair" | "consequence";
  readonly consequenceText?: string;
}

