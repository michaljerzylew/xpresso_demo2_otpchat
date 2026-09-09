// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DeviceClassProvider, useDeviceClass, useDeviceClassLock } from "../src/provider";

let root: Root;
let host: HTMLDivElement;
let coarse: boolean;
let hover: boolean;
const queries = new Map<string, EventTarget>();

function Probe({ locked = false }: { locked?: boolean }) {
  useDeviceClassLock(locked);
  return <span>{useDeviceClass()}</span>;
}
function resize(width: number, height = 1024) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
  window.dispatchEvent(new Event("resize"));
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  coarse = false;
  hover = true;
  queries.clear();
  vi.stubGlobal("matchMedia", (query: string) => {
    if (queries.has(query)) return queries.get(query);
    const target = new EventTarget();
    queries.set(query, target);
    Object.defineProperty(target, "matches", {
      get: () => query === "(pointer: coarse)" ? coarse : query === "(pointer: fine)" ? !coarse : query === "(hover: hover)" ? hover : window.innerHeight >= window.innerWidth,
    });
    return target;
  });
  window.history.replaceState(null, "", "/");
  resize(1366, 768);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it("publishes actual class and input tokens, reacts to input changes, and restores HTML", async () => {
  await act(() => root.render(<DeviceClassProvider><Probe /></DeviceClassProvider>));
  expect(host.textContent).toBe("DS");
  expect(document.documentElement.dataset.xpClass).toBe("DS");
  expect(document.documentElement.style.getPropertyValue("--tap-min")).toBe("24px");
  coarse = true;
  hover = false;
  await act(() => queries.get("(pointer: coarse)")!.dispatchEvent(new Event("change")));
  expect(document.documentElement.dataset.xpInput).toBe("coarse");
  expect(document.documentElement.style.getPropertyValue("--xp-can-hover")).toBe("0");
  expect(document.documentElement.style.getPropertyValue("--tap-min")).toBe("44px");
  await act(() => resize(860));
  expect(host.textContent).toBe("TP");
  await act(() => root.render(<></>));
  expect(document.documentElement.hasAttribute("data-xp-class")).toBe(false);
  expect(document.documentElement.style.getPropertyValue("--tap-min")).toBe("");
});

it("holds form during a hook lock and applies the latest resize on release", async () => {
  await act(() => root.render(<DeviceClassProvider><Probe locked /></DeviceClassProvider>));
  await act(() => { resize(768); resize(390); });
  expect(document.documentElement.dataset.xpClass).toBe("DS");
  await act(() => root.render(<DeviceClassProvider><Probe /></DeviceClassProvider>));
  expect(document.documentElement.dataset.xpClass).toBe("M");
  expect(document.documentElement.style.getPropertyValue("--xp-class")).toBe("M");
});

it("locks native dragging and releases after cancellation", async () => {
  await act(() => root.render(<DeviceClassProvider><Probe /></DeviceClassProvider>));
  await act(() => window.dispatchEvent(new Event("dragstart")));
  await act(() => resize(390));
  expect(host.textContent).toBe("DS");
  await act(() => window.dispatchEvent(new Event("dragend")));
  expect(host.textContent).toBe("M");
});

it("honors query overrides without replacing actual input capabilities", async () => {
  window.history.replaceState(null, "", "/?xp=M");
  await act(() => root.render(<DeviceClassProvider><Probe /></DeviceClassProvider>));
  expect(host.textContent).toBe("M");
  expect(document.documentElement.dataset.xpInput).toBe("fine");
  await act(() => resize(1920));
  expect(host.textContent).toBe("M");
  await act(() => { window.history.replaceState(null, "", "/?xp=invalid"); window.dispatchEvent(new PopStateEvent("popstate")); });
  expect(host.textContent).toBe("DW");
});
