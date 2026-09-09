import { gsap } from "gsap";
import { Flip } from "gsap/dist/Flip";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { CustomEase } from "gsap/dist/CustomEase";
import { duration, easing } from "./tokens";
import { motionDuration, reducedMotionScale } from "./physics";

export { gsap, Flip, ScrollTrigger };
let registered = false;
export function registerMotion() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(Flip, ScrollTrigger, CustomEase);
  for (const [name, value] of Object.entries(easing)) {
    CustomEase.create(`xp-${name}`, value.slice(13, -1));
  }
  registered = true;
}

export type MotionOptions = {
  reduced?: boolean;
  input?: "pointer" | "keyboard" | "programmatic";
  frequency?: "constant" | "frequent" | "occasional" | "rare";
};

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function settings(options: MotionOptions = {}, milliseconds: number = duration.ui) {
  const reduced = options.reduced ?? prefersReducedMotion();
  const bypass = options.input === "keyboard" || options.frequency === "constant";
  const subtle = reduced || options.frequency === "frequent";
  return { reduced, bypass, ...reducedMotionScale(subtle), seconds: bypass ? 0 : motionDuration(milliseconds, subtle) / 1000 };
}

export interface MotionHandle {
  /** Resolves false on cancellation, true on completion; never leaves an await hanging. */
  finished: Promise<boolean>;
  cancel(): void;
  revert(): void;
}

const active = new WeakMap<HTMLElement, MotionHandle>();
export const isAnimating = (element: HTMLElement) => active.has(element);

export function saveStyles(element: HTMLElement) {
  const properties = ["transform", "transform-origin", "opacity", "will-change", "translate", "rotate", "scale"];
  const values = properties.map(property => [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
  return () => {
    // GSAP measures a detached transform by temporarily reattaching the element.
    // Restore its saved inline styles directly on unmount, without causing layout.
    if (element.isConnected) gsap.set(element, { clearProps: "transform" });
    else if (element._gsap) element._gsap.uncache = 1;
    for (const [property, value, priority] of values) {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }
  };
}

export function promote(element: HTMLElement) {
  const original = element.style.willChange;
  element.style.willChange = [...new Set([...original.split(",").map(s => s.trim()).filter(s => s && s !== "auto"), "transform", "opacity"])].join(", ");
  return () => { element.style.willChange = original; };
}

/** One animation owns each element. Replacement keeps the presentation and cancels stale callbacks. */
export function own(targets: HTMLElement[], build: (done: () => void) => { kill(): void }): MotionHandle {
  registerMotion();
  for (const target of targets) active.get(target)?.cancel();
  const restores = targets.map(saveStyles);
  const releases = targets.map(promote);
  let settle!: (completed: boolean) => void;
  let ended = false;
  let animation: { kill(): void } | undefined;
  const finished = new Promise<boolean>(resolve => { settle = resolve; });
  const finish = (completed: boolean) => {
    if (ended) return;
    ended = true;
    for (const target of targets) if (active.get(target) === handle) active.delete(target);
    releases.forEach(release => release());
    settle(completed);
  };
  const handle: MotionHandle = {
    finished,
    cancel() { finish(false); animation?.kill(); },
    revert() { handle.cancel(); restores.forEach(restore => restore()); },
  };
  targets.forEach(target => active.set(target, handle));
  try { animation = build(() => finish(true)); }
  catch (error) { handle.revert(); throw error; }
  return handle;
}

export function tween(element: HTMLElement, vars: gsap.TweenVars, options: MotionOptions = {}, milliseconds: number = duration.ui) {
  const config = settings(options, milliseconds);
  return own([element], done => gsap.to(element, {
    duration: config.seconds, ease: "xp-out", overwrite: "auto", ...vars,
    onComplete: done, onInterrupt: done,
  }));
}
