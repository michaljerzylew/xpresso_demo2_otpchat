import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { gsap, prefersReducedMotion, registerMotion } from "./runtime";
import { duration } from "./tokens";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(notify: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

const ReducedMotionContext = createContext(false);
export const useMotionPreference = () => useContext(ReducedMotionContext);

/** The application owns the shared GSAP ticker policy; no frame-rate cap on fast displays. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    registerMotion();
    gsap.defaults({ duration: duration.ui / 1000, ease: "xp-out", overwrite: "auto" });
    gsap.ticker.lagSmoothing(500, 33);
  }, []);
  return <ReducedMotionContext.Provider value={reduced}>{children}</ReducedMotionContext.Provider>;
}
