import { test, expect } from "@playwright/test";

test("keeps gameplay blocked until every modal panel is closed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-lr-ready", "true");

  await page.evaluate(() => {
    const browserGlobals = globalThis as typeof globalThis & {
      __lanternRun: {
        overlay: {
          mountPanel(panel: HTMLElement, opts: { modal: boolean }): () => void;
        };
      };
      __closeFirstModal?: () => void;
      __closeSecondModal?: () => void;
    };
    const services = browserGlobals.__lanternRun;

    const first = document.createElement("section");
    const second = document.createElement("section");
    browserGlobals.__closeFirstModal = services.overlay.mountPanel(first, { modal: true });
    browserGlobals.__closeSecondModal = services.overlay.mountPanel(second, { modal: true });
  });

  const overlay = page.locator("#overlay");
  await expect(overlay).toHaveAttribute("data-modal", "true");
  await expect(overlay.locator("[data-modal='true']")).toHaveCount(2);

  await page.evaluate(() => {
    (globalThis as typeof globalThis & { __closeFirstModal?: () => void })
      .__closeFirstModal?.();
  });
  await expect(overlay).toHaveAttribute("data-modal", "true");

  await page.evaluate(() => {
    (globalThis as typeof globalThis & { __closeSecondModal?: () => void })
      .__closeSecondModal?.();
  });
  await expect(overlay).toHaveAttribute("data-modal", "false");
});
