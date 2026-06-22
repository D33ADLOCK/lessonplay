/**
 * `useGuidedSession` — the reusable controller for the guided-sim loop.
 *
 * This is chem-lab's `LabSession` orchestration, lifted into the core so every
 * game shares one tested behaviour ("fix it once"): it drives the session
 * reducer, auto-advances out of the transient predict phase so the learner lands
 * on the live bench, animates each action for a beat before resolving it, gates
 * taps through `gateTap` (off-family taps nudge and change nothing), surfaces the
 * safety-net hint after an error, and exposes the derived flags a view needs.
 *
 * It is renderer-agnostic: it returns plain state + handlers and never draws.
 * A game builds its own scene from `state.workspace` + `activeId` and renders it
 * through the core `Stage`; the chemistry-specific art stays in the game.
 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Action, ActionType } from "../model/actions";
import type { Entity } from "../model/entity";
import type { Scenario, Step } from "../model/scenario";
import type { StepResult } from "../model/entity";
import {
  createSession,
  currentStep,
  reduce,
  type Phase,
  type SessionState,
} from "../engine/session";
import { gateTap, hintTargetFor, type ToolHint } from "../engine/tapGate";

/** How long a pour stream / filter / heat animates before it resolves (ms). */
const POUR_MS = 600;
const ACT_MS = 700;

/** The station the current step acts on (a pour/heat target, or a filter source). */
function activeStationOf(step: Step | null): string | undefined {
  if (!step) return undefined;
  return step.expect.target ?? step.expect.source;
}

export interface GuidedSession {
  readonly state: SessionState;
  readonly phase: Phase;
  readonly step: Step | null;
  /** The station the current step acts on. */
  readonly activeId: string | undefined;
  readonly stepNumber: number;
  readonly totalSteps: number;
  readonly result: StepResult | null;

  /** Tool availability, derived from the scenario's steps. */
  readonly hasFilter: boolean;
  readonly hasHeat: boolean;
  readonly hasCool: boolean;
  readonly hasWait: boolean;
  readonly hasShineLight: boolean;
  readonly hasChromatograph: boolean;
  /** The entities offered in the tray, resolved from `scenario.shelf`. */
  readonly shelf: readonly Entity[];
  /** Look up any entity by id (e.g. for a pour-stream colour). */
  readonly entity: (id: string) => Entity | undefined;

  /** Reagent id whose pour is in flight, if any. */
  readonly pouring: string | null;
  /** Which non-pour tool is working, if any. */
  readonly busy: Exclude<ActionType, "pour" | "transfer" | "stir"> | null;
  readonly inFlight: boolean;
  /** Animation tween target (1 once the step has visibly resolved, else 0). */
  readonly animTarget: number;

  /** The step has produced its visible effect — show the result panel. */
  readonly resolved: boolean;
  /** Still choosing a move. */
  readonly working: boolean;
  /** The learner has erred this step — the safety-net hint kicks in. */
  readonly errored: boolean;
  /** The cue's secondary line: the wrong-tap / inert-pour nudge, if any. */
  readonly nudgeText: string | null;
  /** Which tool to glow, once the learner has erred (else null). */
  readonly hint: ToolHint;

  /** Tap a tool — the decision. Gates, then runs the engine or nudges. */
  readonly onTap: (action: ActionType, reagentId?: string) => void;
  /** Resolved → advance across observe → explain → next step in one beat. */
  readonly finishStep: () => void;
}

