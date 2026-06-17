import type { GameplayEvent, GameplayEventStream } from "../events/GameplayEvent";

/**
 * Reaction director (contract).
 *
 * Maps gameplay events to character emotional beats — hope, tension, worry,
 * relief, amusement, celebration (PRD "Cause and effect → Emotional"). The
 * director is event-driven and game-neutral; concrete character reactions and
 * eye-line tracking are wired in Slice 5 (#15).
 */
export type ReactionKind =
  | "idle"
  | "hope"
  | "tension"
  | "worry"
  | "relief"
  | "amusement"
  | "celebration";

export interface Reaction {
  readonly kind: ReactionKind;
  /** Intensity 0..1 for blending pose/expression. */
  readonly intensity: number;
}

export type ReactionMap = (event: GameplayEvent) => Reaction | null;

/** A reasonable default mapping; levels can override per-character in #15. */
export const defaultReactionMap: ReactionMap = (event) => {
  switch (event.type) {
    case "launch":
      return { kind: "hope", intensity: 0.6 };
    case "travel":
      return { kind: "tension", intensity: Math.min(1, event.speed) };
    case "nearMiss":
      return { kind: "worry", intensity: 0.9 };
    case "collision":
      return { kind: "amusement", intensity: 0.7 };
    case "landing":
      return { kind: "tension", intensity: 0.4 };
    case "success":
      return {
        kind: "celebration",
        intensity: event.quality === "perfect" ? 1 : 0.75,
      };
    case "failure":
      return { kind: event.quality === "crash" ? "amusement" : "relief", intensity: 0.6 };
  }
};

export class ReactionDirector {
  private current: Reaction = { kind: "idle", intensity: 0 };
  private unsub?: () => void;

  constructor(private readonly map: ReactionMap = defaultReactionMap) {}

  /** Subscribe to a stream; each event may update the current reaction. */
  attach(stream: GameplayEventStream): void {
    this.unsub?.();
    this.unsub = stream.on("*", (event) => {
      const next = this.map(event);
      if (next) this.current = next;
    });
  }

  get reaction(): Reaction {
    return this.current;
  }

  detach(): void {
    this.unsub?.();
    this.unsub = undefined;
  }
}
