import { useEffect, useState } from "react";
import type { StoryBeat } from "../contracts/story";
import { Portrait } from "./Portrait";

interface MessageBoxProps {
  readonly beat: StoryBeat;
  readonly onAdvance: () => void;
  readonly onSkip: () => void;
  readonly textSpeedMs?: number;
}

const speakerNames = {
  mira: "Mira",
  kabir: "Kabir",
  "ms-rao": "Ms. Rao · Radio",
  narrator: "Field Station",
} as const;

export function MessageBox({
  beat,
  onAdvance,
  onSkip,
  textSpeedMs = 24,
}: MessageBoxProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const isComplete = visibleLength >= beat.text.length;

  useEffect(() => {
    setVisibleLength(0);
    const timer = window.setInterval(() => {
      setVisibleLength((current) => {
        if (current >= beat.text.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, textSpeedMs);
    return () => window.clearInterval(timer);
  }, [beat.id, beat.text.length, textSpeedMs]);

  const completeOrAdvance = (): void => {
    if (!isComplete) {
      setVisibleLength(beat.text.length);
      return;
    }
    onAdvance();
  };

  return (
    <section
      className={`message-box ${beat.messageBoxVariant} portrait-${beat.portraitPosition}`}
      aria-live="polite"
      aria-label={`${speakerNames[beat.speaker]} dialogue`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          completeOrAdvance();
        }
      }}
    >
      <Portrait speaker={beat.speaker} expression={beat.expression} />
      <div className="dialogue-copy">
        <p className="speaker">{speakerNames[beat.speaker]}</p>
        <p className="dialogue-text">
          {beat.text.slice(0, visibleLength)}
          {!isComplete ? <span className="text-cursor" aria-hidden="true" /> : null}
        </p>
        <div className="dialogue-actions">
          <button type="button" className="advance-button" onClick={completeOrAdvance}>
            {isComplete ? (beat.next === "repair" ? "Open repair board" : "Continue") : "Show full text"}
          </button>
          <button type="button" className="skip-button" onClick={onSkip}>
            Skip intro
          </button>
        </div>
      </div>
    </section>
  );
}

