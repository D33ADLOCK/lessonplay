import type { Chemical, ChemicalId } from "../contracts/chemistry";

interface ReagentShelfProps {
  readonly reagents: readonly Chemical[];
  readonly selected: ChemicalId | null;
  readonly onSelect: (id: ChemicalId) => void;
  readonly disabled: boolean;
}

/**
 * The thumb-zone reagent shelf. Tap a reagent to select it; the beaker is then
 * tapped to pour. Large targets, no hover affordances.
 */
export function ReagentShelf({
  reagents,
  selected,
  onSelect,
  disabled,
}: ReagentShelfProps) {
  return (
    <div className="shelf">
      {reagents.map((reagent) => (
        <button
          key={reagent.id}
          className={`reagent ${selected === reagent.id ? "selected" : ""}`}
          onClick={() => onSelect(reagent.id)}
          disabled={disabled}
        >
          <span
            className="swatch"
            style={{ backgroundColor: reagent.color }}
          />
          <span className="reagent-label">{reagent.label}</span>
        </button>
      ))}
    </div>
  );
}
