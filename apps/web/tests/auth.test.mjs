import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { DeviceClassProvider, deviceClasses } from "@xp/runtime";
import { expect, test } from "vitest";
import { AppRoutes } from "../src/App.tsx";
import { AuthSessionProvider } from "../src/modules/auth/session.tsx";
import { authScreens, forms } from "../src/modules/auth/forms.ts";
import { authDemo } from "../src/data/auth.ts";
import { brand, authNavigation } from "../src/app-modules";
import { blankValues, validate, passwordChecks, checkCode, normalizeEmail, safeDestination, authHref } from "../src/modules/auth/logic.ts";
import { screens } from "../src/qa/screens.ts";

test.each(["/login/", "/LOGIN", "/LOGIN/"])("%s resolves safely to login", path => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(DeviceClassProvider, { deviceClass: "M" }, createElement(AuthSessionProvider, null, createElement(AppRoutes)))));
  expect(html).toContain('data-auth-screen="login"');
  expect(html).toContain(`data-auth-layout="${forms.login.M.layout}"`);
  expect(html).toContain(`Sign in to ${brand.name}`);
});

for (const screen of authScreens) for (const deviceClass of deviceClasses) test(`${screen} renders its ${deviceClass} form`, () => {
  const route = screens.find(item => item.id === screen);
  const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [route.path + "?token=" + authDemo.resetToken] }, createElement(DeviceClassProvider, { deviceClass }, createElement(AuthSessionProvider, null, createElement(AppRoutes)))));
  expect(html).toContain(`data-auth-screen="${screen}"`);
  expect(html).toContain(`data-auth-layout="${forms[screen][deviceClass].layout}"`);
  expect(html).toContain("<h1>");
  expect(html.includes('class="auth-brand"')).toBe(!["M", "TP"].includes(deviceClass));
  expect(route.states).toEqual(expect.arrayContaining(["default", "empty", "loading", "error"]));
  // AuthShell owns the workspace pane: sheet on M/TP, docked otherwise.
  expect(route.states).toContain("panel-open");
});
test("validation rejects incomplete email, password mismatch, consent and malformed OTP", () => {
  const values = blankValues();
  expect(Object.keys(validate("register", values))).toEqual(["email", "name", "password", "confirm", "accepted"]);
  Object.assign(values, { name: "Riley Morgan", email: " riley@example.test ", password: "LongWorkspacePass2", confirm: "LongWorkspacePass2", accepted: true }); // scan-secrets: allow (documented fake registration fixture)
  expect(validate("register", values)).toEqual({});
  expect(validate("reset-password", { ...values, confirm: "different" })).toHaveProperty("confirm");
  for (const code of ["12345", "1234567", "abcdef", "12 456"]) expect(validate("two-factor", { ...values, code })).toHaveProperty("code");
  expect(validate("two-factor", { ...values, code: "246810" })).toEqual({});
  expect(validate("two-factor", { ...values, code: authDemo.recoveryCode.toLowerCase() }, true)).toEqual({});
  expect(passwordChecks("a1")).toEqual([false, true, true]);
});
test("recovery validation treats product punctuation literally without assuming a separator", () => {
  const original = authDemo.recoveryCode;
  try {
    for (const code of ["ACCESS.(CODE[2041", "ACME.CODE-2041", "ACCESS+?^$|{CODE}\\2041"]) {
      authDemo.recoveryCode = code;
      expect(validate("two-factor", { ...blankValues(), code: code.toLowerCase() }, true)).toEqual({});
      expect(validate("two-factor", { ...blankValues(), code: code.replace(/[.([+]/, "X") }, true)).toEqual({ code: "Enter the complete recovery code exactly as provided." });
      expect(validate("two-factor", { ...blankValues(), code: "2041" }, true)).toHaveProperty("code");
    }
  } finally { authDemo.recoveryCode = original; }
});
test("both shells render the configured brand mark, auth icon and footnote", () => {
  const original = { mark: brand.mark, icon: brand.auth.icon, footNote: brand.auth.footNote };
  try {
    brand.mark = "QZ";
    brand.auth.icon = props => createElement("svg", { ...props, "data-test-brand-icon": "custom" });
    brand.auth.footNote = "Fixture-only account access";
    const render = path => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(DeviceClassProvider, { deviceClass: "DW" }, createElement(AuthSessionProvider, null, createElement(AppRoutes)))));
    const workspace = render("/configure");
    expect(workspace).toMatch(/class="workspace-mark[^\"]*"[^>]*>QZ<\/a>/);
    expect(workspace).toContain('class="workspace-brand-mark" aria-hidden="true">QZ</span>');
    const auth = render("/login");
    expect(auth).toContain('data-test-brand-icon="custom"');
    expect(auth).toContain("Fixture-only account access");
  } finally { brand.mark = original.mark; brand.auth.icon = original.icon; brand.auth.footNote = original.footNote; }
});
test("local codes and navigation links are deterministic", () => {
  expect(checkCode(authDemo.code)).toBe(true);
  expect(checkCode("000000")).toBe(false);
  expect(checkCode(authDemo.recoveryCode, true)).toBe(true);
  expect(normalizeEmail(" MARA@EXAMPLE.TEST ")).toBe("mara@example.test");
  for (const link of brand.auth.links) expect(link.path.startsWith("/")).toBe(true);
  expect(authDemo.team.memberIds).toContain(authDemo.person.id);
});
test("navigation preserves simulation, removes fixtures and denies untrusted destinations", () => {
  for (const value of ["https://example.com", "//example.com", "/missing", "javascript:alert(1)", null]) expect(safeDestination(value)).toBe(authNavigation.defaultPath);
  for (const path of authNavigation.paths) expect(safeDestination(path)).toBe(path);
  expect(authHref("/login", "?xp=M&xp-frame=1&auth-state=error&token=old&next=%2Fsettings")).toBe("/login?xp=M&xp-frame=1&next=%2Fsettings");
});
