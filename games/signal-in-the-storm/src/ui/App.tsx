import { useEffect, useMemo, useRef, useState } from "react";
import { GameBridge } from "../bridge/GameBridge";
import { introScene } from "../content/intro";
import { torchLevel } from "../content/levels";
import {
  advanceStory,
  applyConsequence,
  createStoryState,
} from "../domain/story";
import { createGame } from "../game/createGame";

export function App() {
  const bridge = useMemo(() => new GameBridge(), []);
  const gameHost = useRef<HTMLDivElement>(null);
  const [story, setStory] = useState(() => createStoryState(introScene));
  const [boardReady, setBoardReady] = useState(false);
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
        if (event.type === "consequence-triggered") {
          setStory((current) =>
            applyConsequence(current, event.consequence.description),
          );
        }
      }),
    [bridge],
  );

  const openRepair = (): void => {
    setStory((current) => advanceStory(current, introScene));
    bridge.send({ type: "load-level", level: torchLevel });
  };

  return (
    <main className="app-shell">
      <section className="portrait-frame" aria-label="Signal in the Storm game">
        <header className="story-header">
          <p>Field Station · Storm Warning</p>
          <h1>Signal in the Storm</h1>
        </header>

        <div
          className="game-canvas"
          ref={gameHost}
          aria-label="Emergency torch repair board"
        />

        {story.mode === "story" && beat ? (
          <section className="message-box" aria-live="polite">
            <div className="portrait" aria-hidden="true">
              M
            </div>
            <div>
              <p className="speaker">{beat.speaker}</p>
              <p>{beat.text}</p>
              <button type="button" onClick={openRepair}>
                Check the torch
              </button>
            </div>
          </section>
        ) : null}

        {story.mode === "repair" ? (
          <p className="status" aria-live="polite">
            {boardReady
              ? "The board is ready. Test the circuit."
              : "Preparing the repair board..."}
          </p>
        ) : null}

        {story.mode === "consequence" ? (
          <section className="message-box consequence" aria-live="polite">
            <div className="portrait" aria-hidden="true">
              K
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
