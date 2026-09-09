import type { DeviceClass } from "@xp/runtime";
/** No collection or inspector exists yet. The shell owns each class's navigation. */
export const forms = {
  M: { content: "start", inspector: "none" },
  TP: { content: "start", inspector: "none" },
  TL: { content: "start", inspector: "none" },
  DS: { content: "start", inspector: "none" },
  DW: { content: "start", inspector: "none" },
} as const satisfies Record<DeviceClass, { content: "start"; inspector: "none" }>;
