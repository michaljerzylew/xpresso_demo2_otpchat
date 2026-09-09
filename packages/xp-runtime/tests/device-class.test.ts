import { describe, expect, it, vi } from "vitest";
import { createClassController, parseDeviceClass, previewSizes, resolveDeviceClass, type DeviceEnvironment } from "../src/device-class";

const environment: DeviceEnvironment = { width: 390, height: 844, pointer: "fine", hover: true, orientation: "portrait" };
describe("resolveDeviceClass", () => {
  it.each([[0, "M"], [599, "M"], [600, "TP"], [839, "TP"], [840, "TL"], [1199, "TL"], [1200, "DS"], [1599, "DS"], [1600, "DW"], [2400, "DW"]] as const)("resolves width %s to %s", (width, expected) => {
    expect(resolveDeviceClass({ ...environment, width })).toBe(expected);
  });
  it.each([840, 860, 899, 899.9])("keeps coarse portrait %s in TP", (width) => {
    expect(resolveDeviceClass({ ...environment, width, pointer: "coarse" })).toBe("TP");
  });
  it("limits the tie-break to coarse portrait below 900", () => {
    expect(resolveDeviceClass({ ...environment, width: 900, pointer: "coarse" })).toBe("TL");
    expect(resolveDeviceClass({ ...environment, width: 860, pointer: "coarse", orientation: "landscape" })).toBe("TL");
    expect(resolveDeviceClass({ ...environment, width: 860, pointer: "none" })).toBe("TL");
    expect(resolveDeviceClass({ ...environment, width: 860, hover: false })).toBe("TL");
  });
  it.each([{ overlayOpen: true }, { dragActive: true }, { overlayOpen: true, dragActive: true }])("defers classification for %j", (lock) => {
    expect(resolveDeviceClass({ ...environment, width: 1920 }, { ...lock, previous: "M" })).toBe("M");
    expect(resolveDeviceClass({ ...environment, width: 1920 }, { previous: "M" })).toBe("DW");
  });
  it("resolves initial classification even when a lock starts active", () => {
    expect(resolveDeviceClass(environment, { overlayOpen: true })).toBe("M");
  });
});

it("flushes only the latest measurement after all overlay and drag locks release", () => {
  const publish = vi.fn();
  const controller = createClassController("M", publish);
  const closeOverlay = controller.acquire();
  const endDrag = controller.acquire();
  controller.update("TP");
  controller.update("DW");
  closeOverlay();
  closeOverlay();
  expect(publish).not.toHaveBeenCalled();
  endDrag();
  expect(publish).toHaveBeenCalledExactlyOnceWith("DW");
  controller.update("DW");
  expect(publish).toHaveBeenCalledTimes(1);
  controller.update("DS");
  expect(publish).toHaveBeenLastCalledWith("DS");
});

it("cancels a deferred transition when the viewport returns to the original class", () => {
  const publish = vi.fn();
  const controller = createClassController("M", publish);
  const release = controller.acquire();
  controller.update("DW");
  controller.update("M");
  release();
  expect(publish).not.toHaveBeenCalled();
});

it("validates overrides and gives every preview its own viewport dimensions", () => {
  expect(parseDeviceClass("mobile")).toBeUndefined();
  expect(parseDeviceClass(null)).toBeUndefined();
  for (const [deviceClass, size] of Object.entries(previewSizes)) {
    expect(parseDeviceClass(deviceClass)).toBe(deviceClass);
    expect(resolveDeviceClass({ ...environment, ...size })).toBe(deviceClass);
  }
});
