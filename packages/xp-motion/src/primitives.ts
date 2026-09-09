import { duration } from "./tokens";
import { routeDistance, type DeviceClass, type Direction } from "./physics";
import { gsap, Flip, ScrollTrigger, own, tween, settings, registerMotion, saveStyles, isAnimating, type MotionOptions, type MotionHandle } from "./runtime";

/** Exercise timeline initialization during idle without touching any visible element. */
export function warmMotion() {
  registerMotion();
  const values = [{ x: 0, opacity: 1 }, { x: 0, opacity: 1 }];
  const timeline = gsap.timeline({ paused: true });
  for (const ease of ["xp-out", "xp-inOut"]) {
    timeline.to(values, { x: 0, opacity: 1, duration: duration.ui / 1000, ease, stagger: 0.05, onUpdate() {} });
  }
  timeline.progress(1).kill();
}

export function press(element: HTMLElement, options: MotionOptions = {}) {
  registerMotion();
  let restore: (() => void) | undefined;
  // Binding controls during a route mount must not force layout to parse transforms.
  // Keep the first press's baseline for subsequent interruption/release cycles.
  let base: { scaleX: number; scaleY: number; opacity: number } | undefined;
  let animation: MotionHandle | undefined;
  let pointer: number | undefined;
  const release = (event: PointerEvent) => {
    if (pointer !== event.pointerId || !base) return;
    pointer = undefined;
    animation = tween(element, base, options, 80);
  };
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || pointer !== undefined || element.matches(":disabled, [aria-disabled=true]")) return;
    if (!base) {
      restore = saveStyles(element);
      base = { scaleX: Number(gsap.getProperty(element, "scaleX")), scaleY: Number(gsap.getProperty(element, "scaleY")), opacity: Number(gsap.getProperty(element, "opacity")) };
    }
    pointer = event.pointerId;
    const config = settings(options);
    const factor = config.bypass ? 1 : 1 - 0.03 * config.scale;
    animation = tween(element, { scaleX: base.scaleX * factor, scaleY: base.scaleY * factor, opacity: base.opacity * (config.bypass ? 1 : 0.85) }, options, duration.press);
  };
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointerleave", release);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  return () => {
    animation?.cancel();
    // An untouched binding wrote no styles and has nothing to restore or measure.
    restore?.();
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointerleave", release);
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
  };
}

type SurfaceOptions = MotionOptions & { trigger?: HTMLElement };
function origin(element: HTMLElement, trigger?: HTMLElement) {
  if (!trigger) return "50% 50%";
  const anchor = trigger.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  return `${anchor.left + anchor.width / 2 - box.left}px ${anchor.top + anchor.height / 2 - box.top}px`;
}

export function enter(element: HTMLElement, options: SurfaceOptions = {}) {
  registerMotion();
  const config = settings(options);
  const interrupted = isAnimating(element);
  return own([element], done => {
    gsap.set(element, { transformOrigin: origin(element, options.trigger) });
    if (!interrupted && !config.bypass) gsap.set(element, { scale: 1 - 0.04 * config.scale, opacity: 0 });
    return gsap.to(element, { scale: 1, opacity: 1, duration: config.seconds, ease: "xp-out", onComplete: done });
  });
}

export function exit(element: HTMLElement, options: SurfaceOptions = {}) {
  const config = settings(options);
  return tween(element, { transformOrigin: origin(element, options.trigger), scale: 1 - 0.04 * config.scale, opacity: 0 }, options);
}

export function stagger(elements: HTMLElement[], options: MotionOptions & { gap?: number } = {}) {
  registerMotion();
  const config = settings(options);
  const interrupted = elements.some(isAnimating);
  const gap = Math.max(30, Math.min(80, options.gap ?? 50));
  return own(elements, done => {
    // Rows own their individual translate; avoid CSSPlugin reading every newly
    // mounted row's computed transform and forcing the whole Inbox to lay out.
    const values = elements.map(element => ({
      y: interrupted ? Number.parseFloat(element.style.translate.split(" ")[1] ?? "0") || 0 : config.bypass ? 0 : 8 * config.distance,
      opacity: interrupted ? Number(element.style.opacity || "1") : config.bypass ? 1 : 0,
    }));
    const paint = () => elements.forEach((element, index) => {
      element.style.translate = `0px ${values[index]!.y}px`;
      element.style.opacity = String(values[index]!.opacity);
    });
    paint();
    return gsap.to(values, {
      y: 0, opacity: 1, duration: config.seconds, ease: "xp-out",
      stagger: index => config.bypass ? 0 : Math.min(200, index * gap) * config.duration / 1000,
      onUpdate: paint,
      // GSAP flushes lazy child tweens before onComplete, but after onUpdate.
      // A delayed first frame can therefore complete without painting their final values.
      onComplete: () => { paint(); done(); },
    });
  });
}

