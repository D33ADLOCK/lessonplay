import {
  fail,
  ok,
  type ValidationError,
  type ValidationResult,
} from "../../platform/content/ContentLoader";
import type { Course, SurfaceSegment, Target } from "../course/Course";

export type RouteId = "safe" | "risky";

export interface RouteContent {
  readonly id: RouteId;
  readonly label: string;
  readonly description: string;
  readonly segments: readonly SurfaceSegment[];
  readonly bonus: number;
}

export interface LevelContent {
  readonly id: string;
  readonly title: string;
  readonly learningObjective: string;
  readonly need: string;
  readonly successText: string;
  readonly hint: string;
  readonly initialWorldState: string;
  readonly successWorldState: string;
  readonly course: Omit<Course, "segments">;
  readonly routes: readonly RouteContent[];
  readonly forceRange: readonly [number, number];
  readonly predictionRequired: boolean;
  readonly predictionPrompt: string;
  readonly reactionKeys: readonly string[];
  readonly transformations: readonly {
    id: string;
    kind: "light" | "decoration" | "musicLayer" | "character";
  }[];
  readonly scoreThresholds: readonly [number, number, number];
}

const supportedReactions = new Set([
  "hope",
  "tension",
  "worry",
  "relief",
  "amusement",
  "celebration",
]);

export function validateLevel(input: unknown): ValidationResult<LevelContent> {
  const errors: ValidationError[] = [];
  if (!input || typeof input !== "object") {
    return fail([{ path: "$", message: "must be an object" }]);
  }
  const value = input as Partial<LevelContent>;
  if (!value.id?.trim()) errors.push({ path: "id", message: "stable identifier is required" });
  if (!value.title?.trim()) errors.push({ path: "title", message: "title is required" });
  if (!value.course || value.course.length <= 0) {
    errors.push({ path: "course.length", message: "must be greater than zero" });
  }
  const target = value.course?.target;
  if (!target) errors.push({ path: "course.target", message: "target is required" });
  else {
    if (target.radius <= 0) errors.push({ path: "course.target.radius", message: "must be positive" });
    if (target.perfectRadius > target.radius) {
      errors.push({
        path: "course.target.perfectRadius",
        message: "cannot exceed the success radius",
      });
    }
  }
  if (!value.routes?.length) errors.push({ path: "routes", message: "at least one route is required" });
  value.routes?.forEach((route, routeIndex) => {
    if (!route.segments.length) {
      errors.push({ path: `routes.${routeIndex}.segments`, message: "cannot be empty" });
    }
    route.segments.forEach((segment, segmentIndex) => {
      if (segment.from < 0 || segment.to <= segment.from) {
        errors.push({
          path: `routes.${routeIndex}.segments.${segmentIndex}`,
          message: "segment geometry is invalid",
        });
      }
    });
  });
  if (!value.forceRange || value.forceRange[0] < 0 || value.forceRange[1] > 1) {
    errors.push({ path: "forceRange", message: "must stay within 0..1" });
  }
  const thresholds = value.scoreThresholds;
  if (!thresholds || thresholds[0] >= thresholds[1] || thresholds[1] >= thresholds[2]) {
    errors.push({ path: "scoreThresholds", message: "must be strictly increasing" });
  }
  value.reactionKeys?.forEach((key, index) => {
    if (!supportedReactions.has(key)) {
      errors.push({ path: `reactionKeys.${index}`, message: `unsupported reaction "${key}"` });
    }
  });
  return errors.length ? fail(errors) : ok(value as LevelContent);
}

const target = (center: number, radius: number, perfectRadius: number): Target => ({
  center,
  radius,
  perfectRadius,
});

export const LEVELS: readonly LevelContent[] = [
  {
    id: "first-light",
    title: "The First Light",
    learningObjective: "A stronger push travels farther on the same surface.",
    need: "Mira is waiting beside the dark courier workshop.",
    successText: "The workshop glows again. Mira rings the first festival bell!",
    hint: "Wood slows the cart steadily. Place your marker, then choose a push.",
    initialWorldState: "workshop-dark",
    successWorldState: "workshop-lit",
    course: { length: 100, start: 7, target: target(64, 10, 4) },
    routes: [
      {
        id: "safe",
        label: "Wooden path",
        description: "A steady path with a generous landing zone.",
        segments: [{ surfaceId: "wood", from: 0, to: 100 }],
        bonus: 0,
      },
    ],
    forceRange: [0.2, 0.9],
    predictionRequired: false,
    predictionPrompt: "Where will the first lantern stop?",
    reactionKeys: ["hope", "tension", "relief", "celebration"],
    transformations: [
      { id: "workshop-light", kind: "light" },
      { id: "bell-layer", kind: "musicLayer" },
    ],
    scoreThresholds: [350, 650, 850],
  },
  {
    id: "frozen-shortcut",
    title: "The Frozen Shortcut",
    learningObjective: "Lower friction lets the same push travel farther.",
    need: "Tavi needs a lantern for the frozen bridge decorations.",
    successText: "Bridge ribbons unfold and Tavi skates a delighted circle.",
    hint: "The safe route is forgiving. Ice slides farther and carries a star token.",
    initialWorldState: "bridge-dark",
    successWorldState: "bridge-lit",
    course: { length: 100, start: 7, target: target(78, 8, 3) },
    routes: [
      {
        id: "safe",
        label: "Garden path",
        description: "Wet grass and wood slow the cart safely.",
        segments: [
          { surfaceId: "grass", from: 0, to: 48 },
          { surfaceId: "wood", from: 48, to: 100 },
        ],
        bonus: 0,
      },
      {
        id: "risky",
        label: "Frozen shortcut",
        description: "Fast ice, a smaller margin, and a mastery star.",
        segments: [
          { surfaceId: "wood", from: 0, to: 22 },
          { surfaceId: "ice", from: 22, to: 100 },
        ],
        bonus: 180,
      },
    ],
    forceRange: [0.2, 0.85],
    predictionRequired: false,
    predictionPrompt: "How far will this route carry the lantern?",
    reactionKeys: ["hope", "tension", "worry", "amusement", "celebration"],
    transformations: [
      { id: "bridge-light", kind: "light" },
      { id: "bridge-ribbons", kind: "decoration" },
      { id: "strings-layer", kind: "musicLayer" },
    ],
    scoreThresholds: [400, 700, 900],
  },
  {
    id: "music-square",
    title: "Music in the Square",
    learningObjective: "Apply earlier observations across changing surfaces.",
    need: "Niko waits at the silent stage with the whole village watching.",
    successText: "The stage ignites with colour. The festival melody becomes complete!",
    hint: "Use what you noticed before. Guidance is lighter now.",
    initialWorldState: "stage-dark",
    successWorldState: "stage-lit",
    course: { length: 100, start: 7, target: target(84, 6, 2.2) },
    routes: [
      {
        id: "safe",
        label: "Festival approach",
        description: "Wood, grass, then a short icy finish.",
        segments: [
          { surfaceId: "wood", from: 0, to: 34 },
          { surfaceId: "grass", from: 34, to: 62 },
          { surfaceId: "ice", from: 62, to: 100 },
        ],
        bonus: 80,
      },
    ],
    forceRange: [0.25, 0.85],
    predictionRequired: true,
    predictionPrompt: "Make your final prediction before launching.",
    reactionKeys: ["hope", "tension", "worry", "relief", "celebration"],
    transformations: [
      { id: "stage-light", kind: "light" },
      { id: "crowd-arrives", kind: "character" },
      { id: "melody-layer", kind: "musicLayer" },
    ],
    scoreThresholds: [450, 720, 920],
  },
];
