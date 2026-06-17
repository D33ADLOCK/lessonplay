/**
 * Gameplay event stream — the spine of the emotional-gameplay layer.
 *
 * The simulation/mechanics publish *what happened* as neutral events; the
 * reaction director, world-transformer, contextual-feedback and celebration
 * systems all subscribe. These systems must NOT assume lanterns, sliding,
 * friction, or a festival (PRD "Architecture Boundaries"): the contract is
 * deliberately game-neutral so future educational games can reuse it.
 *
 * Slice 1 fixes the event vocabulary + the bus. Slice 2 (#12) starts emitting
 * launch/travel/landing; Slice 3 (#13) adds outcome detail; Slice 5 (#15)
 * consumes the stream.
 */

/** Where along the course something happened, normalized to [0, 1]. */
export type CoursePosition = number;

export type OutcomeQuality =
  | "perfect"
  | "success"
  | "nearMiss"
  | "undershoot"
  | "overshoot"
  | "crash";

export type GameplayEvent =
  | { readonly type: "launch"; readonly force: number; readonly from: CoursePosition }
  | {
      readonly type: "travel";
      readonly position: CoursePosition;
      readonly speed: number;
      readonly surfaceId: string;
    }
  | { readonly type: "nearMiss"; readonly position: CoursePosition; readonly missBy: number }
  | { readonly type: "collision"; readonly position: CoursePosition; readonly objectId: string }
  | { readonly type: "landing"; readonly position: CoursePosition; readonly speed: number }
  | {
      readonly type: "success";
      readonly position: CoursePosition;
      readonly quality: Extract<OutcomeQuality, "perfect" | "success">;
      readonly deliveryAccuracy: number;
    }
  | {
      readonly type: "failure";
      readonly position: CoursePosition;
      readonly quality: Exclude<OutcomeQuality, "perfect" | "success">;
    };

export type GameplayEventType = GameplayEvent["type"];

export type GameplayEventListener<E extends GameplayEvent = GameplayEvent> = (event: E) => void;

/** Minimal typed pub/sub bus. Synchronous: listeners run in registration order. */
export class GameplayEventStream {
  private readonly listeners = new Map<
    GameplayEventType | "*",
    Set<GameplayEventListener>
  >();

  on<T extends GameplayEventType>(
    type: T,
    listener: GameplayEventListener<Extract<GameplayEvent, { type: T }>>,
  ): () => void;
  on(type: "*", listener: GameplayEventListener): () => void;
  on(type: GameplayEventType | "*", listener: GameplayEventListener): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
    return () => set.delete(listener);
  }

  emit(event: GameplayEvent): void {
    this.listeners.get(event.type)?.forEach((l) => l(event));
    this.listeners.get("*")?.forEach((l) => l(event));
  }

  clear(): void {
    this.listeners.clear();
  }
}
