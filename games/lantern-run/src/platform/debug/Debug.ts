/**
 * Debug + simulation-inspection hook (PRD "Architecture Boundaries").
 *
 * Enabled via `?debug=1` in the URL. Exposes a tiny registry so the
 * deterministic simulation can publish inspectable state (positions, surface
 * under the cart, predicted vs. actual stop) without the renderer reaching into
 * sim internals. Slice 2 (#12) onward populate it.
 */
export interface DebugSink {
  readonly enabled: boolean;
  set(key: string, value: unknown): void;
  snapshot(): Record<string, unknown>;
}

export function createDebug(search = globalThis.location?.search ?? ""): DebugSink {
  const enabled = new URLSearchParams(search).get("debug") === "1";
  const store: Record<string, unknown> = {};
  if (enabled) {
    (globalThis as Record<string, unknown>).__lanternRunDebug = store;
  }
  return {
    enabled,
    set(key, value) {
      if (enabled) store[key] = value;
    },
    snapshot() {
      return { ...store };
    },
  };
}
