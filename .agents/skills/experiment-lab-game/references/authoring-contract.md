# Authoring Contract

Rules for the learner-facing text and reveal content. These protect the two
properties that make ExperimentLab feel like discovery.

## Discovery before naming

The learner must infer the concept; the game must not hand it over.

- `observation` text describes **only what is seen** — a sensory, neutral
  description. No inference, no classification, no concept name.
  - Good: `"A beam shows, but the liquid looks gritty and uneven."`
  - Bad:  `"A beam shows; this is a suspension."`
- `validateExperimentGame` rejects any observation whose text contains a declared
  category `label` (whole-word, case-insensitive). Keep concept names out of
  observations, hints, and level intros.
- Concept names (`ExperimentCategory.label`) and definitions appear only in the
  reveal, after a correct classification — as a reward, not a lecture.

## Observation text

- One observation per stable `observationId`; reusing an id with different text
  is rejected.
- Distinct *visuals* should read as distinct observations, but two samples that
  share the trap's `visual` may legitimately differ in wording (e.g. "evenly
  cloudy" vs "gritty and uneven") — the player learns to read the difference.
- Keep it short, concrete, and sensory.

## Predictions

- When `predictionRequired`, the learner predicts a `visual`. Author tool
  descriptions so the available outcomes are guessable but not obvious.
- A surprising-but-fair result (the prediction is wrong) is the teaching moment;
  design the trap so an intuitive first guess is sometimes wrong.

## Hints

`ExperimentHint = { id, text }`, revealed one at a time, in order, only on
request.

- Order from gentle nudge to concrete strategy; the last hint may point at
  *combining* causes but must still not name the answer for a specific sample.
- `guided` levels usually need one hint; `hinted` levels two or three; `open`
  levels none.

## Reveal copy

- `ExperimentLevel.outro` is shown after a correct classification, before the
  reveal/next level.
- The reveal pairs each sample's `category.label` (+ `definition`) with its
  `revealLabel` (the real-world identity). Make the payoff land: this is where
  the vocabulary and the "what it really was" arrive together.

## Accuracy

- The concept, grade, and every property -> observation mapping must be
  scientifically correct; a teacher should trust it. Verify in the
  science-validator phase before encoding.
