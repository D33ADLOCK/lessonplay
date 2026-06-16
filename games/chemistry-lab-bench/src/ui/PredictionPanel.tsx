import type { PredictionOption } from "../contracts/experiment";

interface PredictionPanelProps {
  readonly prompt: string;
  readonly options: readonly PredictionOption[];
  readonly chosen: PredictionOption | null;
  readonly onChoose: (option: PredictionOption) => void;
  readonly onContinue: () => void;
}

/**
 * The Predict phase. Tapping an option records it and reveals feedback, but does
 * not block — a Continue button always advances to Observe.
 */
export function PredictionPanel({
  prompt,
  options,
  chosen,
  onChoose,
  onContinue,
}: PredictionPanelProps) {
  return (
    <section className="panel">
      <p className="prompt">{prompt}</p>
      <div className="options">
        {options.map((option) => {
          const isChosen = chosen?.label === option.label;
          const state = isChosen
            ? option.correct
              ? "correct"
              : "incorrect"
            : "";
          return (
            <button
              key={option.label}
              className={`option ${state}`}
              onClick={() => onChoose(option)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {chosen && <p className="feedback">{chosen.feedback}</p>}
      <button
        className="primary"
        disabled={!chosen}
        onClick={onContinue}
      >
        Continue
      </button>
    </section>
  );
}
