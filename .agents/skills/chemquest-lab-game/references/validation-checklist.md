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
- every investigation presentation with `validateSandboxLabPresentation`
- mission lists stay in lockstep
- at least one full scenario sequence reaches the expected workspace state
- hidden identities are absent before a correct conclusion
- every investigation stage offers a meaningful material/tool choice
- notebook evidence unlocks the final conclusion

## Browser Smoke Test

Browser testing is required. Use the available browser automation tool. Prefer
Playwright or the host browser tool.

Test at a phone viewport:

```text
390 x 844
```

Required checks:
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

Example Playwright flow:

```ts
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:5184/");
await page.getByRole("button", { name: "Open missions" }).click();
await page.getByRole("button", { name: /Separate Salt and Sand/ }).click();
await page.getByRole("button", { name: /^Water$/ }).click();
await page.getByRole("article", { name: "Salt + sand" }).click();
await page.getByRole("button", { name: "Next step" }).waitFor();
```

If screenshots show clipped text, cramped tools, unclear station visuals, or
overlap, fix the template package when the issue is reusable. Fix game-local CSS
only when the problem is genuinely game-specific outer chrome.
