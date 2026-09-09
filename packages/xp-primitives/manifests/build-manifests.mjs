#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const schema = "https://xpresso.studio/schemas/block-1.1.json";
const classes = ["M", "TP", "TL", "DS", "DW"];
const check = process.argv.includes("--check");

const definitions = [
  {
    name: "morph-slot", exportName: "MorphSlot", job: "overlay", engine: "swap",
    forms: ["takeover", "sheet", "dialog", "pane", "inspector"],
    why: "One headless core mounts exactly one renderer while preserving the consumer contract.",
    a11y: "Renderer roles vary by presentation; consumer content and accessible names must remain invariant.",
  },
  {
    name: "adaptive-overlay", exportName: "AdaptiveOverlay", job: "overlay", engine: "swap",
    forms: ["sheet", "sheet", "popover", "popover", "popover"],
    why: "Overlay geometry follows intent and device posture instead of shrinking one desktop modal.",
    a11y: "Dialog, sheet and popover roles differ intentionally while their named content stays equivalent.",
  },
  {
    name: "snap-rail", exportName: "SnapRail", job: "browse", engine: "css",
    forms: ["rail", "rail", "rail", "grid-4", "grid-5"],
    why: "Touch classes retain horizontal native inertia while wide classes can expose the collection at once.",
  },
  {
    name: "sticky-action-bar", exportName: "StickyActionBar", job: "act", engine: "css",
    forms: ["strip", "strip", "band", "band", "band"],
    why: "Primary actions stay thumb-reachable on touch classes and return inline when width makes pinning wasteful.",
  },
  {
    name: "segmented-control", exportName: "SegmentedControl", job: "compare", engine: "css",
    forms: ["strip", "strip", "strip", "cluster", "cluster"],
    why: "Exclusive choices fill the touch lane on compact devices and contract to an inline control on desktops.",
  },
  {
    name: "metric-tile", exportName: "MetricTile", job: "glance", engine: "css", fluid: true,
    slotForms: { S1: "metric-chip", S2: "metric-compact", S3: "metric-full" },
    why: "The metric atom responds to its own slot so dashboards and proof bands share one truthful contract.",
  },
  {
    name: "chip-bar", exportName: "ChipBar", job: "browse", engine: "css",
    forms: ["rail", "rail", "cluster", "cluster", "cluster"],
    why: "Compact devices scroll filters horizontally while wider surfaces expose a wrapping control cluster.",
  },
  {
    name: "field-group", exportName: "FieldGroup", job: "act", engine: "css",
    forms: ["stack", "stack", "grid-2", "grid-2", "grid-2"],
    why: "Fields preserve one semantic anatomy while choice density adapts to the available component slot.",
  },
  {
    name: "disclosure-group", exportName: "DisclosureGroup", job: "read", engine: "css",
    forms: ["stack", "stack", "grid-2", "grid-2", "grid-2"],
    why: "Touch classes compress long walls into disclosures while wider classes expose parallel reading lanes.",
  },
  {
    name: "pager", exportName: "Pager", job: "browse", engine: "css",
    forms: ["pager", "pager", "pager", "pager", "pager"],
    why: "A uniform full-screen sequence is intentionally width-agnostic and preserves native scroll snapping.",
  },
  {
    name: "menu-popout", exportName: "MenuPopout", job: "overlay", engine: "swap",
    forms: ["sheet", "popover", "popover", "popover", "popover"],
    why: "One item model becomes a reachable sheet on mobile and a compact anchored surface elsewhere.",
    a11y: "Menu items remain invariant while the containing overlay role follows input and screen context.",
  },
  {
    name: "popout", exportName: "Popout", job: "overlay", engine: "swap",
    forms: ["takeover", "drawer-side", "drawer-side", "drawer-side", "drawer-side"],
    why: "Arbitrary feed content becomes a full-height touch sheet or end-edge surface without acquiring menu semantics.",
    a11y: "Feed and form content keep document semantics while only their containing overlay role changes by class.",
  },
  {
    name: "modal-intents", exportName: "ModalSurface", job: "overlay", engine: "swap",
    forms: ["sheet", "sheet", "dialog", "dialog", "dialog"],
    why: "Confirm, pick, edit and search share one contract but receive task-appropriate containment per class.",
    a11y: "Presentation roles vary by intent and class; title, description, body and actions stay equivalent.",
  },
  {
    name: "data-collection", exportName: "DataCollection", job: "browse", engine: "swap",
    forms: ["stack", "grid-2", "disclosure", "grid-4", "grid-5"],
    why: "Rows become app-native cards on compact devices without amputating the full record contract.",
    a11y: "Table and card roles change by task context while every field remains reachable in row details.",
  },
  {
    name: "priority-overflow-bar", exportName: "PriorityOverflowBar", job: "navigate", engine: "swap",
    forms: ["sheet", "popover", "popover", "popover", "popover"],
    why: "Measured capacity keeps high-priority actions visible and routes only the tail to an input-native overlay.",
    a11y: "Visible and overflow actions share names and order while their containing surface changes presentation.",
  },
  {
    name: "marquee", exportName: "Marquee", job: "glance", engine: "css",
    forms: ["marquee", "marquee", "marquee", "marquee", "marquee"],
    why: "The sanctioned proof drift stays width-agnostic and becomes a static wrapping set under reduced motion.",
  },
];

function manifest(definition) {
  const common = {
    $schema: schema,
    name: definition.name,
    version: "0.1.0",
    formsVocab: "1.1",
    job: definition.job,
    contract: {
      kind: "primitive",
      exportName: definition.exportName,
      ...(definition.slotForms ? { slotForms: definition.slotForms } : {}),
    },
    fluid: definition.fluid ?? false,
    engine: definition.engine,
    interaction: { sweepDemo: `/gates/primitives?primitive=${definition.name}` },
    tokens: ["--tap-min", "--gap-min", "--space-s", "--role-body"],
    budgets: { horizontalOverflow: "declared-scrollers-only", touchTargetCoarse: 44 },
    baseline: { javascriptOff: definition.engine === "css", reducedMotion: true },
    a11y: definition.a11y
      ? { treeInvariant: false, roleExemption: definition.a11y }
      : { treeInvariant: true },
  };
  if (definition.fluid) {
    return { ...common, slotRange: { min: "S1", max: "S6" } };
  }
  return {
    ...common,
    forms: Object.fromEntries(classes.map((className, index) => [className, { form: definition.forms[index] }])),
    whyPolymorphic: definition.why,
  };
}

let failed = false;
for (const definition of definitions) {
  const target = join(root, definition.name, "xpresso.block.json");
  const output = `${JSON.stringify(manifest(definition), null, 2)}\n`;
  if (check) {
    try {
      if (readFileSync(target, "utf8") !== output) {
        console.error(`${definition.name}: generated manifest is stale`);
        failed = true;
      }
    } catch {
      console.error(`${definition.name}: generated manifest is missing`);
      failed = true;
    }
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, output);
  }
}

if (failed) process.exit(1);
console.log(`KIT-T1 manifests ${check ? "CHECK" : "BUILD"}: ${definitions.length}/16`);

export { definitions };
