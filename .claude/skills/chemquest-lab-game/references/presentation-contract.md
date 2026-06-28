# Presentation Contract

ChemQuest Lab station presentation is constrained. The agent may label stations
and choose approved visual kinds; it may not invent new layout primitives.

## Investigation Presentation

For `SandboxLabViewport`, author a `SandboxLabMissionPresentation` with
`mode: "investigation"`. See `gameplay-contract.md` for the required loop and
`scenario-contract.md` for the paired `Scenario` data.

- Set `mode: "investigation"`.
- Use public material labels such as `Unknown A`.
- Put the end-of-mission identity in `hiddenIdentity.revealLabel`.
- Keep station labels consistent with the public material label.
- Do not expose internal entity ids as visible labels.
- Define material/tool interactions, evidence-bearing feedback cards, stages,
  and conclusions as described in `gameplay-contract.md`.

## Approved Station Visual Kinds

`stationVisuals[].kind` accepts:
- `beaker`
- `flask`
- `filter`
- `dish`
- `tube`
- `jar`
- `tray`

Do not pass unsupported `kind` values. Pick the kind that best matches the real
apparatus (for example, a settling sample in a test tube uses `tube`; a filtrate
catch uses `beaker`; filter residue uses `filter`).

## Example Station Visuals

```ts
stationVisuals: [
  { stationId: "unknownA", kind: "tube", label: "Unknown A" },
  { stationId: "residue", kind: "filter", label: "Filter residue" },
  { stationId: "filtrate", kind: "beaker", label: "Filtrate" },
],
```
