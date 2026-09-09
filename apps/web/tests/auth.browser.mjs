import { tsImport } from "tsx/esm/api";
const { brand, authNavigation } = await tsImport(new URL("../src/app-modules.ts", import.meta.url).href, import.meta.url);
const { authDemo } = await tsImport(new URL("../src/data/auth.ts", import.meta.url).href, import.meta.url);
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { prepare, screens, sizes, waitForOverlayRest } from "../../../scripts/qa/common.mjs";
const base = process.env.XP_BASE_URL ?? "http://127.0.0.1:5221";
const browser = await chromium.launch({ channel: "chrome" });
const directory = new URL("../evidence/auth54-interactions/", import.meta.url);
await mkdir(directory, { recursive: true });
async function expectDemoPassword(page, device, password) {
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  const selector = device === "M" ? ".workspace-sheet[open] .sheet-surface" : ".kit-floating";
  await waitForOverlayRest(page, selector);
  await expect(page.locator(`${selector} .auth-demo-details dt`).filter({ hasText: /^Password$/ }).locator("+ dd")).toHaveText(password);
  await expect(page.locator(`${selector} .auth-demo-body`)).toContainText("Accounts and password changes last until this page is reloaded.");
  await page.keyboard.press("Escape");
  await page.locator(selector).waitFor({ state: "detached" });
}
try {
  for (const device of ["M", "TP"]) for (const mode of ["light", "dark"]) for (const activation of ["pointer", "Enter"]) {
    const [width, height] = sizes[device];
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true });
    await prepare(page, base, screens.find(item => item.id === "register"), device, mode, "default");
    // Reach the form using only Tab, then type without locator focus/fill shortcuts.
    const name = page.getByLabel("Full name", { exact: true });
    for (let tab = 0; tab < 12 && !await name.evaluate(node => node === document.activeElement); tab++) await page.keyboard.press("Tab");
    await expect(name).toBeFocused();
    await page.keyboard.type("Riley Morgan");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
    await page.keyboard.type("riley@example.test");
    await page.keyboard.press("Tab");
    const next = page.getByRole("button", { name: "Continue to security" });
    await expect(next).toBeFocused();
    if (activation === "pointer") await next.click(); else await page.keyboard.press("Enter");
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Edit details" })).toBeFocused();
    await expect(page.locator('.auth-password-help')).toHaveCount(0);
    await expect(page.getByText("Use at least 12 characters, with a letter and a number.", { exact: true })).toBeVisible();
    const pane = await page.locator('.auth-content .route-pane[data-active="true"]').boundingBox();
    const demo = await page.getByRole("button", { name: "Demo access", exact: true }).boundingBox();
    if (demo.y + demo.height > pane.y + pane.height + 1) await page.screenshot({ path: new URL(`clipped-${device}-${mode}.png`, directory).pathname });
    assert.ok(demo.y + demo.height <= pane.y + pane.height + 1, `${device}/${mode}: validation clips Demo access below the pane: ${JSON.stringify({ pane, demo })}`);
    await page.keyboard.press("Enter");
    await expect(name).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(password).toBeFocused();
    await page.keyboard.type("RileyHarbor2026!");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Show password", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Confirm password", { exact: true })).toBeFocused();
    await page.keyboard.type("RileyHarbor2026!");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Show confirm password", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("checkbox")).toBeFocused();
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.getByRole("heading", { name: "Verify your email" }).waitFor();
    await expectDemoPassword(page, device, "RileyHarbor2026!");
    await page.close();
    console.log(`PASS ${device}/${mode}/${activation}: pager focus, edit restoration, keyboard-only security order and current registered credentials`);
  }
  // Apply the kit's 40rem geometry ceiling to the auth consumer, including its context links.
  for (const [device, width, height] of [["TL", 1024, 768], ["DS", 1366, 768], ["DW", 1920, 1080]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(`${base}/login?xp=${device}&xp-frame=1`);
    await page.locator(".auth-context-content nav").waitFor();
    const oversized = await page.locator('.auth-shell button, .auth-shell input, .auth-shell a, .kit-toast').evaluateAll(nodes => nodes
      .filter(node => node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !node.closest('[inert], [aria-hidden="true"]'))
      .map(node => ({ label: node.getAttribute("aria-label") || node.textContent, width: node.getBoundingClientRect().width }))
      .filter(node => node.width > 640));
    assert.deepEqual(oversized, [], `${device}: auth controls exceed the kit geometry ceiling`);
    await page.close();
  }
  console.log("PASS TL/DS/DW: auth controls and context links stay within 640px");
  for (const device of ["TP", "TL", "DS", "DW"]) {
    const [width, height] = sizes[device];
    const page = await browser.newPage({ viewport: { width, height } });
    let anchor;
    for (const state of ["default", "loading", "error"]) {
      await prepare(page, base, screens.find(item => item.id === "login"), device, "light", state);
      const current = await page.locator(".auth-heading h1, .auth-form input").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().y));
      anchor ??= current;
      assert.ok(current.every((value, index) => Math.abs(value - anchor[index]) <= 1), `${device}/${state}: heading or fields moved with feedback`);
    }
    await page.close();
  }
  console.log("PASS: larger login forms keep heading and fields anchored across feedback states");
  const mobileLogin = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  let submitY;
  for (const state of ["default", "loading"]) {
    await prepare(mobileLogin, base, screens.find(item => item.id === "login"), "M", "light", state);
    const button = await mobileLogin.locator('.auth-actions button[type="submit"]').boundingBox();
    submitY ??= button.y;
    assert.ok(Math.abs(button.y - submitY) <= 1, `M/${state}: primary action moved when cancellation appeared`);
  }
  await mobileLogin.close();
  console.log("PASS: mobile login primary action keeps its slot during loading");
  // Tall error/busy states must expose the entire final action in the initial viewport.
  for (const [screen, device, state] of [["login", "DS", "error"], ["login", "DS", "loading"], ["register", "DW", "error"], ["reset-password", "DS", "error"]]) {
    const [width, height] = sizes[device];
    const page = await browser.newPage({ viewport: { width, height } });
    await prepare(page, base, screens.find(item => item.id === screen), device, "light", state);
    const pane = await page.locator('.auth-content .route-pane[data-active="true"]').boundingBox();
    const button = await page.getByRole("button", { name: "Demo access", exact: true }).boundingBox();
    assert.ok(button.y >= pane.y && button.y + button.height <= pane.y + pane.height + 1, `${screen}/${device}/${state}: Demo access clipped at the form boundary`);
    await page.close();
  }
  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 }, hasTouch: true });
  await prepare(tablet, base, screens.find(item => item.id === "login"), "TP", "light", "panel-open");
  const closeContext = tablet.getByRole("button", { name: `Close ${brand.name.toLowerCase()} workspace`, exact: true });
  await closeContext.click();
  await tablet.locator('.workspace-sheet[open]').waitFor({ state: "detached" });
  assert.equal(await tablet.getByRole("button", { name: "Workspace details", exact: true }).evaluate(node => node === document.activeElement), true);
  await tablet.close();
  console.log("PASS: desktop error/busy actions fit; TP context sheet closes and restores focus");
  for (const screen of screens.filter(item => item.module === "auth")) for (const device of ["TP", "TL", "DS", "DW"]) {
    const [width, height] = sizes[device];
    const page = await browser.newPage({ viewport: { width, height } });
    await prepare(page, base, screen, device, "light", "default");
    await page.getByRole("button", { name: "Demo access", exact: true }).click();
    await waitForOverlayRest(page, ".kit-floating");
    const box = await page.locator(".kit-floating").boundingBox();
    assert.ok(box.y >= 15 && box.y + box.height <= height - 15, `${screen.id}/${device}: Demo access popover clips viewport edges`);
    const closeBox = await page.locator(".kit-floating-dismiss").boundingBox();
    assert.ok(closeBox.y >= box.y && closeBox.y + closeBox.height <= box.y + box.height - 1, `${screen.id}/${device}: complete Close button must be visible before scrolling`);
    assert.ok(await page.locator(".kit-floating .auth-demo-body").evaluate(node => node.scrollHeight <= node.clientHeight + 1), `${screen.id}/${device}: demo instructions must fit without scrolling`);
    await page.locator(".kit-floating").getByRole("button", { name: "Close", exact: true }).click();
    await page.locator(".kit-floating").waitFor({ state: "detached" });
    await page.close();
  }
  console.log("PASS: all six auth demo popovers fit TP/TL/DS/DW and remain dismissible");
  for (const screen of screens.filter(item => item.module === "auth" && item.states.includes("saved"))) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await prepare(page, base, screen, "M", "light", "saved");
    const action = await page.locator(".auth-success > a").boundingBox();
    assert.ok(action.y >= 422 && action.y + action.height <= 844, `${screen.id}: mobile success action left the lower action region`);
    assert.ok(action.width >= 342, `${screen.id}: mobile success action does not fill its action region`);
    await page.close();
  }
  console.log("PASS: mobile success actions retain the lower action region");
  const reset = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await prepare(reset, base, screens.find(item => item.id === "reset-password"), "M", "light", "selected");
  assert.equal(await reset.locator(".auth-heading h1").textContent(), "Request a fresh reset link");
  assert.equal(await reset.locator(".auth-heading p").count(), 0);
  await prepare(reset, base, screens.find(item => item.id === "reset-password"), "M", "light", "saved");
  assert.equal(await reset.getByRole("link", { name: "Return to sign in", exact: true }).count(), 1);
  assert.equal(await reset.getByRole("link", { name: "Back to sign in", exact: true }).count(), 0);
  await reset.close();
  for (const [device, width, height] of [["M", 390, 844], ["DW", 1920, 1080]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: device === "M" });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${base}/login?xp=${device}&xp-frame=1`);
    if (device === "M") {
      const action = await page.getByRole("button", { name: "Sign in", exact: true }).boundingBox();
      assert.ok(action.width >= 342 && action.y >= 422, "mobile sign-in action must fill its lower action region");
    }
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByText("Enter your password.", { exact: true }).waitFor();
    await page.locator(".route-pane:not([inert])").getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByText("Enter your password.", { exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "doesn't match" }).waitFor();
    assert.equal(await page.locator(".route-pane:not([inert])").getByLabel("Password", { exact: true }).inputValue(), "wrong-password");
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    assert.equal(await page.locator(".route-pane:not([inert])").getByLabel("Password", { exact: true }).getAttribute("type"), "text");
    await page.getByRole("button", { name: "Hide password", exact: true }).click();
    await page.locator(".route-pane:not([inert])").getByLabel("Password", { exact: true }).fill(authDemo.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("heading", { name: "Confirm it's you", exact: true }).waitFor();
    await page.locator(".route-pane:not([inert])").getByLabel("Verification code", { exact: true }).fill("000000");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.getByRole("alert").filter({ hasText: "doesn't match" }).waitFor();
    await page.getByRole("button", { name: "Use a recovery code" }).click();
    assert.equal(await page.locator(".auth-heading p").textContent(), "Use a recovery code");
    await page.locator(".route-pane:not([inert])").getByLabel("Recovery code", { exact: true }).fill(authDemo.recoveryCode);
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.getByRole("heading", { name: "You're signed in" }).waitFor();
    assert.equal(await page.locator(".auth-heading h1").textContent(), "You're signed in");
    assert.equal(await page.locator(".auth-heading p").count(), 0);
    assert.equal(await page.getByRole("link", { name: "Open workspace", exact: true }).count(), 1, "the success destination has a unique accessible name");
    await page.getByRole("link", { name: "Open workspace", exact: true }).click();
    await page.getByRole("heading", { name: screens.find(screen => screen.path === authNavigation.defaultPath).name, exact: true }).waitFor();
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("link", { name: "Account access", exact: true }).filter({ visible: true }).first().click();
    await page.getByRole("link", { name: "Forgot password?", exact: true }).click();
    await page.getByRole("button", { name: "Send reset link", exact: true }).click();
    await page.getByRole("link", { name: "Open demo reset link" }).click();
    await page.locator(".route-pane:not([inert])").getByLabel("New password", { exact: true }).fill("NewEastPier2026!");
    await page.locator(".route-pane:not([inert])").getByLabel("Confirm password", { exact: true }).fill("NewEastPier2026!");
    await page.getByRole("button", { name: "Update password", exact: true }).click();
    await page.getByRole("heading", { name: "Password updated", exact: true }).waitFor();
    await page.getByRole("link", { name: "Return to sign in", exact: true }).click();
    await expectDemoPassword(page, device, "NewEastPier2026!");
    await page.locator(".route-pane:not([inert])").getByLabel("Password", { exact: true }).fill("NewEastPier2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Use a recovery code" }).click();
    await page.locator(".route-pane:not([inert])").getByLabel("Recovery code", { exact: true }).fill(authDemo.recoveryCode);
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.getByRole("alert").filter({ hasText: "already used" }).waitFor();
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await page.getByRole("link", { name: `New to ${brand.name}? Create an account` }).click();
    await page.locator('.route-pane[inert]').waitFor({ state: "detached" });
    await page.locator(".route-pane:not([inert])").getByLabel("Full name", { exact: true }).fill("Riley Morgan");
    await page.locator(".route-pane:not([inert])").getByLabel("Email address", { exact: true }).fill("riley@example.test");
    if (device === "M") await page.getByRole("button", { name: "Continue to security" }).click();
    await page.locator(".route-pane:not([inert])").getByLabel("Password", { exact: true }).fill("RileyHarbor2026!");
    await page.locator(".route-pane:not([inert])").getByLabel("Confirm password", { exact: true }).fill("RileyHarbor2026!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByRole("heading", { name: "Verify your email" }).waitFor();
    assert.ok(await page.locator(".auth-account").getByText("riley@example.test", { exact: true }).isVisible());
    await page.getByRole("button", { name: "Resend code" }).click();
    assert.ok(await page.getByRole("button", { name: /Resend in/ }).isDisabled());
    await page.locator(".route-pane:not([inert])").getByLabel("Verification code", { exact: true }).fill(authDemo.code);
    await page.getByRole("button", { name: "Verify email", exact: true }).click();
    await page.getByRole("heading", { name: "Email verified" }).waitFor();
    assert.equal(await page.locator(".auth-heading h1").textContent(), "Email verified");
    assert.equal(await page.locator(".auth-heading p").count(), 0);
    await page.screenshot({ path: new URL(`registration-${device}.png`, directory).pathname });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${device}: validation, password toggle, login, 2FA, one-use recovery, reset, registration, verify and resend cooldown`);
  }
} finally { await browser.close(); }
