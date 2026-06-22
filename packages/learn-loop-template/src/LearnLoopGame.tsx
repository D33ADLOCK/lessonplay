import { useState } from "react";
import type { Entity, Scenario, Station } from "@learn-loop/core";
import { ToolTray, useGuidedSession } from "@learn-loop/core/ui";

import {
  type LearnLoopTemplateConfigInput,
  normalizeLearnLoopTemplateConfig,
} from "./config";
import {
  type LearnLoopPresentationInput,
  type NormalizedLearnLoopStationPresentation,
  normalizeLearnLoopPresentation,
} from "./presentation";

export interface LearnLoopGameProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly scenario: Scenario;
  readonly config?: LearnLoopTemplateConfigInput;
  readonly presentation?: LearnLoopPresentationInput;
  readonly missionIndex?: number;
  readonly missionCount?: number;
  readonly missionTitles?: readonly string[];
  readonly onSelectMission?: (index: number) => void;
}

export function LearnLoopGame({
  title,
  eyebrow = "Learn Loop",
  scenario,
  config,
  presentation,
  missionIndex = 0,
  missionCount = 1,
  missionTitles,
  onSelectMission,
}: LearnLoopGameProps) {
  const [missionsOpen, setMissionsOpen] = useState(false);
  const { config: templateConfig } = normalizeLearnLoopTemplateConfig(config);
  const normalizedPresentation = normalizeLearnLoopPresentation(
    scenario,
    presentation,
  );
  const session = useGuidedSession(scenario);
  const {
    state,
    step,
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
    hint,
    entity,
    activeId,
    onTap,
    finishStep,
  } = session;

  const explanation = result?.explanation ?? step?.explanation ?? "";
  const isLastStep = state.stepIndex + 1 >= scenario.steps.length;
  const canSelectMissions = Boolean(
    onSelectMission && missionTitles && missionTitles.length > 1,
  );

  return (
    <main className="learn-loop-template-shell" aria-label={title}>
      {canSelectMissions ? (
        <div className="learn-loop-mission-actions">
          <button
            type="button"
            className="learn-loop-mission-menu-button"
            onClick={() => setMissionsOpen((open) => !open)}
          >
            Open missions
          </button>
          {missionsOpen ? (
            <nav className="learn-loop-mission-menu" aria-label="Mission list">
              {missionTitles!.map((missionTitle, index) => (
                <button
                  key={`${missionTitle}-${index}`}
                  type="button"
                  aria-current={index === missionIndex ? "true" : undefined}
                  onClick={() => {
                    onSelectMission!(index);
                    setMissionsOpen(false);
                  }}
                >
                  {missionTitle}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      ) : null}

      <div
        className={[
          "learn-loop-template",
          `theme-${templateConfig.theme.palette}`,
          `accent-${templateConfig.theme.accent}`,
          `intensity-${templateConfig.theme.intensity}`,
          `header-${templateConfig.variants.header}`,
          `stage-${templateConfig.variants.stage}`,
          `feedback-${templateConfig.variants.feedback}`,
        ].join(" ")}
      >
      <header className="learn-loop-region learn-loop-header">
        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="learn-loop-header-metrics" aria-label="Progress">
          <span>
            Mission {missionIndex + 1}/{missionCount}
          </span>
          <span>
            Step {stepNumber}/{totalSteps}
          </span>
        </div>
      </header>

      <section className="learn-loop-region learn-loop-mission" aria-label="Mission">
        <p>{scenario.concept}</p>
        <h2>{scenario.title}</h2>
        {step && state.phase !== "complete" ? (
          <span>{step.goal ?? step.actionPrompt}</span>
        ) : (
          <span>Scenario complete</span>
        )}
      </section>

      <section
        className="learn-loop-region learn-loop-experiment"
        aria-label="Experiment zone"
      >
        <div
          className="learn-loop-stations"
          data-stage={templateConfig.variants.stage}
        >
          {normalizedPresentation.stations.map((stationPresentation) => {
            const station = state.workspace.stations[stationPresentation.stationId];
            if (!station) return null;

            return (
              <StationView
                key={stationPresentation.stationId}
                presentation={stationPresentation}
                station={station}
                entities={station.contents.map(entity)}
                active={stationPresentation.stationId === activeId}
                resolved={resolved && stationPresentation.stationId === activeId}
                emits={result?.emits?.map((emission) => emission.gas) ?? []}
              />
            );
          })}
        </div>
      </section>

      <section className="learn-loop-region learn-loop-tool-tray" aria-label="Tools">
        {step && state.phase !== "complete" ? (
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
        ) : (
          <p>All tools complete.</p>
        )}
      </section>

      <section
        className="learn-loop-region learn-loop-feedback"
        aria-label="Feedback"
        aria-live="polite"
      >
        {state.phase === "complete" ? (
          <p>You completed every step in this guided lab.</p>
        ) : null}
        {working && step ? (
          <>
            <p>{step.actionPrompt}</p>
            {nudgeText ? <small>{nudgeText}</small> : null}
          </>
        ) : null}
        {resolved ? (
          <>
            <p>{result?.observation}</p>
            <button type="button" onClick={finishStep}>
              {isLastStep ? "Finish" : "Next step"}
            </button>
          </>
        ) : null}
      </section>

      <section className="learn-loop-region learn-loop-notebook" aria-label="Notebook">
        <p>{explanation || "Evidence and reasoning will appear as you work."}</p>
      </section>
      </div>
    </main>
  );
}

function StationView({
  presentation,
  station,
  entities,
  active,
  resolved,
  emits,
}: {
  readonly presentation: NormalizedLearnLoopStationPresentation;
  readonly station: Station;
  readonly entities: readonly (Entity | undefined)[];
  readonly active: boolean;
  readonly resolved: boolean;
  readonly emits: readonly string[];
}) {
  const visibleEntities = entities.filter((item): item is Entity => Boolean(item));

  return (
    <article
      className={[
        "learn-loop-station",
        `station-${presentation.kind}`,
        `role-${presentation.role}`,
        active ? "active" : "",
        resolved ? "resolved" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={presentation.label}
      data-station-kind={presentation.kind}
      data-station-role={presentation.role}
    >
      <div className="learn-loop-station-vessel">
        <div
          className={`learn-loop-station-fill heat-${station.heat}`}
          style={{ backgroundColor: station.color }}
        />
        {station.heat === "hot" ? <span className="learn-loop-heat" /> : null}
        {emits.length > 0 && active ? (
          <div className="learn-loop-emissions" aria-label="Emission">
            {emits.map((emission) => (
              <span key={emission}>{emission}</span>
            ))}
          </div>
        ) : null}
      </div>
      <h3>{presentation.label}</h3>
      <p>{station.phase ?? "solution"}</p>
      <ul>
        {visibleEntities.length > 0 ? (
          visibleEntities.map((item) => <li key={item.id}>{item.label}</li>)
        ) : (
          <li>Empty</li>
        )}
      </ul>
    </article>
  );
}
