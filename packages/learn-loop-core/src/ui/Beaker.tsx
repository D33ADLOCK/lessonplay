import type { ExperimentVisual } from "../model/experimentLab";

/**
 * The hero of an ExperimentLab game: a glowing beaker in a dark lab. The Tyndall
 * light beam is the money shot — a bright shaft that blazes across a cloudy
 * liquid and passes invisibly through a clear one. `settle` and `residue` are
 * the supporting effects. The component is purely presentational: it renders the
 * `visual` it is handed by {@link ExperimentLabViewport}, which is driven by the
 * tested session reducer.
 */
export function Beaker({
  visual,
  cloudy,
  animating = false,
  gasLabel,
}: {
  readonly visual: ExperimentVisual;
  /** Hint for the resting liquid look; the beam is what actually teaches. */
  readonly cloudy: boolean;
  /** True while the effect is playing out, for a brighter live look. */
  readonly animating?: boolean;
  /** Short gas token chipped onto the escaping bubbles, e.g. "H₂". */
  readonly gasLabel?: string;
}) {
  const beam = visual === "beam";
  const settle = visual === "settle";
  const residue = visual === "residue";
  const fizz = visual === "fizz";
  const colorChange = visual === "color-change";
  const gas = visual === "gas";
  const precipitate = visual === "precipitate";

  return (
    <div
      className={`beaker ${beam ? "is-beam" : ""} ${animating ? "is-animating" : ""}`}
    >
      <div className="beaker__glass">
        <div
          className={`beaker__liquid ${cloudy || beam ? "is-cloudy" : ""} ${
            colorChange ? "is-colour" : ""
          } ${precipitate ? "is-milky" : ""}`}
        >
          {/* drifting motes — the suspended particles light scatters off */}
          {(cloudy || beam) && (
            <div className="motes" aria-hidden>
              {MOTES.map((m) => (
                <span
                  key={m.id}
                  className="mote"
                  style={{
                    left: `${m.x}%`,
                    top: `${m.y}%`,
                    animationDelay: `${m.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* the Tyndall beam */}
          {beam && (
            <div className="beam" aria-hidden>
              <div className="beam__shaft" />
              <div className="beam__glow" />
            </div>
          )}

          {/* sediment layer that has settled out */}
          {settle && <div className="sediment" aria-hidden />}

          {/* filter residue clinging to the inner wall */}
          {residue && <div className="residue" aria-hidden />}

          {/* rising bubbles — effervescence (fizz) and gas escaping (gas) */}
          {(fizz || gas) && (
            <div className={`bubbles ${gas ? "bubbles--gas" : ""}`} aria-hidden>
              {BUBBLES.map((b) => (
                <span
                  key={b.id}
                  className="bubble"
                  style={{
                    left: `${b.x}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    animationDelay: `${b.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* curd flecks suspended through the milky liquid */}
          {precipitate && (
            <div className="precipitate" aria-hidden>
              {MOTES.map((m) => (
                <span
                  key={m.id}
                  className="curd"
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}
                />
              ))}
            </div>
          )}

          <div className="beaker__surface" aria-hidden />
        </div>
      </div>

      {/* gas identity chip riding above the escaping bubbles */}
      {gas && gasLabel && <div className="gas-chip">{gasLabel} ↑</div>}

      {/* the lamp that fires the beam, drawn outside the glass */}
      <div className={`lamp ${beam ? "is-on" : ""}`} aria-hidden>
        <div className="lamp__bulb" />
      </div>
    </div>
  );
}

interface Mote {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly delay: number;
}

// Deterministic scatter so the look is stable across renders.
const MOTES: readonly Mote[] = [
  { id: 0, x: 18, y: 28, delay: 0 },
  { id: 1, x: 62, y: 20, delay: 0.6 },
  { id: 2, x: 40, y: 48, delay: 1.1 },
  { id: 3, x: 78, y: 56, delay: 0.3 },
  { id: 4, x: 26, y: 64, delay: 1.4 },
  { id: 5, x: 54, y: 72, delay: 0.9 },
  { id: 6, x: 70, y: 38, delay: 1.7 },
  { id: 7, x: 34, y: 36, delay: 2.0 },
  { id: 8, x: 48, y: 60, delay: 0.5 },
];

interface Bubble {
  readonly id: number;
  readonly x: number;
  readonly size: number;
  readonly delay: number;
}

// Deterministic bubble column for fizz / gas effervescence.
const BUBBLES: readonly Bubble[] = [
  { id: 0, x: 30, size: 7, delay: 0 },
  { id: 1, x: 52, size: 5, delay: 0.25 },
  { id: 2, x: 44, size: 9, delay: 0.5 },
  { id: 3, x: 62, size: 6, delay: 0.15 },
  { id: 4, x: 38, size: 4, delay: 0.7 },
  { id: 5, x: 56, size: 8, delay: 0.9 },
  { id: 6, x: 48, size: 5, delay: 0.4 },
  { id: 7, x: 34, size: 6, delay: 1.1 },
];
