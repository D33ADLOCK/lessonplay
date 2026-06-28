import type { Station, Workspace } from "../model/entity";
import type {
  SandboxLabMission,
  SandboxLabMissionPresentation,
  SandboxLabMaterial,
} from "../model/sandboxLab";
import type { StationVisual } from "../model/guidedLabPresentation";
import { Stage } from "./Stage";
import { apparatusLabel, stationVisualClasses } from "./sandboxLabKit";
import { playSandboxLabSoundCue } from "./sandboxLabSound";
import { titleCase } from "./titleCase";
import { sandboxLabThemeClasses, type SandboxLabThemeInput } from "./sandboxLabTheme";
import { useSandboxLabSession } from "./useSandboxLabSession";
import { useEffect, useState } from "react";

export interface SandboxLabViewportProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly mission: SandboxLabMission;
  readonly missionIndex: number;
  readonly missionCount: number;
  readonly missionTitles: readonly string[];
  readonly onSelectMission: (index: number) => void;
  /**
   * Optional visual skin. Picks palette/accent/intensity plus the safe
   * `headerDensity` layout knob. Unknown tokens fall back to the default
   * (clean-lab / blue / standard). Omit it for the default skin.
   */
  readonly theme?: SandboxLabThemeInput;
}

export function SandboxLabViewport({
  title,
  eyebrow = "Sandbox lab",
  mission,
  missionIndex,
  missionCount,
  missionTitles,
  onSelectMission,
  theme,
}: SandboxLabViewportProps) {
  const session = useSandboxLabSession(mission);
  const [openOverlay, setOpenOverlay] = useState<"drawer" | "notebook" | "briefing" | null>(
    "briefing",
  );
  const { scenario, presentation } = mission;
  const latest = session.state.observations.at(-1);
  const selectedMaterial = presentation.materials.find(
    (material) => material.id === session.selectedMaterialId,
  );
  const drawerOpen = openOverlay === "drawer";
  const notebookOpen = openOverlay === "notebook";
  const currentStage = session.currentStage;
  const stageNumber = session.state.currentStageIndex + 1;
  const stageCount = presentation.stages.length;
  const revealHiddenIdentities = session.state.phase === "concluded";

  useEffect(() => {
    setOpenOverlay("briefing");
  }, [scenario.id]);

  useEffect(() => {
    playSandboxLabSoundCue(session.state.lastSoundCue);
  }, [session.state.lastSoundCue]);

  useEffect(() => {
    if (!openOverlay) return undefined;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenOverlay(null);
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openOverlay]);

  return (
    <main className={`sandbox-lab-app ${sandboxLabThemeClasses(theme)}`}>
      <section className="sandbox-lab-frame" aria-label={title}>
        {openOverlay ? (
          <button
            className="sandbox-overlay-backdrop"
            type="button"
            aria-label="Close panel"
            onClick={() => setOpenOverlay(null)}
          />
        ) : null}
        <header className="sandbox-lab-hud">
          <button
            className="sandbox-icon-button mission-menu-button"
            type="button"
            onClick={() =>
              setOpenOverlay((overlay) => (overlay === "drawer" ? null : "drawer"))
            }
            aria-label="Open missions"
          >
            Menu
          </button>
          <div className="sandbox-title-block">
            <p className="sandbox-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <button
            className="sandbox-icon-button"
            type="button"
            aria-label="Open notebook"
            onClick={() =>
              setOpenOverlay((overlay) => (overlay === "notebook" ? null : "notebook"))
            }
          >
            i
          </button>
          {notebookOpen ? (
            <div
              className="notebook-panel sandbox-overlay-panel"
              role="dialog"
              aria-label="Notebook"
            >
              <h2>Notebook</h2>
              <p>{presentation.notebook.goal}</p>
              <p className="notebook-question">{presentation.question}</p>
              {presentation.notebook.hints?.length ? (
                <ul>
                  {presentation.notebook.hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              ) : null}
              <h3>Evidence</h3>
              {session.state.notebookEvidence.length ? (
                <ol>
                  {session.state.notebookEvidence.map((evidence) => (
                    <li key={evidence.id}>{evidence.text}</li>
                  ))}
                </ol>
              ) : (
                <p>No evidence yet.</p>
              )}
              {session.state.observations.some((observation) => observation.explanation) &&
              presentation.notebook.explanation ? (
                <p>{presentation.notebook.explanation}</p>
              ) : null}
            </div>
          ) : null}
        </header>

        {openOverlay === "briefing" ? (
          <div
            className="sandbox-briefing-modal sandbox-overlay-panel"
            role="dialog"
            aria-label="Mission briefing"
          >
            <p>{presentation.badge ?? `Mission ${missionIndex + 1}`}</p>
            <h2>{presentation.question}</h2>
            <span>{presentation.notebook.goal}</span>
            {presentation.notebook.hints?.length ? (
              <ul>
                {presentation.notebook.hints.slice(0, 2).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : null}
            <button type="button" onClick={() => setOpenOverlay(null)}>
              Start experiment
            </button>
          </div>
        ) : null}

        {session.state.pendingFeedback ? (
          <div
            className="sandbox-feedback-card sandbox-overlay-panel"
            role="dialog"
            aria-label="Action feedback"
          >
            <p>{session.state.pendingFeedback.card.action}</p>
            <h2>{session.state.pendingFeedback.card.result}</h2>
            <span>{session.state.pendingFeedback.card.why}</span>
            <small>{session.state.pendingFeedback.card.next}</small>
            <button type="button" onClick={session.dismissFeedback}>
              Add evidence
            </button>
          </div>
        ) : null}

        <div
          id="mission-drawer"
          className={`sandbox-mission-drawer sandbox-overlay-panel ${drawerOpen ? "open" : ""}`}
          hidden={!drawerOpen}
          role="dialog"
          aria-label="Missions"
        >
          <div className="drawer-head">
            <p>Mission {missionIndex + 1}/{missionCount}</p>
            <h2>{scenario.title}</h2>
          </div>
          <div className="drawer-list">
            {missionTitles.map((missionTitle, index) => (
              <button
                key={missionTitle}
                type="button"
                className={index === missionIndex ? "active" : ""}
                onClick={() => {
                  onSelectMission(index);
                  setOpenOverlay(null);
                }}
              >
                <span>{index + 1}</span>
                {missionTitle}
              </button>
            ))}
          </div>
        </div>

        <section className="sandbox-objective-card" aria-live="polite">
          <div>
            <p>
              Mission {missionIndex + 1}/{missionCount} · Stage {stageNumber}/{stageCount}
            </p>
            <h2>{currentStage?.title ?? scenario.title}</h2>
            <span>{currentStage?.goal ?? presentation.question}</span>
          </div>
          <button type="button" onClick={() => setOpenOverlay("briefing")}>
            ?
          </button>
        </section>

        <Stage
          className="sandbox-lab-stage"
          backdrop={
            <SandboxLabScene
              presentation={presentation}
              workspace={session.state.workspace}
              selectedMaterial={selectedMaterial}
              visibleMaterials={session.visibleMaterials}
              revealHiddenIdentities={revealHiddenIdentities}
              effectTags={[
                ...(session.state.latestInteraction?.effectTags ?? []),
                ...(session.state.latestInteraction?.reactionEffect
                  ? [session.state.latestInteraction.reactionEffect]
                  : []),
              ]}
            />
          }
          foreground={
            <div className="sandbox-effect-layer" aria-hidden="true">
              {latest?.gasLabel && <span className="gas-marker">{latest.gasLabel}</span>}
            </div>
          }
        />

        <section className="sandbox-observation-card" aria-live="polite">
          <p>What happened</p>
          <h2>{latest?.observation ?? "Pick a material, then tap a tool to test it."}</h2>
          <small>{latest?.explanation ?? currentStage?.nextPrompt}</small>
          {session.state.conclusionAttempt ? (
            <strong>{session.state.conclusionAttempt.conclusion.feedback}</strong>
          ) : null}
        </section>

        <section className="sandbox-material-strip" aria-label="Current material">
          {session.visibleMaterials.map((material) => (
            <button
              key={material.id}
              type="button"
              className={material.id === session.selectedMaterialId ? "active" : ""}
              onClick={() => session.selectMaterial(material.id)}
            >
              <span>{materialLabel(material, revealHiddenIdentities)}</span>
            </button>
          ))}
        </section>

        <section className="sandbox-tool-dock" aria-label="Tools">
          <p>Try a tool</p>
          {session.visibleTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => session.applyTool(tool.id)}
              disabled={session.state.phase === "concluded" || !!session.state.pendingFeedback}
            >
              <span>{toolIcon(tool.action.type)}</span>
              {tool.label}
            </button>
          ))}
        </section>

        {session.canUseConclusions ? (
          <section className="sandbox-conclusion-strip" aria-label="Conclusions">
            <h2>What did you learn?</h2>
            {presentation.conclusions.map((conclusion) => {
              const unlocked = session.isConclusionUnlocked(conclusion);
              return (
                <button
                  key={conclusion.id}
                  type="button"
                  disabled={!unlocked}
                  className={
                    session.state.conclusionAttempt?.conclusion.id === conclusion.id
                      ? "selected"
                      : ""
                  }
                  onClick={() => session.submitConclusion(conclusion.id)}
                >
                  {conclusion.label}
                </button>
              );
            })}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function SandboxLabScene({
  presentation,
  workspace,
  selectedMaterial,
  visibleMaterials,
  revealHiddenIdentities,
  effectTags,
}: {
  readonly presentation: SandboxLabMissionPresentation;
  readonly workspace: Workspace;
  readonly selectedMaterial: SandboxLabMaterial | undefined;
  readonly visibleMaterials: readonly SandboxLabMaterial[];
  readonly revealHiddenIdentities: boolean;
  readonly effectTags: readonly string[];
}) {
  const visibleStationIds = new Set(visibleMaterials.map((material) => material.stationId));
  const visibleStationVisuals = presentation.stationVisuals.filter((visual) =>
    visibleStationIds.has(visual.stationId),
  );

  return (
    <section className="sandbox-lab-scene">
      <div className="sandbox-lab-wall" />
      <div className="sandbox-lab-bench" />
      <div className="sandbox-station-row">
        {visibleStationVisuals.map((visual) => {
          const material = visibleMaterials.find(
            (candidate) => candidate.stationId === visual.stationId,
          );

          return (
            <SandboxStation
              key={visual.stationId}
              visual={visual}
              material={material}
              station={workspace.stations[visual.stationId]}
              active={visual.stationId === selectedMaterial?.stationId}
              revealHiddenIdentity={revealHiddenIdentities}
              effectTags={effectTags}
            />
          );
        })}
      </div>
    </section>
  );
}

function SandboxStation({
  visual,
  material,
  station,
  active,
  revealHiddenIdentity,
  effectTags,
}: {
  readonly visual: StationVisual;
  readonly material: SandboxLabMaterial | undefined;
  readonly station: Station | undefined;
  readonly active: boolean;
  readonly revealHiddenIdentity: boolean;
  readonly effectTags: readonly string[];
}) {
  const safeStation = station ?? {
    contents: [],
    color: "#eef3f3",
    heat: "room" as const,
    phase: "empty" as const,
  };
  const contents = safeStation.contents.length ? safeStation.contents : ["empty"];
  const activeEffects = active ? effectTags : [];
  const classes = stationVisualClasses(
    visual,
    safeStation.phase ?? "solution",
    active,
    effectTags,
  );
  const hasHiddenIdentity = Boolean(material?.hiddenIdentity);
  const publicLabel =
    material?.hiddenIdentity
      ? materialLabel(material, revealHiddenIdentity)
      : visual.label ?? apparatusLabel(visual.kind);
  const visibleContents =
    hasHiddenIdentity && !revealHiddenIdentity
      ? ["Identity hidden"]
      : contents.map(titleCase);

  return (
    <article
      className={classes}
      data-apparatus={visual.kind}
      data-effect={activeEffects.join(" ")}
      aria-label={publicLabel}
    >
      <div className="sandbox-apparatus">
        <div
          className="sandbox-liquid"
          style={{ backgroundColor: safeStation.color }}
        />
        {safeStation.heat === "hot" ? <span className="sandbox-heat" /> : null}
      </div>
      <strong>{publicLabel}</strong>
      <small>{visibleContents.join(" + ")}</small>
    </article>
  );
}

function materialLabel(
  material: SandboxLabMaterial,
  revealHiddenIdentity: boolean,
): string {
  if (revealHiddenIdentity && material.hiddenIdentity) {
    return `${material.label}: ${material.hiddenIdentity.revealLabel}`;
  }
  return material.label;
}

function toolIcon(type: string): string {
  switch (type) {
    case "pour":
      return "+";
    case "filter":
      return "F";
    case "heat":
      return "^";
    case "cool":
      return "C";
    case "wait":
      return "...";
    case "shineLight":
      return "L";
    case "chromatograph":
      return "B";
    default:
      return "*";
  }
}
