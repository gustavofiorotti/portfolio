import { describe, expect, it } from "vitest";
import { scrollProgress, walkOffsetPx, WALK_MARGIN } from "./walk";

describe("walk", () => {
  it("starts near the top and ends near the bottom of the viewport", () => {
    expect(walkOffsetPx(0, 900)).toBe(WALK_MARGIN - 450);
    expect(walkOffsetPx(1, 900)).toBe(900 - WALK_MARGIN - 450);
  });

  it("is level with the switch halfway down the page", () => {
    expect(walkOffsetPx(0.5, 900)).toBe(0);
  });

  it("clamps bad input", () => {
    expect(walkOffsetPx(-1, 900)).toBe(walkOffsetPx(0, 900));
    expect(walkOffsetPx(Number.NaN, 900)).toBe(walkOffsetPx(0, 900));
    expect(scrollProgress(500, 900, 900)).toBe(0);
    expect(scrollProgress(450, 1800, 900)).toBe(0.5);
  });
});
