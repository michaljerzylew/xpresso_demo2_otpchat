"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useDeviceClass, type DeviceClass } from "./device-class";

type RendererProperties<Core> = { core: Core; deviceClass: DeviceClass; form: string };

export type MorphSlotProperties<Core> = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  ladder: Record<DeviceClass, string>;
  core: Core;
  renderers: Record<string, (properties: RendererProperties<Core>) => ReactNode>;
};

export function MorphSlot<Core>({ ladder, core, renderers, className, ...properties }: MorphSlotProperties<Core>) {
  const deviceClass = useDeviceClass();
  const form = ladder[deviceClass];
  const renderer = renderers[form];
  if (!renderer) throw new Error(`MorphSlot has no renderer for form "${form}".`);

  return (
    <div
      {...properties}
      className={["xp-morph-slot", className].filter(Boolean).join(" ")}
      data-xp-primitive="morph-slot"
      data-device-class={deviceClass}
      data-variant={form}
      style={{ "--xp-form": form } as React.CSSProperties}
    >
      {renderer({ core, deviceClass, form })}
    </div>
  );
}
