import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { prepare, openRoutePane, screens, sizes, waitForOverlayRest } from "../../../scripts/qa/common.mjs";

const base = process.env.XP_BASE_URL ?? "http://127.0.0.1:5221";
const browser = await chromium.launch({ channel: process.env.XP_BROWSER_CHANNEL ?? "chrome" });
const directory = new URL("../evidence/chat-interactions/", import.meta.url);
await mkdir(directory, { recursive: true });

const chatScreen = screens.find(item => item.id === "chat");
assert.ok(chatScreen, "chat screen must be registered in screens.ts");

try {
  for (const device of ["M", "DS"]) {
    const [width, height] = sizes[device];
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: device === "M" });

    // Verify default view renders primary heading and composer
    await prepare(page, base, chatScreen, device, "light", "default");
    await expect(page.locator("main h1")).toHaveText(chatScreen.name);
    await expect(page.locator("[data-xp-composer]")).toBeVisible();
    await expect(page.locator("textarea")).toBeVisible();

    if (device === "M") {
      // Test mobile sheet state
      await prepare(page, base, chatScreen, device, "light", "sheet-open");
    } else {
      // Test desktop panel state
      await prepare(page, base, chatScreen, device, "light", "panel-open");
    }

    await page.close();
  }
} finally {
  await browser.close();
}
