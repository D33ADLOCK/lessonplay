# Squid Jet Thrust (squid-jet-thrust)

**Concept**: Newton's 3rd law (thrust) - a squid moves forward by pushing water backward.

## Phase 1 - Game Design Document

## Atomic Concept and Aha Moment

- Atomic concept: Every thrust has an equal and opposite push; when the squid ejects water backward, the water pushes the squid forward.
- Aha moment: "I only moved because I shoved water the other way."

## Concept Is Load-Bearing

The concept is load-bearing because the squid receives forward acceleration only when a visible backward water jet is created; remove the opposite water push and the squid cannot move through gates.

## 1. Core Mechanics

The squid travels through a 16:9 ocean lab lane with side panels showing cause and effect. The center playfield contains moving reef gates that rhythmically open and close. The player times one-button water jets so the squid reaches each gate while it is open.

### How the Concept Is Taught Through Play

The mechanic is not a squid skin on a normal runner. A tap spawns water puffs behind the squid, gives those puffs backward velocity, and applies a forward impulse to the squid. The side panels update with the same event: left panel shows water pushed backward, right panel shows the reaction thrust and high score. If the player does not push water backward, drag and the gentle current slow the squid until it drifts into the rear net. If the player mashes, the squid rushes into closed gates. Correct play is timing thrust pulses, which makes the action-reaction relationship necessary to progress.

### Controls

| Phase | Action | Notes |
| :--- | :--- | :--- |
| Press / tap | Eject a burst of water backward and apply one forward thrust impulse to the squid | Space, click, and tap all trigger the same edge event. |
| Hold | No repeated action | Holding does not keep firing; the input must be released before another tap. |
| Release | Resets input edge only | Release has no gameplay action. |

- Win condition: pass 8 reef gates before the timer reaches 60 seconds.
- Lose condition: collide with a closed reef gate or the rear safety net.
- Core loop: for about 30-60 seconds, watch a gate's open rhythm, tap to eject water backward, see the squid surge forward, coast under drag, and time the next pulse so arrival happens while the gate is open.
- Scoring: +10 for each gate passed while open, with +3 flow bonus for passing at a controlled speed. Score comes from the in-world gate pass, not from tap count.

### Difficulty Scaling

| Quantity | Scaling | Reason |
| :--- | :--- | :--- |
| Gate cycle speed | Increases slightly after each passed gate, capped for readability | Keeps children in flow while making arrival timing matter. |
| Gate spacing | Starts generous, then tightens mildly | Early gates teach the jet, later gates ask for controlled coasting. |
| Drag/current pressure | Constant and gentle | Reinforces that a squid needs repeated water ejections without making idle loss instant. |

## 1.5 State Model and Tradeoff

| State Variable | Increase/Decrease Triggers | In-World Feedback | Decision Purpose |
| :--- | :--- | :--- | :--- |
| Squid velocity | Tap increases forward velocity; drag and current reduce it | Forward arrow length and squid trail length change | Choose when to add thrust and when to coast. |
| Gate openness | Gate rhythm opens and closes over time | Center gate bars slide apart or squeeze shut | Time arrival, not just tap quickly. |
| Jet evidence | Tap creates backward water puffs that fade behind the squid | Blue puffs and backward arrow appear on the left side of the squid | Connect the visible backward push to forward motion. |
| Gate progress | Increases when the squid safely passes gates | Gate markers and side high-score panel update | Gives a short goal without adding extra controls. |

- Concrete behavior pair: coast and wait for an open gate vs. tap now for speed and risk arriving at a closed gate.
- Tradeoff explanation: more thrust helps reach the next gate before the timer, but too much thrust removes timing control and causes a closed-gate collision.
- Idle weakness: no taps means no new backward water jets, so drag/current push the squid into the rear net and no gates are scored.
- Hold-only weakness: holding is edge-triggered and produces only one jet, after which the squid slows and eventually fails.
- Mashing weakness: rapid repeated taps make the squid too fast to synchronize with gate openings, causing a collision and wasting the visible jet rhythm.
- Skilled play: tap once or twice after a gate opens, coast while watching velocity, then pulse again only when arrival timing lines up with the next opening.
- Persistent consequence: each tap leaves a short-lived water-puff trail, so the player can see the action that caused motion.

### Implementation Invariants

| Promise | Invariant | Validation |
| :--- | :--- | :--- |
| Concept accuracy | Every positive forward impulse must create a backward-moving water puff in the same frame. | Test snapshot reports `lastJetImpulse > 0` only with recent jet puffs. |
| Idle weakness | With no input, forward velocity cannot grow and rear-net collision remains possible under drag/current. | NoInput eventually has scene `lose` or score 0 with x near rear net. |
| Hold-only weakness | Input is edge-triggered; a held key/pointer cannot create more than one jet before release. | Holding Space creates one impulse only. |
| Mashing weakness | Gate collision uses current position and gate openness; high speed does not bypass closed gates. | Spam taps collide with a closed gate more often than timed taps. |
| Skilled play | Passing an open gate adds score and advances the next gate; controlled speed grants a small bonus. | Timed pulses can pass all 8 gates. |

## 2. Object Specifications

- Squid: rounded body with eyes and tentacles, horizontal position, velocity, and a forward thrust arrow that grows after taps.
- Water jet puffs: blue circles spawned behind the squid on each tap, moving backward and fading to show the pushed water.
- Reef gate: two coral bars at a fixed world position, opening and closing around the center lane. A collision with closed bars is the single failure object.
- Rear net: left-side boundary that catches the squid if it never creates enough thrust.
- Side panels: left panel shows pushed-water puffs and tap count; right panel shows thrust arrow, score, high score, timer, and the current concept sentence.
- Juice: screen shake on collisions, squash/stretch on thrust, bubbles on successful gates, color flash when gates open, and small score pops.

## 3. Design Principle Analysis

### (1) Simplicity and Intuitiveness

The screen uses one squid, one gate, one button, and arrows that point in opposite directions. Children can infer that tapping makes water go backward and the squid go forward.

### (2) Visual Feedback and Game Over

Success is shown by bubble bursts and a passed-gate flash. Danger is shown by coral gates squeezing shut. Failure is a clear collision with a closed gate or rear net.

### (3) Skill-Based Scoring and Risk/Reward

Score reflects controlled arrival timing. Safe play coasts and waits; risky play adds thrust to reach an open gate before it closes.

### (4) Novel Mechanics

The educational proof is the movement mechanic itself: the game never gives direct forward movement without the opposite water push.

## 4. Relationship with Seeds

The seed is Squid Jet / Newton's 3rd law. The design keeps the natural squid propulsion behavior and turns the law into timing-based movement instead of a decorative theme.

## 5. Basis for Novelty

Many educational games ask for a vocabulary answer after an arcade action. Here the action is the answer: pushing water backward is the only way to move forward.

## 6. Similarity Check

- Similar to one-button runners because progress is timed with a single input, but unlike runners the input does not jump or flap; it creates an opposite water impulse.
- Similar to simple physics demos because it shows action and reaction, but unlike a demo it makes the player use that physical rule to pass gates.
