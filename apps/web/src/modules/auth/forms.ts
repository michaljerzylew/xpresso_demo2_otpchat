import type { DeviceClass } from "@xp/runtime";

export const authScreens = ["login", "register", "forgot-password", "reset-password", "two-factor", "verify-email"] as const;
export type AuthScreen = typeof authScreens[number];
export type AuthForm = { layout: "full-screen" | "summary-sheet" | "compact-split" | "brand-split" | "wide-split"; actions: "sticky" | "inline"; context: "sheet" | "pane" };
const anatomy = {
  M: { layout: "full-screen", actions: "sticky", context: "sheet" },
  TP: { layout: "summary-sheet", actions: "inline", context: "sheet" },
  TL: { layout: "compact-split", actions: "inline", context: "pane" },
  DS: { layout: "brand-split", actions: "inline", context: "pane" },
  DW: { layout: "wide-split", actions: "inline", context: "pane" },
} as const satisfies Record<DeviceClass, AuthForm>;
export const forms = {
  login: anatomy, register: anatomy, "forgot-password": anatomy,
  "reset-password": anatomy, "two-factor": anatomy, "verify-email": anatomy,
} satisfies Record<AuthScreen, Record<DeviceClass, AuthForm>>;
export const registrationForms = { M: "pager", TP: "pager", TL: "paired-form", DS: "paired-form", DW: "form" } as const satisfies Record<DeviceClass, "pager" | "paired-form" | "form">;
