import { test, expect, type Page } from "@playwright/test";

async function launchAndWaitFor(
  page: Page,
  buttonName: "Continue" | "See the restored festival",
): Promise<void> {
  await page.getByRole("button", { name: "Launch lantern" }).click();
  await expect(page.getByRole("button", { name: buttonName })).toBeVisible({
    timeout: 12_000,
  });
}

test("completes all three levels, risky route, retry, and persistence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the first delivery" }).click();

  await launchAndWaitFor(page, "Continue");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Frozen shortcut" }).click();
  await expect(page.getByRole("slider", { name: "Push strength" })).toHaveValue("50");
  await launchAndWaitFor(page, "Continue");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("slider", { name: "Prediction" }).fill("84");
  await page.getByRole("slider", { name: "Push strength" }).fill("50");
  await page.getByRole("button", { name: "Launch lantern" }).click();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible({
    timeout: 12_000,
  });
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("slider", { name: "Prediction" }).fill("85");
  await page.getByRole("slider", { name: "Push strength" }).fill("71");
  await launchAndWaitFor(page, "See the restored festival");
  await page.getByRole("button", { name: "See the restored festival" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-game-phase", "complete");

  const save = await page.evaluate(() => JSON.parse(localStorage.getItem("lantern-run-save") ?? "{}"));
  expect(save.data.completedLevelIds).toEqual([
    "first-light",
    "frozen-shortcut",
    "music-square",
  ]);
  await page.reload();
  await expect(page.getByRole("button", { name: "Begin the first delivery" })).toBeVisible();
  const reloaded = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lantern-run-save") ?? "{}"),
  );
  expect(reloaded.data.restoredWorld).toContain("stage-light");
});

test("settings, pause modal, and reduced motion block or alter presentation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.locator("#overlay")).toHaveAttribute("data-modal", "true");
  await page.getByLabel("Reduce motion").check();
  await page.getByRole("button", { name: "Back to game" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
  await expect(page.locator("#overlay")).toHaveAttribute("data-modal", "false");

  await page.getByRole("button", { name: "Pause game" }).click();
  await expect(page.getByRole("heading", { name: "Festival paused" })).toBeVisible();
  await expect(page.locator("#overlay")).toHaveAttribute("data-modal", "true");
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.locator("#overlay")).toHaveAttribute("data-modal", "false");
});
