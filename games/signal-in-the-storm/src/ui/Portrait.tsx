import type { ExpressionId, SpeakerId } from "../contracts/story";

interface PortraitProps {
  readonly speaker: SpeakerId;
  readonly expression?: ExpressionId;
}

const mouthPaths: Record<ExpressionId, string> = {
  neutral: "M42 75 Q50 78 58 75",
  worried: "M42 79 Q50 72 58 79",
  thinking: "M44 76 Q50 74 56 76",
  excited: "M40 73 Q50 84 60 73",
  relieved: "M41 74 Q50 81 59 74",
};

export function Portrait({
  speaker,
  expression = "neutral",
}: PortraitProps) {
  if (speaker === "narrator") return null;
  if (speaker === "ms-rao") {
    return (
      <img
        className="radio-portrait"
        src="/assets/ui/field-radio.svg"
        alt="Ms. Rao speaking over the field radio"
      />
    );
  }

  const isMira = speaker === "mira";
  const jacket = isMira ? "#dc6c50" : "#318b8c";
  const hair = isMira ? "#251b2a" : "#30231e";
  const eyebrowY = expression === "worried" ? 42 : 45;

  return (
    <svg
      className={`character-portrait ${speaker} ${expression}`}
      viewBox="0 0 100 120"
      role="img"
      aria-label={`${isMira ? "Mira" : "Kabir"}, ${expression}`}
    >
      <path d="M13 120 Q16 88 50 86 Q84 88 87 120" fill={jacket} />
      <path d="M32 91 Q50 106 68 91 L64 120 H36Z" fill="#f2d7ad" />
      <ellipse cx="50" cy="54" rx="29" ry="35" fill="#b9784d" />
      <path
        d={
          isMira
            ? "M20 55 Q16 12 51 13 Q88 15 80 58 L70 37 Q48 44 29 31Z"
            : "M21 45 Q24 10 53 13 Q80 13 81 43 Q66 31 51 32 Q34 34 21 45Z"
        }
        fill={hair}
      />
      {isMira ? (
        <path d="M22 46 Q11 72 24 91 Q17 72 30 55Z" fill={hair} />
      ) : null}
      <path
        d={`M33 ${eyebrowY} Q39 ${eyebrowY - 3} 44 ${eyebrowY}`}
        fill="none"
        stroke={hair}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M56 ${eyebrowY} Q62 ${eyebrowY - 3} 67 ${eyebrowY}`}
        fill="none"
        stroke={hair}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="39" cy="54" r={expression === "excited" ? 4 : 3} fill="#17223b" />
      <circle cx="62" cy="54" r={expression === "excited" ? 4 : 3} fill="#17223b" />
      <path
        d={mouthPaths[expression]}
        fill={expression === "excited" ? "#6d2e35" : "none"}
        stroke="#6d2e35"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {expression === "thinking" ? (
        <circle cx="73" cy="71" r="3" fill="#f0b558" opacity="0.9" />
      ) : null}
    </svg>
  );
}

