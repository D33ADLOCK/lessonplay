import type { SandboxLabSoundCue } from "../model/sandboxLab";

export function playSandboxLabSoundCue(cue: SandboxLabSoundCue | null): void {
  if (!cue || typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const shape = cueShape(cue);

    oscillator.type = shape.type;
    oscillator.frequency.setValueAtTime(shape.start, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      shape.end,
      context.currentTime + shape.duration,
    );
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(shape.gain, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + shape.duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + shape.duration);
    window.setTimeout(() => void context.close(), (shape.duration + 0.05) * 1000);
  } catch {
    // Browser audio can be blocked until user gesture; gameplay must continue silently.
  }
}

function cueShape(cue: SandboxLabSoundCue): {
  readonly start: number;
  readonly end: number;
  readonly duration: number;
  readonly gain: number;
  readonly type: OscillatorType;
} {
  switch (cue) {
    case "pour":
      return { start: 520, end: 260, duration: 0.18, gain: 0.03, type: "sine" };
    case "filter":
      return { start: 220, end: 160, duration: 0.16, gain: 0.025, type: "triangle" };
    case "heat":
      return { start: 180, end: 360, duration: 0.22, gain: 0.022, type: "sawtooth" };
    case "cool":
      return { start: 520, end: 380, duration: 0.2, gain: 0.018, type: "sine" };
    case "wait":
      return { start: 240, end: 240, duration: 0.12, gain: 0.018, type: "triangle" };
    case "light":
      return { start: 640, end: 960, duration: 0.12, gain: 0.02, type: "sine" };
    case "chromatograph":
      return { start: 360, end: 540, duration: 0.2, gain: 0.02, type: "triangle" };
    case "success":
    case "stage-complete":
      return { start: 540, end: 810, duration: 0.16, gain: 0.026, type: "sine" };
    case "wrong-tool":
      return { start: 180, end: 140, duration: 0.14, gain: 0.018, type: "square" };
  }
}
