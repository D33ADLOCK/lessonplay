import { test, expect } from "@playwright/test";

/**
 * Slice 1 e2e smoke: the game boots, the Phaser canvas mounts, and the DOM
 * overlay shell is present and non-blocking. The full three-level / persistence
 * / mobile suite is built in Slice 8 (#18).
 */
test("boots into an actionable opening under the overlay shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-lr-ready", "true", {
    timeout: 15_000,
  });
  await expect(page.locator("#game canvas")).toBeVisible();
  await expect(page.locator("#overlay")).toBeAttached();
  await expect(page.getByRole("button", { name: "Begin the first delivery" })).toBeVisible();
  // Overlay must not block gameplay input until a modal panel opts in.
  await expect(page.locator("#overlay")).not.toHaveAttribute("data-modal", "true");
});
