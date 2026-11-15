import { describe, expect, it } from "vitest";
import { eyesAt, frameKey, FAVICON_LOOP_MS } from "./favicon-eyes";

describe("favicon eyes", () => {
  it("start centered and open", () => {
    expect(eyesAt(0)).toEqual({ dx: 0, dy: 0, open: 1 });
  });

  it("look left, then right, like the header logo", () => {
    expect(eyesAt(FAVICON_LOOP_MS * 0.25).dx).toBeCloseTo(-2.4);
    expect(eyesAt(FAVICON_LOOP_MS * 0.45).dx).toBeCloseTo(2.4);
  });

  it("blink once per loop", () => {
    expect(eyesAt(FAVICON_LOOP_MS * 0.87).open).toBeLessThan(0.15);
    expect(eyesAt(FAVICON_LOOP_MS * 0.8).open).toBe(1);
  });

  it("loop forever and give equal keys for equal frames", () => {
    expect(frameKey(eyesAt(1000))).toBe(frameKey(eyesAt(1000 + FAVICON_LOOP_MS * 3)));
  });
});
