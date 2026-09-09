export type DeviceClass = "M" | "TP" | "TL" | "DS" | "DW";
export type Direction = "forward" | "back" | "none";

/** Velocity in px/s; result in px. */
export function project(velocity: number, decelerationRate = 0.998): number {
  if (!Number.isFinite(velocity) || decelerationRate <= 0 || decelerationRate >= 1 || !Number.isFinite(decelerationRate)) {
    throw new RangeError("Finite velocity and 0 < decelerationRate < 1 required");
  }
  return velocity / 1000 * decelerationRate / (1 - decelerationRate);
}

export function rubberBand(overshoot: number, dimension: number, constant = 0.55): number {
  if (![overshoot, dimension, constant].every(Number.isFinite) || dimension <= 0 || constant <= 0) {
    throw new RangeError("Finite overshoot, positive dimension and resistance required");
  }
  return overshoot * dimension * constant / (dimension + constant * Math.abs(overshoot));
}

export function resolveDirection(direction: Direction, rtl = false): -1 | 0 | 1 {
  if (direction === "none") return 0;
  return (direction === "forward" ? 1 : -1) * (rtl ? -1 : 1) as -1 | 1;
}

export function routeDistance(device: DeviceClass, direction: Direction, rtl = false) {
  const distance = device === "M" ? 48 : device === "TP" || device === "TL" ? 20 : 4;
  return resolveDirection(direction, rtl) * distance;
}

export function reducedMotionScale(reduced: boolean) {
  return reduced ? { distance: 0.1, duration: 0.7, scale: 0.1 } : { distance: 1, duration: 1, scale: 1 };
}

export function motionDuration(milliseconds: number, reduced: boolean) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new RangeError("Positive duration required");
  return reduced ? Math.max(80, Math.min(200, milliseconds * 0.7)) : milliseconds;
}

/** Exact critically damped solution. Bounds initial velocity to forbid crossing the target. */
export function criticalSpring(position: number, target: number, velocity: number, seconds: number, omega = 30) {
  const displacement = position - target;
  const safeVelocity = displacement > 0 ? Math.max(velocity, -omega * displacement)
    : displacement < 0 ? Math.min(velocity, -omega * displacement) : 0;
  const coefficient = safeVelocity + omega * displacement;
  const decay = Math.exp(-omega * Math.max(0, seconds));
  return {
    position: target + (displacement + coefficient * seconds) * decay,
    velocity: (safeVelocity - omega * coefficient * seconds) * decay,
  };
}
