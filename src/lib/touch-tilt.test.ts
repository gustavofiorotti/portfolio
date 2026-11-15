import { describe, expect, it } from "vitest";
import { follow, touchTilt, viewportOffset } from "./touch-tilt";

describe("viewportOffset", () => {
  it("is 0 when the card is centered and ±1 at the edges", () => {
    expect(viewportOffset(300, 200, 800)).toBe(0);
    expect(viewportOffset(-100, 200, 800)).toBe(-1);
    expect(viewportOffset(700, 200, 800)).toBe(1);
  });
});

describe("touchTilt", () => {
  it("rests flat far from the center", () => {
    expect(touchTilt(0.9)).toEqual({ rotateX: 0, rotateY: 0, scale: 1, featured: false });
  });
  it("is featured (scaled) only near the center, and tilts the opposite way on each side", () => {
    expect(touchTilt(0).featured).toBe(true);
    expect(touchTilt(0).scale).toBeGreaterThan(1);
    expect(touchTilt(0.5).featured).toBe(false);
    expect(Math.sign(touchTilt(0.2).rotateX)).toBe(-Math.sign(touchTilt(-0.2).rotateX));
  });
  it("adds the gyroscope only to the featured card, within limits", () => {
    expect(touchTilt(0.1, { x: 0, y: 40 }).rotateY).toBe(9);
    expect(touchTilt(0.5, { x: 0, y: 40 }).rotateY).toBe(0);
    expect(Math.abs(touchTilt(0, { x: 100, y: 0 }).rotateX)).toBeLessThanOrEqual(8);
  });
});

describe("follow", () => {
  it("starts at the first reading and then moves slowly", () => {
    expect(follow(null, 30)).toBe(30);
    expect(follow(30, 40, 0.1)).toBeCloseTo(31);
  });
});
