# Presentation Contract

ChemQuest Lab station presentation is constrained. The agent may label stations
and choose approved visual kinds; it may not invent new layout primitives.

## Preferred Adapter

When using `GuidedLabMissionPresentation` from `@learn-loop/core`, convert it:

```ts
import { createLearnLoopTemplatePresentation } from "@learn-loop/template";

const presentation = createLearnLoopTemplatePresentation(guidedPresentation);
```

## Approved Template Station Kinds

`@learn-loop/template` accepts:
- `beaker`
- `flask`
- `filter`
- `dish`
- `tube`
- `jar`
- `tray`

## Adapter Mappings

The shared adapter maps core guided-lab visuals into template visuals:

```text
test-tube -> tube
evaporating-dish -> dish
receiver -> jar
distillation -> flask
paper -> tray
condenser -> tube
burner -> tray
magnet -> tray
```

Existing approved visual kinds such as `beaker`, `dish`, `filter`, and `flask`
stay unchanged.

## Roles

The template supports these roles:
- `source`
- `process`
- `output`

The adapter uses first station as `source`, last station as `output`, and middle
stations as `process`.

## Manual Presentation

If not using the adapter, pass `LearnLoopPresentationInput`:

```ts
presentation={{
  stations: [
    { stationId: "beaker", label: "Salt + sand", kind: "beaker", role: "source" },
    { stationId: "residue", label: "Sand residue", kind: "filter", role: "process" },
    { stationId: "filtrate", label: "Salt water", kind: "dish", role: "output" },
  ],
}}
```

Do not pass unsupported `kind` or `role` values. The template will normalize
invalid values, but the skill should avoid generating them.
