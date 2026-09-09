import assert from "node:assert/strict";
import { test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "../src/App.tsx";
import { DeviceClassProvider, deviceClasses } from "@xp/runtime";
import { screens } from "../src/qa/screens.ts";

// Every registered screen is smoke-tested in every class: the registry is the list, so a route that
// lands without one, or renders blank in one form, fails here rather than in a capture run.
// Auth owns a separate shell and has its own five-class render suite in auth.test.mjs.
const routes = screens.filter(screen => screen.module !== "auth").map(screen => [screen.path, screen.name, screen.module, screen.states]);

for (const deviceClass of deviceClasses) for (const [route, heading, module, states] of routes) test(route + " renders in " + deviceClass, () => {
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [route] }, createElement(DeviceClassProvider, { deviceClass }, createElement(AppRoutes))),
  );
  assert.match(html, /data-xp-shell=""/);
  assert.ok(html.includes(heading));
  assert.ok(html.includes('data-device-class="' + deviceClass + '"'));
  // /configure is deliberately reachable without a primary navigation entry (`secondaryTitles` in
  // the shell), so it is the one screen with no current destination to mark.
  if (route !== "/configure") assert.match(html, /aria-current="page"/);
  assert.equal(html.includes('class="workspace-tabs"'), deviceClass === "M");
  // Vision §3 gives TP one top bar on every route: the title is the trigger of the module sheet, and
  // no row of module links appears under it. A module with sections still adds exactly one section
  // row in the form it declares: a top strip, the inbox's chip rail, or the kit's own strip (#101).
  assert.equal(html.includes('aria-label="Choose module"'), deviceClass === "TP");
  assert.equal(html.includes('<div class="workspace-topnav"><nav'), false);
  if (deviceClass === "TP") {
    const rows = ['data-sections=""', 'class="module-strip"', 'class="kit-section-strip"'].filter(marker => html.includes(marker));
    assert.ok(rows.length <= 1, `${route}: TP draws ${rows.length} section rows`);
  }
  if (deviceClass === "TP" && route === "/inbox") assert.ok(html.includes('class="module-strip"'));
  assert.equal(html.includes('class="workspace-rail"'), deviceClass === "TL" || deviceClass === "DW");
  assert.equal(html.includes('class="workspace-sidebar"'), deviceClass === "DS" || deviceClass === "DW");
  // DW always docks a route's pane. DS docks it only when the route asks for it open, which the two
  // configurators and the three calendar screens do: the panel or the day summary is the point of
  // the screen rather than support for it.
  const opensItsPane = ["/configure", "/venue/configure", "/calendar", "/calendar/event/event-1", "/settings/calendar"].includes(route);
  // A screen with no inspector docks none: the recovery pages are the whole screen (#61).
  const hasPane = states.includes("panel-open");
  assert.equal(html.includes('class="route-inspector xp-slot"'), hasPane && (deviceClass === "DW" || (deviceClass === "DS" && opensItsPane)));
});
