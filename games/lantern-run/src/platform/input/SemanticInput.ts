import type {
  SemanticAction,
  SemanticActionEvent,
  SemanticActionListener,
} from "./actions";

/**
 * Central semantic-input bus.
 *
 * Device adapters (touch/pointer/keyboard) call {@link emit} with normalized
 * {@link SemanticActionEvent}s; gameplay subscribes via {@link on}. Slice 1
 * ships the bus + the contract; Slice 2 (#12) adds the concrete adapters and
 * the equivalence tests across input sources.
 */
export class SemanticInput {
  private readonly listeners = new Map<
    SemanticAction | "*",
    Set<SemanticActionListener>
  >();

  /** Subscribe to one action, or "*" for every action. Returns an unsubscribe. */
  on(action: SemanticAction | "*", listener: SemanticActionListener): () => void {
    const set = this.listeners.get(action) ?? new Set();
    set.add(listener);
    this.listeners.set(action, set);
    return () => set.delete(listener);
  }

  /** Dispatch a normalized action to all matching listeners. */
  emit(event: SemanticActionEvent): void {
    this.listeners.get(event.action)?.forEach((l) => l(event));
    this.listeners.get("*")?.forEach((l) => l(event));
  }

  /** Remove all listeners (used on scene teardown). */
  clear(): void {
    this.listeners.clear();
  }
}
