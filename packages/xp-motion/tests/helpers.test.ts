import { describe, expect, it } from "vitest";
import { easing, duration, motionTokens, motionCss } from "../src/tokens";
import { project, rubberBand, criticalSpring, resolveDirection, routeDistance, reducedMotionScale, motionDuration } from "../src/physics";

describe("projection in px/s", () => {
  it.each([[0, 0], [1000, 499], [-1000, -499], [200, 99.8]])("projects %s to %s pixels", (velocity, expected) => {
    expect(project(velocity)).toBeCloseTo(expected, 8);
  });
  it("supports a different decay without confusing velocity units", () => expect(project(1000, 0.99)).toBeCloseTo(99));
  it.each([0, 1, -1, NaN, Infinity])("rejects invalid decay %s", rate => expect(() => project(1, rate)).toThrow(RangeError));
  it("rejects non-finite velocity", () => expect(() => project(Infinity)).toThrow(RangeError));
});

describe("rubber-band boundaries", () => {
  it("is continuous at zero and preserves sign", () => {
    expect(rubberBand(0, 400)).toBe(0);
    expect(rubberBand(-80, 400)).toBe(-rubberBand(80, 400));
    expect(rubberBand(0.001, 400)).toBeCloseTo(0.00055, 7);
  });
  it("resists progressively and remains below the dimension", () => {
    const small = rubberBand(100, 400), large = rubberBand(200, 400);
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(100);
    expect(large).toBeGreaterThan(small);
    expect(large - small).toBeLessThan(small);
    expect(rubberBand(1e9, 400)).toBeLessThan(400);
  });
  it.each([0, -1, NaN, Infinity])("rejects invalid dimension %s", size => expect(() => rubberBand(20, size)).toThrow(RangeError));
});

describe("shared token contracts", () => {
  it("contains the exact three CSS curves", () => expect(easing).toEqual({
    out: "cubic-bezier(0.23,1,0.32,1)", inOut: "cubic-bezier(0.77,0,0.175,1)", drawer: "cubic-bezier(0.32,0.72,0,1)",
  }));
  it("keeps durations in milliseconds", () => expect(duration).toEqual({ press: 120, ui: 200, surface: 320, launch: 600 }));
  it("emits every namespaced variable once", () => {
    expect(Object.keys(motionTokens)).toHaveLength(7);
    for (const [name, value] of Object.entries(motionTokens)) expect(motionCss().split(`${name}: ${value};`)).toHaveLength(2);
  });
});

describe("direction and device resolution", () => {
  it.each([
    ["forward", false, 1], ["back", false, -1], ["none", false, 0],
    ["forward", true, -1], ["back", true, 1], ["none", true, 0],
  ] as const)("%s, RTL %s = %s", (direction, rtl, sign) => expect(resolveDirection(direction, rtl)).toBe(sign));
  it.each([["M", 48], ["TP", 20], ["TL", 20], ["DS", 4], ["DW", 4]] as const)("%s travel is %spx with reversible direction", (device, distance) => {
    expect(routeDistance(device, "forward")).toBe(distance);
    expect(routeDistance(device, "back")).toBe(-distance);
    expect(routeDistance(device, "forward", true)).toBe(-distance);
    expect(routeDistance(device, "back", true)).toBe(distance);
    expect(routeDistance(device, "none")).toBe(0);
    expect(routeDistance(device, "none", true)).toBe(0);
  });
});

describe("reduced motion stays gentle and nonzero", () => {
  it("reduces distance and scale deviation", () => {
    expect(reducedMotionScale(true)).toEqual({ distance: 0.1, duration: 0.7, scale: 0.1 });
    expect(reducedMotionScale(false)).toEqual({ distance: 1, duration: 1, scale: 1 });
  });
  it.each(Object.values(duration))("bounds reduced duration for %sms", milliseconds => {
    expect(motionDuration(milliseconds, true)).toBeGreaterThanOrEqual(80);
    expect(motionDuration(milliseconds, true)).toBeLessThanOrEqual(200);
    expect(motionDuration(milliseconds, false)).toBe(milliseconds);
  });
  it("scales UI to 140ms", () => expect(motionDuration(200, true)).toBe(140));
});

describe("critical settle", () => {
  it.each([-10000, -300, 0, 300, 10000])("does not cross the target with velocity %s", velocity => {
    for (const start of [-100, 100]) {
      for (let time = 0; time <= 2; time += 1 / 120) {
        const result = criticalSpring(start, 0, velocity, time);
        expect(result.position * Math.sign(start)).toBeGreaterThanOrEqual(0);
      }
      expect(criticalSpring(start, 0, velocity, 2).position).toBeCloseTo(0, 6);
    }
  });
  it("starts at the live value and retains safe release velocity", () => {
    expect(criticalSpring(100, 0, -300, 0)).toEqual({ position: 100, velocity: -300 });
  });
});
