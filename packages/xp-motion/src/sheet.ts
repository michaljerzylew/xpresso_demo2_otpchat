import { criticalSpring, project, rubberBand } from "./physics";
import { duration } from "./tokens";
import { gsap, own, registerMotion, saveStyles, settings, type MotionHandle, type MotionOptions } from "./runtime";

export type SheetOptions = MotionOptions & {
  handle: HTMLElement;
  snapPoints: readonly number[];
  initial?: number;
  axis?: "x" | "y";
  onSnap?: (position: number) => void;
};

/** Motion/gesture binding only. The modal owner supplies dialog semantics and focus management. */
export function sheet(element: HTMLElement, options: SheetOptions) {
  if (!options.snapPoints.length || !options.snapPoints.every(Number.isFinite)) throw new RangeError("Finite snap points required");
  registerMotion();
  const points = [...options.snapPoints].sort((a, b) => a - b);
  const min = points[0], max = points[points.length - 1];
  const axis = options.axis ?? "y";
  const handle = options.handle;
  const restore = saveStyles(element);
  const baseOpacity = Number(gsap.getProperty(element, "opacity"));
  const touchAction = handle.style.touchAction;
  handle.style.touchAction = "none";
  let position = options.initial ?? min;
  let velocity = 0;
  let dimension = 1;
  let pointer: number | undefined;
  let start = 0;
  let rawStart = 0;
  let samples: { position: number; time: number }[] = [];
  let animation: MotionHandle | undefined;
  let disposed = false;
  const write = gsap.quickSetter(element, axis, "px");
  write(position);
  const coordinate = (event: PointerEvent) => axis === "x" ? event.clientX : event.clientY;
  const nearest = (value: number) => points.reduce((best, point) => Math.abs(point - value) < Math.abs(best - value) ? point : best, min);
  const unband = (value: number) => {
    const edge = value < min ? min : max;
    if (value >= min && value <= max) return value;
    const offset = value - edge;
    return edge + offset * dimension / (0.55 * Math.max(0.01, dimension - Math.abs(offset)));
  };
  const band = (value: number) => value < min ? min + rubberBand(value - min, dimension)
    : value > max ? max + rubberBand(value - max, dimension) : value;

  function stopCapture() {
    const previous = pointer;
    pointer = undefined;
    if (previous !== undefined && handle.hasPointerCapture(previous)) handle.releasePointerCapture(previous);
  }

  function snapTo(target: number, interaction: MotionOptions = {}, physical = false): MotionHandle {
    if (disposed) throw new Error("Sheet binding has been disposed");
    if (!points.includes(target)) throw new RangeError("Target must be a configured snap point");
    stopCapture();
    animation?.cancel();
    const config = settings({ ...options, ...interaction }, duration.surface);
    const initial = position;
    const initialVelocity = velocity;
    animation = own([element], done => {
      if (config.bypass) {
        position = target; velocity = 0; write(position); gsap.set(element, { opacity: baseOpacity }); done();
        return { kill() {} };
      }
      if (config.reduced) {
        // Cross the large distance only while invisible. Each visible leg is
        // 5% of the journey, capped at 12px (24px total), including drag settle.
        const leg = Math.sign(target - initial) * Math.min(12, Math.abs(target - initial) * 0.05);
        const state = { value: position, opacity: Number(gsap.getProperty(element, "opacity")) };
        const update = () => {
          position = state.value; velocity = 0; write(position);
          gsap.set(element, { opacity: state.opacity });
        };
        let fade = gsap.to(state, {
          value: initial + leg, opacity: 0, duration: config.seconds / 2, ease: "xp-out",
          onUpdate: update,
          onComplete() {
            state.value = target - leg; state.opacity = 0; update();
            fade = gsap.to(state, {
              value: target, opacity: baseOpacity, duration: config.seconds / 2, ease: "xp-out",
              onUpdate: update,
              onComplete() { position = target; velocity = 0; write(position); done(); },
            });
          },
        });
        return { kill() { fade.kill(); } };
      }
      gsap.set(element, { opacity: baseOpacity });
      if (!physical && Math.abs(initialVelocity) < 1) {
        const state = { value: position };
        let lastTime = gsap.ticker.time;
        return gsap.to(state, {
          value: target, duration: config.seconds, ease: "xp-drawer",
          onUpdate() {
            const now = gsap.ticker.time;
            velocity = (state.value - position) / Math.max(0.001, now - lastTime);
            position = state.value; lastTime = now; write(position);
          },
          onComplete() { position = target; velocity = 0; write(position); done(); },
        });
      }
      const started = gsap.ticker.time;
      const tick = () => {
        const state = criticalSpring(initial, target, initialVelocity, gsap.ticker.time - started, config.reduced ? 45 : 30);
        position = state.position; velocity = state.velocity; write(position);
        if (Math.abs(position - target) < 0.1 && Math.abs(velocity) < 1) {
          position = target; velocity = 0; write(position);
          gsap.ticker.remove(tick); done();
        }
      };
      gsap.ticker.add(tick);
      return { kill() { gsap.ticker.remove(tick); } };
    });
    const current = animation;
    void current.finished.then(completed => {
      if (completed && current === animation && !disposed) options.onSnap?.(target);
    });
    return current;
  }

  function down(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || pointer !== undefined) return;
    animation?.cancel();
    gsap.set(element, { opacity: baseOpacity });
    const box = element.getBoundingClientRect();
    dimension = Math.max(1, axis === "x" ? box.width : box.height);
    position = Number(gsap.getProperty(element, axis));
    pointer = event.pointerId;
    start = coordinate(event); rawStart = unband(position);
    samples = [{ position, time: event.timeStamp }];
    handle.setPointerCapture(event.pointerId);
    animation = own([element], () => ({ kill() {} }));
    event.preventDefault();
  }

  function move(event: PointerEvent) {
    if (event.pointerId !== pointer) return;
    position = band(rawStart + coordinate(event) - start);
    samples.push({ position, time: event.timeStamp });
    samples = samples.filter(sample => event.timeStamp - sample.time <= 80);
    write(position);
  }

  function finish(event: PointerEvent) {
    if (event.pointerId !== pointer) return;
    const cancelled = event.type !== "pointerup";
    const recent = samples.filter(sample => event.timeStamp - sample.time <= 80);
    const last = recent[recent.length - 1];
    const first = recent[0];
    velocity = !cancelled && first && last && last.time > first.time && event.timeStamp - last.time < 50
      ? (last.position - first.position) / (last.time - first.time) * 1000 : 0;
    const config = settings(options);
    const target = nearest(position + project(velocity) * config.distance);
    snapTo(target, {}, true);
  }

  handle.addEventListener("pointerdown", down);
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", finish);
  handle.addEventListener("lostpointercapture", finish);
  return {
    snapTo,
    get position() { return position; },
    get velocity() { return velocity; },
    dispose() {
      disposed = true;
      stopCapture(); animation?.cancel(); restore();
      handle.style.touchAction = touchAction;
      handle.removeEventListener("pointerdown", down);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      handle.removeEventListener("lostpointercapture", finish);
    },
  };
}
