import type { GameplayEventStream } from "../events/GameplayEvent";

/**
 * World transformation system (contract).
 *
 * Successful deliveries *permanently* restore parts of the world — lights,
 * decorations, music layers — and the restored state persists across reloads
 * (PRD "Cause and effect → Persistent", user stories 13/14/20). The transformer
 * tracks which transformations have fired; the renderer and audio mixer
 * subscribe. Game-neutral: a transformation is just a keyed flag with a kind.
 *
 * Slice 5 (#15) wires it to the event stream + save service and adds the
 * lights/music presentation.
 */
export type TransformationKind = "light" | "decoration" | "musicLayer" | "character";

export interface Transformation {
  readonly id: string;
  readonly kind: TransformationKind;
}

export type TransformationListener = (t: Transformation) => void;

export class WorldTransformer {
  private readonly applied = new Set<string>();
  private readonly listeners = new Set<TransformationListener>();
  private unsub?: () => void;

  /** Seed already-restored transformations (e.g. from a save load). */
  constructor(restored: readonly string[] = []) {
    restored.forEach((id) => this.applied.add(id));
  }

  /** Apply a transformation once; re-applying the same id is a no-op. */
  apply(t: Transformation): boolean {
    if (this.applied.has(t.id)) return false;
    this.applied.add(t.id);
    this.listeners.forEach((l) => l(t));
    return true;
  }

  has(id: string): boolean {
    return this.applied.has(id);
  }

  /** Stable list of restored ids, for persistence. */
  get restored(): string[] {
    return [...this.applied];
  }

  onApply(listener: TransformationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Bind to gameplay success events with a mapper that decides which
   * transformations a success triggers. Concrete mapping defined per-level in #15.
   */
  attach(
    stream: GameplayEventStream,
    onSuccess: () => readonly Transformation[],
  ): void {
    this.unsub?.();
    this.unsub = stream.on("success", () => {
      onSuccess().forEach((t) => this.apply(t));
    });
  }

  detach(): void {
    this.unsub?.();
    this.unsub = undefined;
  }
}
