import type { DeviceClass } from "@xp/runtime";

export type ChatForm = {
  collection: "deck" | "workspace";
  history: "sheet" | "split";
  inspector: "sheet" | "drawer-side" | "toggle-pane" | "persistent-pane";
  navigation: "segments" | "strip" | "tabs" | "sidebar";
};

const anatomy = {
  M: { collection: "deck", history: "sheet", inspector: "sheet", navigation: "segments" },
  TP: { collection: "deck", history: "split", inspector: "sheet", navigation: "strip" },
  TL: { collection: "workspace", history: "split", inspector: "drawer-side", navigation: "strip" },
  DS: { collection: "workspace", history: "split", inspector: "toggle-pane", navigation: "sidebar" },
  DW: { collection: "workspace", history: "split", inspector: "persistent-pane", navigation: "sidebar" },
} as const satisfies Record<DeviceClass, ChatForm>;

export const forms = {
  chat: anatomy,
  thread: anatomy,
};

export type ChatScreen = keyof typeof forms;

export const sections = [
  { id: "chat", path: "/", label: "Chat", owns: ["/c"] },
] as const;
