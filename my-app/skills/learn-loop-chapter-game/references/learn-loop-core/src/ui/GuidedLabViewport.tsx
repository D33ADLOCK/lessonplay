import type { Scenario } from "../model/scenario";
import type { Station, Workspace } from "../model/entity";
import type {
  GuidedLabMissionPresentation,
  StationVisual,
} from "../model/guidedLabPresentation";
import { Stage } from "./Stage";
import { ToolTray } from "./ToolTray";
import { titleCase } from "./titleCase";
import { useGuidedSession } from "./useGuidedSession";

export interface GuidedLabViewportProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly scenario: Scenario;
  readonly presentation: GuidedLabMissionPresentation;
  readonly missionIndex: number;
  readonly missionCount: number;
  readonly missionTitles: readonly string[];
  readonly onSelectMission: (index: number) => void;
}

export function GuidedLabViewport({
  title,
  eyebrow = "Guided lab",
  scenario,
  presentation,
  missionIndex,
  missionCount,
  missionTitles,
  onSelectMission,
}: GuidedLabViewportProps) {
  const session = useGuidedSession(scenario);
  const {
    state,
    step,
    activeId,
    result,
    working,
    resolved,
    nudgeText,
    stepNumber,
    totalSteps,
    hasFilter,
    hasHeat,
    hasCool,
    hasWait,
    hasShineLight,
    hasChromatograph,
    shelf,
    pouring,
    busy,
    inFlight,
    animTarget,
    hint,
    onTap,
    finishStep,
  } = session;

  const canGoBack = missionIndex > 0;
  const canGoForward = missionIndex + 1 < missionCount;
  const currentMissionTitle = missionTitles[missionIndex] ?? scenario.title;
  const explanation = result?.explanation ?? step?.explanation ?? "";

  return (
    <main className="guided-lab-app">
      <section className="guided-lab-frame" aria-label={title}>
        <header className="guided-lab-hud">
          <div className="guided-lab-title-block">
            <p className="guided-lab-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="guided-lab-progress" aria-label="Mission progress">
            <span>{missionIndex + 1}</span>
            <small>/{missionCount}</small>
          </div>
        </header>

        <div className="guided-lab-mission-strip">
          <button
            className="mission-arrow"
            type="button"
            disabled={!canGoBack}
            onClick={() => onSelectMission(missionIndex - 1)}
            title="Previous mission"
          >
            {"<"}
          </button>
          <div className="mission-current">
            <p>{presentation.badge ?? `Mission ${missionIndex + 1}`}</p>
            <h2>{currentMissionTitle}</h2>
          </div>
          <button
            className="mission-arrow"
            type="button"
            disabled={!canGoForward}
            onClick={() => onSelectMission(missionIndex + 1)}
            title="Next mission"
          >
            {">"}
          </button>
        </div>

        <Stage
          className="guided-lab-stage"
          backdrop={
            <GuidedLabScene
              scenario={scenario}
              presentation={presentation}
              workspace={state.workspace}
              activeId={activeId}
              resultVisible={animTarget > 0}
            />
          }
          foreground={
            <div className="guided-lab-effects" aria-hidden="true">
              {result?.emits?.map((emission) => (
                <span key={emission.gas} className="effect-bubble">
                  {emission.gas}
                </span>
              ))}
            </div>
          }
        />

        <section className="guided-lab-chip-zone" aria-live="polite">
          {state.phase !== "complete" && step && (
            <div className={`lab-chip ${resolved ? "result" : "cue"}`}>
              <div className="chip-step">
                Step {stepNumber}/{totalSteps}
              </div>
              {working && (
                <>
                  <p>{step.goal ?? step.actionPrompt}</p>
                  {nudgeText && <small>{nudgeText}</small>}
                </>
              )}
              {resolved && (
                <>
                  <p>{result?.observation ?? ""}</p>
                  <details>
                    <summary>Why?</summary>
                    <small>{explanation}</small>
                  </details>
                  <button className="chip-next" type="button" onClick={finishStep}>
                    {state.stepIndex + 1 >= scenario.steps.length ? "Finish" : "Next"}
                  </button>
                </>
              )}
            </div>
          )}

          {state.phase === "complete" && (
            <div className="lab-chip complete">
              <div className="chip-step">Complete</div>
              <p>
                {presentation.completionMessage ??
                  "You completed every step in this guided lab."}
              </p>
            </div>
          )}
        </section>

        {step && state.phase !== "complete" && (
          <ToolTray
            reagents={shelf}
            hasFilter={hasFilter}
            hasHeat={hasHeat}
            hasCool={hasCool}
            hasWait={hasWait}
            hasShineLight={hasShineLight}
            hasChromatograph={hasChromatograph}
            hint={hint}
            pendingReagent={pouring}
            busy={busy}
            disabled={inFlight || resolved}
            onPour={(id) => onTap("pour", id)}
            onFilter={() => onTap("filter")}
            onHeat={() => onTap("heat")}
            onCool={() => onTap("cool")}
            onWait={() => onTap("wait")}
            onShineLight={() => onTap("shineLight")}
            onChromatograph={() => onTap("chromatograph")}
          />
        )}

        <nav className="mission-dots" aria-label="Choose a mission">
          {missionTitles.map((missionTitle, index) => (
            <button
              key={missionTitle}
              type="button"
              className={index === missionIndex ? "active" : ""}
              onClick={() => onSelectMission(index)}
              title={missionTitle}
              aria-label={missionTitle}
            />
          ))}
        </nav>
      </section>
    </main>
  );
}

