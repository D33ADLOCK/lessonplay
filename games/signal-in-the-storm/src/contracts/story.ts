export type SpeakerId = "mira" | "kabir" | "ms-rao" | "narrator";
export type ExpressionId =
  | "neutral"
  | "worried"
  | "thinking"
  | "excited"
  | "relieved";
export type PortraitPosition = "left" | "right" | "radio";
export type MessageBoxVariant = "standard" | "urgent" | "radio";

export interface StoryBeat {
  readonly id: string;
  readonly speaker: SpeakerId;
  readonly expression?: ExpressionId;
  readonly textKey: string;
  readonly text: string;
  readonly backgroundId: string;
  readonly backgroundState: "storm" | "blackout" | "lightning";
  readonly portraitPosition: PortraitPosition;
  readonly messageBoxVariant: MessageBoxVariant;
  readonly audioCue?: "thunder" | "radio-static" | "power-down";
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
