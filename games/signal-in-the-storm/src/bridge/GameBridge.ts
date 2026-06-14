import type { GameCommand, GameEvent } from "../contracts/events";

type Listener<T> = (message: T) => void;

export class GameBridge {
  private readonly commandListeners = new Set<Listener<GameCommand>>();
  private readonly eventListeners = new Set<Listener<GameEvent>>();
  private readonly pendingCommands: GameCommand[] = [];
  private readonly pendingEvents: GameEvent[] = [];

  send(command: GameCommand): void {
    if (this.commandListeners.size === 0) {
      this.pendingCommands.push(command);
      return;
    }
    this.commandListeners.forEach((listener) => listener(command));
  }

  emit(event: GameEvent): void {
    if (this.eventListeners.size === 0) {
      this.pendingEvents.push(event);
      return;
    }
    this.eventListeners.forEach((listener) => listener(event));
  }

  onCommand(listener: Listener<GameCommand>): () => void {
    this.commandListeners.add(listener);
    this.pendingCommands.splice(0).forEach((command) => listener(command));
    return () => this.commandListeners.delete(listener);
  }

  onEvent(listener: Listener<GameEvent>): () => void {
    this.eventListeners.add(listener);
    this.pendingEvents.splice(0).forEach((event) => listener(event));
    return () => this.eventListeners.delete(listener);
  }
}
