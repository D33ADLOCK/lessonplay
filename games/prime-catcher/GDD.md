# Prime Catcher (prime-catcher)

**Concept**: Prime numbers

## Phase 1 - Game Design Document

## Atomic Concept and Aha Moment

- Atomic concept: A prime number is a whole number greater than 1 that cannot be split into equal rows except as one row of itself.
- Aha moment: When a composite number is tapped or passes by, its dots snap into equal rows; when a prime is caught, the dots refuse every small equal-row split and glow as "only one row works."

## Concept Is Load-Bearing

The game breaks if primality is removed: the only scoring decision is whether the falling number has a real equal-row split, and every success or mistake is resolved by that divisibility check.

## 1. Core Mechanics

Numbers fall through a highlighted catch zone. The player taps exactly when a prime number is inside the zone. Catching a prime scores and produces a bright "cannot split" dot burst. Tapping a composite, tapping 1, tapping empty space, or letting a prime leave the zone cracks the catcher jar. Composite numbers may safely pass, then briefly reveal one valid equal-row layout.

### How the Concept Is Taught Through Play

The player is not matching a color or theme; they are predicting real factor behavior. Correct taps happen only on numbers whose only positive divisors are 1 and themselves. Wrong taps reveal an equal-row arrangement such as 3 x 4 for 12, connecting the error to why the number was not prime. Missed primes show "only 1 x n," making the absence of equal rows visible.

### Controls

| Phase | Action | Notes |
| :--- | :--- | :--- |
| Press / tap | Attempt to catch the current number in the zone | Space, click, or tap all map to the same single input event. |
| Hold | No action | Holding does not repeat catches. |
| Release | No action | Release is intentionally unused because the educational decision is a single timed classification. |

- Behavior: One number falls at a time at first, then two can appear with spacing late in the run. The catch zone stays fixed near the lower third so children can focus on number meaning and timing rather than aiming. Correct primes add score and streak; mistakes crack the jar.
- Win condition: survive 60 seconds or reach 20 correct prime catches.
- Lose condition: the jar reaches 3 cracks from wrong catches, empty taps, or missed primes.
- Core loop: for 30-60 seconds, read the falling number, decide whether it can split into equal rows, tap only if it is prime in the zone, watch dot feedback, and prepare for the next number.
- Scoring: +10 for each prime caught, plus a small streak bonus after three consecutive correct prime decisions. Score comes from the in-world catch event, not from raw taps.

### Difficulty Scaling

| Quantity | Scaling | Reason |
| :--- | :--- | :--- |
| Fall speed | Slowly increases over the first 45 seconds, then caps | Keeps timing pressure slightly above beginner level without making number reading unfair. |
| Spawn interval | Shrinks gently with time, with a minimum readable gap | Increases flow while preserving one-button clarity. |
| Number range | Starts at 1-19, later reaches 1-49 | Children first practice small primes, then see richer composites and times-table-like factors. |

## 1.5 State Model and Tradeoff

| State Variable | Increase/Decrease Triggers | In-World Feedback | Decision Purpose |
| :--- | :--- | :--- | :--- |
| Jar cracks | Increase on wrong tap, empty tap, or missed prime; reset on restart | Crack lines drawn across the catcher jar | Creates a forgiving three-strike lose condition. |
| Streak | Increases on correct prime catches; resets on any mistake | Catcher rim glows brighter and score popups grow | Rewards confident classification without making mistakes catastrophic. |
| Number age / zone position | Increases as each number falls | Number approaches and crosses the highlighted zone | Creates timing pressure: wait until in-zone, but not past it. |
| Reveal dots | Trigger on catch or safe pass | Dots arrange into equal rows for composites; primes glow in a single unsplittable row | Converts every decision into visible factor evidence. |

- Concrete behavior pair: wait and read the number safely vs. tap late in the zone for score before it escapes.
- Tradeoff explanation: waiting gives more time to decide whether the number can split into equal rows, but waiting too long misses primes and cracks the jar.
- Idle weakness: never tapping catches no primes, so missed primes eventually crack the jar.
- Hold-only weakness: holding has no repeat effect, so it behaves like at most one badly timed press.
- Mashing weakness: repeated taps hit composites or empty space and quickly crack the jar.
- Skilled play: watch the number, use known small factors or the dot-row intuition, and tap only when a prime is inside the highlighted zone.
- Persistent consequence: mistakes leave visible cracks until the game ends.

### Implementation Invariants

| Promise | Invariant | Validation |
| :--- | :--- | :--- |
| Accurate primes | `isPrime(n)` returns true only for integers greater than 1 with no divisor from 2 through sqrt(n). | Snapshot includes current number and prime flag. |
| Idle weakness | Any prime whose bottom leaves the catch zone uncaught adds exactly one crack. | No-input play eventually reaches 3 cracks. |
| Hold-only weakness | Input is edge-triggered; a held pointer or key cannot produce repeated catches. | Holding Space performs one attempt until released and pressed again. |
| Mashing weakness | Any tap without a prime target in the zone adds one crack. | Rapid tapping loses faster than skilled play. |
| Skilled play | Catching a prime in the zone adds score, clears that object, and advances streak without cracking the jar. | Timed prime catches outscore idle and mashing. |

## 2. Object Specifications

- Falling number: large rounded tile with a numeral, vertical motion, and a tiny dot-trail. It stores `value`, `prime`, `x`, `y`, `speed`, and whether it has been judged.
- Catch zone: translucent green horizontal band. Only numbers overlapping this band can be caught.
- Catcher jar: glass bowl at the bottom with up to three drawn cracks. It is the single failure object.
- Dot reveal: short-lived particles that show one valid equal-row factor layout for composites, or a single glowing row for primes.
- Score pops: short-lived text near the zone for feedback; they never create gameplay decisions.

## 3. Design Principle Analysis

### Simplicity and Intuitiveness

The only recurring action is tap. Children see numbers fall into a clear zone and quickly learn that tapping some numbers helps while tapping split-able numbers hurts.

### Visual Feedback and Game Over

Correct prime catches sparkle and bounce the jar rim. Composite mistakes split into equal rows and crack the jar. Losing is visually obvious because the same jar reaches three cracks and breaks.

### Skill-Based Scoring and Risk/Reward

Score measures correct primality decisions under light timing pressure. The safe action is to wait and inspect; the risky action is delaying too long for certainty and missing a prime.

### Novel Mechanics

The educational proof is part of the arcade feedback: the game answers "why not prime?" by physically arranging dots into equal rows after the player's decision.

## 4. Relationship with Seeds

The brief seed is "Prime Catcher." The design keeps the catching fantasy but makes the caught object prove its number property through row formation, avoiding a cosmetic prime-label quiz.

## 5. Basis for Novelty

Most number drills ask for a memorized answer and then mark it right or wrong. This design turns divisibility into the impact animation itself, so the correction is spatial and immediate.

## 6. Similarity Check

- Similar to falling-object typing or rhythm games in timing pressure, but the tap is not a reflex-only hit; it is a mathematical classification.
- Similar to prime-number flash cards in content, but wrong answers are explained through equal-row layouts instead of static text.
