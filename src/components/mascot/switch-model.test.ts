import { describe, expect, it } from "vitest";
import { KEY, PLATE, WELL, tiltFor } from "./switch-model";
import { PRESS_UP } from "./switch-spot";
import { PPU } from "./ViewRig";

describe("3D switch model", () => {
  it("raises the top half in the light theme and the bottom one in the dark", () => {
    expect(tiltFor(false, false, false)).toBe(20);
    expect(tiltFor(true, false, false)).toBe(-20);
    expect(tiltFor(false, true, false)).toBe(16);
    expect(tiltFor(true, false, true)).toBe(-6);
  });
  it("is the HTML piece's size (60 × 92, well inset 27%/27.5%, rocker inset 6%)", () => {
    expect([PLATE.w, PLATE.h]).toEqual([60, 92]);
    expect(WELL.w).toBeCloseTo(60 * (1 - 2 * 0.27));
    expect(WELL.h).toBeCloseTo(92 * (1 - 2 * 0.275));
    expect(KEY.h).toBeCloseTo(WELL.h * 0.88);
  });
  it("puts the hand's press point on the raised half of the rocker", () => {
    const px = PRESS_UP * PPU; // from the switch centre
    expect(px).toBeGreaterThan(KEY.h * 0.1);
    expect(px).toBeLessThan(KEY.h / 2);
  });
});
