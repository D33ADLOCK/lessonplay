# Lantern Run Feel Tuning

## Readability budgets

- Cart tilt is clamped to 0.12 radians and never changes simulation geometry.
- Launch squash peaks at 1.22 × 0.78 and returns within 150 ms.
- Trails require speed above 12 course-units/second and expire within 320 ms.
- Celebration particles are capped at 32 and expire within 900 ms.
- Camera shake is limited to 180 ms for crashes and 80 ms for softer failures.
- Reduced-motion mode removes trails, particles, looping notes, flash, and shake.

## Feedback vocabulary

- Launch: warm recoil, sparks, rising tone.
- Wood: short low knock; grass: muted low brush; ice: light high glide.
- Near miss: cool marker colour and restrained tilt.
- Crash: coral cart flash, short shake, playful low tone.
- Success: warm burst; perfect delivery receives the larger burst and higher tone.

## Performance target

Maintain 30 FPS or better on representative mobile hardware. All transient
graphics self-destruct, and no gameplay rule depends on presentation effects.