export function useGuidedSession(scenario: Scenario): GuidedSession {
  const [state, dispatch] = useReducer(reduce, scenario, createSession);

  const entities = useMemo(
    () => new Map(scenario.entities.map((e) => [e.id, e])),
    [scenario],
  );

  const [pouring, setPouring] = useState<string | null>(null);
  const [busy, setBusy] = useState<GuidedSession["busy"]>(null);
  // The nudge shown after the learner taps a wrong tool (off-family). Per step.
  const [errNudge, setErrNudge] = useState<string | null>(null);
  const actTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (actTimer.current) window.clearTimeout(actTimer.current);
    },
    [],
  );

  const result = state.result;
  const step = currentStep(state);
  const activeId = activeStationOf(step);
  const inFlight = Boolean(pouring) || Boolean(busy);

  // The action is the decision: never show a guess screen — auto-advance out of
  // the predict phase so the learner lands straight on the live bench.
  useEffect(() => {
    if (state.phase === "predict") dispatch({ type: "advance-phase" });
  }, [state.phase]);

  // A fresh step clears any lingering wrong-tap nudge.
  useEffect(() => {
    setErrNudge(null);
  }, [state.stepIndex]);

  const runAfter = (action: Parameters<typeof dispatch>[0], delay: number) => {
    actTimer.current = window.setTimeout(() => {
      dispatch(action);
      setPouring(null);
      setBusy(null);
      actTimer.current = null;
    }, delay);
  };

  const startPour = (reagent: string, target: string) => {
    if (inFlight) return;
    setPouring(reagent);
    runAfter(
      { type: "perform", action: { type: "pour", reagent, target } },
      POUR_MS,
    );
  };

  const startFilter = (source: string) => {
    if (inFlight) return;
    setBusy("filter");
    runAfter({ type: "perform", action: { type: "filter", source } }, ACT_MS);
  };

  const startTargetAction = (
    action: Extract<
      Action,
      {
        readonly type:
          | "heat"
          | "cool"
          | "wait"
          | "shineLight"
          | "chromatograph";
      }
    >["type"],
    target: string,
  ) => {
    if (inFlight) return;
    setBusy(action);
    runAfter({ type: "perform", action: { type: action, target } }, ACT_MS);
  };

  const resolved = state.phase === "observe" && Boolean(result?.visibleChange);
  const working = !resolved && state.phase !== "complete";
  const errored = errNudge !== null || Boolean(result && !result.visibleChange);
  const nudgeText =
    errNudge ?? (result && !result.visibleChange ? result.observation : null);

  const onTap = (action: ActionType, reagentId?: string) => {
    if (!step || inFlight) return;
    const outcome = gateTap(step, action);
    if (outcome.kind === "nudge") {
      setErrNudge(outcome.text);
      return;
    }
    setErrNudge(null);
    if (action === "pour") {
      startPour(reagentId ?? "", step.expect.target ?? activeId ?? "");
    } else if (action === "filter" && step.expect.source) {
      startFilter(step.expect.source);
    } else if (
      (action === "heat" ||
        action === "cool" ||
        action === "wait" ||
        action === "shineLight" ||
        action === "chromatograph") &&
      step.expect.target
    ) {
      startTargetAction(action, step.expect.target);
    }
  };

  const finishStep = () => {
    dispatch({ type: "advance-phase" });
    dispatch({ type: "advance-phase" });
  };

  const shelf = useMemo(
    () =>
      scenario.shelf
        .map((id) => entities.get(id))
        .filter((e): e is Entity => Boolean(e)),
    [scenario, entities],
  );

  const hasFilter = scenario.steps.some((s) => s.expect.type === "filter");
  const hasHeat = scenario.steps.some((s) => s.expect.type === "heat");
  const hasCool = scenario.steps.some((s) => s.expect.type === "cool");
  const hasWait = scenario.steps.some((s) => s.expect.type === "wait");
  const hasShineLight = scenario.steps.some((s) => s.expect.type === "shineLight");
  const hasChromatograph = scenario.steps.some(
    (s) => s.expect.type === "chromatograph",
  );

  return {
    state,
    phase: state.phase,
    step,
    activeId,
    stepNumber: Math.min(state.stepIndex + 1, scenario.steps.length),
    totalSteps: scenario.steps.length,
    result,
    hasFilter,
    hasHeat,
    hasCool,
    hasWait,
    hasShineLight,
    hasChromatograph,
    shelf,
    entity: (id) => entities.get(id),
    pouring,
    busy,
    inFlight,
    animTarget: result?.visibleChange ? 1 : 0,
    resolved,
    working,
    errored,
    nudgeText,
    hint: errored && step ? hintTargetFor(step) : null,
    onTap,
    finishStep,
  };
}
