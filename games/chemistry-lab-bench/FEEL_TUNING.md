# Feel tuning — Chemistry Lab Bench

Polish notes for the v2 lab bench. Game state stays authoritative (the reducer +
engine); all feel lives in the render-only Canvas layer (`src/scene/labRenderer.ts`)
and CSS (`src/style.css`). Effects are gated by the moment they belong to, never
always-on at full strength, and respect `prefers-reduced-motion`.

## Feedback vocabulary

| Moment | Effect | Where |
| :-- | :-- | :-- |
| Pour (anticipation) | Falling droplet stream + surface splash, ~600 ms before the reaction resolves | `drawPour` + `POUR_MS` in `App.tsx` |
| Reaction resolves (reward) | Colour bloom tween + soft radial sheen glint | `draw` glint block |
| Gas released | Rising bubbles that shrink/fade ("pop") near the surface; emission note fades in | `drawBubbles` + `.emission` keyframe |
| Lasting heat | Warm/cool radial aura behind the glass, strength tied to the tween | `HEAT_AURA` + aura block |
| Ambient life | Gentle sine ripple on the liquid surface | `draw` ripple |
| Tap | `:active` scale on buttons/options/reagents + colour transitions | `style.css` |

## Budgets & thresholds

- Pour stream: 5 droplets + 3 splash dots; loops at 1.8 Hz.
- Bubbles: 7, gated on `scene.emitting`, intensity scales with the tween `t`.
- Aura alpha caps at `0.32 * t`; glint sheen at ~`0.18 * t`. Kept subtle on purpose.
- Tween easing: `0.12` lerp-toward-target per frame in `LabCanvas` (ease-out).

## Reduced motion

`LabCanvas` reads `prefers-reduced-motion`; when set, the renderer drops all
time-based motion (ripple, bubble rise, pour droplets, aura/glint pulse) but every
**end state still reads** (final colour, heat level + label, a static pour stream).
CSS transitions/animations are also disabled under the same query.

## Not done (candidates for later)

- Audio cues (fizz, pour, pop-test) — no audio layer yet.
- Per-reagent pour colour trail tint inside the liquid.
- Screen-level pulse on a correct prediction.
