export const deviceClasses = ["M", "TP", "TL", "DS", "DW"] as const;
export type DeviceClass = (typeof deviceClasses)[number];
export type DeviceEnvironment = {
  width: number;
  height: number;
  pointer: "coarse" | "fine" | "none";
  hover: boolean;
  orientation: "portrait" | "landscape";
};
export type ClassLock = { previous?: DeviceClass; overlayOpen?: boolean; dragActive?: boolean };

export function classForWidth(width: number): DeviceClass {
  if (width < 600) return "M";
  if (width < 840) return "TP";
  if (width < 1200) return "TL";
  if (width < 1600) return "DS";
  return "DW";
}

export function resolveDeviceClass(environment: DeviceEnvironment, lock: ClassLock = {}): DeviceClass {
  if (lock.previous && (lock.overlayOpen || lock.dragActive)) return lock.previous;
  const { width, pointer, orientation } = environment;
  if (pointer === "coarse" && orientation === "portrait" && width >= 840 && width < 900) return "TP";
  return classForWidth(width);
}

export function parseDeviceClass(value: string | null): DeviceClass | undefined {
  return deviceClasses.find((deviceClass) => deviceClass === value);
}

export const previewSizes: Record<DeviceClass, { width: number; height: number }> = {
  M: { width: 390, height: 844 }, TP: { width: 768, height: 1024 },
  TL: { width: 1024, height: 768 }, DS: { width: 1366, height: 768 },
  DW: { width: 1920, height: 1080 },
};

// Reference-counted locks defer resolution, retaining the latest measurement.
export function createClassController(initial: DeviceClass, publish: (value: DeviceClass) => void, onLockChange: (locked: boolean) => void = () => {}) {
  let current = initial;
  let locks = 0;
  let pending: DeviceClass | undefined;
  function update(next: DeviceClass) {
    if (locks) { pending = next; return; }
    if (current !== next) { current = next; publish(next); }
  }
  return {
    update,
    acquire() {
      locks += 1;
      onLockChange(true);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        locks -= 1;
        onLockChange(locks > 0);
        if (!locks && pending) { const next = pending; pending = undefined; update(next); }
      };
    },
  };
}
