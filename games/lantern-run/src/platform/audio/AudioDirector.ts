import type { GameSettings } from "../settings/Settings";

type AudioContextConstructor = typeof AudioContext;

export class AudioDirector {
  private context?: AudioContext;
  private settings: GameSettings;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }

  play(
    kind: "launch" | "wood" | "grass" | "ice" | "success" | "perfect" | "failure",
  ): void {
    if (!this.settings.audioEnabled || this.settings.volume <= 0) return;
    const AudioCtor = (
      globalThis as typeof globalThis & {
        webkitAudioContext?: AudioContextConstructor;
      }
    ).AudioContext ?? (
      globalThis as typeof globalThis & {
        webkitAudioContext?: AudioContextConstructor;
      }
    ).webkitAudioContext;
    if (!AudioCtor) return;
    this.context ??= new AudioCtor();
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const tones = {
      launch: [180, 340, 0.12],
      wood: [130, 105, 0.06],
      grass: [90, 70, 0.06],
      ice: [520, 690, 0.08],
      success: [440, 660, 0.28],
      perfect: [520, 880, 0.4],
      failure: [180, 120, 0.22],
    } as const;
    const [from, to, duration] = tones[kind];
    oscillator.type = kind === "failure" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, this.settings.volume * 0.12),
      now + 0.015,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }
}
