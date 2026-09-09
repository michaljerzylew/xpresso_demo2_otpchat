import { resolve } from "node:path";
import { tsImport } from "tsx/esm/api";
import { web, waitForOverlayRest, waitForPressRest } from "./common.mjs";
const { authDemo } = await tsImport(resolve(web, "src/data/auth.ts"), import.meta.url);
export function route(screen, state) {
  return { query: `auth-state=${state}${screen.id === "reset-password" && state !== "selected" ? "&token=" + authDemo.resetToken : ""}` };
}
export async function prepare(page, base, screen, deviceClass, mode, state) {
    if (state === "panel-open") {
      if (deviceClass === "M" || deviceClass === "TP") {
        await page.getByRole("button", { name: "Workspace details", exact: true }).click();
        await waitForOverlayRest(page, ".workspace-sheet[open] .sheet-surface");
      } else {
        await page.locator(".auth-brand .auth-context-content").waitFor();
        await waitForOverlayRest(page, ".auth-brand");
      }
    } else if (state === "sheet-open") {
      await page.getByRole("button", { name: "Demo access", exact: true }).click();
      await waitForOverlayRest(page, deviceClass === "M" ? ".workspace-sheet[open] .sheet-surface" : ".kit-floating");
    } else if (state === "selected" && screen.id === "register" && ["M", "TP"].includes(deviceClass)) {
      await page.getByLabel("Full name", { exact: true }).fill("Riley Morgan");
      await page.getByLabel("Email address", { exact: true }).fill("riley@example.test");
      await page.getByRole("button", { name: "Continue to security" }).click();
      await page.getByLabel("Confirm password", { exact: true }).waitFor();
    } else if (state === "selected" && screen.id === "two-factor") {
      await page.getByRole("button", { name: "Use a recovery code" }).click();
      await page.getByLabel("Recovery code", { exact: true }).waitFor();
    }
    // Pointer press feedback must finish before measuring its transformed hit box.
    await waitForPressRest(page);
    return;

}
