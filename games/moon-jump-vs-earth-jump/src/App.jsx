import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Rocket, Sparkles } from 'lucide-react';
import { BUILT_IN_PROFILES, DEFAULT_PROFILE, createCustomProfile, validateCustomProfile } from './gravityProfiles.js';
import { createInitialPhysicsState, jump, updatePhysics } from './physics.js';

export default function App() {
  const [profiles, setProfiles] = useState(BUILT_IN_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState(DEFAULT_PROFILE.id);
  const [physicsState, setPhysicsState] = useState(createInitialPhysicsState);
  const [form, setForm] = useState({
    name: 'Tiny Planet',
    gravity: 1100,
    jumpVelocity: 760,
    message: 'Tiny Planet has custom gravity, so its jump feels different.',
  });
  const [formMessage, setFormMessage] = useState('');

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? DEFAULT_PROFILE,
    [activeProfileId, profiles],
  );

  const profileRef = useRef(activeProfile);

  useEffect(() => {
    profileRef.current = activeProfile;
  }, [activeProfile]);

  const triggerJump = useCallback(() => {
    setPhysicsState((current) => jump(current, profileRef.current));
  }, []);

  useEffect(() => {
    let frameId;
    let lastTime;

    const tick = (time) => {
      if (lastTime === undefined) {
        lastTime = time;
      }

      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      setPhysicsState((current) => updatePhysics(current, profileRef.current, deltaSeconds));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        triggerJump();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerJump]);

  const addCustomProfile = (event) => {
    event.preventDefault();

    const draft = {
      name: form.name,
      gravity: Number(form.gravity),
      jumpVelocity: Number(form.jumpVelocity),
      message: form.message,
    };
    const error = validateCustomProfile(draft);

    if (error) {
      setFormMessage(error);
      return;
    }

    const profile = createCustomProfile(draft);
    setProfiles((current) => [...current, profile]);
    setActiveProfileId(profile.id);
    setFormMessage(`${profile.name} gravity added.`);
  };

  const characterStyle = {
    transform: `translateY(-${Math.min(physicsState.y, 280)}px)`,
  };

  return (
    <main className="app" style={{ '--planet-color': activeProfile.color, '--planet-accent': activeProfile.accent }}>
      <section className="game-shell" aria-label="Moon Jump vs Earth Jump game">
        <div className="top-bar">
          <div>
            <p className="eyebrow">Gravity Lab</p>
            <h1>Moon Jump vs Earth Jump</h1>
          </div>
          <div className="gravity-meter" aria-label={`Current gravity ${activeProfile.gravity}`}>
            <Sparkles size={18} aria-hidden="true" />
            <span>{activeProfile.gravity}</span>
            <small>gravity</small>
          </div>
        </div>

        <div className="layout">
          <section className="stage-panel">
            <div className="planet-sky" aria-hidden="true">
              <div className="planet-orb" />
              <div className="star star-one" />
              <div className="star star-two" />
              <div className="star star-three" />
            </div>

            <div className="character-track">
              <div className="character" style={characterStyle} aria-label="Jumping astronaut">
                <div className="helmet">
                  <div className="visor" />
                </div>
                <div className="body">
                  <span />
                </div>
                <div className="boots" />
              </div>
            </div>

            <div className="ground">
              <span />
              <span />
              <span />
            </div>
          </section>

          <aside className="controls-panel">
            <div className="planet-buttons" role="group" aria-label="Choose gravity">
              {profiles.map((profile) => (
                <button
                  className={`planet-button ${profile.id === activeProfileId ? 'active' : ''}`}
                  key={profile.id}
                  onClick={() => setActiveProfileId(profile.id)}
                  type="button"
                >
                  <span className="planet-dot" style={{ background: profile.color, borderColor: profile.accent }} />
                  {profile.name}
                </button>
              ))}
            </div>

            <button className="jump-button" onClick={triggerJump} type="button">
              <Rocket size={24} aria-hidden="true" />
              Jump
            </button>

            <p className="learning-message">{activeProfile.message}</p>

            <form className="gravity-form" onSubmit={addCustomProfile}>
              <h2>Add Gravity</h2>
              <label>
                Object
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  maxLength={24}
                />
              </label>
              <label>
                Gravity
                <input
                  type="number"
                  min="300"
                  max="3200"
                  step="50"
                  value={form.gravity}
                  onChange={(event) => setForm((current) => ({ ...current, gravity: event.target.value }))}
                />
              </label>
              <label>
                Jump Strength
                <input
                  type="number"
                  min="250"
                  max="1000"
                  step="25"
                  value={form.jumpVelocity}
                  onChange={(event) => setForm((current) => ({ ...current, jumpVelocity: event.target.value }))}
                />
              </label>
              <label>
                Message
                <textarea
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  maxLength={120}
                  rows="3"
                />
              </label>
              <button className="add-button" type="submit">
                <Plus size={18} aria-hidden="true" />
                Add Object
              </button>
              <p className="form-message" role="status">{formMessage}</p>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
