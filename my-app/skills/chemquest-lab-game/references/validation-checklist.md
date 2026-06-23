# Validation Checklist

Run static validation first:

```bash
npm run typecheck --workspace @learn-loop/core
npm test --workspace @learn-loop/core
npm run typecheck --workspace @learn-loop/template
npm test --workspace @learn-loop/template
npm run typecheck --workspace <game-package-name>
npm test --workspace <game-package-name>
npm run build --workspace <game-package-name>
```

The game tests should validate:
- every `Scenario` with `validateScenario`
- every guided presentation with `validateGuidedLabPresentation`
- mission lists stay in lockstep
- at least one full scenario sequence reaches the expected workspace state

## Visual QA Checklist

The app agent does not always have browser automation. Do not try to call
browser tools unless the runtime explicitly provides them. When browser access is
not available, report that visual/mobile QA was not run and use this checklist
as manual follow-up guidance:

- no horizontal overflow
- no vertical overflow
- header, mission, experiment, tool tray, feedback, and notebook are visible
- mission menu opens
- mission menu can switch missions
- one mission can perform its first expected action
- feedback appears after action
- `Next step` appears after action resolves
- notebook explanation is readable
- station visuals match the intended experiment

If screenshots show clipped text, cramped tools, unclear station visuals, or
overlap, fix the template package when the issue is reusable. Fix game-local CSS
only when the problem is genuinely game-specific outer chrome.