export function routeTransition(outgoing: HTMLElement, incoming: HTMLElement, options: MotionOptions & {
  device: DeviceClass; direction: Direction; rtl?: boolean;
}) {
  const config = settings(options);
  const distance = routeDistance(options.device, options.direction, options.rtl) * config.distance;
  const ease = options.device === "TP" || options.device === "TL" ? "xp-out" : "xp-inOut";
  const interrupted = isAnimating(incoming);
  return own([outgoing, incoming], done => {
    // Route panes own translation/opacity. Animate scalar state so CSSPlugin does
    // not synchronously measure the newly mounted tree to initialise a transform.
    // Inline presentation survives cancellation, including reversal mid-arrival.
    const state = (element: HTMLElement) => ({
      x: element.style.transform ? new DOMMatrixReadOnly(element.style.transform).m41 : 0,
      opacity: element.style.opacity === "" ? 1 : Number(element.style.opacity),
    });
    const from = state(outgoing);
    const to = interrupted ? state(incoming) : { x: config.bypass ? 0 : distance, opacity: config.bypass ? 1 : 0 };
    const paint = (element: HTMLElement, value: { x: number; opacity: number }) => {
      element.style.transform = `translate3d(${value.x}px, 0px, 0px)`;
      element.style.opacity = String(value.opacity);
    };
    paint(incoming, to);
    const timeline = gsap.timeline({ onComplete: done });
    timeline.to(from, { x: config.bypass ? 0 : -distance, opacity: 0, duration: config.seconds, ease, onUpdate: () => paint(outgoing, from) }, 0);
    timeline.to(to, { x: 0, opacity: 1, duration: config.seconds, ease, onUpdate: () => paint(incoming, to) }, 0);
    return timeline;
  });
}

export function flipLayout(elements: HTMLElement[], mutate: () => void, options: MotionOptions = {}) {
  const config = settings(options);
  return own(elements, done => {
    const state = Flip.getState(elements);
    mutate();
    if (config.reduced || options.frequency === "frequent" || config.bypass) {
      if (!config.bypass) gsap.set(elements, { opacity: 0.6 });
      return gsap.to(elements, { opacity: 1, duration: config.seconds, ease: "xp-inOut", onComplete: done });
    }
    return Flip.from(state, { scale: true, duration: config.seconds, ease: "xp-inOut", onComplete: done });
  });
}

/** Content stays readable before its trigger. Animate once as it enters; never hide below-fold data in advance. */
export function revealOnScroll(element: HTMLElement, options: MotionOptions = {}) {
  registerMotion();
  const restore = saveStyles(element);
  let animation: MotionHandle | undefined;
  const trigger = ScrollTrigger.create({
    trigger: element, start: "top 92%", once: true,
    onEnter() {
      const config = settings(options);
      animation = own([element], done => {
        if (!config.bypass) gsap.set(element, { y: 16 * config.distance, opacity: 0.4 });
        return gsap.to(element, { y: 0, opacity: 1, duration: config.seconds, ease: "xp-out", onComplete: done });
      });
    },
  });
  return () => { trigger.kill(); animation?.cancel(); restore(); };
}

/** Pass word/line spans inside static overflow clips; semantic text stays in the caller's DOM. */
export function kineticHeadline(words: HTMLElement[], options: MotionOptions & { frequency: "rare" }) {
  if (options.frequency !== "rare") throw new Error("Kinetic headlines require the rare frequency tier");
  const config = settings(options, duration.launch);
  const interrupted = words.some(isAnimating);
  return own(words, done => {
    if (!interrupted && !config.bypass) gsap.set(words, { yPercent: 105 * config.distance, opacity: config.reduced ? 0.5 : 0 });
    return gsap.to(words, {
      yPercent: 0, opacity: 1, duration: config.seconds, ease: "xp-out",
      stagger: index => config.bypass ? 0 : Math.min(200, index * 50) * config.duration / 1000,
      onComplete: done,
    });
  });
}
