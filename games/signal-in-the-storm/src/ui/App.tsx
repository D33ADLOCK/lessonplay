import { useEffect, useMemo, useRef, useState } from "react";
import { GameBridge } from "../bridge/GameBridge";
import type { GameEvent } from "../contracts/events";
import { introScene } from "../content/intro";
import { torchLevel } from "../content/levels";
import {
  advanceStory,
  applyConsequence,
  createStoryState,
  skipStory,
} from "../domain/story";
import { createGame } from "../game/createGame";
import { MessageBox } from "./MessageBox";

export function App() {
  const bridge = useMemo(() => new GameBridge(), []);
  const gameHost = useRef<HTMLDivElement>(null);
  const [story, setStory] = useState(() => createStoryState(introScene));
  const [boardReady, setBoardReady] = useState(false);
  const [sequenceStage, setSequenceStage] =
    useState<Extract<GameEvent, { type: "sequence-stage" }>["stage"]>();
  const beat = introScene.beats[story.beatIndex];

  useEffect(() => {
    if (!gameHost.current) return;
    const mountedGame = createGame(gameHost.current, bridge);
    return () => mountedGame.destroy();
  }, [bridge]);

  useEffect(
    () =>
      bridge.onEvent((event) => {
        if (event.type === "board-ready") setBoardReady(true);
        if (event.type === "sequence-stage") setSequenceStage(event.stage);
        if (event.type === "consequence-triggered") {
          setStory((current) =>
            applyConsequence(current, event.consequence.description),
          );
        }
      }),
    [bridge],
  );

  const loadRepair = (): void => {
    bridge.send({ type: "load-level", level: torchLevel });
  };

  const advanceDialogue = (): void => {
    setStory((current) => {
      const next = advanceStory(current, introScene);
      if (next.mode === "repair") loadRepair();
      return next;
    });
  };

  const skipIntroduction = (): void => {
    setStory((current) => skipStory(current));
    loadRepair();
  };

  return (
    <main className="app-shell">
      <section
        className={`portrait-frame mode-${story.mode} stage-${sequenceStage ?? "idle"}`}
        aria-label="Signal in the Storm game"
      >
        <header className="story-header">
          <p>Field Station · Storm Warning</p>
          <h1>Signal in the Storm</h1>
        </header>

        {story.mode === "story" && beat ? (
          <div
            className={`story-scene ${beat.backgroundState} transition-${beat.transition ?? "cut"}`}
            style={{ backgroundImage: "url('/assets/backgrounds/field-station-blackout.svg')" }}
            aria-label="School field station during a storm and blackout"
          >
            <div className="storm-clouds" aria-hidden="true" />
            <div className="rain" aria-hidden="true" />
            <div className="lightning-flash" aria-hidden="true" />
            <div className="blackout-vignette" aria-hidden="true" />
            <div className="story-objective">
              <span>Emergency objective</span>
              Restore the torch
            </div>
          </div>
        ) : null}

        <div
          className={`game-canvas ${story.mode === "story" ? "is-hidden" : ""}`}
          ref={gameHost}
          aria-label="Emergency torch repair board"
        />

        {story.mode === "story" && beat ? (
          <MessageBox
            beat={beat}
            onAdvance={advanceDialogue}
            onSkip={skipIntroduction}
          />
        ) : null}

        {story.mode === "repair" ? (
          <p className="status" aria-live="polite">
            {sequenceStage === "current"
              ? "Current is moving around the loop."
              : sequenceStage === "device"
                ? "The torch is beginning to glow."
                : sequenceStage === "room"
                  ? "The repair bench is visible again."
                  : boardReady
                    ? "Place the cell, close the switch, then Test."
                    : "Preparing the repair board..."}
          </p>
        ) : null}

        {story.mode === "consequence" ? (
          <section className="message-box consequence" aria-live="polite">
            <div className="consequence-icon" aria-hidden="true">
              ✦
            </div>
            <div>
              <p className="speaker">Kabir</p>
              <p>{story.consequenceText}</p>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
