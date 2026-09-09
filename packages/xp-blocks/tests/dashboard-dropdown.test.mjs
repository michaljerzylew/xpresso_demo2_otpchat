import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DASHBOARD_DROPDOWN_MENU_PRESETS,
  DASHBOARD_DROPDOWN_POPOUT_PRESETS,
  resolveDashboardDropdownFixture,
} from "../src/dashboard-dropdown-model.ts";

test("dashboard dropdown owns exactly 15 Menu and 8 true Popout presets", () => {
  assert.equal(DASHBOARD_DROPDOWN_MENU_PRESETS.length, 15);
  assert.equal(DASHBOARD_DROPDOWN_POPOUT_PRESETS.length, 8);
  assert.equal(new Set([...DASHBOARD_DROPDOWN_MENU_PRESETS, ...DASHBOARD_DROPDOWN_POPOUT_PRESETS]).size, 23);
});

test("resolver preserves wallet Menu and rejects invented people search", () => {
  const wallet = {
    sourceKey: "dashboard-dropdown-03",
    surface: "menu",
    preset: "wallet-actions",
    profile: "M1",
    selection: "none",
    trigger: { label: "Balance options" },
    closeLabel: "Close balance options",
    groups: [{ id: "wallet", items: ["one", "two", "three"].map((id) => ({ id, label: id, kind: "action" })) }],
    announcements: {},
    states: {},
  };
  assert.equal(resolveDashboardDropdownFixture(wallet).surface, "menu");
  const people = {
    ...wallet,
    sourceKey: "dashboard-dropdown-14",
    preset: "people-multiselect",
    profile: "M3",
    selection: "multiple",
    groups: [],
    people: Array.from({ length: 5 }, (_, index) => ({ id: `person-${index}`, displayName: `Person ${index}`, avatarKey: `avatar-${index}` })),
    selectedIds: ["person-0"],
    query: { label: "Search", placeholder: "Search", emptyLabel: "No results" },
  };
  assert.throws(() => resolveDashboardDropdownFixture(people), /must not invent search/);
});

test("one renderer keeps Popout content out of flat MenuPopout", () => {
  const source = readFileSync(new URL("../src/dashboard-dropdown.tsx", import.meta.url), "utf8");
  for (const token of ["DashboardMenu", "DashboardPopout", "PopoutBody", "NotificationCentre", "ProductRows", "ReorderControls", "AdaptiveOverlay"]) assert.match(source, new RegExp(token));
  assert.doesNotMatch(source, /MenuPopout/);
  assert.doesNotMatch(source, /model\.sourceKey\s*===\s*["']dashboard-dropdown-/);
});
