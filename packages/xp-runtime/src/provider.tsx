import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createClassController, parseDeviceClass, resolveDeviceClass, type DeviceClass, type DeviceEnvironment } from "./device-class";

const ClassContext = createContext<DeviceClass>("M");
const LockContext = createContext<(() => () => void) | null>(null);
const BusyContext = createContext(false);
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readEnvironment(): DeviceEnvironment {
  return {
    width: window.innerWidth, height: window.innerHeight,
    pointer: window.matchMedia("(pointer: coarse)").matches ? "coarse" : window.matchMedia("(pointer: fine)").matches ? "fine" : "none",
    hover: window.matchMedia("(hover: hover)").matches,
    orientation: window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape",
  };
}

export function DeviceClassProvider({ children, deviceClass: forced }: { children: ReactNode; deviceClass?: DeviceClass }) {
  const parentLock = useContext(LockContext);
  const parentBusy = useContext(BusyContext);
  const [busy, setBusy] = useState(false);
  const [environment, setEnvironment] = useState<DeviceEnvironment>(() => typeof window === "undefined"
    ? { width: 390, height: 844, pointer: "coarse", hover: false, orientation: "portrait" } : readEnvironment());
  const [deviceClass, setDeviceClass] = useState<DeviceClass>(() => forced ?? (typeof window === "undefined" ? undefined : parseDeviceClass(new URLSearchParams(window.location.search).get("xp"))) ?? resolveDeviceClass(environment));
  const controller = useRef<ReturnType<typeof createClassController> | null>(null);
  if (!controller.current) controller.current = createClassController(deviceClass, setDeviceClass, setBusy);

  useClientLayoutEffect(() => {
    if (parentLock) { controller.current!.update(forced ?? deviceClass); return; }
    const update = () => {
      const next = readEnvironment();
      setEnvironment(next);
      controller.current!.update(forced ?? parseDeviceClass(new URLSearchParams(window.location.search).get("xp")) ?? resolveDeviceClass(next));
    };
    const queries = ["(pointer: coarse)", "(pointer: fine)", "(hover: hover)", "(orientation: portrait)"].map((query) => window.matchMedia(query));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("popstate", update);
    queries.forEach((query) => query.addEventListener("change", update));
    let releaseDrag: (() => void) | undefined;
    const startDrag = () => { releaseDrag ??= controller.current!.acquire(); };
    const endDrag = () => { releaseDrag?.(); releaseDrag = undefined; };
    window.addEventListener("dragstart", startDrag);
    window.addEventListener("dragend", endDrag);
    window.addEventListener("drop", endDrag);
    window.addEventListener("blur", endDrag);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("popstate", update);
      queries.forEach((query) => query.removeEventListener("change", update));
      window.removeEventListener("dragstart", startDrag);
      window.removeEventListener("dragend", endDrag);
      window.removeEventListener("drop", endDrag);
      window.removeEventListener("blur", endDrag);
      endDrag();
    };
  }, [forced, parentLock]);

  useClientLayoutEffect(() => {
    if (parentLock) return;
    const root = document.documentElement;
    const tokens = { "--xp-class": deviceClass, "--xp-input": environment.pointer, "--xp-can-hover": environment.hover ? "1" : "0", "--tap-min": environment.pointer === "fine" ? "24px" : "44px" };
    const previous = Object.keys(tokens).map((key) => [key, root.style.getPropertyValue(key)]);
    const oldClass = root.getAttribute("data-xp-class");
    const oldInput = root.getAttribute("data-xp-input");
    root.dataset.xpClass = deviceClass;
    root.dataset.xpInput = environment.pointer;
    Object.entries(tokens).forEach(([key, value]) => root.style.setProperty(key, value));
    return () => {
      previous.forEach(([key, value]) => value ? root.style.setProperty(key, value) : root.style.removeProperty(key));
      if (oldClass === null) root.removeAttribute("data-xp-class"); else root.setAttribute("data-xp-class", oldClass);
      if (oldInput === null) root.removeAttribute("data-xp-input"); else root.setAttribute("data-xp-input", oldInput);
    };
  }, [deviceClass, environment.pointer, environment.hover, parentLock]);

  return <LockContext.Provider value={parentLock ?? controller.current.acquire}><BusyContext.Provider value={parentBusy || busy}><ClassContext.Provider value={deviceClass}>{children}</ClassContext.Provider></BusyContext.Provider></LockContext.Provider>;
}

export function useDeviceClass() { return useContext(ClassContext); }
export function useDeviceClassBusy() { return useContext(BusyContext); }

export function useDeviceClassLock(active: boolean) {
  const acquire = useContext(LockContext);
  useClientLayoutEffect(() => { if (active) return acquire?.(); }, [active, acquire]);
}
