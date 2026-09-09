import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { screens } from "../src/qa/screens.ts";

function routeFiles(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    return entry.isDirectory() ? routeFiles(resolve(directory, entry.name), relative + "/")
      : /\.(tsx|jsx)$/.test(entry.name) ? [relative] : [];
  });
}
export function missingRoutes(files, registry) {
  return files.filter(file => !registry.some(screen => screen.routeFile === file));
}
test("every route file has a unique QA entry and capture states", () => {
  const files = routeFiles(fileURLToPath(new URL("../src/routes", import.meta.url)));
  expect(missingRoutes(files, screens)).toEqual([]);
  expect(screens.map(screen => screen.routeFile).sort()).toEqual(files.sort());
  for (const key of ["id", "path", "routeFile"]) expect(new Set(screens.map(screen => screen[key])).size).toBe(screens.length);
  for (const screen of screens) {
    expect(screen.states).toContain("default");
    expect(screen.module).toBeTruthy();
    expect(screen.name).toBeTruthy();
  }
});
test("a newly added unregistered route fails coverage", () => {
  expect(missingRoutes(["nested/NewRoute.tsx"], screens)).toEqual(["nested/NewRoute.tsx"]);
});

const routesDirectory = fileURLToPath(new URL("../src/routes", import.meta.url));
/** A route file may be a one-line re-export of the module that actually renders the screen. */
function routeSource(file) {
  const path = resolve(routesDirectory, file);
  const seen = new Set();
  function source(path) {
    if (seen.has(path)) return "";
    seen.add(path);
    const text = readFileSync(path, "utf8");
    // Follow local JSX components as well as route re-exports: modules may put RoutePanes
    // in a shared Frame. Stop at the shell boundary, whose implementation is not a route.
    const children = [...text.matchAll(/(?:import|export) \{([^}]+)\} from "(\.[^"]+)"/g)].flatMap(([statement, names, target]) => {
      if (!statement.startsWith("export") && !names.split(",").some(name => text.includes("<" + name.trim().split(/\s+as\s+/).at(-1)))) return [];
      const child = resolve(dirname(path), target + ".tsx");
      return child.includes("/shell/") || !existsSync(child) ? [] : [source(child)];
    });
    return [text, ...children].join("\n");
  }
  return source(path);
}
// A module frame that always mounts a pane counts too: InboxScreen, OffersPage and VenuePage
// each take their inspector as a required prop, so the word RoutePanes need not appear.
export const hasInspectorPane = source => (/<(?:RoutePanes|InboxScreen|OffersPage)\b/.test(source) && /\binspector=/.test(source)) || /<VenuePage\b/.test(source);
// The #53 round-2 review found the kit rendering an inspector pane with no capture state for it, so
// four of its five per-class forms -- M sheet, TP sheet, TL drawer, DS toggled pane -- were never
// captured and never perceived. The rule is general, and this is the gate for it.
test("every route with an inspector pane registers that pane as a capture state", () => {
  const paned = screens.filter(screen => hasInspectorPane(routeSource(screen.routeFile)));
  expect(paned.map(screen => screen.id).sort()).toEqual(screens.filter(screen => screen.states.includes("panel-open") && screen.module !== "auth").map(screen => screen.id).sort());
  for (const screen of paned) {
    expect(screen.states.filter(state => state.endsWith("panel-open")),
      `${screen.id} renders an inspector pane but registers no pane capture state`).not.toEqual([]);
  }
});
test("the pane detector reads the prop, not the import", () => {
  expect(hasInspectorPane('import { RoutePanes } from "../shell/AppShell";')).toBe(false);
  expect(hasInspectorPane("<RoutePanes list={x}>")).toBe(false);
  expect(hasInspectorPane("<RoutePanes inspector={<p />}>")).toBe(true);
  expect(hasInspectorPane('import { InboxScreen } from "./components";')).toBe(false);
  expect(hasInspectorPane('<InboxScreen screen="contact" inspector={<p />} />')).toBe(true);
  expect(hasInspectorPane('<RoutePanes list={<><p /></>} inspector={inspector}>')).toBe(true);
  expect(hasInspectorPane("<OffersPage inspector={summary}>")).toBe(true);
  expect(hasInspectorPane("<OffersPage title={title}>")).toBe(false);
  expect(hasInspectorPane('<VenuePage screen="menu" inspector={inspector}>')).toBe(true);
});
