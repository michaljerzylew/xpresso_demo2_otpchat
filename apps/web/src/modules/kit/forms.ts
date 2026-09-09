import type { DeviceClass } from "@xp/runtime";
export type KitForm = { gallery: "summary-disclosure" | "workspace"; collection: "deck" | "table"; navigation: "select" | "tabs" | "sidebar" | "strip"; inspector: "sheet" | "drawer-side" | "toggle-pane" | "persistent-pane"; overlay: "sheet" | "popover" };
export const forms = {
  M: { gallery: "summary-disclosure", collection: "deck", navigation: "select", inspector: "sheet", overlay: "sheet" },
  TP: { gallery: "summary-disclosure", collection: "deck", navigation: "strip", inspector: "sheet", overlay: "popover" },
  TL: { gallery: "workspace", collection: "table", navigation: "tabs", inspector: "drawer-side", overlay: "popover" },
  DS: { gallery: "workspace", collection: "table", navigation: "tabs", inspector: "toggle-pane", overlay: "popover" },
  DW: { gallery: "workspace", collection: "table", navigation: "sidebar", inspector: "persistent-pane", overlay: "popover" },
} as const satisfies Record<DeviceClass, KitForm>;
export const resolveKitForm = (deviceClass: DeviceClass): KitForm => forms[deviceClass];
export const specimens = ["collections", "controls", "fields", "surfaces", "feedback"] as const;
export type Specimen = typeof specimens[number];
export function resolveSpecimen(value: string | null): Specimen { return specimens.find(s => s === value) ?? "collections"; }