function GuidedLabScene({
  scenario,
  presentation,
  workspace,
  activeId,
  resultVisible,
}: {
  readonly scenario: Scenario;
  readonly presentation: GuidedLabMissionPresentation;
  readonly workspace: Workspace;
  readonly activeId: string | undefined;
  readonly resultVisible: boolean;
}) {
  return (
    <section className={`guided-lab-scene scene-${scenario.id}`}>
      <div className="lab-wall">
        <span />
        <span />
      </div>
      <div className="lab-bench" />
      <div className="guided-station-row">
        {presentation.stationVisuals.map((visual) => {
          const station = workspace.stations[visual.stationId];
          return (
            <GuidedStation
              key={visual.stationId}
              visual={visual}
              station={station}
              active={visual.stationId === activeId}
              resultVisible={resultVisible && visual.stationId === activeId}
            />
          );
        })}
      </div>
    </section>
  );
}

function GuidedStation({
  visual,
  station,
  active,
  resultVisible,
}: {
  readonly visual: StationVisual;
  readonly station: Station | undefined;
  readonly active: boolean;
  readonly resultVisible: boolean;
}) {
  const safeStation = station ?? {
    contents: [],
    color: "#eef3f3",
    heat: "room" as const,
    phase: "empty" as const,
  };
  const contents = safeStation.contents.length ? safeStation.contents : ["empty"];
  const effectClasses = (visual.effectTags ?? []).map((tag) => `effect-${tag}`);

  return (
    <article
      className={[
        "guided-station",
        `station-${visual.kind}`,
        `phase-${safeStation.phase ?? "solution"}`,
        active ? "active" : "",
        resultVisible ? "resolved" : "",
        ...effectClasses,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="station-apparatus">
        <div
          className="station-liquid"
          style={{ backgroundColor: safeStation.color }}
        />
        {safeStation.heat === "hot" && <span className="apparatus-heat" />}
        {safeStation.heat === "cool" && <span className="apparatus-cool" />}
        {shows(contents, "scattered-beam") && <span className="apparatus-beam" />}
        {shows(contents, "settled-chalk") && <span className="apparatus-sediment" />}
        {shows(contents, "crystals") && <span className="apparatus-crystals" />}
        {shows(contents, "pigment-bands") && (
          <span className="apparatus-bands">
            <i />
            <i />
            <i />
          </span>
        )}
        {safeStation.contents.length > 0 && visual.kind === "filter" && (
          <span className="apparatus-residue" />
        )}
      </div>
      <h3>{visual.label ?? titleCase(visual.stationId)}</h3>
      <p>{contents.map(titleCase).join(" · ")}</p>
    </article>
  );
}

function shows(contents: readonly string[], id: string): boolean {
  return contents.includes(id);
}
