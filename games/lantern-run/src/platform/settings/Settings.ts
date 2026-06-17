/**
 * Player settings: audio and reduced motion (PRD user story 19).
 *
 * Settings are observable so both the renderer (effects) and the DOM overlay
 * can react. The effective reduced-motion value also respects the OS
 * `prefers-reduced-motion` media query as a baseline. Persistence is wired
 * through the SaveService in Slice 4 (#14); the runtime behaviour (muting,
 * disabling non-essential motion) lands in Slice 6 (#16).
 */
export interface GameSettings {
  /** Master audio toggle. */
  audioEnabled: boolean;
  /** 0..1 master volume. */
  volume: number;
  /** Force reduced motion regardless of OS preference. */
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  audioEnabled: true,
  volume: 0.8,
  reducedMotion: false,
};

export type SettingsListener = (settings: GameSettings) => void;

export class SettingsStore {
  private settings: GameSettings;
  private readonly listeners = new Set<SettingsListener>();

  constructor(initial: Partial<GameSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...initial };
  }

  get(): Readonly<GameSettings> {
    return this.settings;
  }

  /** True if non-essential motion should be suppressed (setting OR OS pref). */
  get effectiveReducedMotion(): boolean {
    if (this.settings.reducedMotion) return true;
    return (
      typeof globalThis.matchMedia === "function" &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  update(patch: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...patch };
    this.listeners.forEach((l) => l(this.settings));
  }

  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
