import { expect, test, type Page } from "@playwright/test";

interface DebugState {
  cellPlaced: boolean;
  switchClosed: boolean;
  phase: "editing" | "testing" | "complete";
  lastPointer?: { x: number; y: number };
}

async function scenePoint(
  page: Page,
  logicalX: number,
  logicalY: number,
): Promise<{ x: number; y: number }> {
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Phaser canvas has no bounding box.");
  return {
    x: box.x + (logicalX / 360) * box.width,
    y: box.y + (logicalY / 520) * box.height,
  };
}

async function debugState(page: Page): Promise<DebugState | undefined> {
  return page.evaluate(
    () =>
      (
        globalThis as typeof globalThis & {
          __signalStormDebug?: DebugState;
        }
      ).__signalStormDebug,
  );
}

test("repairs the emergency torch from arrangement to room consequence", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.getByText("Place the cell, close the switch, then Test.")).toBeVisible();

  const cellHome = await scenePoint(page, 75, 348);
  const cellSlot = await scenePoint(page, 87, 226);
  await page.mouse.move(cellHome.x, cellHome.y);
  await page.mouse.down();
  await page.mouse.move(cellSlot.x, cellSlot.y, { steps: 8 });
  await page.mouse.up();
  const afterDrag = await debugState(page);
  expect(afterDrag?.lastPointer).toBeDefined();
  await expect.poll(() => debugState(page)).toMatchObject({ cellPlaced: true });

  const switchPoint = await scenePoint(page, 257, 226);
  await page.mouse.click(switchPoint.x, switchPoint.y);
  await expect.poll(() => debugState(page)).toMatchObject({ switchClosed: true });

  const testPoint = await scenePoint(page, 180, 420);
  await page.mouse.click(testPoint.x, testPoint.y);

  await expect(page.getByText("Current is moving around the loop.")).toBeVisible();
  await expect(page.getByText("The torch is beginning to glow.")).toBeVisible();
  await expect(page.getByText("The repair bench is visible again.")).toBeVisible();
  await expect(
    page.getByText("The emergency torch glows, revealing the repair bench."),
  ).toBeVisible();
  await expect.poll(() => debugState(page)).toMatchObject({ phase: "complete" });
});
