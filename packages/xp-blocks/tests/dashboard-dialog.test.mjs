import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DASHBOARD_DIALOG_PRESETS,
  resolveDashboardDialogFixture,
} from "../src/dashboard-dialog-model.ts";

test("dashboard dialog owns 25 modal presets plus one typed activity Popout", () => {
  assert.equal(DASHBOARD_DIALOG_PRESETS.length, 25);
  const fixture = {
    sourceKey: "dashboard-dialog-20",
    preset: "activity-feed",
    profile: "P7",
    surface: "popout",
    triggerLabel: "Activity",
    closeLabel: "Close",
    title: "Activity",
    actions: [],
    announcements: {},
    media: Array.from({ length: 6 }, (_, index) => ({ key: `avatar-${index}`, role: "portrait" })),
    extension: {
      kind: "activity",
      activities: Array.from({ length: 6 }, (_, index) => ({ id: `a${index}`, time: `${index}`, actor: "A", body: "B", avatarKey: `avatar-${index}`, kind: index === 4 ? "tags" : "plain", ...(index === 4 ? { tags: ["one", "two", "three"] } : {}) })),
    },
  };
  const assets = Array.from({ length: 6 }, (_, index) => ({ key: `avatar-${index}`, src: `/avatar-${index}.jpg`, alt: "" }));
  assert.equal(resolveDashboardDialogFixture(fixture, assets).extension.activities.length, 6);
});

test("dashboard dialog resolver rejects count drift and remote media", () => {
  const base = {
    sourceKey: "dashboard-dialog-01",
    preset: "plan-compare",
    profile: "P2",
    intent: "pick",
    triggerLabel: "Open",
    closeLabel: "Close",
    title: "Plans",
    choices: [{ id: "one", label: "One" }],
    actions: [],
    announcements: {},
  };
  assert.throws(() => resolveDashboardDialogFixture(base), /requires 2 choices/);
  const mediaFixture = {
    ...base,
    sourceKey: "dashboard-dialog-04",
    preset: "workspace-connection",
    profile: "P3",
    intent: "edit",
    fields: [{ id: "url", label: "URL", type: "url" }],
    choices: undefined,
    media: [{ key: "hero", role: "illustration" }],
    announcements: { discardTitle: "Discard", discardDescription: "Discard changes", keepEditing: "Keep", discard: "Discard" },
  };
  assert.throws(() => resolveDashboardDialogFixture(mediaFixture, [{ key: "hero", src: "https://remote.invalid/a.jpg", alt: "A" }]), /cannot resolve local media/);
});

test("one renderer composes shared fields, choices, people, search and feed primitives", () => {
  const source = readFileSync(new URL("../src/dashboard-dialog.tsx", import.meta.url), "utf8");
  for (const token of ["FieldControl", "ChoiceSet", "PeopleList", "ExtensionContent", "ActivityFeed", "ModalSurface", "Popout"]) assert.match(source, new RegExp(token));
  assert.doesNotMatch(source, /model\.sourceKey\s*===\s*["']dashboard-dialog-/);
});
