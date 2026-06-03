# FLIP (flip)

A one-button magnetism game for children (~ages 6–10).

**Concept taught (atomic):** *Opposite charges/poles attract; like charges/poles repel — and the force grows the closer you are.* That is the **only** mechanic.

---

## 0. The "aha" moment

> "If I'm the **opposite** color of the magnet it **pulls** me in; if I'm the **same** color it **pushes** me away — so I can pick my color to steer myself toward the gap."

The child is never told left/right. They discover that *choosing a polarity relative to a fixed magnet is steering*. That realisation is the whole game.

---

## 1. Core Mechanics

A glowing charged orb auto-rises up a vertical channel (the world scrolls down past it). The orb is **red** or **blue**. Coloured magnets are mounted in the side walls. Each magnet pushes or pulls the orb sideways depending on whether their colors match. Barriers with a single gap scroll toward the orb; you must be lined up with the gap when the barrier arrives.

### Controls

| Phase | Action | Notes |
| :--- | :--- | :--- |
| **Press / Tap** | **Flip the orb's charge** red ↔ blue (instant) | The single, total mechanic. |
| **Hold** | *intentionally unused* | Polarity is binary — there are only two states, so a continuous hold adds nothing. A tap toggle fully expresses the concept. |
| **Release** | *intentionally unused* | Same reason; there is no charge level to release. |

