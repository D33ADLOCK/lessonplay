# Lantern Run QA

## Automated coverage

- Deterministic fixed-step motion and surface-dependent stopping distance
- Outcome boundary classification and prediction comparison
- Content validation with valid and invalid fixtures
- Scoring, stars, optional mastery, personal bests, save migration and recovery
- Semantic input equivalence for touch, pointer, and keyboard
- Event-driven reactions, celebrations, and world transformations
- Browser boot, overlay stacking, modal blocking, full three-level flow, retry,
  risky route, completion, persistence, mobile viewport, settings, and pause

## Manual device checklist

- [x] Desktop layout preserves the full playfield and keeps HUD controls clear
- [x] Mobile viewport uses large controls and a compact two-column dock
- [x] First meaningful launch is available from the opening in one action
- [x] All three surfaces are visually distinct
- [x] Prediction remains visible during and after motion
- [x] Failure permits immediate retry without reload
- [x] Risky ice route provides a mastery bonus
- [x] Final level requires an explicit prediction
- [x] Audio and reduced-motion settings persist
- [x] Pause/settings block gameplay input
- [x] Completion restores lights/music layers and reveals the next district

## Human playtest gate

Still requires a supervised target-age (Class 6–7) playtest. Record:

1. Whether the player cared about helping the characters.
2. Whether they watched launches through completion.
3. Whether success produced visible satisfaction.
4. Whether failure prompted a voluntary retry.
5. Whether they could explain different travel distances without textbook cues.
6. Whether they changed a later prediction based on an earlier result.
7. Whether they noticed persistent light and music restoration.

Do not close issue #18 or parent PRD #10 until those observations are recorded.