- **Behavior:** The orb cannot move sideways on its own. The *only* source of horizontal motion is magnetic force from a nearby wall magnet. Force direction = **toward** the magnet if the orb is the **opposite** color (attract), **away** from it if the orb is the **same** color (repel). Force strength grows as the magnet draws level with the orb (proximity). The player flips color to choose which way they get pushed/pulled, drifts to line up with the next gap, and may flip again to *brake* (reversing the force).
- **Game-over:** A single, obvious condition — the orb hits a **barrier** (it was not inside the gap when the barrier crossed it). Screen flashes and shakes; tap to restart. (Side walls are soft — the orb clamps against them and does not die, so kids are never killed by a wall they can't see coming.)
- **Scoring:** `+1` for every gap passed (an in-world causal event). A **clean pass** near the gap centre adds a `+1` spark and grows the orb's glow streak — rewarding precise steering over barely-scraping through.

### Difficulty Scaling

Tuned slightly above a raw beginner: the first two gaps are wide and slow (a built-in tutorial), then it tightens into flow.

| Quantity | Scaling | Reason |
| :--- | :--- | :--- |
| Scroll speed | `1.9 + 0.22·sqrt(score)`, capped ≈ 4.2 | Less reaction time, but `sqrt` keeps it gentle and readable. |
| Gap width | `130 − 6·sqrt(score)`, floor ≈ 76 px | Demands more precise polarity timing as you improve. |
| Magnet placement | gap on same wall as magnet (attract) **or** opposite wall (repel), chosen 50/50 | Forces the child to keep applying *both* halves of the rule. |

---

## 1.5 State Model and Tradeoff

| State Variable | Increase/Decrease Triggers | In-World Feedback | Decision Purpose |
| :--- | :--- | :--- | :--- |
| `polarity` (red/blue) | flips on every tap | orb body color + a flash ring; a live arrow drawn from the magnet to the orb turns **green when pulling**, **orange when pushing** | choose which direction the active magnet moves you |
| `vx` (sideways velocity) | integrates magnetic force; damped | orb's drift + motion trail | commit early to cross far, or flip to brake before overshooting |

- **Concrete behavior pair:** *flip to the magnet's opposite color and hold it to glide across to a far gap* (risky/committal) **vs.** *flip back to brake as you near the gap so you don't overshoot into the barrier wall* (safe/controlled).
- **Tradeoff:** building enough sideways speed to reach a far gap is exactly what makes you overshoot a near one — speed that helps reach helps you crash.
- **Idle weakness:** never flipping leaves a fixed color; magnet sides/colors vary per section, so the unchanged force eventually pushes/pulls the orb to the wrong side of a gap → barrier crash. Idle cannot pass a varied sequence.
- **Hold-only weakness:** n/a — there is no hold; documented unused above.
- **Mashing weakness:** rapid flipping reverses the force direction every few frames, so `vx` oscillates around zero and the orb stays stuck near where it is — it cannot travel to a gap that sits near a wall. Mashing < deliberate timing.
- **Skilled play:** read magnet color + gap side, flip to the polarity that drives you the right way, hold it long enough to arrive, then flip to brake for a clean centre pass (bonus). Timed commitment beats both idle and mashing.
- **Persistent consequence / safety cost:** committing to cross (high `vx`) is spent momentum you must actively cancel; the magnet you used recedes below you and stops helping, so a late realisation cannot be rescued.

### Implementation Invariants

| Promise | Invariant | Validation |
| :--- | :--- | :--- |
| Idle weakness | Consecutive sections randomize {magnet side, magnet color, gap side}; with a fixed polarity at least one section in any short run requires the opposite force | NoInput run dies within a few sections (score « skilled). |
| Mashing weakness | `vx += dir·F`; `vx *= 0.9` each frame. Flipping inverts `dir`; alternating every frame yields mean displacement ≈ 0 | SpamFlip run stays near spawn x and misses wall-side gaps. |
| Skilled play | Force is strong and continuous enough that one well-timed sustained polarity crosses the channel within a section's descent time; a brake-flip reduces overshoot | A timed policy reaches arbitrary gap x and scores far above idle/mash. |
| Readability | `|vx|` capped (≤ 7) so motion stays trackable by a child's eye | Visual check; orb never teleports. |
| No unfair death | Side walls clamp `x` (no death); only a barrier with the orb outside its gap ends the run | Touching a wall never triggers game-over in state snapshots. |

---

## 2. Object Specifications

- **Orb (player):** circle r≈13 at fixed screen y (≈70% down). Color = polarity (red `#ff4d5e` / blue `#4db5ff`), radial-gradient glow, particle trail. Clamped within channel. Only barriers kill it.
- **Magnet:** rounded block embedded in left or right wall at a section's y, colored red or blue (its fixed pole). Draws short field-line ticks. Applies horizontal force to the orb while within vertical influence range; strength ∝ proximity as it draws level.
- **Barrier:** thick dark bar spanning the channel at the section's y, with one **gap** (glowing green) of width `gapW`. Crossing the orb's line decides pass (orb.x in gap) or crash.
- **Force arrow:** a live line magnet→orb, **green = attract (pull)**, **orange = repel (push)**, with an arrowhead on the orb — the teaching cue, no text needed.
- **FX:** flip flash ring, pass sparkle, crash flash + screen shake.

## 3. Design Principle Analysis

**(1) Simplicity & Intuitiveness:** basic shapes (circle, blocks, bars), dark background, no resource HUD beyond a score number. Colors + the green/orange force arrow teach the rule wordlessly.

**(2) Visual Feedback & Game Over:** flip = flash; attract/repel = colored arrow direction; pass = sparkle; the single failure (hit a barrier) flashes and shakes. The reason for death is always visible (you were not in the gap).

**(3) Skill-Based Scoring & Risk/Reward:** score comes from passing gaps; the clean-centre bonus rewards precise polarity timing and braking over scraping the edge. Safe (small early commitment, brake) vs. risky (full cross for a far gap) choice every section.

**(4) Novel Mechanics:** you never steer directly — you steer by *picking a charge*. Movement is an emergent consequence of a physics law (Coulomb/magnetic attraction-repulsion with distance falloff). The "I've never seen this" beat: braking by flipping to *reverse* the very force that was carrying you.

## 4. Relationship with Seeds

Seed: *magnetism / polarity*. Rather than reskinning a dodger, the seed **is** the control scheme — the law of attraction/repulsion is the steering. The contradiction "one button, two directions" is resolved by making the *world's* magnet supply the direction and the button only choose the sign.

## 5. Basis for Novelty

One binary input maps to a physical *property* (charge), not an action (jump/shoot). Direction of travel is computed from the relationship between two colors and a distance, so identical taps produce opposite results depending on the nearby magnet — the player reasons about a field, not a D-pad.

## 6. Similarity Check

- **Flappy-style gap dodgers:** there you control vertical position directly; here you have **no** direct positional control — only charge sign, and the force/direction is environment-supplied. Removing magnetism removes all movement.
- **Polarity shooters (e.g. Ikaruga):** matching color there absorbs/deals damage; it never *moves* you. Here color match/oppose is purely a propulsion vector.
- **Magnet platformers:** usually a single attract toggle. Here both attract *and* repel are required by alternating magnet/gap geometry, and flipping doubles as a brake.

---

## One-button mapping
**Tap / click / Space = flip the orb's charge (red ↔ blue).** That is the only input.

## How playing teaches the concept
By repeatedly choosing the orb's color to either get *pulled toward* a magnet (opposite colors) or *pushed away* from it (same colors) in order to reach each gap, the child internalises through their own successful steering that opposite poles attract and like poles repel, and that the pull/push gets stronger the closer the magnet is.
